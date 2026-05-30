// touch-ui-runtime
// Purpose: Touch/pause overlay button sync helpers for the active game state.
function syncMenuCredit(){}
function syncTouchPauseBtn(){
  if(touchUiAvailable && document.getElementById('gamePadShell')){
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
  if(touchUiAvailable && document.getElementById('gamePadShell')){
    if(touchInteractBtn){ touchInteractBtn.classList.add('hidden'); touchInteractBtn.style.display='none'; }
    if(touchDodgeBtn){ touchDodgeBtn.classList.add('hidden'); touchDodgeBtn.style.display='none'; }
    return;
  }
  if(!touchUiAvailable){
    if(touchInteractBtn) touchInteractBtn.classList.add('hidden');
    if(touchDodgeBtn) touchDodgeBtn.classList.add('hidden');
    return;
  }
  const inPlay=gState==='playing';
  const inDialog=gState==='dialog';
  if(touchInteractBtn) touchInteractBtn.classList.toggle('hidden', !(inPlay||inDialog));
  if(touchDodgeBtn) touchDodgeBtn.classList.toggle('hidden', !inPlay);
}
