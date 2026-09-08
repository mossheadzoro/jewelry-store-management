const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'client', 'prisma', 'schema.prisma');
const content = fs.readFileSync(schemaPath, 'utf8');

// Parse enums
const enums = [];
const enumRegex = /enum\s+(\w+)\s+\{([^}]+)\}/g;
let match;
while ((match = enumRegex.exec(content)) !== null) {
  const name = match[1];
  const values = match[2]
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('//'));
  enums.push({ name, values });
}

// Parse models
const models = [];
// Better regex for multiline model definition
const modelRegex = /model\s+(\w+)\s+\{([\s\S]*?)\n\}/g;
while ((match = modelRegex.exec(content)) !== null) {
  const name = match[1];
  const body = match[2];
  const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  const fields = [];
  const attributes = [];
  
  for (const line of lines) {
    if (line.startsWith('@@')) {
      attributes.push(line);
    } else {
      const parts = line.split(/\s+/);
      const fieldName = parts[0];
      const fieldType = parts[1];
      const fieldModifiers = parts.slice(2).join(' ');
      fields.push({ fieldName, fieldType, fieldModifiers });
    }
  }
  models.push({ name, fields, attributes });
}

console.log('=== PRISMA SCHEMA ANALYSIS ===');
console.log(`Total Models: ${models.length}`);
console.log(`Total Enums: ${enums.length}`);
console.log('\n--- ALL ENUMS ---');
enums.forEach(e => console.log(`${e.name}: [${e.values.join(', ')}]`));

console.log('\n--- ALL MODELS & FIELD COUNTS ---');
models.forEach((m, idx) => {
  console.log(`${(idx + 1).toString().padStart(3, ' ')}. ${m.name.padEnd(30, ' ')} (${m.fields.length} fields)`);
});

fs.writeFileSync(path.join(__dirname, 'parsed_schema.json'), JSON.stringify({ models, enums }, null, 2));
console.log('\nSaved full parsed schema to scratch/parsed_schema.json');
