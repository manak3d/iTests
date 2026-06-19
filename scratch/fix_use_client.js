const fs = require('fs');
const path = 'src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove all existing "use client";
content = content.replace(/"use client";\n?/g, '');

// Prepend "use client";
content = '"use client";\n' + content;

fs.writeFileSync(path, content);
console.log("Fixed use client directive.");
