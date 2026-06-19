const fs = require('fs');

const pagePath = 'src/app/page.tsx';
const content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split('\n');

const startLine = 3138;
const endLine = 4660; // where feedback tab ends, check it carefully.

const adminLines = lines.slice(startLine - 1, endLine);

const adminPropsStr = `
    const adminProps = {
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
      targetClassId, setTargetClassId, setIsAddingStudent,
      customCredits, setCustomCredits,
      toast,
      adminViewingAssignmentId, setAdminViewingAssignmentId,
      viewingSubmission, setViewingSubmission,
      downloadAllSubmissionsZip,
      setEditingStudentId, setNewPasswordVal,
      evalScores, setEvalScores,
      evalGrade, setEvalGrade,
      evalFeedback, setEvalFeedback,
      isGradeManuallySet, setIsGradeManuallySet,
      aiInstructions, setAiInstructions,
      isAiGrading, handleAiGrade,
      formatDateTime,
      setDeleteFeedbackId,
      editingStudentId, newPasswordVal
    };
`;

const imports = `import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LayoutDashboard, School, Users, Crown, ChevronRight, Check, CheckCircle2, UserPlus, Upload, Trash2, Edit3, Settings, GraduationCap, ClipboardList, MessageSquare, Activity, ChevronUp, ChevronDown, Sparkles, Printer, PenTool, Loader2 } from 'lucide-react';
import { GradePicker } from '@/components/itest/GradePicker';
import { GraphQuestionEvaluation, AxisQuestionEvaluation, NumberLineQuestionEvaluation } from '@/components/itest/GraphQuestion';
import { parseClozeText } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
`;

const componentContent = `
${imports}

export function AdminDashboard(props: any) {
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
    targetClassId, setTargetClassId, setIsAddingStudent,
    customCredits, setCustomCredits,
    toast,
    adminViewingAssignmentId, setAdminViewingAssignmentId,
    viewingSubmission, setViewingSubmission,
    downloadAllSubmissionsZip,
    setEditingStudentId, setNewPasswordVal,
    evalScores, setEvalScores,
    evalGrade, setEvalGrade,
    evalFeedback, setEvalFeedback,
    isGradeManuallySet, setIsGradeManuallySet,
    aiInstructions, setAiInstructions,
    isAiGrading, handleAiGrade,
    formatDateTime,
    setDeleteFeedbackId,
    editingStudentId, newPasswordVal
  } = props;

  return (
    <>
${adminLines.join('\n')}
    </>
  );
}
`;

fs.writeFileSync('src/components/dashboard/AdminDashboard.tsx', componentContent);

// Replace lines with AdminDashboard Component in place
lines.splice(startLine - 1, adminLines.length, '          <AdminDashboard {...adminProps} />');

// Find return ( and prepend adminPropsStr
const returnIndex = lines.findIndex((l, i) => i > 3100 && l.includes('return (') && l.includes(';'));
// Wait, return ( is at line 3113!
const returnLine = lines.findIndex((l, i) => i > 3100 && i < 3120 && l.includes('return ('));
if (returnLine !== -1) {
    lines.splice(returnLine, 0, adminPropsStr);
}

// Also add import for AdminDashboard to page.tsx
lines.unshift(`import { AdminDashboard } from '@/components/dashboard/AdminDashboard';`);

fs.writeFileSync('src/app/page.tsx', lines.join('\n'));

console.log("Extraction done v2");
