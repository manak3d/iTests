const fs = require('fs');

const path = 'src/components/dashboard/TeacherDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldDialogRegex = /<Dialog open=\{isAddingStudent\} onOpenChange=[\s\S]*?<\/DialogContent>\n\s*<\/Dialog>/;

const newDialog = `<AddStudentDialog
            isAddingStudent={isAddingStudent}
            setIsAddingStudent={setIsAddingStudent}
            studentActionType={studentActionType}
            setStudentActionType={setStudentActionType}
            newStudentName={newStudentName}
            setNewStudentName={setNewStudentName}
            newStudentUsername={newStudentUsername}
            setNewStudentUsername={setNewStudentUsername}
            newStudentPassword={newStudentPassword}
            setNewStudentPassword={setNewStudentPassword}
            targetClassId={targetClassId}
            setTargetClassId={setTargetClassId}
            selectedClassId={selectedClassId}
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
            selectedExistingStudentId={selectedExistingStudentId}
            setSelectedExistingStudentId={setSelectedExistingStudentId}
            csvFile={csvFile}
            setCsvFile={setCsvFile}
            csvParsingError={csvParsingError}
            setCsvParsingError={setCsvParsingError}
            csvImportProgress={csvImportProgress}
            setCsvImportProgress={setCsvImportProgress}
            handleAddStudent={handleAddStudent}
            handleImportCSVToExisting={handleImportCSVToExisting}
            store={store}
            schools={schools}
          />`;

if (content.match(oldDialogRegex)) {
  content = content.replace(oldDialogRegex, newDialog);
  content = `import { AddStudentDialog } from '@/components/dashboard/AddStudentDialog';\n` + content;
  fs.writeFileSync(path, content);
  console.log("TeacherDashboard.tsx updated successfully!");
} else {
  console.log("Could not find the Dialog to replace in TeacherDashboard.tsx");
}
