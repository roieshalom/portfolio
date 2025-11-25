<?php
$protectedProjects = ['fig', 'stealthproj'];
$password = 'Rodaga708';

$projectId = isset($_GET['id']) ? $_GET['id'] : null;
$isProtected = in_array($projectId, $protectedProjects);

if ($isProtected) {
    session_start();
    if (!isset($_SESSION['pw_ok']) || $_SESSION['pw_ok'] !== $projectId) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['pw']) && $_POST['pw'] === $password) {
            $_SESSION['pw_ok'] = $projectId;
            header("Location: " . $_SERVER['REQUEST_URI']);
            exit;
        }
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
              <p>The project "${projectId}" doesn't exist. <a href="index.html">Go back to homepage</a>.</p>
            </div>
          `;
          return;
        }

        document.title = `${project.title_bold} ${project.title_regular} | Roie Shalom`;
        document.getElementById('project-title').innerHTML =
          `<strong>${project.title_bold}</strong> ${project.title_regular}`;
        document.getElementById('project-desc').textContent = project.desc;

        fetch(`${project.imagefolder}/images.json`)
          .then(res => res.json())
          .then(files => {
            document.getElementById('project-content').innerHTML = `
              <div class="project-gallery">
              ${files
                .filter(img => !img.file.toLowerCase().includes('thumb.png'))
                .sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true })) // <-- sort images by name!
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
            document.getElementById('project-content').innerHTML += `
              <div class="project-gallery">
                <p style="text-align:center; color: #e91e63;">No images found for this project.</p>
              </div>
            `;
            console.error('Error loading images.json:', err);
          });
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
