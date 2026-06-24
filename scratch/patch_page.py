
file_path = "src/app/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add imports
imports = """import { LiveMonitor } from '@/components/itest/LiveMonitor';
import { TeacherHub } from '@/components/dashboard/TeacherHub';
import { AiPedagogDashboard } from '@/components/dashboard/AiPedagogDashboard';"""

content = content.replace("import { LiveMonitor } from '@/components/itest/LiveMonitor';", imports)

# 2. Change state
old_state = "const [teacherMode, setTeacherMode] = useState<'portal' | 'itest' | 'ai-pedagog'>('portal');"
new_state = "const [teacherMode, setTeacherMode] = useState<'hub' | 'itest' | 'ai'>('hub');"
content = content.replace(old_state, new_state)

# 3. Inject routing logic BEFORE `if (currentUser.role === 'admin') {`
routing_logic = """
  if (currentUser.role === 'admin' || currentUser.role === 'teacher') {
    if (teacherMode === 'hub') {
      return (
        <TeacherHub 
          userName={currentUser.name} 
          onSelectMode={setTeacherMode} 
          onLogout={() => store.logout()} 
        />
      );
    }
    
    if (teacherMode === 'ai') {
      return (
        <AiPedagogDashboard 
          userName={currentUser.name}
          onBack={() => setTeacherMode('hub')}
        />
      );
    }
  }

  if (currentUser.role === 'admin') {"""

content = content.replace("  if (currentUser.role === 'admin') {", routing_logic, 1)

# 4. Remove the old portal view calls inside the teacher block
# We'll just suppress them by changing their conditions to something impossible, or replace them.
# The old render used:
# {teacherMode === 'portal' && renderPortalView()}
# {teacherMode === 'ai-pedagog' && renderAiPedagogView()}

old_render = """        {teacherMode === 'portal' && renderPortalView()}

        {teacherMode === 'ai-pedagog' && renderAiPedagogView()}

        {teacherMode === 'itest' && ("""
new_render = """        {teacherMode === 'itest' && ("""
content = content.replace(old_render, new_render)

# We should also replace showPortalLink in the Navbar
content = content.replace("showPortalLink={teacherMode !== 'portal'}", "showPortalLink={true}")
content = content.replace("onPortalClick={() => {\n            setTeacherMode('portal');", "onPortalClick={() => {\n            setTeacherMode('hub');")


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched successfully")
