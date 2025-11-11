const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'content', 'images');

fs.readdirSync(baseDir).forEach(folder => {
  const folderPath = path.join(baseDir, folder);
  if (fs.statSync(folderPath).isDirectory()) {
    const images = fs.readdirSync(folderPath)
      .filter(file => /\.(png|jpe?g|gif|webp)$/i.test(file));
    const updated = images.map(file => ({
      file,
      caption: ""
    }));
    fs.writeFileSync(path.join(folderPath, 'images.json'), JSON.stringify(updated, null, 2));
    console.log(`Updated ${folder}/images.json`);
  }
});
