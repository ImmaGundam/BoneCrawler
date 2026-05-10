// Zone 1 map definition
(function(){
  'use strict';
  if(!window.BoneCrawlerZones) return;
  BoneCrawlerZones.register({
    id: 1,
    label: 'ZONE 1',
    type: 'map',
    render: function(){ drawDungeonZone1(); },
    collides: function(box){
      box = BoneCrawlerZones.boxFromArgs(box);
      return ZONE1_DECOR_BLOCKERS.some(function(r,i){ return !zone1Broken[i] && ov(box,r); }) ||
        ZONE1_EXTRA_BLOCKERS.some(function(r){ return ov(box,r); });
    },
    objective: function(){
      if(player && !player.zone1DoorKey) return 'Survive the waves. Find the Zone Key.';
      if(player && !player.secret1Key) return 'Use the Zone Key or defeat the dragon.';
      return 'Secret zone unlocked. Break the bookshelf.';
    }
  });
})();
