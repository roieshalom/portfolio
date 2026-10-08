// Skip Clarity on local development, and on any browser that has opted out by
// setting localStorage.block_clarity = "true" (e.g. my own sessions), so neither
// pollutes analytics.
if (
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1" &&
  localStorage.getItem("block_clarity") !== "true"
) {
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script","u4dp513xm1");

  // Allow Clarity to set its session cookies. Projects ship with the
  // cookie-consent setting on by default, which otherwise blocks the cookie and
  // makes every page load look like a brand new session and user.
  window.clarity("consent");
  window.clarity("consentv2", { ad_storage: "granted", analytics_storage: "granted" });
}
