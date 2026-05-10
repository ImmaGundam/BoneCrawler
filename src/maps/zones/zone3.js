// BoneCrawler Zone 3 map definition
(function(){
  'use strict';
  if(!window.BoneCrawlerZones) return;
  BoneCrawlerZones.register({
    id: 3,
    label: 'ZONE 3',
    type: 'map',
    render: function(){ drawDungeonZone3(); },
    collides: function(box){
      box = BoneCrawlerZones.boxFromArgs(box);
      return ZONE3_DECOR_BLOCKERS.some(function(r,i){
        return ((i >= ZONE3_DECOR_BREAK_RECTS.length) || !zone3Broken[i]) && ov(box,r);
      });
    },
    objective: function(){ return 'Reach the dungeon exit and defeat the corrupted.'; }
  });
})();
