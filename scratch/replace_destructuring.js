const fs = require('fs');
const path = 'src/components/dashboard/StudentDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the start and end of the destructuring block
const startMatch = content.indexOf('const {');
const endMatch = content.indexOf('} = props;', startMatch);

if (startMatch !== -1 && endMatch !== -1) {
  const newDestructuring = `  const {
    store, currentUser,
    selectedSubject, setSelectedSubject,
    viewingAssignment, setViewingAssignment,
    formatDateTime,
    renderProfileModal, renderGradebookDialog,
    setSelectedGradebookStudent, setSelectedGradebookSubject, setGradebookViewMode,
    practiceLoading, practiceErrors, practiceAiContent, practiceAnswers, practiceChecked,
    setPracticeAnswers, setPracticeChecked, handleLoadAiPractice,
    renderRichText, studentAnswers, setStudentAnswers,
    setQuestionDrawings, questionDrawingOpen, setQuestionDrawingOpen, questionDrawings,
    setMainWorkDrawing, mainWorkDrawing,
    handlePracticeSubmit, isEvaluatingPractice,
    selectedAssignmentId, selectStudentAssignment
  } = props;`;

  content = content.substring(0, startMatch) + newDestructuring + content.substring(endMatch + 10);
  fs.writeFileSync(path, content);
  console.log("Successfully replaced destructuring block.");
} else {
  console.log("Could not find destructuring block.");
}
