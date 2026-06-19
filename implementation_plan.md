# Implementace Teacher Hubu (Rozcestník po přihlášení)

Úkolem je vytvořit novou úvodní obrazovku pro učitele a administrátory, která se zobrazí ihned po přihlášení. Uživatel si zde vybere, zda chce pracovat s "iTest Cloud" (správa testů a tříd) nebo s "AI Pedagog" (nový AI asistent pro učitele).

## Proposed Changes

### 1. `src/components/dashboard/TeacherHub.tsx`
- Vytvoření nové komponenty, která bude věrně kopírovat design ze screenshotu.
- Bude obsahovat horní lištu s prémiovým štítkem a stavem kreditů (z předaného uživatele).
- Bude obsahovat dvě hlavní karty s volbou: **iTest Cloud** a **AI Pedagog**.
- Po kliknutí na jednu z karet zavolá callback `onSelectMode('itest' | 'ai')`.

### 2. `src/app/page.tsx`
- Přidání lokálního stavu `const [teacherMode, setTeacherMode] = useState<'hub' | 'itest' | 'ai'>('hub');`
- Místo přímého vykreslení `<TeacherDashboard />` se nejdříve vykreslí `<TeacherHub onSelectMode={setTeacherMode} />`.
- Pokud je `teacherMode === 'itest'`, vykreslí se stávající `<TeacherDashboard />`.
- Pokud je `teacherMode === 'ai'`, vykreslí se (prozatím) nová placeholder komponenta pro AI pedagoga.

### 3. `src/components/dashboard/AiPedagogDashboard.tsx`
- Vytvoření prázdného rozhraní pro budoucího AI asistenta s možností vrátit se zpět na rozcestník (`TeacherHub`).

## User Review Required
> [!IMPORTANT]
> Souhlasíš s tímto postupem, že se z hlavní stránky (`page.tsx`) udělá přepínač, který učiteli nejdřív ukáže tento rozcestník, a až po kliknutí ho pustí do vybraného nástroje? Chceš rovnou, abych k AI Pedagogovi připravil nějaké základní UI (chatové okno)?
