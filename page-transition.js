(function () {
  var html = document.documentElement;

  // Safety: always restore visibility, even if something goes wrong
  function restoreOpacity() { html.style.opacity = ''; }

  try {
    var color = sessionStorage.getItem('transitionColor');
    var fromCard = sessionStorage.getItem('fromCard');
    if (fromCard !== '1' || !color) return;
    sessionStorage.removeItem('fromCard');
    sessionStorage.removeItem('transitionColor');
  } catch (e) {
    // sessionStorage unavailable (some private-browsing modes) — skip transition
    return;
  }

  // Hide page immediately to prevent flash before overlays are placed
  html.style.opacity = '0';

  // Hard timeout: restore visibility after 2s regardless of what happens
  var safetyTimer = setTimeout(restoreOpacity, 2000);

  function run() {
    clearTimeout(safetyTimer);
    try {
      restoreOpacity();

      var nav = document.querySelector('.top-nav');
      var navH = nav ? nav.offsetHeight : 56;
      var heroH = Math.max(Math.round(window.innerHeight * 0.44), 380);

      // Color block covering hero area — matches departure end state
      var colorEl = document.createElement('div');
      colorEl.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;' +
        'top:' + navH + 'px;left:0;width:100vw;height:' + heroH + 'px;background:' + color + ';';
      document.body.appendChild(colorEl);

      // White overlay below hero — masks rest of content
      var whiteEl = document.createElement('div');
      whiteEl.style.cssText = 'position:fixed;z-index:9998;pointer-events:none;' +
        'top:' + (navH + heroH) + 'px;left:0;width:100vw;bottom:0;background:#fff;';
      document.body.appendChild(whiteEl);

      // Two rAF calls so overlays are painted before transitioning
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          colorEl.style.transition = 'opacity 0.5s ease-out 0.05s';
          colorEl.style.opacity = '0';
          whiteEl.style.transition = 'opacity 0.45s ease-out 0.15s';
          whiteEl.style.opacity = '0';
          setTimeout(function () { colorEl.remove(); whiteEl.remove(); }, 800);
        });
      });
    } catch (e) {
      restoreOpacity();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
