// Project-page nav collapse (styles live in casestudy.css, ".top-nav.nav-collapse").
// Across roughly one screen of scroll the inner bar shrinks to the sections'
// grid-column 1, then the name morphs "Roie Shalom" -> "Roiesh". The pink
// scroll-progress divider only starts running once that sequence is finished.
// Variables set on the nav: --bar-shrink, --name-morph, --scroll-progress,
// plus the measured --brand-full-w / --brand-sh-w.
(function () {
  var nav = document.querySelector('.top-nav.nav-collapse');
  if (!nav) return;
  var full = nav.querySelector('.brand-full');
  var sh = nav.querySelector('.brand-sh');

  // Fraction of the one-screen sequence spent shrinking the bar; the rest
  // morphs the name. Shrink finishes first, name morph last.
  var SHRINK_END = 0.7;

  function clamp01(v) { return Math.min(1, Math.max(0, v)); }

  // Measure the natural width of a morphing brand fragment so the collapse
  // animates in real pixels.
  function measure(el) {
    if (!el) return 0;
    var prev = el.style.maxWidth;
    el.style.maxWidth = 'none';
    var w = el.getBoundingClientRect().width;
    el.style.maxWidth = prev;
    return w;
  }
  function measureBrand() {
    nav.style.setProperty('--brand-full-w', measure(full).toFixed(2) + 'px');
    nav.style.setProperty('--brand-sh-w', measure(sh).toFixed(2) + 'px');
  }

  var ticking = false;
  function update() {
    var doc = document.documentElement;
    var vh = window.innerHeight;
    var y = window.scrollY;

    // Overall nav-sequence progress across ~one viewport of scroll.
    var p = clamp01(y / vh);
    nav.style.setProperty('--bar-shrink', clamp01(p / SHRINK_END).toFixed(4));
    nav.style.setProperty('--name-morph', clamp01((p - SHRINK_END) / (1 - SHRINK_END)).toFixed(4));

    // Pink divider only starts once the nav sequence is done (after the
    // first viewport of scroll).
    var max = doc.scrollHeight - doc.clientHeight;
    var pink = max > vh ? clamp01((y - vh) / (max - vh)) : 0;
    nav.style.setProperty('--scroll-progress', pink.toFixed(4));
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', function () { measureBrand(); update(); }, { passive: true });

  measureBrand();
  update();
  // Re-measure once webfonts settle (Archivo changes the widths).
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { measureBrand(); update(); });
  }
})();
