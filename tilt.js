// 3D tilt effect for gallery tiles
// Only runs on hover-capable devices (not touch)
if (window.matchMedia('(hover: hover)').matches) {
  function applyTilt(tile) {
    if (tile._tiltInit || tile.classList.contains('coming-soon-tile')) return;
    tile._tiltInit = true;

    tile.addEventListener('mousemove', function(e) {
      var rect = tile.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      var rx = (y - 0.5) * -14;
      var ry = (x - 0.5) * 14;
      tile.style.transition = 'transform 0.08s linear, box-shadow 0.08s linear';
      tile.style.transform = 'perspective(700px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale3d(1.03,1.03,1.03)';
      tile.style.boxShadow = '0 16px 40px var(--color-card-shadow-hover)';
    });

    tile.addEventListener('mouseleave', function() {
      tile.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease';
      tile.style.transform = '';
      tile.style.boxShadow = '';
    });
  }

  // Apply to tiles already in DOM
  document.querySelectorAll('.gallery-tile').forEach(applyTilt);

  // Apply to tiles added dynamically (from JSON fetch)
  var obs = new MutationObserver(function() {
    document.querySelectorAll('.gallery-tile').forEach(applyTilt);
  });
  obs.observe(document.body, { childList: true, subtree: true });
}
