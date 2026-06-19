const fs = require('fs');

const path = 'src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldPropsRegex = /const adminProps = \{[\s\S]*?toast,/m;

const newProps = `const adminProps = {
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
  fs.writeFileSync(path, content);
  console.log("page.tsx adminProps updated successfully!");
} else {
  console.log("Could not match old adminProps regex");
}
