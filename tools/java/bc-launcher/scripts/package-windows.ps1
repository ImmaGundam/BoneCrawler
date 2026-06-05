param(
  [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\..\..\..\..").Path,
  [string]$AppName = "BoneCrawler",
  [string]$AppVersion = "2.9.5",
  [ValidateSet("app-image", "exe", "msi")]
  [string]$Type = "app-image",
  [string]$JdkHome = "",
  [string]$MavenHome = "",
  [string]$NativeDir = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path $ProjectRoot).Path
$LauncherRoot = Join-Path $ProjectRoot "tools\java\bc-launcher"

function Get-CandidateJdkHomes {
  $homes = @()
  if ($JdkHome) { $homes += $JdkHome }
  if ($env:JAVA_HOME) { $homes += $env:JAVA_HOME }

  $knownRoots = @(
    (Join-Path $env:ProgramFiles "Java"),
    (Join-Path $env:ProgramFiles "Eclipse Adoptium"),
    (Join-Path $env:ProgramFiles "Microsoft")
  )

  foreach ($root in $knownRoots) {
    if (-not (Test-Path -LiteralPath $root)) { continue }
    $latest = Join-Path $root "latest"
    if (Test-Path -LiteralPath $latest) { $homes += $latest }
    $homes += Get-ChildItem -LiteralPath $root -Directory |
      Where-Object { $_.Name -match "jdk|java|temurin|openjdk" } |
      Sort-Object Name -Descending |
      ForEach-Object { $_.FullName }
  }

  $homes |
    Where-Object { $_ } |
    ForEach-Object {
      try { (Resolve-Path -LiteralPath $_ -ErrorAction Stop).Path } catch { $_ }
    } |
    Select-Object -Unique
}

function Find-JdkTools {
  foreach ($candidateHome in Get-CandidateJdkHomes) {
    $javacPath = Join-Path $candidateHome "bin\javac.exe"
    $jpackagePath = Join-Path $candidateHome "bin\jpackage.exe"
    if ((Test-Path -LiteralPath $javacPath) -and (Test-Path -LiteralPath $jpackagePath)) {
      return [pscustomobject]@{
        Home = $candidateHome
        Javac = $javacPath
        Jpackage = $jpackagePath
      }
    }
  }

  $javacCommand = Get-Command "javac" -ErrorAction SilentlyContinue
  $jpackageCommand = Get-Command "jpackage" -ErrorAction SilentlyContinue
  if ($javacCommand -and $jpackageCommand) {
    $jdkBin = Split-Path -Parent $javacCommand.Source
    return [pscustomobject]@{
      Home = Split-Path -Parent $jdkBin
      Javac = $javacCommand.Source
      Jpackage = $jpackageCommand.Source
    }
  }

  throw "Could not find javac and jpackage together. Install JDK 17 or newer, or pass -JdkHome `"C:\Program Files\Java\jdk-26.0.1`"."
}

function Get-CandidateMavenHomes {
  $homes = @()
  if ($MavenHome) { $homes += $MavenHome }
  if ($env:MAVEN_HOME) { $homes += $env:MAVEN_HOME }

  $localCache = Join-Path $LauncherRoot ".cache"
  if (Test-Path -LiteralPath $localCache) {
    $homes += Get-ChildItem -LiteralPath $localCache -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match "^apache-maven-" } |
      Sort-Object Name -Descending |
      ForEach-Object { $_.FullName }
  }

  $knownRoots = @(
    $env:ProgramFiles,
    (Join-Path $env:ProgramFiles "Apache"),
    (Join-Path $env:ProgramFiles "Maven")
  )

  foreach ($root in $knownRoots) {
    if (-not (Test-Path -LiteralPath $root)) { continue }
    $homes += Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match "maven" } |
      Sort-Object Name -Descending |
      ForEach-Object { $_.FullName }
  }

  $homes |
    Where-Object { $_ } |
    ForEach-Object {
      try { (Resolve-Path -LiteralPath $_ -ErrorAction Stop).Path } catch { $_ }
    } |
    Select-Object -Unique
}

function Install-LocalMaven {
  $version = "3.9.9"
  $cacheRoot = Join-Path $LauncherRoot ".cache"
  $installRoot = Join-Path $cacheRoot "apache-maven-$version"
  $mvnCmd = Join-Path $installRoot "bin\mvn.cmd"
  if (Test-Path -LiteralPath $mvnCmd) {
    return $mvnCmd
  }

  New-Item -ItemType Directory -Force -Path $cacheRoot | Out-Null
  $zipPath = Join-Path $cacheRoot "apache-maven-$version-bin.zip"
  $downloadUrl = "https://archive.apache.org/dist/maven/maven-3/$version/binaries/apache-maven-$version-bin.zip"

  Write-Host "Downloading Apache Maven $version..."
  Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
  Expand-Archive -LiteralPath $zipPath -DestinationPath $cacheRoot -Force

  if (-not (Test-Path -LiteralPath $mvnCmd)) {
    throw "Maven download completed, but mvn.cmd was not found at $mvnCmd"
  }
  return $mvnCmd
}

function Find-MavenTool {
  foreach ($candidateHome in Get-CandidateMavenHomes) {
    foreach ($name in @("mvn.cmd", "mvn.bat", "mvn")) {
      $candidate = Join-Path $candidateHome "bin\$name"
      if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
  }

  foreach ($name in @("mvn.cmd", "mvn")) {
    $command = Get-Command $name -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
  }

  return Install-LocalMaven
}

$jdkTools = Find-JdkTools
Write-Host "Using JDK tools from: $($jdkTools.Home)"
$env:JAVA_HOME = $jdkTools.Home
$env:Path = "$(Join-Path $jdkTools.Home 'bin');$env:Path"
Write-Host "Using JAVA_HOME for Maven: $env:JAVA_HOME"

$mavenTool = Find-MavenTool
Write-Host "Using Maven from: $mavenTool"

$BuildRoot = Join-Path $LauncherRoot "build"
$InputDir = Join-Path $BuildRoot "input"
$GameDir = Join-Path $InputDir "game"
$TargetDir = Join-Path $LauncherRoot "target"
$NativeDir = if ($NativeDir) { $NativeDir } else { Join-Path $ProjectRoot "dist\native" }
$NativeDir = (Resolve-Path -LiteralPath (New-Item -ItemType Directory -Force -Path $NativeDir)).Path
$AppImageDir = Join-Path $NativeDir $AppName
$PackageIcon = Join-Path $ProjectRoot "assets\icon.ico"
$PomPath = Join-Path $LauncherRoot "pom.xml"

if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot "index.html"))) {
  throw "ProjectRoot must contain index.html: $ProjectRoot"
}
if (-not (Test-Path -LiteralPath $PomPath)) {
  throw "Launcher pom.xml not found: $PomPath"
}

Remove-Item -LiteralPath $InputDir -Recurse -Force -ErrorAction SilentlyContinue
if ($Type -eq "app-image" -and (Test-Path -LiteralPath $AppImageDir)) {
  try {
    Remove-Item -LiteralPath $AppImageDir -Recurse -Force -ErrorAction Stop
  } catch {
    throw "Could not replace existing app image at $AppImageDir. Close BoneCrawler.exe or click Stop Runtime, then run this script again. $($_.Exception.Message)"
  }
}
New-Item -ItemType Directory -Force -Path $InputDir, $GameDir, $NativeDir | Out-Null

Push-Location $LauncherRoot
try {
  & $mavenTool "-f" $PomPath "clean" "package" "dependency:copy-dependencies" "-DskipTests" "-DincludeScope=runtime" "-DoutputDirectory=target\dependency"
} finally {
  Pop-Location
}

$mainJar = Get-ChildItem -LiteralPath $TargetDir -Filter "*.jar" -File |
  Where-Object { $_.Name -notmatch "sources|javadoc|tests|original" } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $mainJar) {
  throw "Could not find the built launcher jar in $TargetDir"
}

Copy-Item -LiteralPath $mainJar.FullName -Destination (Join-Path $InputDir $mainJar.Name) -Force

$dependencyDir = Join-Path $TargetDir "dependency"
if (-not (Test-Path -LiteralPath $dependencyDir)) {
  throw "Launcher dependencies were not copied. Expected: $dependencyDir"
}
Get-ChildItem -LiteralPath $dependencyDir -Filter "*.jar" -File | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $InputDir $_.Name) -Force
}

$itemsToBundle = @(
  "index.html",
  "assets",
  "src",
  "dev",
  "docs",
  "packages"
)

foreach ($item in $itemsToBundle) {
  $source = Join-Path $ProjectRoot $item
  if (-not (Test-Path -LiteralPath $source)) { continue }
  $target = Join-Path $GameDir $item
  Copy-Item -LiteralPath $source -Destination $target -Recurse -Force
}

if (Test-Path -LiteralPath (Join-Path $ProjectRoot "dist\packages")) {
  New-Item -ItemType Directory -Force -Path (Join-Path $GameDir "dist") | Out-Null
  Copy-Item -LiteralPath (Join-Path $ProjectRoot "dist\packages") -Destination (Join-Path $GameDir "dist\packages") -Recurse -Force
}

$packageArgs = @(
  "--type", $Type,
  "--name", $AppName,
  "--app-version", $AppVersion,
  "--vendor", "WebGeeks Labs",
  "--copyright", "(C) 2026 James Deitz",
  "--description", "8-bit Dark Fantasy Arcade Action - Developer: James Deitz - www.bonecrawler.com",
  "--input", $InputDir,
  "--main-jar", $mainJar.Name,
  "--main-class", "BoneCrawlerLauncher",
  "--dest", $NativeDir,
  "--runtime-image", $jdkTools.Home,
  "--java-options", "-Dfile.encoding=UTF-8"
)

if (Test-Path -LiteralPath $PackageIcon) {
  $packageArgs += @("--icon", $PackageIcon)
}

if ($Type -ne "app-image") {
  $packageArgs += @(
    "--about-url", "https://www.bonecrawler.com",
    "--win-help-url", "https://www.bonecrawler.com",
    "--win-update-url", "https://www.bonecrawler.com"
  )
}

& $jdkTools.Jpackage @packageArgs

Write-Host "Built $Type package in $NativeDir"
if ($Type -eq "app-image") {
  Write-Host "Run: $NativeDir\$AppName\$AppName.exe"
}
