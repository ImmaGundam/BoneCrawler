// scene-event-data
(function(){
  'use strict';
  if(!window.GameContent) return;

  GameContent.registerEventBundle({
    transitionRules:[
      {id:'zone1_secret1', fromZone:1, nextZone:101, objectId:'zone1.secretEntrance', transitionOpts:{fromZone:1}, requires:{all:[{type:'zone',equals:1},{type:'playerFlag',name:'secret1Key',equals:true},{type:'worldFlag',name:'zone1Broken.0',equals:true},{type:'noKeyDropKind',kind:'secret1'},{type:'nearObject',objectId:'zone1.secretEntrance',pad:4}]}} ,
      {id:'zone1_zone2', fromZone:1, nextZone:2, objectId:'zone1.door', transitionOpts:{fromZone:1}, requires:{all:[{type:'zone',equals:1},{type:'playerFlag',name:'zone1DoorKey',equals:true},{type:'nearObject',objectId:'zone1.door',pad:4}]}} ,
      {id:'secret1_exit', fromZone:101, nextZone:2, objectId:'secret1.exitDoor', transitionOpts:{fromZone:101, secret:true}, requires:{all:[{type:'zone',equals:101},{type:'globalValue',name:'secret1BlessingT',lte:0},{type:'nearObject',objectId:'secret1.exitDoor',pad:4}]}} ,
      {id:'zone3_exit', fromZone:3, nextZone:-1, objectId:'zone3.door', transitionOpts:{fromZone:3,title:'ZONE CLEAR',messageLines:['Well done,','Bonecrawler'],hideStats:false}, requires:{all:[{type:'zone',equals:3},{type:'playerFlag',name:'hasKey',equals:true},{type:'nearObject',objectId:'zone3.door',pad:4}]}} ,
      {id:'zone3_secret2', fromZone:3, nextZone:102, objectId:'zone3.secret2Portal', transitionOpts:{fromZone:3}, requires:{all:[{type:'zone',equals:3},{type:'globalFlag',name:'shadowBossDefeated',equals:true},{type:'globalAtLeast',name:'score',value:999},{type:'nearObject',objectId:'zone3.secret2Portal',pad:4}]}} ,
      {id:'secret2_return', fromZone:102, nextZone:-1, objectId:'secret2.returnPortal', transitionOpts:{fromZone:3,title:'ZONE CLEAR',messageLines:['Well done,','Bonecrawler'],hideStats:false}, requires:{all:[{type:'zone',equals:102},{type:'nearObject',objectId:'secret2.returnPortal',pad:4}]}}
    ],
    interactionRules:[
      {id:'secret2Sword', type:'secret2Sword', zone:102, objectId:'secret2.masterSword', yPad:3, requires:{all:[{type:'zone',equals:102},{type:'globalFlag',name:'masterSwordOwned',equals:false},{type:'nearObject',objectId:'secret2.masterSword',pad:4}]}} ,
      {id:'secret2Npc', type:'secret2Npc', zone:102, objectId:'secret2.woundedStranger', yPad:6, requires:{all:[{type:'zone',equals:102},{type:'nearObject',objectId:'secret2.woundedStranger',pad:4}]}} ,
      {id:'zone3Tree', type:'zone3Tree', zone:3, objectId:'zone3.tree', yPad:4, requires:{all:[{type:'zone',equals:3},{type:'globalFlag',name:'zone3TreeAwake',equals:true},{type:'nearObject',objectId:'zone3.tree',field:'interactRect',pad:0}]}} ,
      {id:'secret1Rat', type:'secret1Rat', zone:101, objectId:'secret1.rat', yPad:5, requires:{all:[{type:'zone',equals:101},{type:'nearObject',objectId:'secret1.rat',field:'interactRect',pad:0}]}}
    ],
    scriptedDialogRules:[
      {id:'zone1_key_drop_hint', onceFlag:'zone1DoorKeyDialogShown', dialogId:'scene.zone1.keyDropHint', requires:{all:[{type:'zone',equals:1},{type:'keyDropKind',kind:'zone1Door'}]}},
      {id:'zone1_secret_hint', onceFlag:'zone1Kill90DialogShown', dialogId:'scene.zone1.secretHint', requires:{all:[{type:'zone',equals:1},{type:'zoneKillsAtLeast',zone:1,value:90}]}},
      {id:'zone1_dragon_hint', onceFlag:'zone1Kill109DialogShown', dialogId:'scene.zone1.dragonHint', requires:{all:[{type:'zone',equals:1},{type:'zoneKillsAtLeast',zone:1,value:109}]}},
      {id:'zone2_intro', onceFlag:'zone2IntroDialogShown', dialogId:'scene.zone2.intro', requires:{all:[{type:'zone',equals:2}]}},
      {id:'zone2_dragon_hint', onceFlag:'zone2Kill30DialogShown', dialogId:'scene.zone2.dragonHint', requires:{all:[{type:'zone',equals:2},{type:'zoneKillsAtLeast',zone:2,value:25}]}},
      {id:'zone3_intro', onceFlag:'zone3IntroDialogShown', dialogId:'scene.zone3.intro', requires:{all:[{type:'zone',equals:3}]}},
      {id:'zone3_push', onceFlag:'zone3Kill80DialogShown', dialogId:'scene.zone3.push', requires:{all:[{type:'zone',equals:3},{type:'zoneKillsAtLeast',zone:3,value:80}]}},
      {id:'zone3_boss_defeat', onceFlag:'zone3BossDefeatDialogShown', dialogId:'scene.zone3.bossDefeat', requires:{all:[{type:'zone',equals:3},{type:'globalFlag',name:'shadowBossDefeated',equals:true}]}}
    ],
    runtimeEventRules:[
      {id:'zone1_wave_drop_zone1_key_80', on:'enemy.defeated', requires:{all:[{type:'payload',name:'zoneId',equals:1},{type:'spawnSystem',equals:'waves'},{type:'zoneKillsAtLeast',zone:1,value:80},{type:'playerFlag',name:'zone1DoorKey',equals:false},{type:'noKeyDropKind',kind:'zone1Door'}]}, actions:[{type:'spawnObject', objectType:'item', itemType:'key', kind:'zone1Door', x:'x', y:'y', xOffset:-3, yOffset:-3},{type:'showText', text:'ZONE 1 KEY!', y:28}]},
      {id:'zone1_final_wave_spawn_dragon', on:'waves.finalWaveComplete', requires:{all:[{type:'payload',name:'zoneId',equals:1}]}, actions:[{type:'spawnObject', objectType:'boss', objectId:'zone1Dragon'}]},
      {id:'zone2_final_wave_spawn_dragon', on:'waves.finalWaveComplete', requires:{all:[{type:'payload',name:'zoneId',equals:2}]}, actions:[{type:'spawnObject', objectType:'boss', objectId:'dragonBoss'}]},
      {id:'zone3_final_wave_spawn_shadow', on:'waves.finalWaveComplete', requires:{all:[{type:'payload',name:'zoneId',equals:3}]}, actions:[{type:'spawnObject', objectType:'boss', objectId:'shadowBoss'}]},
      {id:'zone1_dragon_drop_secret_key', on:'boss.defeated', requires:{all:[{type:'payload',name:'bossId',equals:'zone1Dragon'},{type:'playerFlag',name:'secret1Key',equals:false},{type:'noKeyDropKind',kind:'secret1'}]}, actions:[{type:'spawnObject', objectType:'item', itemType:'key', kind:'secret1', x:'x', y:'y', xOffset:3, yOffset:-3},{type:'showText', text:'SECRET KEY!', y:28}]},
      {id:'zone3_shadow_drop_key', on:'boss.defeated', requires:{all:[{type:'payload',name:'bossId',equals:'shadowBoss'},{type:'noKeyDropKind',kind:'zone3'}]}, actions:[{type:'spawnObject', objectType:'item', itemType:'key', kind:'zone3', x:'x', y:'y', xOffset:-3, yOffset:-3}]}
    ]
  });
})();
