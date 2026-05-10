// Zone 2 map definition
(function(){
  'use strict';
  if(!window.BoneCrawlerZones) return;
  BoneCrawlerZones.register({
    id: 2,
    label: 'ZONE 2',
    type: 'map',
    render: function(){ drawDungeonZone2(); },
    collides: function(box){
      box = BoneCrawlerZones.boxFromArgs(box);
      if(typeof syncZone2ObjectGeometry === 'function') syncZone2ObjectGeometry();
      return ZONE2_TREE_BLOCKERS.some(function(r){ return ov(box,r); }) ||
        ZONE2_HOLE_BLOCKERS.some(function(r){ return ov(box,r); }) ||
        ZONE2_DECOR_BLOCKERS.some(function(r,i){ return !zone2Broken[i] && ov(box,r); });
    },
    collidesTree: function(box){
      box = BoneCrawlerZones.boxFromArgs(box);
      return ZONE2_TREE_BLOCKERS.some(function(r){ return ov(box,r); });
    },
    objective: function(){
      if(player && !player.zone2Key) return 'Clear the room and earn the Zone 2 key.';
      return 'Zone 3 path is open.';
    }
  });
})();
