/* Staggered entrance reveal.
   Content is hidden up front (html.seq-armed, set synchronously below so it
   applies before first paint), then revealed row by row, top to bottom:
   text blocks in order, tile grids line by line. */
(function () {
  'use strict';

  // Respect reduced motion — leave everything visible, do nothing.
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduce) return;

  // Arriving via a card click? page-transition.js runs first and flags it;
  // its overlay handles that entrance, so the staggered reveal stands down.
  if (window.__cardEntrance) return;

  var html = document.documentElement;
  html.classList.add('seq-armed'); // hides content pre-paint via CSS

  var STAGGER = 65;     // ms between rows
  var DUR = 600;        // ms reveal (matches CSS transition)
  var MAX_DELAY = 850;  // cap so long pages don't drag
  var ROW_BUCKET = 14;  // px tolerance for grouping items onto one visual row
  var START = 40;       // ms before the first row

  // Failsafe: never leave content hidden if something goes wrong.
  var failsafe = setTimeout(disarm, 1600);
  function disarm() {
    html.classList.remove('seq-armed');
    var els = document.querySelectorAll('.seq-el');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.remove('seq-el', 'seq-vis');
      els[i].style.transitionDelay = '';
    }
  }

  var ATOMIC = /^(P|H1|H2|H3|H4|H5|H6|IMG|PICTURE|BUTTON|FIGURE|BLOCKQUOTE|HR|UL|OL|PRE|VIDEO|CANVAS|TABLE)$/;
  function isAtomic(el) {
    if (el.classList.contains('gallery-tile')) return true;
    if (el.hasAttribute('data-seq-atomic')) return true;
    if (ATOMIC.test(el.tagName)) return true;
    return el.children.length === 0;
  }
  function skip(el) {
    var t = el.tagName;
    if (t === 'SCRIPT' || t === 'STYLE' || t === 'NAV' || t === 'FOOTER') return true;
    if (el.hasAttribute('data-no-seq')) return true;
    var cs;
    try { cs = getComputedStyle(el); } catch (e) { return false; }
    return cs.display === 'none' || cs.visibility === 'hidden';
  }
  function collect(el, out, depth) {
    var kids = el.children;
    for (var i = 0; i < kids.length; i++) {
      var c = kids[i];
      if (skip(c)) continue;
      if (c.classList.contains('gallery-grid')) continue; // tiles handled separately (async)
      if (isAtomic(c) || depth >= 4) out.push(c);
      else collect(c, out, depth + 1);
    }
  }

  function markHidden(nodes) {
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.add('seq-el');
  }

  // Commit the hidden state, then reveal (forced reflow works even when the
  // tab is backgrounded — unlike requestAnimationFrame, which gets throttled).
  function reveal(nodes) {
    void document.documentElement.offsetWidth;
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.add('seq-vis');
  }

  // Reveal a set of nodes grouped into visual rows (by top), each row a beat later.
  function revealSet(nodes, startDelay) {
    if (!nodes.length) return;
    nodes.sort(function (a, b) {
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (ra.top - rb.top) || (ra.left - rb.left);
    });
    var lastTop = null, rowIndex = -1;
    for (var i = 0; i < nodes.length; i++) {
      var top = Math.round(nodes[i].getBoundingClientRect().top);
      if (lastTop === null || Math.abs(top - lastTop) > ROW_BUCKET) {
        rowIndex++;
        lastTop = top;
      }
      nodes[i].style.transitionDelay = Math.min(startDelay + rowIndex * STAGGER, MAX_DELAY) + 'ms';
    }
    reveal(nodes);
  }

  function gridColumns(grid) {
    try {
      var t = window.getComputedStyle(grid).gridTemplateColumns;
      if (t && t !== 'none') {
        var n = t.trim().split(/\s+/).length;
        if (n > 0) return n;
      }
    } catch (e) {}
    return 1;
  }

  function observeGrid(grid) {
    if (grid.children.length) { revealGrid(grid); return; }
    var done = false;
    var obs = new MutationObserver(function () {
      if (!done && grid.children.length) { done = true; obs.disconnect(); revealGrid(grid); }
    });
    obs.observe(grid, { childList: true });
    setTimeout(function () {
      if (!done) { done = true; obs.disconnect(); if (grid.children.length) revealGrid(grid); }
    }, 3000);
  }
  // Count how many distinct revealed rows sit above a point, so a grid slots
  // into the global top-to-bottom cadence (tiles come after the heading above).
  function rowsAbove(topY) {
    var els = document.querySelectorAll('.seq-el');
    var seen = {};
    for (var i = 0; i < els.length; i++) {
      var t = els[i].getBoundingClientRect().top;
      if (t < topY - ROW_BUCKET) seen[Math.round(t / ROW_BUCKET)] = 1;
    }
    return Object.keys(seen).length;
  }

  // Tiles reveal line by line: row derived from the grid's column count, so it
  // stays correct even before thumbnail images have loaded (height still 0).
  function revealGrid(grid) {
    var tiles = Array.prototype.slice.call(grid.children);
    var base = START + rowsAbove(grid.getBoundingClientRect().top) * STAGGER;
    markHidden(tiles);
    var cols = gridColumns(grid);
    for (var i = 0; i < tiles.length; i++) {
      var row = Math.floor(i / cols);
      tiles[i].style.transitionDelay = Math.min(base + row * STAGGER, MAX_DELAY) + 'ms';
    }
    reveal(tiles);
  }

  function start() {
    clearTimeout(failsafe);
    try {
      var container = document.querySelector('main') || document.body;
      var targets = [];
      collect(container, targets, 0);
      markHidden(targets);            // hide leaves before showing their containers
      html.classList.remove('seq-armed');
      revealSet(targets, START);

      var grids = document.querySelectorAll('.gallery-grid');
      for (var i = 0; i < grids.length; i++) observeGrid(grids[i]);
    } catch (e) {
      disarm();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
