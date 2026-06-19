const fs = require('fs');

const path = 'src/components/dashboard/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { AddStudentDialog }')) {
  content = `import { AddStudentDialog } from '@/components/dashboard/AddStudentDialog';\n` + content;
}

const oldPropsRegex = /export function AdminDashboard\(props: any\) \{\n  const \{\n[\s\S]*?toast,/m;

const newProps = `export function AdminDashboard(props: any) {
  const {
    adminTab, setAdminTab,
    schools, teachers, classrooms, students, assignments, submissions,
    store, currentUser,
    adminSearchFilter, setAdminSearchFilter,
    adminSchoolFilter, setAdminSchoolFilter,
    adminSortBy, setAdminSortBy,
    adminSortOrder, setAdminSortOrder,
    expandedSubjects, setExpandedSubjects,
    setRenameTarget, setNewClassNameVal,
    setDeleteTarget,
    targetClassId, setTargetClassId,
    
    // AddStudentDialog Props
    isAddingStudent, setIsAddingStudent,
    studentActionType, setStudentActionType,
    newStudentName, setNewStudentName,
    newStudentUsername, setNewStudentUsername,
    newStudentPassword, setNewStudentPassword,
    selectedExistingStudentId, setSelectedExistingStudentId,
    studentSearch, setStudentSearch,
    csvFile, setCsvFile,
    csvParsingError, setCsvParsingError,
    csvImportProgress, setCsvImportProgress,
    handleAddStudent, handleImportCSVToExisting,

    customCredits, setCustomCredits,
    toast,`;

if (content.match(oldPropsRegex)) {
  content = content.replace(oldPropsRegex, newProps);
}

// Append the component before {renderGradebookDialog()}
const dialogComponent = `          <AddStudentDialog
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
            selectedClassId={null} // Admins don't have a single active selectedClassId like teachers do
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
          />
          {renderGradebookDialog()}`;

content = content.replace('{renderGradebookDialog()}', dialogComponent);

fs.writeFileSync(path, content);
console.log("AdminDashboard.tsx updated successfully!");
