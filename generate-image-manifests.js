const fs = require('fs');
const path = require('path');

// The folder containing *all* your project image folders
const baseDir = path.join(__dirname, 'content', 'images');

fs.readdirSync(baseDir).forEach(folder => {
  const folderPath = path.join(baseDir, folder);
  if (fs.statSync(folderPath).isDirectory()) {
    // List all image files: png, jpg, jpeg, gif, webp
    const images = fs.readdirSync(folderPath)
      .filter(file =>
        /\.(png|jpg|jpeg|gif|webp)$/i.test(file)
      );
    // Write the manifest file
    fs.writeFileSync(
      path.join(folderPath, 'images.json'),
      JSON.stringify(images, null, 2)
    );
    console.log(`Updated ${folder}/images.json:`, images.length, 'files');
  }
});
