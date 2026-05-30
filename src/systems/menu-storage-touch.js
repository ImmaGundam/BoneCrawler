// menu-storage-touch
// Purpose: UI-adjacent storage/touch helpers. Runtime scene geometry is owned by game-state.

function syncZone2ObjectGeometry(){
  try{
    if(window.SceneRuntime && typeof SceneRuntime.rebuild === 'function'){
      SceneRuntime.rebuild();
      return true;
    }
  }catch(err){
    console.warn('[BoneCrawler] SceneRuntime rebuild failed during menu geometry sync', err);
  }
  return false;
}
syncZone2ObjectGeometry();

function closeAboutModal(){
  if(aboutPanel) aboutPanel.classList.add('is-hidden');
  syncPlayerMenuVisibility();
}
