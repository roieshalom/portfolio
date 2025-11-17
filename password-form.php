<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Protected project</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Momo+Trust+Sans:wght@400;700&display=swap">
    <script src="https://kit.fontawesome.com/3ff078e01b.js" crossorigin="anonymous"></script>
    <script src="theme.js"></script>
    <style>
        .password-container {
            display: flex;
            justify-content: center;
            min-height: 100vh;
            padding: 5rem; 
        }
        .password-box {
            background: var(--color-surface);
            padding: 3rem;
            border-radius: 12px;
            box-shadow: var(--shadow-lg);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        .password-box h1 {
            margin-top: 0;
            color: var(--color-text);
        }
        .password-box p {
            color: var(--color-text-secondary);
            margin-bottom: 2rem;
        }
        .password-box input {
            width: 100%;
            padding: 0.75rem 1rem;
            font-size: 1rem;
            border: 1px solid var(--color-border);
            border-radius: 5px;
            margin-bottom: 1.5rem;
            box-sizing: border-box;
            font-family: inherit;
            background: var(--color-background);
            color: var(--color-text);
        }
        .password-box input:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: var(--focus-ring);
        }
        .password-box button {
            width: 100%;
        }
        .error-message {
            color: var(--color-error);
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
            padding: 0.75rem;
            background: rgba(var(--color-error-rgb), 0.1);
            border-radius: var(--radius-base);
        }
    </style>
</head>
<body>
    <header>
  <nav>
    <a href="index.html" class="back-nav-link">Home</a>
    <a href="slash.html" class="back-nav-link slash-link">/</a>
    <a href="gallery.html" class="back-nav-link">Gallery</a>
  </nav>
</header>
    <div class="password-container">
        <form method="post" class="password-box">
            <h1>Protected Project</h1>
            <p>Reach out via <a href="mailto:roiesh@gmail.com" class="exp-company">email</a> to get the password</p>
            <?php if ($_SERVER['REQUEST_METHOD'] === 'POST') echo '<div class="error-message">❌ Incorrect password. Please try again.</div>'; ?>
            <input type="password" name="pw" placeholder="Enter password" autofocus required>
            <button type="submit" class="btn btn--primary btn--lg">Access Project</button>
        </form>
    </div>
</body>
</html>
