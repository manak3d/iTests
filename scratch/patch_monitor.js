const fs = require('fs');
let code = fs.readFileSync('src/components/itest/LiveMonitor.tsx', 'utf8');

// Replacements in assignment finding
code = code.replace(/a\.id === assignmentId/g, "a?.id === assignmentId");
code = code.replace(/c\.id === assignment\.classId/g, "c?.id === assignment?.classId");

// Replacements in student filter
code = code.replace(/u\.role === 'student'/g, "u?.role === 'student'");
code = code.replace(/assignment\.studentIds\.includes\(u\.id\)/g, "assignment?.studentIds?.includes(u?.id)");
code = code.replace(/u\.classId === assignment\.classId/g, "u?.classId === assignment?.classId");

// Replacements in submission filter
code = code.replace(/s\.assignmentId === assignmentId/g, "s?.assignmentId === assignmentId");
code = code.replace(/s\.submittedAt/g, "s?.submittedAt");
code = code.replace(/s\.startedAt/g, "s?.startedAt");
code = code.replace(/s\.tabFocusLostCount/g, "s?.tabFocusLostCount");
code = code.replace(/s\.studentId === student\.id/g, "s?.studentId === student?.id");

// Replacements in student map
code = code.replace(/key=\{student\.id\}/g, "key={student?.id || Math.random().toString()}");
code = code.replace(/\{student\.name\}/g, "{student?.name || \"?\"}");
code = code.replace(/\{student\.username\}/g, "{student?.username || \"?\"}");
code = code.replace(/expandedStudentId === student\.id/g, "expandedStudentId === student?.id");

// Replacements in questions map
code = code.replace(/assignment\.questions\?\.map/g, "(assignment?.questions || [])?.map");
code = code.replace(/q\.id/g, "q?.id");
code = code.replace(/q\.type/g, "q?.type");
code = code.replace(/q\.options/g, "q?.options");
code = code.replace(/q\.text/g, "q?.text");

fs.writeFileSync('src/components/itest/LiveMonitor.tsx', code);
console.log("Patched LiveMonitor.tsx");
