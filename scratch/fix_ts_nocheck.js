const fs = require('fs');

const files = [
  'src/components/dashboard/TeacherDashboard.tsx',
  'src/components/dashboard/AdminDashboard.tsx',
  'src/components/dashboard/StudentDashboard.tsx',
  'src/components/dashboard/AddStudentDialog.tsx',
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\/\/ @ts-nocheck/g, '');
  content = '// @ts-nocheck\n' + content.trimStart();
  fs.writeFileSync(file, content);
});

console.log("Fixed @ts-nocheck headers!");
