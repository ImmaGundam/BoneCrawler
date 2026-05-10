// Secret Zone 2 map definition
(function(){
  'use strict';
  if(!window.BoneCrawlerZones) return;
  BoneCrawlerZones.register({
    id: ZONE_SECRET2,
    label: '????',
    type: 'secret',
    render: function(){ drawDungeonSecret2(); },
    collides: function(box){
      box = BoneCrawlerZones.boxFromArgs(box);
      return SECRET2_STONE_BLOCKERS.some(function(r){ return ov(box,r); });
    },
    objective: function(){ return "Who's the dead guy?"; }
  });
})();
