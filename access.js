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
  localStorage.setItem('portfolio_access', Date.now().toString());
}
