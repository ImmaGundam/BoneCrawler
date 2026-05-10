/* BoneCrawler pseudo mini-map graph */
(function(){
  'use strict';

  window.BoneCrawlerMiniMapGraph = {
    version: 1,
    columns: 2,
    rows: 4,
    nodes: {
      secret2: {
        id: 'secret2',
        zoneId: 102,
        label: 'S2',
        name: 'Secret Zone 2',
        x: 1,
        y: 0,
        type: 'portal',
        links: ['zone3'],
        revealWhen: { any: [
          { zoneVisited: 3 },
          { playerFlag: 'secret2Key' },
          { zoneVisited: 102 }
        ] }
      },
      zone3: {
        id: 'zone3',
        zoneId: 3,
        label: 'Z3',
        name: 'Zone 3',
        x: 1,
        y: 1,
        type: 'main',
        links: ['zone2', 'secret2'],
        revealWhen: { any: [
          { playerFlag: 'zone2Key' },
          { zoneVisited: 3 }
        ] }
      },
      zone2: {
        id: 'zone2',
        zoneId: 2,
        label: 'Z2',
        name: 'Zone 2',
        x: 1,
        y: 2,
        type: 'main',
        links: ['zone1', 'zone3'],
        revealWhen: { any: [
          { playerFlag: 'zone1DoorKey' },
          { zoneVisited: 2 }
        ] }
      },
      secret1: {
        id: 'secret1',
        zoneId: 101,
        label: 'S1',
        name: 'Secret Zone 1',
        x: 0,
        y: 3,
        type: 'secret',
        links: ['zone1'],
        revealWhen: { any: [
          { playerFlag: 'secret1Key' },
          { zoneVisited: 101 }
        ] }
      },
      zone1: {
        id: 'zone1',
        zoneId: 1,
        label: 'Z1',
        name: 'Zone 1',
        x: 1,
        y: 3,
        type: 'main',
        links: ['zone2', 'secret1'],
        revealWhen: { always: true }
      }
    }
  };
})();
