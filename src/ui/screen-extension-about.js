(function () {
  var root = document.documentElement;
  var shell = document.getElementById('screenExtensionShell');
  var button = document.getElementById('screenAboutBtn');
  var popdown = document.getElementById('screenAboutPopdown');
  var close = document.getElementById('screenAboutClose');
  var guideButtons = Array.prototype.slice.call(document.querySelectorAll('[data-guide-target]'));
  var guidePopdown = document.getElementById('screenGuidePopdown');

  if (!shell || !button || !popdown) return;

  function setExpanded(expanded) {
    button.classList.toggle('active', !!expanded);
    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  function closeGuide() {
    if (!guidePopdown || guidePopdown.hidden) return;
    guidePopdown.hidden = true;
    root.classList.remove('screen-guide-open');
    shell.setAttribute('data-guide', 'closed');
    guideButtons.forEach(function (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  function closeAbout() {
    popdown.hidden = true;
    root.classList.remove('screen-about-open');
    setExpanded(false);
  }

  function openAbout() {
    closeGuide();
    popdown.hidden = false;
    root.classList.add('screen-about-open');
    setExpanded(true);
  }

  button.addEventListener('click', function () {
    if (popdown.hidden) openAbout();
    else closeAbout();
  });

  if (close) close.addEventListener('click', closeAbout);

  guideButtons.forEach(function (btn) {
    btn.addEventListener('click', closeAbout);
  });

  document.addEventListener('mousedown', function (event) {
    if (popdown.hidden) return;
    var target = event.target;
    var insidePanel = popdown.contains(target);
    var insideButton = button.contains(target);
    if (!insidePanel && !insideButton) closeAbout();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !popdown.hidden) closeAbout();
  });
})();
