(function() {
  'use strict';
  
  fetch('font-config.json')
    .then(res => res.json())
    .then(config => {
      const fonts = config.fonts;
      
      // Build Google Fonts URL dynamically
      const fontFamilies = fonts.map(font => font.replace(/ /g, '+')).join('&family=');
      const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
      
      // Create and inject font link
      const link = document.createElement('link');
      link.href = googleFontsUrl;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      // Wait for fonts to load, then apply random font
      link.onload = function() {
        const randomIndex = Math.floor(Math.random() * fonts.length);
        const randomFont = fonts[randomIndex];
        const fontFamily = `'${randomFont}', sans-serif`;
        
        const desktopBrand = document.getElementById('desktop-brand');
        const mobileBrand = document.getElementById('mobile-brand');
        
        if (desktopBrand) desktopBrand.style.fontFamily = fontFamily;
        if (mobileBrand) mobileBrand.style.fontFamily = fontFamily;
        
        console.log('Font changed to:', randomFont);
      };
    })
    .catch(err => console.error('Font config error:', err));
    
})();
