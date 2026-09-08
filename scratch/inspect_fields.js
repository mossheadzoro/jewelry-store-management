const fs = require('fs');
const { models, enums } = JSON.parse(fs.readFileSync('scratch/parsed_schema.json', 'utf8'));

console.log('=== ENUMS LIST ===');
enums.forEach(e => {
  console.log(`${e.name} (${e.values.length} values): ${e.values.join(' | ')}`);
});

console.log('\n=== KEY MODELS AND STATUS/DATE/FLAG FIELDS ===');
models.forEach(m => {
  const statusFields = m.fields.filter(f => 
    f.fieldName.toLowerCase().includes('status') ||
    f.fieldName.toLowerCase().includes('date') ||
    f.fieldName.toLowerCase().includes('expired') ||
    f.fieldName.toLowerCase().includes('due') ||
    f.fieldName.toLowerCase().includes('balance') ||
    f.fieldName.toLowerCase().includes('lock') ||
    f.fieldName.toLowerCase().includes('pending') ||
    f.fieldName.toLowerCase().includes('alert')
  );
  if (statusFields.length > 0) {
    console.log(`\nModel [${m.name}]:`);
    statusFields.forEach(f => console.log(`  - ${f.fieldName}: ${f.fieldType} (${f.fieldModifiers || 'none'})`));
  }
});
