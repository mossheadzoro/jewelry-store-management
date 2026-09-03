const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'src', 'app');
const mainDir = path.join(appDir, '(main)');

const modules = [
  'billing',
  'customer',
  'inventory',
  'karigar',
  'metalExchange',
  'orderBook',
  'sales',
  'wholesaler'
];

modules.forEach(mod => {
  const srcMod = path.join(appDir, mod);
  const destMod = path.join(mainDir, mod);

  if (!fs.existsSync(srcMod)) return;

  if (!fs.existsSync(destMod)) {
    fs.mkdirSync(destMod, { recursive: true });
  }

  const items = fs.readdirSync(srcMod);
  items.forEach(item => {
    const srcPath = path.join(srcMod, item);
    const destPath = path.join(destMod, item);

    if (fs.existsSync(destPath)) {
      console.log(`Destination already exists: ${destPath}`);
      if (fs.statSync(srcPath).isDirectory()) {
        fs.cpSync(srcPath, destPath, { recursive: true, force: true });
      }
    } else {
      console.log(`Copying ${srcPath} -> ${destPath}`);
      fs.cpSync(srcPath, destPath, { recursive: true, force: true });
    }
  });

  try {
    fs.rmSync(srcMod, { recursive: true, force: true });
    console.log(`Removed duplicate directory: ${srcMod}`);
  } catch (err) {
    console.warn(`Could not immediately remove ${srcMod}:`, err.message);
  }
});

console.log('All route directories successfully consolidated into (main)!');
