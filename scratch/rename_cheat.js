const fs = require('fs');
const path = 'src/components/dashboard/StudentDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace cheatViolations with tabFocusLostCount
content = content.replace(/cheatViolations/g, 'tabFocusLostCount');
content = content.replace(/setCheatViolations/g, 'setTabFocusLostCount');

fs.writeFileSync(path, content);
console.log("Renamed cheatViolations to tabFocusLostCount in StudentDashboard.tsx");
