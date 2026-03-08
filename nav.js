(function () {
  const toggle = document.querySelector('.nav-menu-toggle');
  const links = document.querySelector('.top-nav-links');
  if (!toggle || !links) return;

  const icon = toggle.querySelector('.nav-icon');

  function closeMenu() {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    icon.textContent = '☰';
  }

  toggle.addEventListener('click', function () {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    icon.textContent = open ? '✕' : '☰';
    if (open) {
      links.style.top = toggle.closest('.top-nav').getBoundingClientRect().bottom + 'px';
    }
  });

  links.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.top-nav')) closeMenu();
  });
})();
