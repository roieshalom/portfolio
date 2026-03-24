(function () {
  var CORRECT = '2026';

  function init() {
    var card = document.getElementById('pin-unlock-card');
    if (!card) return;

    if (hasPortfolioAccess()) {
      card.style.display = 'none';
      return;
    }

    var digits = Array.from(card.querySelectorAll('.pin-digit'));
    var inputsWrap = card.querySelector('.pin-inputs');

    digits.forEach(function (input, i) {
      input.addEventListener('input', function () {
        var val = input.value.replace(/\D/g, '');
        input.value = val.slice(-1);
        if (val && i < digits.length - 1) digits[i + 1].focus();
        if (digits.every(function (d) { return d.value !== ''; })) submit();
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !input.value && i > 0) {
          digits[i - 1].value = '';
          digits[i - 1].focus();
        }
      });

      input.addEventListener('paste', function (e) {
        e.preventDefault();
        var pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        pasted.slice(0, 4).split('').forEach(function (ch, j) {
          if (digits[j]) digits[j].value = ch;
        });
        var next = Math.min(pasted.length, digits.length - 1);
        digits[next].focus();
        if (digits.every(function (d) { return d.value !== ''; })) submit();
      });
    });

    function submit() {
      var code = digits.map(function (d) { return d.value; }).join('');
      if (code === CORRECT) {
        grantPortfolioAccess();
        digits.forEach(function (d) { d.classList.add('is-success'); });
        setTimeout(function () {
          card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          card.style.opacity = '0';
          card.style.transform = 'translateY(-6px)';
          setTimeout(function () {
            card.style.display = 'none';
            unlockCards();
          }, 500);
        }, 1000);
      } else {
        inputsWrap.classList.add('is-shaking');
        setTimeout(function () {
          inputsWrap.classList.remove('is-shaking');
          digits.forEach(function (d) { d.value = ''; });
          digits[0].focus();
        }, 400);
      }
    }
  }

  function unlockCards() {
    document.querySelectorAll('.gallery-tile.is-locked').forEach(function (tile) {
      tile.classList.remove('is-locked');
      var strong = tile.querySelector('.tile-label strong');
      if (strong) strong.textContent = strong.textContent.replace(/🔒\s*/g, '');
    });
  }

  function pulsePinCard() {
    var card = document.getElementById('pin-unlock-card');
    if (!card || card.style.display === 'none') return;
    var digits = Array.from(card.querySelectorAll('.pin-digit'));
    digits.forEach(function (d) {
      d.classList.remove('is-pulsing');
      void d.offsetWidth;
      d.classList.add('is-pulsing');
      d.addEventListener('animationend', function h() {
        d.classList.remove('is-pulsing');
        d.removeEventListener('animationend', h);
      });
    });
    if (digits[0]) setTimeout(function () { digits[0].focus(); }, 150);
  }

  // Locked card click handler
  document.addEventListener('click', function (e) {
    var tile = e.target.closest('.gallery-tile.is-locked');
    if (!tile) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    pulsePinCard();
    var hint = tile.querySelector('.tile-lock-hint');
    if (hint) {
      hint.style.opacity = '1';
      clearTimeout(hint._hideTimer);
      hint._hideTimer = setTimeout(function () { hint.style.opacity = '0'; }, 2000);
    }
  }, true); // capture phase so it runs before departure animation

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
