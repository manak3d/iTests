const fs = require('fs');

// Fix page.tsx
let pagePath = 'src/app/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

const oldPagePropsRegex = /const studentProps = \{[\s\S]*?selectStudentAssignment\n\s*\};/;

const newPageProps = `const studentProps = {
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
    };`;

pageContent = pageContent.replace(oldPagePropsRegex, newPageProps);
fs.writeFileSync(pagePath, pageContent);

// Fix StudentDashboard.tsx
let dashboardPath = 'src/components/dashboard/StudentDashboard.tsx';
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

const oldDashboardDestructuringRegex = /store, currentUser,[\s\S]*?selectedAssignmentId, selectStudentAssignment/m;

const newDashboardDestructuring = `store, currentUser,
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
    selectedAssignmentId, selectStudentAssignment`;

dashboardContent = dashboardContent.replace(oldDashboardDestructuringRegex, newDashboardDestructuring);
fs.writeFileSync(dashboardPath, dashboardContent);

console.log("Cleanup successful.");
