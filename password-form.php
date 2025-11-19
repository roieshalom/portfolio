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
            align-items: flex-start; /* Was center, now flex-start (prevents bottom push) */
            min-height: 100vh;
            padding-top: 4vh;       /* Add small top padding only */
            padding-left: 0;        /* Remove horizontal padding */
            padding-right: 0;
            box-sizing: border-box;
        }
        .password-box {
            background: var(--color-surface);
            padding: 2.2rem 1.1rem;
            border-radius: 12px;
            box-shadow: var(--shadow-lg);
            max-width: 400px;
            width: 100%;
            position: relative;
            margin: 0 auto;
            box-sizing: border-box;
            display: flex;           /* NEW */
            flex-direction: column;  /* NEW */
            align-items: center;     /* NEW, ensures children centered */
        }
        .password-box h1 {
            margin-top: 0;
            color: var(--color-text);
        }
        .status-wrapper {
            min-height: 3.3em; /* reserve vertical space for up to 2 lines, prevents layout jump */
            margin-bottom: 1.3em;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        .info-message,
        .error-message {
            font-size: 0.98em;
        }
        .info-message {
            color: var(--color-text-secondary);
            background: transparent;
        }
        .error-message {
            color: var(--color-error);
            background: rgba(var(--color-error-rgb),0.09);
            border-radius: var(--radius-base);
            padding: 0.5rem 0.75rem;
        }
        .password-box input {
            width: 64%;
            min-width: 220px;
            padding: 0.75rem 1rem;
            font-size: 1rem;
            border: 1px solid var(--color-text);
            border-radius: 5px;
            margin-bottom: 1.5rem;
            box-sizing: border-box;
            font-family: inherit;
            background: var(--color-backgroud);
            color: var(--color-text);
        }
        .password-box input:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: var(--focus-ring);
        }


                /* Centerboxes and font-size on very small screens */
        @media (max-width: 600px){
        .password-container {
            padding: 0;
            }
        .password-box {
            max-width: 98vw;
            width: 98vw;
                padding: 2rem 0.7rem;
            }
    
            .password-box h1 {
                font-size: 1.4em;
            }
            nav {
                font-size: 1em;
                gap: .8em;
            }
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
        <form method="post" class="password-box" autocomplete="off">
            <h1>Protected Project</h1>
            <div class="status-wrapper">
                <?php
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    echo '<div class="info-message">Wrong password. Reach out via <a href="mailto:roiesh@gmail.com" class="exp-company">email</a> to get the password</div>';
                }
                ?>
            </div>
            <input type="password" name="pw" placeholder="Enter password" autofocus required>
            <button type="submit" class="btn btn--primary btn--lg">Submit</button>
        </form>
    </div>
</body>
</html>
