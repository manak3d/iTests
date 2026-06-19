const fs = require('fs');

const pagePath = 'src/app/page.tsx';
const content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split('\n');

const startLine = 3230; // `if (currentUser.role === 'student')`
const endLine = lines.length - 2; // the closing brace of the main function

const studentLines = lines.slice(startLine, endLine);

const studentPropsStr = `
    const studentProps = {
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
      setSelectedGradebookStudent, setSelectedGradebookSubject, setGradebookViewMode
    };
`;

const imports = `// @ts-nocheck
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, BookOpen, ChevronRight, AlertTriangle, ArrowLeft, Send, Play, CheckCircle2, Trophy, Clock, XCircle, TrendingUp, HelpCircle, Activity, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Navbar } from '@/components/itest/Navbar';
import { QuestionRenderer } from '@/components/itest/QuestionRenderer';
import { parseClozeText } from '@/lib/utils';
`;

const componentContent = `
${imports}

export function StudentDashboard(props: any) {
  const {
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
    setSelectedGradebookStudent, setSelectedGradebookSubject, setGradebookViewMode
  } = props;

${studentLines.join('\n')}
}
`;

fs.writeFileSync('src/components/dashboard/StudentDashboard.tsx', componentContent);

lines.splice(startLine, (endLine - startLine), 
    studentPropsStr + '\n    return <StudentDashboard {...studentProps} />;\n');

lines.unshift(`import { StudentDashboard } from '@/components/dashboard/StudentDashboard';`);

fs.writeFileSync('src/app/page.tsx', lines.join('\n'));

console.log("StudentDashboard extraction script generated and executed");
