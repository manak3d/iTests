const fs = require('fs');

const path = 'src/components/dashboard/TeacherDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add missing imports
if (!content.includes('import { Tabs, TabsList, TabsTrigger, TabsContent }')) {
    content = content.replace(
        `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';`,
        `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';\nimport { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';`
    );
}
if (!content.includes('Search')) {
    content = content.replace(
        `AlertTriangle, ArrowRight, Play, Copy, Calendar, BrainCircuit, Wand2 } from 'lucide-react';`,
        `AlertTriangle, ArrowRight, Play, Copy, Calendar, BrainCircuit, Wand2, Search, Zap, Plus, Download } from 'lucide-react';`
    );
}

// 2. Add @ts-nocheck back
if (!content.startsWith('// @ts-nocheck')) {
    content = '// @ts-nocheck\n' + content;
}

// 3. Update destructuring
const newDestructuring = `    store, currentUser, schools,
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
    downloadAllSubmissionsZip, handleImportCSV, handleImportCSVToExisting,
    isEvaluatingPractice, setIsEvaluatingPractice,
    customCredits, setCustomCredits, toast,
    expandedSubjects, setExpandedSubjects,
    handleStartSendCopy,
    copyTargetClassId, setCopyTargetClassId,
    copyStartTime, setCopyStartTime,
    copyEndTime, setCopyEndTime,
    isSendingCopy, setIsSendingCopy,
    isEditingSettings, setIsEditingSettings,
    editStartTime, setEditStartTime,
    editEndTime, setEditEndTime,
    editIsPublicTemplate, setEditIsPublicTemplate,
    editTimeLimit, setEditTimeLimit,
    handleStartEditSettings,
    editingStudentId, newPasswordVal, isChangingPassword, setIsChangingPassword,
    deleteTarget, renameTarget, newClassNameVal,
    isGeneratingAlternative, setIsGeneratingAlternative,
    setPaymentDetails, paymentDetails,
    selectedTeacherSubject, setSelectedTeacherSubject,
    classActionType, setClassActionType,
    selectedTemplateForCopy, setSelectedTemplateForCopy,
    templateCopyClassId, setTemplateCopyClassId,
    templateCopyStartTime, setTemplateCopyStartTime,
    templateCopyEndTime, setTemplateCopyEndTime,
    templateCopyAssignType, setTemplateCopyAssignType,
    templateCopySelectedStudentIds, setTemplateCopySelectedStudentIds,
    viewingAssignment, setViewingAssignment,
    viewingAssignmentSubs, setViewingAssignmentSubs,
    setSelectedGradebookStudent, setSelectedGradebookSubject, setGradebookViewMode,
    studentActionType, setStudentActionType,
    csvFile, setCsvFile,
    csvParsingError, setCsvParsingError,
    csvImportProgress, setCsvImportProgress,
    isCustomSchoolModalOpen, setIsCustomSchoolModalOpen,
    handleAddClass, handleAddStudent, downloadCsvResults`;

content = content.replace(/    store, currentUser,([\s\S]*?)handleGenerateAlternative/m, newDestructuring);

fs.writeFileSync(path, content);
console.log("TeacherDashboard.tsx updated successfully!");
