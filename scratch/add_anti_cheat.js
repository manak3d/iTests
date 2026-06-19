const fs = require('fs');
const path = 'src/components/dashboard/StudentDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add the Anti-Cheat hooks
const hooksInsertion = `
  const [cheatViolations, setCheatViolations] = React.useState(0);
  const [showCheatWarning, setShowCheatWarning] = React.useState(false);
  const cheatTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!selectedAssignmentId || showResults) return;

    const handleCheat = () => {
      setCheatViolations(prev => prev + 1);
      setShowCheatWarning(true);
      if (cheatTimeoutRef.current) clearTimeout(cheatTimeoutRef.current);
      cheatTimeoutRef.current = setTimeout(() => {
        setShowCheatWarning(false);
      }, 5000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleCheat();
    };

    const handleBlur = () => {
      handleCheat();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      if (cheatTimeoutRef.current) clearTimeout(cheatTimeoutRef.current);
    };
  }, [selectedAssignmentId, showResults]);

  React.useEffect(() => {
    if (selectedAssignmentId && !showResults) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else if (!selectedAssignmentId) {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [selectedAssignmentId, showResults]);
`;

const propsEndMatch = content.indexOf('} = props;');
if (propsEndMatch !== -1) {
  content = content.slice(0, propsEndMatch + 10) + hooksInsertion + content.slice(propsEndMatch + 10);
}

// Add the Overlay
const overlayInsertion = `
      {showCheatWarning && (
        <div className="fixed inset-0 z-[9999] bg-red-600 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <AlertTriangle className="w-32 h-32 text-white mb-6 animate-pulse" />
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Opuštění testu zaznamenáno!</h1>
          <p className="text-2xl text-red-100 font-medium max-w-2xl">
            Systém detekoval opuštění okna prohlížeče. Toto chování je zaznamenáno a bude předáno učiteli jako možné porušení pravidel zkoušky.
          </p>
          <div className="mt-8 px-6 py-3 bg-black/20 rounded-full text-red-50 font-bold">
            Vraťte se okamžitě k testu. Zpráva zmizí za chvíli.
          </div>
        </div>
      )}
`;

content = content.replace(/className="min-h-screen flex flex-col bg-background">/, 'className="min-h-screen flex flex-col bg-background">' + overlayInsertion);

// Pass cheatViolations to submitWork
content = content.replace(/store\.submitWork\(\{\s*assignmentId:\s*selectedAssignmentId,\s*studentId:\s*currentUser\.id,\s*answers:\s*studentAnswers,\s*questionDrawings,\s*mainWorkDrawing,/g, 
  'store.submitWork({ assignmentId: selectedAssignmentId, studentId: currentUser.id, answers: studentAnswers, questionDrawings, mainWorkDrawing, cheatViolations,');

// Also for handlePracticeSubmit just in case
content = content.replace(/handlePracticeSubmit\(\{[\s\S]*?mainWorkDrawing,\s*\}\)/g, (match) => {
  return match.replace(/mainWorkDrawing,\s*\}/, 'mainWorkDrawing, cheatViolations }');
});

fs.writeFileSync(path, content);
console.log("Anti-cheat added to StudentDashboard.tsx");
