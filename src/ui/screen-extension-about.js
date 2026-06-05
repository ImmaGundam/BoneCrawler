(function () {
  var root = document.documentElement;
  var shell = document.getElementById('screenExtensionShell');
  var button = document.getElementById('screenAboutBtn');
  var popdown = document.getElementById('screenAboutPopdown');
  var close = document.getElementById('screenAboutClose');
  var bitLinks = Array.prototype.slice.call(document.querySelectorAll('a[href="docs/1bit.html"]'));
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

  bitLinks.forEach(function (bitLink) {
    bitLink.addEventListener('click', function (event) {
      event.preventDefault();
      var href = bitLink.getAttribute('href') || 'docs/1bit.html';
      var features = [
        'noopener',
        'noreferrer',
        'width=330',
        'height=380',
        'resizable=yes',
        'scrollbars=yes'
      ].join(',');
      var opened = window.open(href, '_blank', features);
      if (!opened) window.location.href = href;
    });
  });

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
