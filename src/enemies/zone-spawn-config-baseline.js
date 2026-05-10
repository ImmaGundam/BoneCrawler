// Baseline 'zone-spawn-config'
// Purpose: Zones 1/2/3 use arcade waves; secret zones stay passthrough.
// refactor this file later, or edit spawnSystem per zone.
(function(){
  const normalPressure = { enabled: true, trigger: 'clearedOrTimer', maxBursts: 1, dropChest: true };

  // Spawn-system-owned stat scaling. These are consumed by the active spawn
  // subsystem, not by the zone/map layer itself.
  const waveStatScalingDefaults = {
    // Wave mode owns speed. It scales by authored wave number, not score or
    // kill totals, so large waves do not become fast just because they contain
    // more enemies.
    progressSource: 'waveNumber',
    curve: 'linear',
    baseSpeed: 0.14,
    maxSpeed: 0.36,
    factor: 0.020,
    typeMultipliers: {
      normalEnemy1: 1,
      normalEnemy2: 0.86,
      normalEnemy3: 0.52,
      giantEnemy1: 0.56,
      wizardEnemy1: 0.40
    },
    minSpeeds: {
      normalEnemy1: 0.07,
      normalEnemy2: 0.10,
      normalEnemy3: 0.06,
      giantEnemy1: 0.12,
      wizardEnemy1: 0.10
    }
  };

  const wavePlacementDefaults = {
    mode: 'roundRobin',
    rotatePoints: true,
    spreadRadius: 7,
    edgeSpread: 10,
    attempts: 7,
    minEnemySpacing: 7,
    avoidPlayerRadius: 22,
    clampToPlayfield: true,
    usePointPools: true
  };

  const waveSpawnBudgetDefaults = {
    maxSpawnsPerTick: 1,
    minTicksBetweenSpawns: 8,
    maxActiveEnemies: 12,
    maxActivePerSpawnPoint: 4,
    holdWhenCapped: true
  };

  const standardStatScalingDefaults = {
    progressSource: 'zoneKills',
    curve: 'sqrt',
    baseSpeed: 0.22,
    maxSpeed: 0.68,
    factor: 0.035,
    typeMultipliers: {
      normalEnemy1: 1,
      normalEnemy2: 0.9,
      normalEnemy3: 0.55,
      giantEnemy1: 0.65,
      wizardEnemy1: 0.45
    },
    minSpeeds: {
      normalEnemy1: 0.08,
      normalEnemy2: 0.14,
      normalEnemy3: 0.08,
      giantEnemy1: 0.18,
      wizardEnemy1: 0.14
    }
  };

  // Editor-facing template for the old/standard kill-count spawn subsystem.
  // A zone can use spawnSystem: 'standard' and tune these values without using wave logic.
  const standardSpawnDefaults = {
    enabled: true,
    targetKills: 300,
    maxActiveChests: 1,
    statScaling: standardStatScalingDefaults,
    initialSpawns: [
      { delay: 80, enemy: 'normalEnemy1' },
      { delay: 92, enemy: 'normalEnemy3' }
    ],
    regularSpawn: { enabled: true, delayEarly: 112, delayLate: 56, lateAtZoneKills: 100 },
    chest: { enabled: true },
    specials: {
      giant: { enabled: true, firstAt: 20, intervalStart: 20, intervalMin: 12, delayEarly: 120, delayLate: 60, lateAtZoneKills: 100 },
      wizard: { enabled: true, firstAt: 30, intervalStart: 30, intervalMin: 10, delayEarly: 112, delayLate: 56, lateAtZoneKills: 100 }
    },
    killRewards: []
  };

  window.BoneCrawlerZoneSpawnConfig = {
    name: 'BoneCrawler baseline spawn config',
    version: 3,
    configTemplates: {
      standard: standardSpawnDefaults,
      waveStatScaling: waveStatScalingDefaults,
      wavePlacement: wavePlacementDefaults,
      waveSpawnBudget: waveSpawnBudgetDefaults
    },
    zones: {
      1: {
        label: 'Zone 1',
        zoneType: 'normal',
        spawnSystem: 'waves',
        standard: {
          ...standardSpawnDefaults,
          targetKills: 300,
          killRewards: [
            { id: 'zone1_door_key', at: 80, metric: 'runKills', action: 'spawnKeyDrop', kind: 'zone1Door', text: 'ZONE 1 KEY!', color: 'FR1' },
            { id: 'zone1_secret_key', at: 80, metric: 'runKills', action: 'spawnKeyDrop', kind: 'secret1', text: 'SECRET KEY!', color: 'MG2' },
            { id: 'zone1_dragon', at: 300, metric: 'runKills', action: 'spawnBoss', bossId: 'zone1Dragon' }
          ]
        },
        waitForDialogClear: true,
        activationDelaySec: 2,
        entryTextDelaySec: 0.25,
        startDelay: 50,
        betweenWaveDelay: 70,
        entryText: 'ZONE 1',
        showWaveText: true,
        showPressureText: false,
        waveIntro: {
          enabled: true,
          waveTextLifeSec: 2.0,
          readyText: 'Ready?',
          readyTextLifeSec: 0.9,
          goText: 'GO!',
          goTextLifeSec: 0.65,
          yOffset: 14
        },
        defaultSpawnAnimation: 'rise',
        maxActiveChests: 2,
        waveSystem: {
          statScaling: { ...waveStatScalingDefaults, baseSpeed: 0.13, maxSpeed: 0.32, factor: 0.018 },
          placement: {
            ...wavePlacementDefaults,
            pointPools: {
              normal: ['z1_top_door','z1_left_edge','z1_right_edge'],
              wizard: ['z1_top_door','z1_left_edge','z1_right_edge'],
              rise: ['z1_bones_left','z1_bones_right'],
              giant: ['z1_bones_left','z1_bones_right']
            }
          },
          spawnBudget: { ...waveSpawnBudgetDefaults, maxActiveEnemies: 11, maxActivePerSpawnPoint: 3, minTicksBetweenSpawns: 9 }
        },
        statScaling: { ...waveStatScalingDefaults, baseSpeed: 0.13, maxSpeed: 0.32, factor: 0.018 },
        spawnPoints: [
          { id: 'z1_top_door', label: 'Top Door Entrance', mode: 'edge', side: 'top', x: 58, defaultAnimation: 'walkIn' },
          { id: 'z1_left_edge', label: 'Left Wall Entrance', mode: 'edge', side: 'left', y: 62, defaultAnimation: 'walkIn' },
          { id: 'z1_right_edge', label: 'Right Wall Entrance', mode: 'edge', side: 'right', y: 62, defaultAnimation: 'walkIn' },
          { id: 'z1_bones_left', label: 'Left Bone Pile', mode: 'map', x: 24, y: 62, defaultAnimation: 'rise' },
          { id: 'z1_bones_right', label: 'Right Bone Pile', mode: 'map', x: 89, y: 62, defaultAnimation: 'rise' }
        ],
        waves: [
          { id: 'z1_wave_01', name: 'Wave 1', startDelay: 40, pressure: { ...normalPressure, trigger: 'clearedOrTimer', intervalSec: 8, maxBursts: 3, showText: false }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 24, spawnPoint: 'z1_top_door' },
            { enemy: 'normalEnemy3', count: 1, delay: 40, spawnPoint: 'z1_bones_left', animation: 'rise' }
          ], pressureBursts: [
            { label: 'Pressure 1', spawns: [
              { enemy: 'normalEnemy1', count: 2, gap: 24, spawnPoint: 'z1_right_edge' },
              { enemy: 'normalEnemy2', count: 1, delay: 34, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 1, delay: 54, spawnPoint: 'z1_bones_right', animation: 'rise' }
            ]},
            { label: 'Pressure 2', dropChest: false, spawns: [
              { enemy: 'normalEnemy1', count: 2, gap: 22, spawnPoint: 'z1_top_door' },
              { enemy: 'normalEnemy2', count: 2, gap: 24, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 1, delay: 56, spawnPoint: 'z1_bones_right', animation: 'rise' }
            ]},
            { label: 'Pressure 3', dropChest: false, spawns: [
              { enemy: 'normalEnemy1', count: 2, gap: 20, spawnPoint: 'z1_right_edge' },
              { enemy: 'normalEnemy2', count: 2, gap: 22, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 1, delay: 52, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'giantEnemy1', count: 1, delay: 86, spawnPoint: 'z1_bones_left', animation: 'rise' }
            ]}
          ]},
          { id: 'z1_wave_02', name: 'Wave 2', startDelay: 65, pressure: { ...normalPressure, trigger: 'clearedOrTimer', intervalSec: 9, maxBursts: 3, showText: false }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 22, spawnPoint: 'z1_left_edge' },
            { enemy: 'normalEnemy2', count: 1, delay: 36, spawnPoint: 'z1_right_edge' },
            { enemy: 'normalEnemy3', count: 1, delay: 56, spawnPoint: 'z1_bones_right', animation: 'rise' }
          ], pressureBursts: [
            { label: 'Pressure 1', spawns: [
              { enemy: 'normalEnemy1', count: 2, gap: 22, spawnPoint: 'z1_top_door' },
              { enemy: 'normalEnemy2', count: 2, gap: 24, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 1, delay: 56, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'wizardEnemy1', count: 1, delay: 88, spawnPoint: 'z1_top_door' }
            ]},
            { label: 'Pressure 2', dropChest: false, spawns: [
              { enemy: 'normalEnemy1', count: 2, gap: 20, spawnPoint: 'z1_right_edge' },
              { enemy: 'normalEnemy2', count: 2, gap: 22, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 2, gap: 24, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'giantEnemy1', count: 1, delay: 96, spawnPoint: 'z1_bones_left', animation: 'rise' }
            ]},
            { label: 'Pressure 3', dropChest: false, spawns: [
              { enemy: 'normalEnemy1', count: 3, gap: 18, spawnPoint: 'z1_top_door' },
              { enemy: 'normalEnemy2', count: 2, gap: 20, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 1, delay: 56, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'wizardEnemy1', count: 1, delay: 76, spawnPoint: 'z1_right_edge' },
              { enemy: 'giantEnemy1', count: 1, delay: 108, spawnPoint: 'z1_bones_left', animation: 'rise' }
            ]}
          ]},
          { id: 'z1_wave_03', name: 'Wave 3', startDelay: 75, pressure: { ...normalPressure, trigger: 'clearedOrTimer', intervalSec: 10, maxBursts: 3, showText: false }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 20, spawnPoint: 'z1_top_door' },
            { enemy: 'normalEnemy2', count: 2, gap: 22, spawnPoint: 'z1_left_edge' },
            { enemy: 'normalEnemy3', count: 1, delay: 52, spawnPoint: 'z1_bones_left', animation: 'rise' }
          ], pressureBursts: [
            { label: 'Pressure 1', spawns: [
              { enemy: 'normalEnemy1', count: 2, gap: 20, spawnPoint: 'z1_right_edge' },
              { enemy: 'normalEnemy2', count: 2, gap: 22, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 2, gap: 24, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'wizardEnemy1', count: 1, delay: 80, spawnPoint: 'z1_top_door' }
            ]},
            { label: 'Pressure 2', dropChest: false, spawns: [
              { enemy: 'normalEnemy1', count: 3, gap: 18, spawnPoint: 'z1_top_door' },
              { enemy: 'normalEnemy2', count: 2, gap: 20, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 1, delay: 54, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'wizardEnemy1', count: 1, delay: 74, spawnPoint: 'z1_right_edge' },
              { enemy: 'giantEnemy1', count: 1, delay: 104, spawnPoint: 'z1_bones_left', animation: 'rise' }
            ]},
            { label: 'Pressure 3', dropChest: false, spawns: [
              { enemy: 'normalEnemy1', count: 3, gap: 16, spawnPoint: 'z1_right_edge' },
              { enemy: 'normalEnemy2', count: 3, gap: 18, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 2, gap: 22, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'wizardEnemy1', count: 1, delay: 76, spawnPoint: 'z1_top_door' },
              { enemy: 'giantEnemy1', count: 1, delay: 110, spawnPoint: 'z1_bones_left', animation: 'rise' }
            ]}
          ]},
          { id: 'z1_wave_04', name: 'Wave 4', startDelay: 80, pressure: { ...normalPressure, trigger: 'clearedOrTimer', intervalSec: 11, maxBursts: 3, showText: false }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 18, spawnPoint: 'z1_top_door' },
            { enemy: 'normalEnemy2', count: 2, gap: 20, spawnPoint: 'z1_left_edge' },
            { enemy: 'normalEnemy3', count: 1, delay: 50, spawnPoint: 'z1_bones_right', animation: 'rise' },
            { enemy: 'wizardEnemy1', count: 1, delay: 76, spawnPoint: 'z1_right_edge' }
          ], pressureBursts: [
            { label: 'Pressure 1', spawns: [
              { enemy: 'normalEnemy1', count: 3, gap: 18, spawnPoint: 'z1_top_door' },
              { enemy: 'normalEnemy2', count: 2, gap: 20, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 2, gap: 22, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'giantEnemy1', count: 1, delay: 94, spawnPoint: 'z1_bones_left', animation: 'rise' }
            ]},
            { label: 'Pressure 2', dropChest: false, spawns: [
              { enemy: 'normalEnemy1', count: 3, gap: 16, spawnPoint: 'z1_top_door' },
              { enemy: 'normalEnemy2', count: 3, gap: 18, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 2, gap: 20, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'wizardEnemy1', count: 1, delay: 72, spawnPoint: 'z1_right_edge' },
              { enemy: 'giantEnemy1', count: 1, delay: 104, spawnPoint: 'z1_bones_left', animation: 'rise' }
            ]},
            { label: 'Pressure 3', dropChest: false, spawns: [
              { enemy: 'normalEnemy1', count: 4, gap: 14, spawnPoint: 'z1_top_door' },
              { enemy: 'normalEnemy2', count: 3, gap: 16, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 2, gap: 20, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'wizardEnemy1', count: 1, delay: 70, spawnPoint: 'z1_right_edge' },
              { enemy: 'giantEnemy1', count: 1, delay: 106, spawnPoint: 'z1_bones_left', animation: 'rise' }
            ]}
          ]},
          { id: 'z1_wave_05', name: 'Wave 5', startDelay: 90, pressure: { ...normalPressure, trigger: 'clearedOrTimer', intervalSec: 12, maxBursts: 3, showText: false }, spawns: [
            { enemy: 'normalEnemy1', count: 3, gap: 16, spawnPoint: 'z1_top_door' },
            { enemy: 'normalEnemy2', count: 2, gap: 18, spawnPoint: 'z1_left_edge' },
            { enemy: 'normalEnemy3', count: 1, delay: 48, spawnPoint: 'z1_bones_right', animation: 'rise' },
            { enemy: 'wizardEnemy1', count: 1, delay: 72, spawnPoint: 'z1_right_edge' }
          ], pressureBursts: [
            { label: 'Pressure 1', spawns: [
              { enemy: 'normalEnemy1', count: 3, gap: 16, spawnPoint: 'z1_top_door' },
              { enemy: 'normalEnemy2', count: 3, gap: 18, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 2, gap: 20, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'wizardEnemy1', count: 1, delay: 68, spawnPoint: 'z1_right_edge' },
              { enemy: 'giantEnemy1', count: 1, delay: 102, spawnPoint: 'z1_bones_left', animation: 'rise' }
            ]},
            { label: 'Pressure 2', dropChest: false, spawns: [
              { enemy: 'normalEnemy1', count: 4, gap: 14, spawnPoint: 'z1_top_door' },
              { enemy: 'normalEnemy2', count: 3, gap: 16, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 2, gap: 18, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'wizardEnemy1', count: 2, gap: 66, delay: 64, spawnPoint: 'z1_right_edge' },
              { enemy: 'giantEnemy1', count: 1, delay: 106, spawnPoint: 'z1_bones_left', animation: 'rise' }
            ]},
            { label: 'Pressure 3', dropChest: false, spawns: [
              { enemy: 'normalEnemy1', count: 4, gap: 12, spawnPoint: 'z1_top_door' },
              { enemy: 'normalEnemy2', count: 3, gap: 14, spawnPoint: 'z1_left_edge' },
              { enemy: 'normalEnemy3', count: 2, gap: 18, spawnPoint: 'z1_bones_right', animation: 'rise' },
              { enemy: 'wizardEnemy1', count: 2, gap: 62, delay: 60, spawnPoint: 'z1_right_edge' },
              { enemy: 'giantEnemy1', count: 2, gap: 86, delay: 102, spawnPoint: 'z1_bones_left', animation: 'rise' }
            ]}
          ]}
        ],
        // Progression actions are handled via the waves.completed event
        onComplete: []
      },
      2: {
        label: 'Zone 2', zoneType: 'normal', spawnSystem: 'waves', waitForDialogClear: true, activationDelaySec: 2, entryTextDelaySec: 0.25, entryText: 'ZONE 2', entryTextLife: 60, showWaveText: true, showPressureText: false,
        waveIntro: {
          enabled: true,
          waveTextLifeSec: 2.0,
          readyText: 'Ready?',
          readyTextLifeSec: 0.9,
          goText: 'GO!',
          goTextLifeSec: 0.65,
          yOffset: 14
        },
        defaultSpawnAnimation: 'rise', maxActiveChests: 2,
        waveSystem: {
          statScaling: { ...waveStatScalingDefaults, baseSpeed: 0.14, maxSpeed: 0.34, factor: 0.018 },
          placement: {
            ...wavePlacementDefaults,
            pointPools: {
              normal: ['z2_top_path','z2_left_path','z2_right_path'],
              wizard: ['z2_top_path','z2_left_path','z2_right_path'],
              rise: ['z2_roots_left','z2_roots_right'],
              giant: ['z2_roots_left','z2_roots_right']
            }
          },
          spawnBudget: { ...waveSpawnBudgetDefaults, maxActiveEnemies: 12, maxActivePerSpawnPoint: 3, minTicksBetweenSpawns: 8 }
        },
        statScaling: { ...waveStatScalingDefaults, baseSpeed: 0.14, maxSpeed: 0.34, factor: 0.018 },
        spawnPoints: [
          { id: 'z2_top_path', label: 'Top Path', mode: 'edge', side: 'top', x: 58, defaultAnimation: 'walkIn' },
          { id: 'z2_left_path', label: 'Left Path', mode: 'edge', side: 'left', y: 66, defaultAnimation: 'walkIn' },
          { id: 'z2_right_path', label: 'Right Path', mode: 'edge', side: 'right', y: 66, defaultAnimation: 'walkIn' },
          { id: 'z2_roots_left', label: 'Left Root Mass', mode: 'map', x: 28, y: 59, defaultAnimation: 'rise' },
          { id: 'z2_roots_right', label: 'Right Root Mass', mode: 'map', x: 84, y: 59, defaultAnimation: 'rise' }
        ],
        waves: [
          { id: 'z2_wave_01', name: 'Wave 1', startDelay: 55, pressure: { ...normalPressure, intervalSec: 14, maxBursts: 2 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 16, spawnPoint: 'z2_top_path' },
            { enemy: 'normalEnemy2', count: 1, delay: 35, spawnPoint: 'z2_left_path' },
            { enemy: 'normalEnemy1', count: 1, delay: 55, spawnPoint: 'z2_right_path' }
          ], pressureSpawns: [
            { enemy: 'normalEnemy1', count: 2, spawnPoint: 'z2_right_path' },
            { enemy: 'normalEnemy3', count: 1, spawnPoint: 'z2_roots_left', animation: 'rise' }
          ]},
          { id: 'z2_wave_02', name: 'Wave 2', startDelay: 62, pressure: { ...normalPressure, intervalSec: 16, maxBursts: 2 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 14, spawnPoint: 'z2_left_path' },
            { enemy: 'normalEnemy2', count: 2, gap: 16, spawnPoint: 'z2_right_path' },
            { enemy: 'normalEnemy3', count: 1, delay: 55, spawnPoint: 'z2_roots_right', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'normalEnemy3', count: 1, spawnPoint: 'z2_roots_left', animation: 'rise' },
            { enemy: 'normalEnemy2', count: 2, spawnPoint: 'z2_top_path' }
          ]},
          { id: 'z2_wave_03', name: 'Wave 3', startDelay: 68, pressure: { ...normalPressure, intervalSec: 18, maxBursts: 2 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 12, spawnPoint: 'z2_top_path' },
            { enemy: 'normalEnemy2', count: 2, gap: 14, spawnPoint: 'z2_left_path' },
            { enemy: 'wizardEnemy1', count: 1, delay: 65, spawnPoint: 'z2_right_path' }
          ], pressureSpawns: [
            { enemy: 'normalEnemy1', count: 2, spawnPoint: 'z2_left_path' },
            { enemy: 'normalEnemy3', count: 1, spawnPoint: 'z2_roots_right', animation: 'rise' },
            { enemy: 'wizardEnemy1', count: 1, delay: 35, spawnPoint: 'z2_top_path' }
          ]},
          { id: 'z2_wave_04', name: 'Wave 4', startDelay: 74, pressure: { ...normalPressure, intervalSec: 20, maxBursts: 2 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 12, spawnPoint: 'z2_left_path' },
            { enemy: 'normalEnemy2', count: 2, gap: 12, spawnPoint: 'z2_right_path' },
            { enemy: 'normalEnemy3', count: 1, delay: 45, spawnPoint: 'z2_roots_left', animation: 'rise' },
            { enemy: 'giantEnemy1', count: 1, delay: 78, spawnPoint: 'z2_roots_right', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'wizardEnemy1', count: 1, spawnPoint: 'z2_top_path' },
            { enemy: 'normalEnemy3', count: 3, gap: 14, spawnPoint: 'z2_roots_left', animation: 'rise' }
          ]},
          { id: 'z2_wave_05', name: 'Wave 5', startDelay: 80, pressure: { ...normalPressure, intervalSec: 22, maxBursts: 2 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 10, spawnPoint: 'z2_top_path' },
            { enemy: 'normalEnemy2', count: 2, gap: 12, spawnPoint: 'z2_left_path' },
            { enemy: 'normalEnemy3', count: 2, gap: 18, spawnPoint: 'z2_roots_right', animation: 'rise' },
            { enemy: 'wizardEnemy1', count: 1, delay: 70, spawnPoint: 'z2_right_path' }
          ], pressureSpawns: [
            { enemy: 'normalEnemy1', count: 2, spawnPoint: 'z2_left_path' },
            { enemy: 'normalEnemy2', count: 1, spawnPoint: 'z2_right_path' },
            { enemy: 'giantEnemy1', count: 1, spawnPoint: 'z2_roots_left', animation: 'rise' }
          ]},
          { id: 'z2_wave_06', name: 'Wave 6', startDelay: 86, pressure: { ...normalPressure, intervalSec: 24, maxBursts: 2 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 10, spawnPoint: 'z2_top_path' },
            { enemy: 'normalEnemy2', count: 2, gap: 10, spawnPoint: 'z2_left_path' },
            { enemy: 'wizardEnemy1', count: 1, delay: 48, spawnPoint: 'z2_right_path' },
            { enemy: 'giantEnemy1', count: 1, delay: 75, spawnPoint: 'z2_roots_right', animation: 'rise' },
            { enemy: 'normalEnemy3', count: 1, delay: 95, spawnPoint: 'z2_roots_left', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'wizardEnemy1', count: 1, spawnPoint: 'z2_top_path' },
            { enemy: 'normalEnemy3', count: 2, gap: 14, spawnPoint: 'z2_roots_left', animation: 'rise' },
            { enemy: 'normalEnemy2', count: 2, spawnPoint: 'z2_right_path' }
          ]},
          { id: 'z2_wave_07', name: 'Wave 7', startDelay: 92, pressure: { ...normalPressure, intervalSec: 26, maxBursts: 2 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 9, spawnPoint: 'z2_left_path' },
            { enemy: 'normalEnemy2', count: 2, gap: 9, spawnPoint: 'z2_right_path' },
            { enemy: 'normalEnemy3', count: 2, gap: 14, spawnPoint: 'z2_roots_left', animation: 'rise' },
            { enemy: 'wizardEnemy1', count: 1, delay: 55, spawnPoint: 'z2_top_path' },
            { enemy: 'giantEnemy1', count: 1, delay: 85, spawnPoint: 'z2_roots_right', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'wizardEnemy1', count: 1, spawnPoint: 'z2_right_path' },
            { enemy: 'giantEnemy1', count: 1, spawnPoint: 'z2_roots_left', animation: 'rise' },
            { enemy: 'normalEnemy1', count: 2, spawnPoint: 'z2_left_path' },
            { enemy: 'normalEnemy2', count: 1, spawnPoint: 'z2_right_path' }
          ]},
          { id: 'z2_wave_08', name: 'Wave 8', startDelay: 100, pressure: { ...normalPressure, intervalSec: 28, maxBursts: 2 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 8, spawnPoint: 'z2_top_path' },
            { enemy: 'normalEnemy2', count: 2, gap: 8, spawnPoint: 'z2_left_path' },
            { enemy: 'normalEnemy3', count: 2, gap: 12, spawnPoint: 'z2_roots_right', animation: 'rise' },
            { enemy: 'wizardEnemy1', count: 1, delay: 48, spawnPoint: 'z2_right_path' },
            { enemy: 'giantEnemy1', count: 1, delay: 78, spawnPoint: 'z2_roots_left', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'wizardEnemy1', count: 1, spawnPoint: 'z2_top_path' },
            { enemy: 'giantEnemy1', count: 1, spawnPoint: 'z2_roots_right', animation: 'rise' },
            { enemy: 'normalEnemy1', count: 2, spawnPoint: 'z2_left_path' },
            { enemy: 'normalEnemy2', count: 1, spawnPoint: 'z2_right_path' }
          ]}
        ],
        // Progression actions are handled via the waves.completed event
        onComplete: []
      },

      3: {
        label: 'Zone 3', zoneType: 'normal', spawnSystem: 'waves', waitForDialogClear: true, activationDelaySec: 2, entryTextDelaySec: 0.25, entryText: 'ZONE 3', entryTextLife: 60, showWaveText: true, showPressureText: false,
        waveIntro: {
          enabled: true,
          waveTextLifeSec: 2.0,
          readyText: 'Ready?',
          readyTextLifeSec: 0.9,
          goText: 'GO!',
          goTextLifeSec: 0.65,
          yOffset: 14
        },
        defaultSpawnAnimation: 'rise', maxActiveChests: 2,
        waveSystem: {
          statScaling: { ...waveStatScalingDefaults, baseSpeed: 0.15, maxSpeed: 0.36, factor: 0.018 },
          placement: {
            ...wavePlacementDefaults,
            pointPools: {
              normal: ['z3_top_path','z3_left_wall','z3_right_wall'],
              wizard: ['z3_top_path','z3_left_wall','z3_right_wall'],
              rise: ['z3_grave_left','z3_grave_right'],
              giant: ['z3_grave_left','z3_grave_right']
            }
          },
          spawnBudget: { ...waveSpawnBudgetDefaults, maxActiveEnemies: 13, maxActivePerSpawnPoint: 3, minTicksBetweenSpawns: 8 }
        },
        statScaling: { ...waveStatScalingDefaults, baseSpeed: 0.15, maxSpeed: 0.36, factor: 0.018 },
        spawnPoints: [
          { id: 'z3_top_path', label: 'Top Path', mode: 'edge', side: 'top', x: 58, defaultAnimation: 'walkIn' },
          { id: 'z3_left_wall', label: 'Left Wall', mode: 'edge', side: 'left', y: 64, defaultAnimation: 'walkIn' },
          { id: 'z3_right_wall', label: 'Right Wall', mode: 'edge', side: 'right', y: 64, defaultAnimation: 'walkIn' },
          { id: 'z3_grave_left', label: 'Left Grave', mode: 'map', x: 26, y: 61, defaultAnimation: 'rise' },
          { id: 'z3_grave_right', label: 'Right Grave', mode: 'map', x: 86, y: 61, defaultAnimation: 'rise' }
        ],
        waves: [
          { id: 'z3_wave_01', name: 'Wave 1', startDelay: 55, pressure: { ...normalPressure, intervalSec: 12, maxBursts: 1 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 14, spawnPoint: 'z3_top_path' },
            { enemy: 'normalEnemy2', count: 1, delay: 36, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy3', count: 1, delay: 52, spawnPoint: 'z3_grave_left', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'normalEnemy2', count: 1, spawnPoint: 'z3_right_wall' },
            { enemy: 'normalEnemy3', count: 1, spawnPoint: 'z3_grave_right', animation: 'rise' }
          ]},
          { id: 'z3_wave_02', name: 'Wave 2', startDelay: 60, pressure: { ...normalPressure, intervalSec: 13, maxBursts: 1 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 12, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy2', count: 2, gap: 12, spawnPoint: 'z3_right_wall' },
            { enemy: 'wizardEnemy1', count: 1, delay: 58, spawnPoint: 'z3_top_path' }
          ], pressureSpawns: [
            { enemy: 'normalEnemy3', count: 2, gap: 14, spawnPoint: 'z3_grave_left', animation: 'rise' },
            { enemy: 'normalEnemy1', count: 1, spawnPoint: 'z3_top_path' }
          ]},
          { id: 'z3_wave_03', name: 'Wave 3', startDelay: 66, pressure: { ...normalPressure, intervalSec: 14, maxBursts: 1 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 10, spawnPoint: 'z3_top_path' },
            { enemy: 'normalEnemy2', count: 2, gap: 12, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy3', count: 2, gap: 16, spawnPoint: 'z3_grave_right', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'wizardEnemy1', count: 1, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy2', count: 2, gap: 12, spawnPoint: 'z3_right_wall' }
          ]},
          { id: 'z3_wave_04', name: 'Wave 4', startDelay: 72, pressure: { ...normalPressure, intervalSec: 15, maxBursts: 2 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 10, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy2', count: 2, gap: 10, spawnPoint: 'z3_right_wall' },
            { enemy: 'wizardEnemy1', count: 1, delay: 48, spawnPoint: 'z3_top_path' },
            { enemy: 'giantEnemy1', count: 1, delay: 72, spawnPoint: 'z3_grave_left', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'wizardEnemy1', count: 1, spawnPoint: 'z3_top_path' },
            { enemy: 'normalEnemy3', count: 2, gap: 12, spawnPoint: 'z3_grave_right', animation: 'rise' }
          ]},
          { id: 'z3_wave_05', name: 'Wave 5', startDelay: 78, pressure: { ...normalPressure, intervalSec: 16, maxBursts: 2 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 9, spawnPoint: 'z3_top_path' },
            { enemy: 'normalEnemy2', count: 2, gap: 9, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy3', count: 2, gap: 14, spawnPoint: 'z3_grave_left', animation: 'rise' },
            { enemy: 'wizardEnemy1', count: 1, delay: 55, spawnPoint: 'z3_right_wall' }
          ], pressureSpawns: [
            { enemy: 'wizardEnemy1', count: 1, spawnPoint: 'z3_top_path' },
            { enemy: 'giantEnemy1', count: 1, spawnPoint: 'z3_grave_right', animation: 'rise' },
            { enemy: 'normalEnemy1', count: 1, spawnPoint: 'z3_left_wall' }
          ]},
          { id: 'z3_wave_06', name: 'Wave 6', startDelay: 84, pressure: { ...normalPressure, intervalSec: 17, maxBursts: 2 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 8, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy2', count: 2, gap: 8, spawnPoint: 'z3_right_wall' },
            { enemy: 'wizardEnemy1', count: 2, gap: 28, delay: 45, spawnPoint: 'z3_top_path' },
            { enemy: 'giantEnemy1', count: 1, delay: 82, spawnPoint: 'z3_grave_left', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'wizardEnemy1', count: 1, spawnPoint: 'z3_right_wall' },
            { enemy: 'normalEnemy3', count: 2, gap: 12, spawnPoint: 'z3_grave_right', animation: 'rise' },
            { enemy: 'normalEnemy2', count: 1, spawnPoint: 'z3_left_wall' }
          ]},
          { id: 'z3_wave_07', name: 'Wave 7', startDelay: 90, pressure: { ...normalPressure, intervalSec: 18, maxBursts: 2 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 8, spawnPoint: 'z3_top_path' },
            { enemy: 'normalEnemy2', count: 2, gap: 8, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy3', count: 2, gap: 12, spawnPoint: 'z3_grave_left', animation: 'rise' },
            { enemy: 'wizardEnemy1', count: 1, delay: 45, spawnPoint: 'z3_right_wall' },
            { enemy: 'giantEnemy1', count: 1, delay: 78, spawnPoint: 'z3_grave_right', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'wizardEnemy1', count: 1, spawnPoint: 'z3_top_path' },
            { enemy: 'giantEnemy1', count: 1, spawnPoint: 'z3_grave_left', animation: 'rise' },
            { enemy: 'normalEnemy1', count: 1, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy2', count: 1, spawnPoint: 'z3_right_wall' }
          ]},
          { id: 'z3_wave_08', name: 'Wave 8', startDelay: 96, pressure: { ...normalPressure, intervalSec: 19, maxBursts: 3 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 7, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy2', count: 2, gap: 7, spawnPoint: 'z3_right_wall' },
            { enemy: 'normalEnemy3', count: 2, gap: 11, spawnPoint: 'z3_grave_right', animation: 'rise' },
            { enemy: 'wizardEnemy1', count: 2, gap: 24, delay: 42, spawnPoint: 'z3_top_path' },
            { enemy: 'giantEnemy1', count: 1, delay: 82, spawnPoint: 'z3_grave_left', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'wizardEnemy1', count: 1, spawnPoint: 'z3_right_wall' },
            { enemy: 'giantEnemy1', count: 1, spawnPoint: 'z3_grave_right', animation: 'rise' },
            { enemy: 'normalEnemy3', count: 2, gap: 10, spawnPoint: 'z3_grave_left', animation: 'rise' }
          ]},
          { id: 'z3_wave_09', name: 'Wave 9', startDelay: 102, pressure: { ...normalPressure, intervalSec: 20, maxBursts: 3 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 7, spawnPoint: 'z3_top_path' },
            { enemy: 'normalEnemy2', count: 2, gap: 7, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy3', count: 2, gap: 10, spawnPoint: 'z3_grave_left', animation: 'rise' },
            { enemy: 'wizardEnemy1', count: 2, gap: 22, delay: 38, spawnPoint: 'z3_right_wall' },
            { enemy: 'giantEnemy1', count: 1, delay: 70, spawnPoint: 'z3_grave_right', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'wizardEnemy1', count: 1, spawnPoint: 'z3_top_path' },
            { enemy: 'wizardEnemy1', count: 1, delay: 28, spawnPoint: 'z3_right_wall' },
            { enemy: 'giantEnemy1', count: 1, spawnPoint: 'z3_grave_left', animation: 'rise' },
            { enemy: 'normalEnemy2', count: 1, spawnPoint: 'z3_left_wall' }
          ]},
          { id: 'z3_wave_10', name: 'Wave 10', startDelay: 110, pressure: { ...normalPressure, intervalSec: 22, maxBursts: 3 }, spawns: [
            { enemy: 'normalEnemy1', count: 2, gap: 6, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy2', count: 2, gap: 6, spawnPoint: 'z3_right_wall' },
            { enemy: 'normalEnemy3', count: 2, gap: 9, spawnPoint: 'z3_grave_right', animation: 'rise' },
            { enemy: 'wizardEnemy1', count: 2, gap: 20, delay: 35, spawnPoint: 'z3_top_path' },
            { enemy: 'giantEnemy1', count: 2, gap: 36, delay: 70, spawnPoint: 'z3_grave_left', animation: 'rise' }
          ], pressureSpawns: [
            { enemy: 'wizardEnemy1', count: 2, gap: 22, spawnPoint: 'z3_top_path' },
            { enemy: 'giantEnemy1', count: 1, spawnPoint: 'z3_grave_right', animation: 'rise' },
            { enemy: 'normalEnemy1', count: 1, spawnPoint: 'z3_left_wall' },
            { enemy: 'normalEnemy2', count: 1, spawnPoint: 'z3_right_wall' }
          ]}
        ],
        // Progression actions are handled via the waves.completed event
        onComplete: []
      },

      101: { label: 'Secret Zone 1', zoneType: 'secret', spawnSystem: 'none', flow: 'passthrough_to_zone_2', entryBonusPoints: 500, entryBonusOncePerRun: true, entryBonusLabel: '+500 SECRET BONUS' },
      102: { label: 'Secret Zone 2', zoneType: 'secret', spawnSystem: 'none', flow: 'passthrough_to_victory', entryBonusPoints: 500, entryBonusOncePerRun: true, entryBonusLabel: '+500 SECRET BONUS' }
    }
  };
})();
