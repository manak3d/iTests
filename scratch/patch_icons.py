import os

files = {
    "src/components/itest/LiveMonitor.tsx": {
        "TriangleAlert": "AlertTriangle",
        "CircleCheck": "CheckCircle2",
        "CircleHelp": "HelpCircle",
        "<TriangleAlert": "<AlertTriangle",
        "<CircleCheck": "<CheckCircle2",
        "<CircleHelp": "<HelpCircle"
    },
    "src/components/dashboard/AiPedagogDashboard.tsx": {
        "LoaderCircle": "Loader2",
        "<LoaderCircle": "<Loader2"
    },
    "src/components/itest/AssignmentCreator.tsx": {
        "ChartColumnIncreasing": "BarChart3",
        "<ChartColumnIncreasing": "<BarChart3"
    }
}

for file_path, replacements in files.items():
    if not os.path.exists(file_path):
        print(f"File {file_path} not found.")
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Patched {file_path}")
