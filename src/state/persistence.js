// persistence
// Purpose: Scoreboard/name persistence and shared lightweight formatting helpers.
const SCORE_PAGE_SIZE=6;
const SCOREBOARD_KEY='boneCrawlerScoreboard_v1';
const PLAYERNAME_KEY='boneCrawlerPlayerName_v1';
const memoryStore={scores:[],name:''};

function loadScores(){
  try{
    const raw=localStorage.getItem(SCOREBOARD_KEY);
    if(raw) return JSON.parse(raw)||[];
  }catch(err){}
  return memoryStore.scores.slice();
}
function saveScores(list){
  memoryStore.scores=Array.isArray(list) ? list.slice() : [];
  try{ localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(memoryStore.scores)); }catch(err){}
}
function clearScores(){
  memoryStore.scores=[];
  try{ localStorage.removeItem(SCOREBOARD_KEY); }catch(err){}
}
function loadPlayerName(){
  try{
    const raw=localStorage.getItem(PLAYERNAME_KEY);
    if(raw) return raw;
  }catch(err){}
  return memoryStore.name||'';
}
function savePlayerName(name){
  memoryStore.name=String(name||'');
  try{ localStorage.setItem(PLAYERNAME_KEY, memoryStore.name); }catch(err){}
}
function formatTime(ms){
  const total=Math.max(0, Math.floor(ms/1000));
  const h=Math.floor(total/3600);
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  if(h>0) return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
