const fs = require('fs');

const path = 'src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldPropsRegex = /const studentProps = \{[\s\S]*?setGradebookViewMode\n\s*\};/;

const newProps = `const studentProps = {
      store, currentUser,
      selectedSubject, setSelectedSubject,
      viewingAssignment, setViewingAssignment,
      studentAssignments, setStudentAssignments,
      activeQuestionIndex, setActiveQuestionIndex,
      answers, setAnswers,
      isSubmitting, setIsSubmitting,
      showResults, setShowResults,
      submissionResult, setSubmissionResult,
      formatDateTime,
      handleAnswerChange, handleCheck,
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

content = content.replace(oldPropsRegex, newProps);
fs.writeFileSync(path, content);
console.log("page.tsx studentProps updated successfully!");
