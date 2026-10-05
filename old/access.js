// Try localStorage (persists 30 days), fall back to sessionStorage
// if blocked by Safari's privacy protections (lasts until tab closes)
function _getStore() {
  try {
    localStorage.setItem('_test', '1');
    localStorage.removeItem('_test');
    return localStorage;
  } catch (e) {
    return sessionStorage;
  }
}

function hasPortfolioAccess() {
  try {
    var store = _getStore();
    var timestamp = store.getItem('portfolio_access');
    if (!timestamp) return false;
    var thirtyDays = 30 * 24 * 60 * 60 * 1000;
    var elapsed = Date.now() - parseInt(timestamp, 10);
    if (elapsed > thirtyDays) {
      store.removeItem('portfolio_access');
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function grantPortfolioAccess() {
  try {
    _getStore().setItem('portfolio_access', Date.now().toString());
  } catch (e) {}
}
