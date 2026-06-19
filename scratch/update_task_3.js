const fs = require('fs');
let task = fs.readFileSync('task.md', 'utf8');

task = task.replace(/- \[ \] 3\.1 Anti-Cheat \(Fullscreen zámek\)/g, '- [x] 3.1 Anti-Cheat (Fullscreen zámek)');

if (!task.includes('- [x] 3.1 Anti-Cheat (Fullscreen zámek)')) {
  task += `\n- [x] 3.1 Anti-Cheat (Fullscreen zámek a monitoring opuštění okna)`;
}

fs.writeFileSync('task.md', task);
console.log("Task updated");
