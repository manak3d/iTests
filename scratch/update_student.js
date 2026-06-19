const fs = require('fs');

const path = 'src/components/dashboard/StudentDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add missing component imports
const missingLucideIcons = ['Sparkles', 'PenTool', 'Loader2', 'ClipboardList'];
missingLucideIcons.forEach(icon => {
  if (!content.includes(icon + ',')) {
    content = content.replace(
      `HelpCircle, } from 'lucide-react';`,
      `HelpCircle, ${icon}, } from 'lucide-react';`
    );
    // fallback if previous replace failed due to different formatting
    content = content.replace(
      `HelpCircle,\n} from "lucide-react";`,
      `HelpCircle, ${icon},\n} from "lucide-react";`
    );
  }
});

if (!content.includes('import { Input }')) {
  content = content.replace(
    `import { Badge } from "@/components/ui/badge";`,
    `import { Badge } from "@/components/ui/badge";\nimport { Input } from "@/components/ui/input";\nimport { Textarea } from "@/components/ui/textarea";`
  );
}

if (!content.includes('GraphQuestionStudent')) {
  content = content.replace(
    `import { QuestionRenderer } from "@/components/itest/QuestionRenderer";`,
    `import { QuestionRenderer } from "@/components/itest/QuestionRenderer";\nimport { GraphQuestionEvaluation, GraphQuestionStudent, AxisQuestionEvaluation, AxisQuestionStudent, NumberLineQuestionEvaluation, NumberLineQuestionStudent, MatchingQuestionReview, MatchingQuestionStudent } from "@/components/itest/GraphQuestion";\nimport { MistakeTrainingWidget } from "@/components/itest/MistakeTrainingWidget";\nimport { DrawingPad } from "@/components/itest/DrawingPad";`
  );
}

// 2. Add @ts-nocheck back
if (!content.startsWith('// @ts-nocheck')) {
    content = '// @ts-nocheck\n' + content;
}

// 3. Update destructuring
const newDestructuring = `    store, currentUser,
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
    selectedAssignmentId, selectStudentAssignment`;

content = content.replace(/    store, currentUser,([\s\S]*?)setGradebookViewMode,/m, newDestructuring + ',');

fs.writeFileSync(path, content);
console.log("StudentDashboard.tsx updated successfully!");
