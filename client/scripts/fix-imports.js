const fs = require('fs');
const path = require('path');

const mainDir = path.join(__dirname, '..', 'src', 'app', '(main)');

function fixImportsInDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixImportsInDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Replace relative imports to client/components
      // e.g. from "../../../components/..." or "../../../../components/..."
      const updated = content.replace(/(from\s+["'])(\.\.\/)+components\/([^"']+)(["'])/g, (match, p1, p2, p3, p4) => {
        changed = true;
        // Check if file exists in client/components/ or client/src/components/
        const pathInClientComponents = path.join(__dirname, '..', '..', 'components', p3);
        const pathInSrcComponents = path.join(__dirname, '..', 'components', p3);

        if (fs.existsSync(pathInClientComponents) || fs.existsSync(pathInClientComponents + '.tsx') || fs.existsSync(pathInClientComponents + '.jsx') || fs.existsSync(pathInClientComponents + '.js') || fs.existsSync(pathInClientComponents + '.ts')) {
          return `${p1}@components/${p3}${p4}`;
        }
        return `${p1}@/components/${p3}${p4}`;
      });

      if (changed) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log(`Fixed imports in: ${fullPath}`);
      }
    }
  }
}

fixImportsInDir(mainDir);
console.log('Finished updating import paths!');
