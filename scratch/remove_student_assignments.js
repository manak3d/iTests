const fs = require('fs');
const path = 'src/components/dashboard/StudentDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/studentAssignments, setStudentAssignments,\n?\s*/g, '');

fs.writeFileSync(path, content);
console.log("Removed studentAssignments duplicate destructuring.");
