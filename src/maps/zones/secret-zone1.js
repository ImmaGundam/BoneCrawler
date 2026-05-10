// Secret Zone 1 map definition
(function(){
  'use strict';
  if(!window.BoneCrawlerZones) return;
  BoneCrawlerZones.register({
    id: ZONE_SECRET1,
    label: '????',
    type: 'secret',
    render: function(){ drawDungeonSecret1(); },
    collides: function(box){
      box = BoneCrawlerZones.boxFromArgs(box);
      return SECRET1_POOL_BLOCKERS.some(function(r){ return ov(box,r); });
    },
    objective: function(){ return 'Why is there a rat in here?'; }
  });
})();
