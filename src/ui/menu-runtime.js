// menu-runtime
// Purpose: Shared menu hitboxes and title-screen helper actions.
const MENU_BTN_W=66, MENU_BTN_H=9;
const MENU_BTN_X=((GW-MENU_BTN_W)/2)|0;
const MENU_PLAY={x:MENU_BTN_X,y:78,w:MENU_BTN_W,h:MENU_BTN_H};
const MENU_SCORE={x:MENU_BTN_X,y:92,w:MENU_BTN_W,h:MENU_BTN_H};
const GAMEOVER_RETRY={x:21,y:94,w:32,h:10};
const GAMEOVER_MENU={x:67,y:94,w:32,h:10};
const NAME_BTN={x:MENU_BTN_X,y:106,w:MENU_BTN_W,h:MENU_BTN_H};
const DEVKIT_TITLE_BTN={x:84,y:8,w:34,h:30};

function pointInBtn(mx,my,btn){
  return !!btn && mx>=btn.x&&mx<=btn.x+btn.w&&my>=btn.y&&my<=btn.y+btn.h;
}
function shouldShowDevKitTitleButton(){
  return window.self === window.top;
}
function openDevKitPrompt(){
  const ok = window.confirm('Load the developer kit?\n\nBest viewed in desktop!');
  if(!ok) return false;
  const url = 'dev/devkit_lite.html';
  const opened = window.open(url, '_blank', 'noopener');
  if(!opened) window.location.href = url;
  return true;
}
