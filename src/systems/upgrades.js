// upgrades
// Purpose: Upgrade constants, weighted point rewards, upgrade-button rolling.
// ── Upgrade menu buttons ─────────────────────────────────────
const PLAYER_BASE_SPEED = 0.28;
const SPEED_UP_STEP = 0.12;
const MAX_PLAYER_SPEED = 0.94;
const MASTER_SWORD_START_LEVEL = 4;
const MASTER_SWORD_START_REACH = 35;
const MASTER_SWORD_DISPLAY_RANGE = 5;
const MASTER_SWORD_START_WIDTH = 1;
const MASTER_SWORD_START_HEART_SLOTS = 5;
const STEP_BASE_DISTANCE = 10;
const STEP_SHADOW_BASE_DISTANCE = 14;
const STEP_DISTANCE_PER_UPGRADE = 2;
const STEP_BASE_COOLDOWN_FRAMES = 5*60;
const STEP_SHADOW_BASE_COOLDOWN_FRAMES = 4*60;
const STEP_COOLDOWN_REDUCTION_PER_UPGRADE = 45;
const STEP_MIN_COOLDOWN_FRAMES = 90;
const SHADOW_STEP_INVULN_FRAMES = 12;
const POTION_DROP_CHANCE = 0.04;
const POTION_MAX_COUNT = 1;
const POTION_ITEM_TTL_FRAMES = 8*60;
const POTION_ITEM_FADE_FRAMES = 2*60;
const UPGRADE_SLOT_YS=[37,58,79];
const POINT_REWARD_WEIGHTS=[
  {points:5,weight:25},
  {points:10,weight:20},
  {points:20,weight:20},
  {points:30,weight:20},
  {points:40,weight:10},
  {points:100,weight:9},
  {points:200,weight:5},
  {points:1000,weight:1},
];
const UPGRADE_POOL=[
  {type:'heart',label:'HEART',sub:'HEAL 1 HEART',border:C.BLD,text:'#ff9977',icon:'upHeart'},
  {type:'sword',label:'SWORD',sub:'BIGGER BLADE',border:C.SI2,text:C.BN1,icon:'upSword'},
  {type:'shield',label:'MAGIC SHIELD',sub:'ABSORB HIT + SHOCKWAVE',border:C.SH2,text:C.SH,icon:'shieldIcon',labelFs:6,subFs:4},
  {type:'speed',label:'SPEED',sub:'INCREASE SPEED',border:C.FR2,text:C.FR1,icon:'upSpeed'},
  {type:'shadowstep',label:'SHADOW STEP',sub:'IMPROVE DODGE',border:'#7a74f5',text:'#d8d3ff',icon:'shadowStepIcon',labelFs:5,subFs:4},
  {type:'points',label:'POINTS',sub:'BONUS SCORE',border:C.FR1,text:C.BN1,icon:'pointsIcon'},
];
let currentUpgradeBtns=[];

function choosePointReward(){
  const total=POINT_REWARD_WEIGHTS.reduce((sum,opt)=>sum+opt.weight,0);
  let roll=Math.random()*total;
  for(const opt of POINT_REWARD_WEIGHTS){
    roll-=opt.weight;
    if(roll<=0) return opt.points;
  }
  return POINT_REWARD_WEIGHTS[POINT_REWARD_WEIGHTS.length-1].points;
}

function rollUpgradeChoices(){
  const pool=UPGRADE_POOL.slice();
  for(let i=pool.length-1;i>0;i--){
    const j=(Math.random()*(i+1))|0;
    const tmp=pool[i];
    pool[i]=pool[j];
    pool[j]=tmp;
  }
  currentUpgradeBtns=pool.slice(0,3).map((opt,idx)=>{
    const btn={
      ...opt,
      num:String(idx+1),
      x:31,
      y:UPGRADE_SLOT_YS[idx],
      w:58,
      h:16,
    };
    if(btn.type==='points'){
      btn.pointValue=choosePointReward();
      btn.sub='+'+btn.pointValue+' SCORE';
    }
    return btn;
  });
}

