function setThemeByTime() {
  // DEBUG: Log for troubleshooting
  console.log('Theme script running...');
  const storedTheme = localStorage.getItem('theme');
  console.log('Stored theme:', storedTheme);

  if (storedTheme === 'light') {
    document.body.classList.remove('dark-mode');
    console.log('Applying stored light');
    return;
  } else if (storedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    console.log('Applying stored dark');
    return;
  }
  const hour = new Date().getHours();
  console.log('Hour is:', hour);

  if (hour >= 7 && hour < 19) {
    document.body.classList.remove('dark-mode');
    console.log('Auto day (light)');
  } else {
    document.body.classList.add('dark-mode');
    console.log('Auto night (dark)');
  }
}

window.addEventListener('DOMContentLoaded', function() {
  setThemeByTime();
  const themeToggle = document.getElementById('theme-toggle');
  window.addEventListener('DOMContentLoaded', function() {
  setThemeByTime();
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', function(event) {
    event.preventDefault();
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    console.log('Manual toggle, now', isDark ? 'dark' : 'light');
  });
});

});
