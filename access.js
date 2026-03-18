// Portfolio magic link access system
// Sets/checks a 30-day access flag via localStorage + cookie

function hasPortfolioAccess() {
  var timestamp = localStorage.getItem('portfolio_access');
  if (!timestamp) return false;
  var thirtyDays = 30 * 24 * 60 * 60 * 1000;
  var elapsed = Date.now() - parseInt(timestamp, 10);
  if (elapsed > thirtyDays) {
    localStorage.removeItem('portfolio_access');
    return false;
  }
  return true;
}

function grantPortfolioAccess() {
  var now = Date.now().toString();
  localStorage.setItem('portfolio_access', now);
  var expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = 'portfolio_access=' + now + '; expires=' + expires + '; path=/; SameSite=Lax';
}

// Handle ?access=in query parameter on any page
(function() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('access') === 'in') {
    grantPortfolioAccess();
    params.delete('access');
    var newSearch = params.toString();
    window.location.replace(
      window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash
    );
  }
})();
