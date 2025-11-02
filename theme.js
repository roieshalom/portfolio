function setThemeByTime() {
  // Use stored preference if set
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    document.body.classList.toggle('dark-mode', storedTheme === 'dark');
    return;
  }
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 19) {
    document.body.classList.remove('dark-mode');
  } else {
    document.body.classList.add('dark-mode');
  }
}

window.addEventListener('DOMContentLoaded', function() {
  setThemeByTime();
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', function(event) {
    event.preventDefault(); // Prevents the # from scrolling to top
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
});
