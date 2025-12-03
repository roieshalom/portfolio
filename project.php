<?php
$password = 'Rodaga708';
$projectId = isset($_GET['id']) ? $_GET['id'] : null;

// Load projects and check if this one is protected
$isProtected = false;
if ($projectId) {
    $projectsData = json_decode(file_get_contents('data/projects.json'), true);
    $project = array_filter($projectsData, fn($p) => $p['id'] === $projectId);
    $project = reset($project); // get first match
    $isProtected = !empty($project['protected']);
}

if ($isProtected) {
    session_start();
    
    // Set session timeout (in seconds) - e.g., 1 hour = 3600
    $session_timeout = 1200; // 20 minutes
    
    // Check if session exists and is valid
    $session_valid = isset($_SESSION['pw_ok']) 
                     && $_SESSION['pw_ok'] === $projectId
                     && isset($_SESSION['pw_timestamp'])
                     && (time() - $_SESSION['pw_timestamp']) < $session_timeout;
    
    if (!$session_valid) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['pw']) && $_POST['pw'] === $password) {
            $_SESSION['pw_ok'] = $projectId;
            $_SESSION['pw_timestamp'] = time(); // Store current timestamp
            header("Location: " . $_SERVER['REQUEST_URI']);
            exit;
        }
        // Clear old session data
        unset($_SESSION['pw_ok']);
        unset($_SESSION['pw_timestamp']);
        include 'password-form.php';
        exit;
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "u4dp513xm1");
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project | Roie Shalom</title>
  <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
  <link href="https://fonts.googleapis.com/css2?family=Momo+Trust+Sans:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script src="https://kit.fontawesome.com/3ff078e01b.js" crossorigin="anonymous"></script>
</head>
<body>
<header>
  <nav>
    <a href="index.html" class="back-nav-link">Home</a>
    <a href="slash.html" class="back-nav-link slash-link">/</a>
    <a href="gallery.html" class="back-nav-link">Gallery</a>
  </nav>
  <h1 id="project-title">Project Title Loading...</h1>
  <p id="project-desc">Explore my work across UX, branding, and creative technology.</p>
</header>
<div class="project-container">
  <div id="project-content">
    <p style="text-align: center; padding: 60px 20px;">Loading project...</p>
  </div>
</div>

<script>
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  if (!projectId) {
    document.getElementById('project-content').innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <h1>No project specified</h1>
        <p>Please select a project from the <a href="index.html">homepage</a>.</p>
      </div>
    `;
  } else {
    fetch('data/projects.json')
      .then(res => res.json())
      .then(projects => {
        const project = projects.find(p => p.id === projectId);

        if (!project) {
          document.getElementById('project-content').innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
              <h1>Project not found</h1>
              <p>The project ${projectId} does not exist. <a href="index.html">Go back to homepage</a>.</p>
            </div>
          `;
          return;
        }

        document.title = `${project.title_bold} ${project.title_regular} | Roie Shalom`;
        document.getElementById('project-title').innerHTML =
          `<strong>${project.title_bold}</strong> ${project.title_regular}`;
        document.getElementById('project-desc').textContent = project.desc;

        // Check if imagefolder is a PDF file
        if (project.imagefolder && project.imagefolder.toLowerCase().endsWith('.pdf')) {
          // Display PDF with button at top right
          document.getElementById('project-content').innerHTML = `
            <div style="position: relative; width: 100%; max-width: 1400px; margin: 0 auto;">
              <a href="serve-pdf.php?id=${projectId}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="position: absolute; top: 10px; right: 10px; z-index: 10; display: inline-block; padding: 10px 20px; background: #e91e63; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                Open in New Tab
              </a>
              <iframe 
                src="serve-pdf.php?id=${projectId}#pagemode=none&view=FitH" 
                title="${project.title_bold} PDF"
                style="width: 100%; height: 1000px; border: none;">
              </iframe>
            </div>
          `;
        } else {
          // Display image gallery
          fetch(`${project.imagefolder}/images.json`)
            .then(res => res.json())
            .then(files => {
              document.getElementById('project-content').innerHTML = `
                <div class="project-gallery">
                ${files
                  .filter(img => !img.file.toLowerCase().includes('thumb.png'))
                  .sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }))
                  .map((img, index) => `
                    <figure>
                      <img src="${project.imagefolder}/${img.file}"
                          alt="${project.title_bold} screenshot ${index + 1}"
                          loading="lazy"
                          onerror="this.style.display='none';">
                      ${img.caption ? `<figcaption>${img.caption}</figcaption>` : ""}
                    </figure>
                  `).join('')}
                </div>
              `;
            })
            .catch(err => {
              document.getElementById('project-content').innerHTML = `
                <div class="project-gallery">
                  <p style="text-align:center; color: #e91e63;">No images found for this project.</p>
                </div>
              `;
              console.error('Error loading images.json:', err);
            });
        }
      })
      .catch(error => {
        document.getElementById('project-content').innerHTML = `
          <div style="text-align: center; padding: 60px 20px;">
            <h1>Error loading project</h1>
            <p>There was an error loading the project data. Please try again later.</p>
          </div>
        `;
        console.error('Error loading project:', error);
      });
  }
</script>
<script src="theme.js"></script>
</body>
</html>
