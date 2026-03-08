(function () {
  const toggle = document.querySelector('.nav-menu-toggle');
  const links = document.querySelector('.top-nav-links');
  if (!toggle || !links) return;

  function closeMenu() {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('i').className = 'fa-solid fa-bars';
  }

  toggle.addEventListener('click', function () {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('i').className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
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
