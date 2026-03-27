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
        // Stagger the pop animation across digits
        digits.forEach(function (d, i) {
          setTimeout(function () { d.classList.add('is-success'); }, i * 110);
        });

        // Step 1: green wash — start after digits have popped
        setTimeout(function () {
          card.style.transition = 'background 0.55s ease';
          card.style.background = 'rgba(60, 200, 80, 0.28)';

          // Step 2: fade out + slide up — give green state time to breathe
          setTimeout(function () {
            var h = card.offsetHeight;
            card.style.maxHeight = h + 'px';
            card.style.overflow = 'hidden';
            void card.offsetWidth; // reflow
            card.style.transition = 'opacity 0.55s ease, max-height 0.6s ease, padding 0.6s ease, margin 0.6s ease, background 0.4s ease';
            card.style.opacity = '0';
            card.style.maxHeight = '0';
            card.style.padding = '0';
            card.style.margin = '0';
            card.style.background = 'transparent';
            setTimeout(function () {
              card.style.display = 'none';
              unlockCards();
            }, 700);
          }, 1000);
        }, 450);
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
      var icon = tile.querySelector('.tile-lock-icon');
      if (icon) {
        icon.style.maxWidth = '0';
        icon.style.opacity = '0';
        setTimeout(function () { icon.remove(); }, 750);
      }
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

  var isTouch = !window.matchMedia('(hover: hover)').matches;

  // Locked card click handler
  document.addEventListener('click', function (e) {
    var tile = e.target.closest('.gallery-tile.is-locked');
    if (!tile) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    pulsePinCard();
    // On touch devices only: show hint and auto-hide after 2.5s
    // On desktop: CSS :hover handles the hint display
    if (isTouch) {
      var hint = tile.querySelector('.tile-lock-hint');
      if (hint) {
        hint.style.opacity = '1';
        clearTimeout(hint._hideTimer);
        hint._hideTimer = setTimeout(function () { hint.style.opacity = '0'; }, 2500);
      }
    }
  }, true); // capture phase so it runs before departure animation

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
