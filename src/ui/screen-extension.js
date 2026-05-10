/* BoneCrawler UI module reads public game globals */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('screen-extension-enabled');

  var panel = document.getElementById('screenExtensionPanel');
  if (!panel) return;

  var els = {
    state: document.getElementById('screenExtState'),
    zone: document.getElementById('screenExtZone'),
    wave: document.getElementById('screenExtWave'),
    objective: document.getElementById('screenExtObjective'),
    playerName: document.getElementById('screenExtPlayerName'),
    score: document.getElementById('screenExtScore'),
    kills: document.getElementById('screenExtKills'),
    zoneKey: document.getElementById('screenExtZoneKey'),
    secretKey: document.getElementById('screenExtRankLegacyKey'),
    miniMapGrid: document.getElementById('screenMiniMapGrid'),
    miniMapCaption: document.getElementById('screenMiniMapCaption'),
    upgradeStack: null
  };

  function hasGlobal(name) {
    try { return typeof window[name] !== 'undefined'; }
    catch (err) { return false; }
  }

  function readGlobal(name, fallback) {
    try {
      if (typeof window[name] !== 'undefined') return window[name];
    } catch (err) {}

    // Game state files use top-level `let` bindings such as score, killCount,
    // currentZone, and currentPlayerName. 
    try {
      if (/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(name)) {
        var value = Function('try { return typeof ' + name + ' !== "undefined" ? ' + name + ' : undefined; } catch (err) { return undefined; }')();
        if (typeof value !== 'undefined') return value;
      }
    } catch (err) {}

    return fallback;
  }

  function setText(el, value) {
    if (!el) return;
    var next = String(value == null ? '' : value);
    if (el.textContent !== next) el.textContent = next;
  }

  function keyFlag(name) {
    var player = readGlobal('player', null);
    return !!(player && player[name]);
  }

  function formatNumber(value) {
    var n = Number(value);
    if (!isFinite(n)) n = 0;
    n = Math.max(0, Math.floor(n));
    return String(n);
  }

  function getPlayerNameText() {
    var name = readGlobal('currentPlayerName', 'Player');
    if (!name && readGlobal('player', null) && readGlobal('player', null).name) name = readGlobal('player', null).name;
    name = String(name || 'Player').trim() || 'Player';
    return name.toUpperCase().slice(0, 12);
  }


  function getSpawnDebugState() {
    try {
      if (window.BoneCrawlerZoneSpawn && typeof BoneCrawlerZoneSpawn.getDebugState === 'function') {
        return BoneCrawlerZoneSpawn.getDebugState() || null;
      }
    } catch (err) {}
    return null;
  }

  function getWaveText(zoneId) {
    var text = 'WAVE —';
    try {
      var st = getSpawnDebugState();
      if (st) {
        if (st && Number(st.zoneId || st.currentZone || zoneId) === Number(zoneId)) {
          var n = st.waveNumber || (typeof st.waveIndex === 'number' ? st.waveIndex + 1 : null);
          var total = st.waveTotal || st.totalWaves || null;
          if (n && total) text = 'WAVE ' + n + ' / ' + total;
          else if (n) text = 'WAVE ' + n;
        }
      }
    } catch (err) {}
    return text;
  }

  function isTitleLikeState(state) {
    if (window.BoneCrawlerTitleScreen && typeof BoneCrawlerTitleScreen.isActive === 'function') {
      try { return BoneCrawlerTitleScreen.isActive(); } catch (err) {}
    }
    return state === 'title' || state === 'intro' || state === 'intro_fade' || state === 'scoreboard';
  }

  function getZoneLabel(zoneId, state) {
    if (isTitleLikeState(state)) return 'TITLE SCREEN';
    try {
      if (window.BoneCrawlerZones && typeof BoneCrawlerZones.getLabel === 'function') {
        return BoneCrawlerZones.getLabel(zoneId);
      }
    } catch (err) {}
    return zoneId >= 100 ? 'SECRET ZONE ' + (zoneId - 100) : 'ZONE ' + zoneId;
  }

  function getObjective(zoneId, state) {
    if (isTitleLikeState(state)) return 'Press PLAY to enter the dungeon.';
    if (state === 'dialog') return 'Read the message. Press confirm to continue.';
    if (state === 'paused') return 'Paused. Return when ready.';

    try {
      if (window.BoneCrawlerZones && typeof BoneCrawlerZones.get === 'function') {
        var zone = BoneCrawlerZones.get(zoneId);
        if (zone && typeof zone.objective === 'function') return zone.objective();
      }
    } catch (err) {}

    if (zoneId === 1) {
      if (!keyFlag('zone1DoorKey')) return 'Survive the waves. Find the Zone Key.';
      if (!keyFlag('secret1Key')) return 'Use the Zone Key or challenge the dragon.';
      return 'Secret path unlocked. Break the bookshelf to enter.';
    }
    if (zoneId === 2) {
      if (!keyFlag('zone2Key')) return 'Clear the crypt route and earn the Zone 2 key.';
      return 'Zone 3 path is open.';
    }
    if (zoneId === 3) return 'Reach the cavern exit and defeat the shadow.';
    if (zoneId === 101) return 'Secret Zone 1. Escape the hidden path.';
    if (zoneId === 102) return 'Secret Zone 2. Survive the final secret.';
    return 'Explore the dungeon.';
  }


  var miniMapBuilt = false;
  var miniMapVisited = {};

  function getMiniMapGraph() {
    return window.BoneCrawlerMiniMapGraph || null;
  }

  function getMiniMapNodeList(graph) {
    if (!graph || !graph.nodes) return [];
    return Object.keys(graph.nodes).map(function (id) {
      var node = graph.nodes[id];
      node.id = node.id || id;
      return node;
    });
  }

  function zoneVisited(zoneId) {
    return !!miniMapVisited[String(zoneId)];
  }

  function evalMiniMapCondition(condition) {
    if (!condition) return false;
    if (condition.always) return true;
    if (condition.playerFlag) return keyFlag(condition.playerFlag) === (condition.equals === false ? false : true);
    if (condition.zoneVisited != null) return zoneVisited(condition.zoneVisited);
    if (condition.any && condition.any.length) return condition.any.some(evalMiniMapCondition);
    if (condition.all && condition.all.length) return condition.all.every(evalMiniMapCondition);
    return false;
  }

  function isMiniMapRevealed(node) {
    if (!node) return false;
    if (zoneVisited(node.zoneId)) return true;
    if (!node.revealWhen) return true;
    return evalMiniMapCondition(node.revealWhen);
  }

  function findMiniMapNodeByZone(zoneId) {
    var graph = getMiniMapGraph();
    var nodes = getMiniMapNodeList(graph);
    for (var i = 0; i < nodes.length; i++) {
      if (Number(nodes[i].zoneId) === Number(zoneId)) return nodes[i];
    }
    return null;
  }

  function buildMiniMap() {
    var graph = getMiniMapGraph();
    if (!els.miniMapGrid || !graph || !graph.nodes) return;

    var nodes = getMiniMapNodeList(graph);
    var columns = Number(graph.columns || 1) || 1;
    var rows = Number(graph.rows || 1) || 1;

    els.miniMapGrid.innerHTML = '';
    els.miniMapGrid.style.setProperty('--mini-map-cols', String(columns));
    els.miniMapGrid.style.setProperty('--mini-map-rows', String(rows));

    nodes.forEach(function (node) {
      var item = document.createElement('div');
      item.className = 'mini-map-node mini-map-node-' + String(node.type || 'main');
      item.setAttribute('data-node-id', node.id);
      item.setAttribute('data-zone-id', String(node.zoneId));
      item.setAttribute('data-state', 'locked');
      item.style.gridColumn = String((Number(node.x) || 0) + 1);
      item.style.gridRow = String((Number(node.y) || 0) + 1);
      item.title = node.name || node.label || node.id;
      item.textContent = node.label || node.id;
      els.miniMapGrid.appendChild(item);
    });

    nodes.forEach(function (node) {
      var links = node.links || [];
      links.forEach(function (targetId) {
        var target = graph.nodes[targetId];
        if (!target) return;
        if (String(node.id) > String(targetId)) return;

        var link = document.createElement('div');
        link.className = 'mini-map-link';
        link.setAttribute('data-link-from', node.id);
        link.setAttribute('data-link-to', targetId);
        link.setAttribute('data-state', 'locked');

        var dx = Number(target.x) - Number(node.x);
        var dy = Number(target.y) - Number(node.y);
        var x = Math.min(Number(node.x), Number(target.x));
        var y = Math.min(Number(node.y), Number(target.y));

        if (dx === 0) {
          link.classList.add('mini-map-link-vertical');
          link.style.gridColumn = String((Number(node.x) || 0) + 1);
          link.style.gridRow = String(y + 1) + ' / span ' + String(Math.abs(dy) + 1);
        } else if (dy === 0) {
          link.classList.add('mini-map-link-horizontal');
          link.style.gridColumn = String(x + 1) + ' / span ' + String(Math.abs(dx) + 1);
          link.style.gridRow = String((Number(node.y) || 0) + 1);
        } else {
          link.classList.add('mini-map-link-portal');
          link.style.gridColumn = String((Number(node.x) || 0) + 1);
          link.style.gridRow = String((Number(node.y) || 0) + 1);
        }

        els.miniMapGrid.insertBefore(link, els.miniMapGrid.firstChild);
      });
    });

    miniMapBuilt = true;
  }


  function getUpgradeProgressionItems() {
    var items = [];
    var p = readGlobal('player', null) || {};

    function add(id, label, value, spriteName, iconClass, fallbackText, forceShow) {
      var n = Number(value || 0);
      if (!forceShow && (!n || n < 1)) return;
      if (!isFinite(n)) n = 0;

      items.push({
        id: id,
        label: label,
        value: Math.max(1, Math.floor(n)),
        spriteName: spriteName,
        iconClass: iconClass,
        fallbackText: fallbackText
      });
    }

    var swordLevel = Number(p.swordLevel || 0);
    var speedLevel = Number(p.speedLevel || 0);
    var stepLevel = Number(p.stepLevel || 0);
    var shieldLevel = Number(p.shieldLevel || 0);

    var hasShadowStep = !!p.shadowStep;
    var hasShield = !!p.shield || shieldLevel > 0;
    var hasMasterSword = !!readGlobal('masterSwordOwned', false);
    var hasWhirlwind = !!readGlobal('whirlwindUnlocked', false);

    /*
      Match the in-game pause menu's progression logic:
      - Sword shows base x1 plus swordLevel.
      - Step shows base x1, using shadow icon if Shadow Step is unlocked.
      - Speed shows base x1 plus speedLevel.
      - Whirlwind appears when unlocked.
      - Shield appears when the player has shield progress.
    */
    add('sword', hasMasterSword ? 'Master' : 'Sword', swordLevel + 1, 'upSword', 'upgrade-icon-sword', 'SW', true);
    add('step', hasShadowStep ? 'Shadow' : 'Step', Math.max(1, hasShadowStep ? (stepLevel || 1) : 1), hasShadowStep ? 'shadowStepIcon' : 'stepIcon', 'upgrade-icon-step', 'ST', true);
    add('speed', 'Speed', speedLevel + 1, 'upSpeed', 'upgrade-icon-speed', 'SP', true);

    if (hasShield) {
      add('shield', 'Shield', Math.max(1, shieldLevel || 1), 'shieldIcon', 'upgrade-icon-shield', 'SH', true);
    }

    if (hasWhirlwind) {
      add('whirlwind', 'Whirl', 1, 'whirlwindIcon', 'upgrade-icon-whirlwind', 'WH', true);
    }

    return items;
  }

  function drawSpriteToCanvas(canvas, spriteName) {
    if (!canvas || !spriteName) return false;

    var sprites = readGlobal('S', null);
    var palette = readGlobal('PAL', null);

    if (!sprites || !palette || !sprites[spriteName]) return false;

    var spr = sprites[spriteName];
    if (!spr || !spr.length || !spr[0] || !spr[0].length) return false;

    var rows = spr.length;
    var cols = spr[0].length;
    var scale = 2;

    canvas.width = cols * scale;
    canvas.height = rows * scale;
    canvas.style.width = String(cols * scale) + 'px';
    canvas.style.height = String(rows * scale) + 'px';

    var ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var v = spr[y][x];
        if (!v) continue;
        ctx.fillStyle = palette[v] || '#d4c89a';
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    return true;
  }

  function paintUpgradeIcons() {
    if (!els.upgradeStack) return;

    var icons = els.upgradeStack.querySelectorAll('canvas[data-bc-sprite]');
    icons.forEach(function(canvas) {
      var spriteName = canvas.getAttribute('data-bc-sprite');
      var ok = drawSpriteToCanvas(canvas, spriteName);

      if (!ok) {
        var fallback = canvas.getAttribute('data-fallback') || '';
        var span = document.createElement('span');
        span.className = 'upgrade-icon-fallback';
        span.textContent = fallback;
        canvas.replaceWith(span);
      }
    });
  }

  function renderUpgradeProgression() {
    if (!els.upgradeStack) return;

    var items = getUpgradeProgressionItems();

    if (!items.length) {
      els.upgradeStack.innerHTML = '<span class="upgrade-empty">NO UPGRADES</span>';
      return;
    }

    els.upgradeStack.innerHTML = items.map(function(item) {
      var count = '<b class="upgrade-count">x' + item.value + '</b>';
      return '<span class="upgrade-chip" title="' + item.label + ' x' + item.value + '">' +
        '<canvas class="upgrade-icon-canvas ' + item.iconClass + '" data-bc-sprite="' + item.spriteName + '" data-fallback="' + item.fallbackText + '" aria-hidden="true"></canvas>' +
        '<span class="upgrade-label">' + item.label + '</span>' +
        count +
      '</span>';
    }).join('');

    paintUpgradeIcons();
  }


  function getPlayerRank() {
    /*
      UI-only reader.

      Do not calculate a separate status-panel ranking formula.
      Use the same rank source the game uses for zone clear:
        - zoneTransitionInfo.rank when the zone-clear screen is active
        - getRankInfo(score, fromZone, nextZone) for the current zone projection
    */

    var transitionInfo = readGlobal('zoneTransitionInfo', null);
    if (transitionInfo && typeof transitionInfo.rank !== 'undefined') {
      return String(transitionInfo.rank);
    }

    var getRankInfoFn = readGlobal('getRankInfo', null);
    if (typeof getRankInfoFn !== 'function') return '-';

    var scoreValue = Number(readGlobal('score', 0) || 0);
    var fromZone = Number(readGlobal('currentZone', 0) || 0);
    var pendingNext = Number(readGlobal('pendingZoneTransition', 0) || 0);

    var secret1 = Number(readGlobal('ZONE_SECRET1', 101) || 101);
    var secret2 = Number(readGlobal('ZONE_SECRET2', 102) || 102);

    var nextZone = pendingNext || 0;

    if (!nextZone) {
      if (fromZone === 1) nextZone = 2;
      else if (fromZone === 2) nextZone = 3;
      else if (fromZone === 3) nextZone = -1;
      else if (fromZone === secret1 || fromZone === secret2) return '????';
    }

    try {
      var info = getRankInfoFn(scoreValue, fromZone, nextZone);
      if (info && typeof info.rank !== 'undefined') return String(info.rank);
    } catch (err) {}

    return '-';
  }

  function restructureStatusPanelForMiniMap() {
    if (!root) return;

    var zoneValue = document.getElementById('screenExtZone');
    var playerName = document.getElementById('screenExtPlayerName');

    var zoneCard =
      root.querySelector('[data-screen-extension-zone-card]') ||
      root.querySelector('.screen-extension-zone-card') ||
      (zoneValue && zoneValue.closest ? zoneValue.closest('.screen-extension-section') : null);

    var playerCard =
      root.querySelector('[data-screen-extension-player-card]') ||
      root.querySelector('.screen-extension-player-card') ||
      (playerName && playerName.closest ? playerName.closest('.screen-extension-section') : null);

    if (zoneCard) {
      zoneCard.classList.add('screen-extension-zone-card');
      zoneCard.setAttribute('data-screen-extension-zone-card', 'true');
    }

    if (playerCard) {
      playerCard.classList.add('screen-extension-player-card');
      playerCard.setAttribute('data-screen-extension-player-card', 'true');
    }

    var keyGrid = root.querySelector('.screen-extension-key-grid') ||
      root.querySelector('.screen-extension-grid[aria-label="Key status"]');

    if (keyGrid) {
      keyGrid.classList.add('screen-extension-key-grid');
      keyGrid.classList.add('zone-status-key-grid');
      if (zoneCard && !zoneCard.querySelector('.zone-status-key-grid')) {
        zoneCard.appendChild(keyGrid);
      }
    }


    var zoneKeyStat = null;
    var rankStat = null;

    if (keyGrid) {
      var stats = Array.prototype.slice.call(keyGrid.querySelectorAll('.screen-extension-stat, [class*="screen-extension-stat"]'));

      stats.forEach(function(stat) {
        var labelEl = stat.querySelector('.screen-extension-label') || stat.querySelector('span');
        var text = labelEl ? String(labelEl.textContent || '').trim().toUpperCase() : '';

        if (text === 'ZONE KEY') {
          zoneKeyStat = stat;
          stat.classList.add('zone-key-stat');
        }

        if (text === 'SECRET') {
          rankStat = stat;
          stat.classList.add('rank-stat');
          if (labelEl) labelEl.textContent = 'RANK';

          var valueEl = stat.querySelector('strong') || stat.querySelector('.screen-extension-value');
          if (valueEl) {
            valueEl.setAttribute('data-screen-extension-rank', 'true');
            valueEl.id = 'screenExtRank';
          }
        }

        if (text === 'RANK') {
          rankStat = stat;
          stat.classList.add('rank-stat');
          var valueEl2 = stat.querySelector('strong') || stat.querySelector('.screen-extension-value');
          if (valueEl2) {
            valueEl2.setAttribute('data-screen-extension-rank', 'true');
            valueEl2.id = 'screenExtRank';
          }
        }
      });

      if (rankStat && zoneKeyStat && keyGrid.firstElementChild !== rankStat) {
        keyGrid.insertBefore(rankStat, zoneKeyStat);
      }
    }

    var miniMapSection =
      root.querySelector('.screen-extension-minimap-section') ||
      root.querySelector('[data-screen-extension-minimap-section]');

    if (zoneCard && miniMapSection && !zoneCard.querySelector('.zone-status-inline-map')) {
      var inline = document.createElement('div');
      inline.className = 'zone-status-inline-map';
      inline.setAttribute('aria-label', 'Zone route indicator');
      inline.appendChild(miniMapSection);
      zoneCard.appendChild(inline);
    }

    if (playerCard && !root.querySelector('[data-screen-extension-upgrades]')) {
      var section = document.createElement('div');
      section.className = 'screen-extension-upgrade-section';
      section.innerHTML =
        '<span class="screen-extension-label">UPGRADES</span>' +
        '<div class="upgrade-stack" data-screen-extension-upgrades></div>';
      playerCard.appendChild(section);
      els.upgradeStack = section.querySelector('[data-screen-extension-upgrades]');
    } else if (!els.upgradeStack) {
      els.upgradeStack = root.querySelector('[data-screen-extension-upgrades]');
    }
  }


  function updateMiniMap(zoneId, state) {
    var titleLike = isTitleLikeState(state);
    var graph = getMiniMapGraph();
    if (!graph || !els.miniMapGrid) return;
    if (!miniMapBuilt) buildMiniMap();

    if (!titleLike && zoneId) miniMapVisited[String(zoneId)] = true;

    var currentNode = titleLike ? null : findMiniMapNodeByZone(zoneId);
    var nodes = getMiniMapNodeList(graph);
    var revealedById = {};

    nodes.forEach(function (node) {
      var revealed = isMiniMapRevealed(node);
      revealedById[node.id] = revealed;
      var el = els.miniMapGrid.querySelector('[data-node-id="' + node.id + '"]');
      if (!el) return;

      var stateName = 'locked';
      if (currentNode && node.id === currentNode.id) stateName = 'current';
      else if (zoneVisited(node.zoneId)) stateName = 'visited';
      else if (revealed) stateName = 'known';

      el.setAttribute('data-state', stateName);
      el.setAttribute('aria-current', stateName === 'current' ? 'location' : 'false');
    });

    Array.prototype.slice.call(els.miniMapGrid.querySelectorAll('.mini-map-link')).forEach(function (link) {
      var from = link.getAttribute('data-link-from');
      var to = link.getAttribute('data-link-to');
      var active = currentNode && (currentNode.id === from || currentNode.id === to);
      var known = revealedById[from] || revealedById[to];
      link.setAttribute('data-state', active ? 'current' : (known ? 'known' : 'locked'));
    });

    if (els.miniMapCaption) {
      var caption = titleLike ? 'Route indicator activates when the run begins.' :
        (currentNode ? 'Current: ' + (currentNode.name || currentNode.label || currentNode.id) : 'Current route unknown.');
      setText(els.miniMapCaption, caption);
    }
  }

  function update() {
    restructureStatusPanelForMiniMap();
    var dbg = getSpawnDebugState();
    var zoneId = Number(readGlobal('currentZone', dbg && (dbg.zoneId || dbg.currentZone) || 1)) || 1;
    var state = String(readGlobal('gState', 'title') || 'title');

    var titleLike = isTitleLikeState(state);
    panel.setAttribute('data-phase', titleLike ? 'title' : 'run');
    root.classList.toggle('screen-extension-title-phase', !!titleLike);
    
    var rankEl = root.querySelector('[data-screen-extension-rank]') || document.getElementById('screenExtRank');
    if (rankEl) setText(rankEl, getPlayerRank());

    renderUpgradeProgression();
    updateMiniMap(zoneId, state);
    setText(els.state, state.toUpperCase());
    setText(els.zone, getZoneLabel(zoneId, state));
    setText(els.wave, titleLike ? '—' : getWaveText(zoneId));
    setText(els.objective, getObjective(zoneId, state));
    setText(els.playerName, getPlayerNameText());
    setText(els.score, formatNumber(readGlobal('score', 0)));
    setText(els.kills, formatNumber(readGlobal('killCount', 0)));
    setText(els.zoneKey, keyFlag('zone1DoorKey') || keyFlag('zone2Key') ? 'YES' : 'NO');
    setText(els.secretKey, keyFlag('secret1Key') || keyFlag('secret2Key') ? 'YES' : 'NO');

    requestAnimationFrame(update);
  }


  function setupGuideNav() {
    var shell = document.getElementById('screenExtensionShell');
    var popdown = document.getElementById('screenGuidePopdown');
    var title = document.getElementById('screenGuideTitle');
    var close = document.getElementById('screenGuideClose');
    var statusToggle = document.getElementById('screenStatusToggle');
    var guideButtons = Array.prototype.slice.call(document.querySelectorAll('[data-guide-target]'));
    var guidePanes = Array.prototype.slice.call(document.querySelectorAll('[data-guide-pane]'));

    if (!shell) return;

    function setExpanded(target, expanded) {
      guideButtons.forEach(function (btn) {
        if (btn.getAttribute('data-guide-target') === target) {
          btn.classList.toggle('active', !!expanded);
          btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    function closeGuide() {
      if (popdown) popdown.hidden = true;
      root.classList.remove('screen-guide-open');
      shell.setAttribute('data-guide', 'closed');
      setExpanded('', false);
    }

    function openGuide(target) {
      if (!popdown) return;
      var next = target === 'howto' ? 'howto' : 'controls';
      popdown.hidden = false;
      root.classList.add('screen-guide-open');
      shell.setAttribute('data-guide', next);
      if (title) title.textContent = next === 'howto' ? 'HOW TO PLAY' : 'CONTROLS';
      guidePanes.forEach(function (pane) {
        pane.classList.toggle('active', pane.getAttribute('data-guide-pane') === next);
      });
      setExpanded(next, true);
    }

    guideButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-guide-target') || 'controls';
        var isOpen = popdown && !popdown.hidden && shell.getAttribute('data-guide') === target;
        if (isOpen) closeGuide();
        else openGuide(target);
      });
    });

    if (close) close.addEventListener('click', closeGuide);

    document.addEventListener('mousedown', function (event) {
      if (!popdown || popdown.hidden) return;
      var target = event.target;
      var inGuide = popdown.contains(target);
      var inGuideButton = target && target.closest && target.closest('[data-guide-target]');
      if (!inGuide && !inGuideButton) closeGuide();
    });

    if (statusToggle) {
      statusToggle.addEventListener('click', function () {
        var collapsed = shell.getAttribute('data-panel') === 'collapsed';
        shell.setAttribute('data-panel', collapsed ? 'open' : 'collapsed');
        statusToggle.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && popdown && !popdown.hidden) closeGuide();
    });
  }

  setupGuideNav();
  update();
})();
