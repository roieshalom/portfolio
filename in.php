<?php
$expires = time() + (30 * 24 * 60 * 60);
setcookie('portfolio_access', time() * 1000, $expires, '/');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Roie Shalom</title>
  <script>
    localStorage.setItem('portfolio_access', Date.now().toString());
    window.location.replace('/');
  </script>
</head>
<body></body>
</html>
