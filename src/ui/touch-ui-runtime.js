// touch-ui-runtime
// Purpose: Touch/pause overlay button sync helpers for the active game state.
function syncMenuCredit(){}
function mobileGamepadShellActive(){
  return document.documentElement.classList.contains('mobile-browser') && document.getElementById('gamePadShell');
}
function syncTouchPauseBtn(){
  if(touchUiAvailable && mobileGamepadShellActive()){
    if(touchPauseBtn){ touchPauseBtn.classList.add('hidden'); touchPauseBtn.style.display='none'; }
    return;
  }
  if(!touchPauseBtn) return;
  const active=touchUiAvailable && (gState==='playing' || gState==='paused');
  const aria=gState==='paused' ? 'Resume game' : 'Pause game';
  const stateKey=(active?'1':'0')+'|'+aria;
  if(stateKey===lastTouchPauseUiState) return;
  lastTouchPauseUiState=stateKey;
  touchPauseBtn.classList.toggle('hidden', !active);
  touchPauseBtn.textContent='❚❚';
  touchPauseBtn.setAttribute('aria-label', aria);
}
function syncTouchActionBtns(){
  if(touchUiAvailable && mobileGamepadShellActive()){
    if(touchInteractBtn){ touchInteractBtn.classList.add('hidden'); touchInteractBtn.style.display='none'; }
    if(touchDodgeBtn){ touchDodgeBtn.classList.add('hidden'); touchDodgeBtn.style.display='none'; }
    if(touchBlockBtn){ touchBlockBtn.classList.add('hidden'); touchBlockBtn.style.display='none'; }
    return;
  }
  if(!touchUiAvailable){
    if(touchInteractBtn) touchInteractBtn.classList.add('hidden');
    if(touchDodgeBtn) touchDodgeBtn.classList.add('hidden');
    if(touchBlockBtn) touchBlockBtn.classList.add('hidden');
    return;
  }
  const inPlay=gState==='playing';
  const inDialog=gState==='dialog';
  if(touchInteractBtn) touchInteractBtn.classList.toggle('hidden', !(inPlay||inDialog));
  if(touchDodgeBtn){
    touchDodgeBtn.textContent='BLOCK';
    touchDodgeBtn.setAttribute('aria-label', 'Block');
    touchDodgeBtn.classList.toggle('hidden', !inPlay);
  }
  if(touchBlockBtn){
    touchBlockBtn.classList.add('hidden');
    touchBlockBtn.style.display='none';
  }
}
