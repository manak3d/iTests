const fs = require('fs');
const path = 'src/components/dashboard/StudentDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/return null;[\s\n]*$/, '');

fs.writeFileSync(path, content);
console.log("Removed trailing return null;");
