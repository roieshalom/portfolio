function getThemeByTime() {
  const hour = new Date().getHours();
  return (hour >= 20 || hour < 6) ? "dark" : "light";
}

function applyTheme(theme) {
  document.body.classList.toggle('dark-mode', theme === 'dark');
  document.body.classList.toggle('light-mode', theme === 'light');
}

function updateThemeLinks(selected) {
  document.getElementById('theme-light').classList.toggle('selected', selected === 'light');
  document.getElementById('theme-dark').classList.toggle('selected', selected === 'dark');
  document.getElementById('theme-auto').classList.toggle('selected', selected === 'auto');
}

// On load, set theme and highlight current option
(function initializeTheme() {
  const storedTheme = localStorage.getItem('theme');
  let toApply;
  if (!storedTheme) {
    toApply = getThemeByTime();
    updateThemeLinks('auto');
  } else {
    toApply = storedTheme;
    updateThemeLinks(storedTheme);
  }
  applyTheme(toApply);
})();

document.getElementById('theme-light').addEventListener('click', function(e) {
  e.preventDefault();
  applyTheme('light');
  localStorage.setItem('theme', 'light');
  updateThemeLinks('light');
});
document.getElementById('theme-dark').addEventListener('click', function(e) {
  e.preventDefault();
  applyTheme('dark');
  localStorage.setItem('theme', 'dark');
  updateThemeLinks('dark');
});
document.getElementById('theme-auto').addEventListener('click', function(e) {
  e.preventDefault();
  localStorage.removeItem('theme');
  applyTheme(getThemeByTime());
  updateThemeLinks('auto');
});
