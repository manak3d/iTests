const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/StudentDashboard.tsx', 'utf8');
content = content.replace('// @ts-nocheck', '');
fs.writeFileSync('src/components/dashboard/StudentDashboard.tsx', content);

let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');
pageContent = pageContent.replace(/studentAssignments, setStudentAssignments,[\s\S]*?handleAnswerChange, handleCheck,/, '');
fs.writeFileSync('src/app/page.tsx', pageContent);

console.log("Temporarily removed @ts-nocheck and removed bad props.");
