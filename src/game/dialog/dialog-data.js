// dialog-data
(function(){
  'use strict';
  if(!window.GameContent) return;

  GameContent.registerDialog('npc.node.startup', {
    title:'NODE',
    mode:'opening',
    pages:[
      {speaker:'NODE',lines:['Welcome BoneCrawler..!','This dungeon will serve as your','training since waking up.','Good luck.']},
      {speaker:'NODE',lines:['.. and if you see a Dragon,','well..',"I'm glad I mentioned it now."]},
      {speaker:'PLAYER',lines:["I don't deal with dragons."]},
      {speaker:'NODE',lines:['You do now.', ".. and don't forget the corrupted."]},
      {speaker:'PLAYER',lines:["That's great..",'I need to get out of this room.','There should be a key somewhere..']}
    ]
  });

  GameContent.registerDialog('npc.rat.initial', {
    title:'NODE',
    mode:'npc',
    pages:[
      {speaker:'RAT',lines:['...']},
      {speaker:'PLAYER',lines:['...']}
    ]
  });

  GameContent.registerDialog('npc.rat.repeat', {
    title:'NODE',
    mode:'npc',
    pages:[
      {speaker:'NODE',lines:["C'mon man, would you just", 'play the game?']},
      {speaker:'PLAYER',lines:["You're a rat?"]},
      {speaker:'NODE',lines:["Game's short, we ain't got time", "discussin' this.", "Dijya' even pay for this game?"]},
      {speaker:'PLAYER',lines:['.. Maybe.']},
      {speaker:'NODE',lines:["Sheesh. Go on, get otta' 'ere"]}
    ]
  });

  GameContent.registerDialog('npc.woundedStranger.initial', {
    title:'WOUNDED STRANGER',
    mode:'npc',
    pages:[
      {speaker:'WOUNDED STRANGER',lines:['You . . . found me . .','Thank you. . for. . playing. .']},
      {speaker:'WOUNDED STRANGER',lines:['......']},
      {speaker:'WOUNDED STRANGER',lines:["There's a name engraved on his sword",'ImmaGundam']}
    ]
  });

  GameContent.registerDialog('npc.woundedStranger.repeat', {
    title:'WOUNDED STRANGER',
    mode:'npc',
    pages:[
      {speaker:'WOUNDED STRANGER',lines:['......']},
      {speaker:'WOUNDED STRANGER',lines:["There's a name engraved on his sword",'ImmaGundam']}
    ]
  });

  GameContent.registerDialog('npc.zone3Tree.default', {
    title:'DEKU',
    mode:'npc',
    pages:[
      {speaker:'DEKU',lines:['.....']}
    ]
  });

  GameContent.registerDialog('scene.zone1.keyDropHint', {title:'NODE', mode:'npc', pages:[{speaker:'NODE',lines:['Grab the key!']}]});
  GameContent.registerDialog('scene.zone1.secretHint', {title:'NODE', mode:'npc', pages:[{speaker:'NODE',lines:["There's a grate to the left..",'It looks locked..',"Maybe there's a way to unlock it?"]}]});
  GameContent.registerDialog('scene.zone1.dragonHint', {title:'NODE', mode:'npc', pages:[{speaker:'NODE',lines:['I hear something..']},{speaker:'NODE',lines:['.. keep fighting.']}]});
  GameContent.registerDialog('scene.zone2.intro', {title:'NODE', mode:'npc', pages:[{speaker:'NODE',lines:['Seeesh. How many skellys was that?']},{speaker:'PLAYER',lines:['Too many.']},{speaker:'NODE',lines:['Yeah. Good job!','.... Now do it again!']},{speaker:'PLAYER',lines:['Here they come..']}]});
  GameContent.registerDialog('scene.zone2.dragonHint', function(){
    return {
      title:'NODE',
      mode:'npc',
      pages:[
        {speaker:'NODE',lines:['Shh.. do you hear that?','I smell a dragon!']},
        {speaker:'PLAYER',lines:[window.secret1NodeSpoken ? 'Rats can smell dragons?' : 'Wait, what? Are you here?']},
        {speaker:'NODE',lines:['....']},
        {speaker:'PLAYER',lines:['Here we go again..']}
      ]
    };
  });
  GameContent.registerDialog('scene.zone3.intro', {title:'NODE', mode:'npc', pages:[{speaker:'NODE',lines:['I smell an evil soul..',"it's in here somewhere"]}]});
  GameContent.registerDialog('scene.zone3.push', {title:'NODE', mode:'npc', pages:[{speaker:'NODE',lines:["Don't give up!"]}]});
  GameContent.registerDialog('scene.zone3.bossDefeat', {title:'NODE', mode:'npc', pages:[{speaker:'NODE',lines:['Good job..',"You'll do good Bonecrawler."]},{speaker:'NODE',lines:['See ya next game.']}]});
})();
