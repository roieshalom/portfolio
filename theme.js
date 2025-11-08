function getThemeByTime() {
  const hour = new Date().getHours();
  return (hour >= 20 || hour < 6) ? "dark" : "light";
}

function applyTheme(theme) {
  // Set data-theme on <html>
  document.documentElement.setAttribute('data-theme', theme);
}

function updateThemeLinks(selected) {
  document.getElementById('theme-light')?.classList.toggle('selected', selected === 'light');
  document.getElementById('theme-dark')?.classList.toggle('selected', selected === 'dark');
  document.getElementById('theme-auto')?.classList.toggle('selected', selected === 'auto');
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

// Attach event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('theme-light')?.addEventListener('click', function(e) {
    e.preventDefault();
    applyTheme('light');
    localStorage.setItem('theme', 'light');
    updateThemeLinks('light');
  });
  document.getElementById('theme-dark')?.addEventListener('click', function(e) {
    e.preventDefault();
    applyTheme('dark');
    localStorage.setItem('theme', 'dark');
    updateThemeLinks('dark');
  });
  document.getElementById('theme-auto')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('theme');
    const autoTheme = getThemeByTime();
    applyTheme(autoTheme);
    updateThemeLinks('auto');
  });
});
