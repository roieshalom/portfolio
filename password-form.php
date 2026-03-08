<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Protected Project · Roie Shalom</title>
    <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
    <link href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@100..900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <nav class="top-nav">
        <a href="index.html" class="brand" id="desktop-brand">Roie Shalom</a>
        <button class="nav-menu-toggle" aria-label="Open menu" aria-expanded="false"><span class="nav-icon">☰</span></button>
        <div class="top-nav-links">
            <a href="index.html" class="nav-link">Home</a>
            <a href="work.html" class="nav-link">Work</a>
            <a href="about.html" class="nav-link">About</a>
            <a href="contact.html" class="nav-link">Contact</a>
        </div>
    </nav>
    <main class="main-content" style="display:flex; justify-content:center; padding-top:60px;">
        <form method="post" autocomplete="off" style="max-width:400px; width:100%; display:flex; flex-direction:column; align-items:center; gap:1.2rem;">
            <h1 style="display:block; font-size:1.4rem; font-weight:600; color:var(--color-text-main); margin:0;">Protected Project</h1>
            <?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
                <p style="color:var(--color-text-main); margin:0; font-size:0.95rem;">Wrong password. Reach out via <a href="mailto:roiesh@gmail.com" style="color:var(--color-link); text-decoration:underline;">email</a> to get access.</p>
            <?php endif; ?>
            <input type="password" name="pw" placeholder="Enter password" autofocus required
                style="width:100%; padding:0.65em 0.85em; font-size:1rem; font-family:inherit;
                       color:var(--color-text-main); background:var(--color-card);
                       border:1px solid var(--color-border); border-radius:8px;
                       outline:none; box-sizing:border-box;">
            <button type="submit">Submit</button>
        </form>
    </main>
    <script src="nav.js"></script>
    <script src="theme.js"></script>
</body>
</html>
