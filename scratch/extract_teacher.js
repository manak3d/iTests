const fs = require('fs');

const pagePath = 'src/app/page.tsx';
const content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split('\n');

const startLine = 3151; // where `if (currentUser.role === 'teacher')` starts
const endLine = 5959;   // the closing brace for that block

const teacherLines = lines.slice(startLine, endLine - 1);

const teacherPropsStr = `
    const teacherProps = {
      store, currentUser,
      selectedClassId, setSelectedClassId,
      activeTab, setActiveTab,
      templateSearchQuery, setTemplateSearchQuery,
      templateSelectedSubject, setTemplateSelectedSubject,
      isUpgradeModalOpen, setIsUpgradeModalOpen,
      isProfileModalOpen, setIsProfileModalOpen,
      isAddingClass, setIsAddingClass,
      newClassName, setNewClassName,
      isAddingStudent, setIsAddingStudent,
      newStudentName, setNewStudentName,
      newStudentUsername, setNewStudentUsername,
      newStudentPassword, setNewStudentPassword,
      selectedExistingClassId, setSelectedExistingClassId,
      selectedExistingStudentId, setSelectedExistingStudentId,
      classSearch, setClassSearch,
      studentSearch, setStudentSearch,
      isImportingCSV, setIsImportingCSV,
      csvClassName, setCsvClassName,
      isCreatingAssignment, setIsCreatingAssignment,
      viewingSubmission, setViewingSubmission,
      evalScores, setEvalScores,
      evalGrade, setEvalGrade,
      evalFeedback, setEvalFeedback,
      isGradeManuallySet, setIsGradeManuallySet,
      aiInstructions, setAiInstructions,
      isAiGrading, setIsAiGrading,
      handleAiGrade,
      setEditingStudentId, setNewPasswordVal,
      setRenameTarget, setNewClassNameVal,
      setDeleteTarget,
      targetClassId, setTargetClassId,
      formatDateTime,
      renderProfileModal, renderGradebookDialog, renderTemplateCopyDialog,
      downloadAllSubmissionsZip, handleCSVImport,
      isEvaluatingPractice, setIsEvaluatingPractice,
      handleAiGradePractice, customCredits, setCustomCredits, toast,
      expandedSubjects, setExpandedSubjects,
      handleCopyTemplate,
      templateTargetId, setTemplateTargetId,
      copyTargetClassId, setCopyTargetClassId,
      copyStartTime, setCopyStartTime,
      copyEndTime, setCopyEndTime,
      isSendingCopy, setIsSendingCopy,
      isEditingSettings, setIsEditingSettings,
      editStartTime, setEditStartTime,
      editEndTime, setEditEndTime,
      editIsPublicTemplate, setEditIsPublicTemplate,
      editTimeLimit, setEditTimeLimit,
      handleSaveSettings,
      editingStudentId, newPasswordVal, isChangingPassword, setIsChangingPassword,
      deleteTarget, renameTarget, newClassNameVal,
      isGeneratingAlternative, setIsGeneratingAlternative,
      handleGenerateAlternative
    };
`;

const imports = `// @ts-nocheck
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutDashboard, School, Users, Crown, ChevronRight, Check, CheckCircle2, UserPlus, Upload, Trash2, Edit3, Settings, GraduationCap, ClipboardList, MessageSquare, Activity, ChevronUp, ChevronDown, Sparkles, Printer, PenTool, Loader2, BookOpen, AlertTriangle, ArrowRight, Play, Copy, Calendar, BrainCircuit, Wand2 } from 'lucide-react';
import { GradePicker } from '@/components/itest/GradePicker';
import { GraphQuestionEvaluation, AxisQuestionEvaluation, NumberLineQuestionEvaluation } from '@/components/itest/GraphQuestion';
import { parseClozeText } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Navbar } from '@/components/itest/Navbar';
`;

const componentContent = `
${imports}

export function TeacherDashboard(props: any) {
  const {
    store, currentUser,
    selectedClassId, setSelectedClassId,
    activeTab, setActiveTab,
    templateSearchQuery, setTemplateSearchQuery,
    templateSelectedSubject, setTemplateSelectedSubject,
    isUpgradeModalOpen, setIsUpgradeModalOpen,
    isProfileModalOpen, setIsProfileModalOpen,
    isAddingClass, setIsAddingClass,
    newClassName, setNewClassName,
    isAddingStudent, setIsAddingStudent,
    newStudentName, setNewStudentName,
    newStudentUsername, setNewStudentUsername,
    newStudentPassword, setNewStudentPassword,
    selectedExistingClassId, setSelectedExistingClassId,
    selectedExistingStudentId, setSelectedExistingStudentId,
    classSearch, setClassSearch,
    studentSearch, setStudentSearch,
    isImportingCSV, setIsImportingCSV,
    csvClassName, setCsvClassName,
    isCreatingAssignment, setIsCreatingAssignment,
    viewingSubmission, setViewingSubmission,
    evalScores, setEvalScores,
    evalGrade, setEvalGrade,
    evalFeedback, setEvalFeedback,
    isGradeManuallySet, setIsGradeManuallySet,
    aiInstructions, setAiInstructions,
    isAiGrading, setIsAiGrading,
    handleAiGrade,
    setEditingStudentId, setNewPasswordVal,
    setRenameTarget, setNewClassNameVal,
    setDeleteTarget,
    targetClassId, setTargetClassId,
    formatDateTime,
    renderProfileModal, renderGradebookDialog, renderTemplateCopyDialog,
    downloadAllSubmissionsZip, handleCSVImport,
    isEvaluatingPractice, setIsEvaluatingPractice,
    handleAiGradePractice, customCredits, setCustomCredits, toast,
    expandedSubjects, setExpandedSubjects,
    handleCopyTemplate,
    templateTargetId, setTemplateTargetId,
    copyTargetClassId, setCopyTargetClassId,
    copyStartTime, setCopyStartTime,
    copyEndTime, setCopyEndTime,
    isSendingCopy, setIsSendingCopy,
    isEditingSettings, setIsEditingSettings,
    editStartTime, setEditStartTime,
    editEndTime, setEditEndTime,
    editIsPublicTemplate, setEditIsPublicTemplate,
    editTimeLimit, setEditTimeLimit,
    handleSaveSettings,
    editingStudentId, newPasswordVal, isChangingPassword, setIsChangingPassword,
    deleteTarget, renameTarget, newClassNameVal,
    isGeneratingAlternative, setIsGeneratingAlternative,
    handleGenerateAlternative
  } = props;

${teacherLines.join('\n')}
}
`;

fs.writeFileSync('src/components/dashboard/TeacherDashboard.tsx', componentContent);

lines.splice(startLine, (endLine - startLine), 
    teacherPropsStr + '\n    return <TeacherDashboard {...teacherProps} />;\n  }');

lines.unshift(`import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard';`);

fs.writeFileSync('src/app/page.tsx', lines.join('\n'));

console.log("TeacherDashboard extraction script generated and executed");
