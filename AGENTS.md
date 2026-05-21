# 🤖 AI Agent Workspace & Hand-off Guide (`AGENTS.md`)

Vítejte v repozitáři projektu **iTest Cloud**! Tento dokument slouží jako hlavní rozcestník, architektonický přehled a předávací protokol pro všechny AI kódovací asistenty (např. Antigravity), kteří na tomto projektu pracují.

---

## 🛠️ Technologický Stoh (Tech Stack)

* **Framework**: [Next.js](https://nextjs.org/) (App Router, verze 15+)
* **Databáze**: [MongoDB](https://www.mongodb.com/) (připojení přes Mongoose)
* **Původní úložiště (Zálohy)**: [Firebase/Firestore](https://firebase.google.com/) (slouží pro kompatibilitu / offline režim)
* **Styling**: Tailwind CSS & Lucide React ikony
* **Autentizace**: JWT uložený v HttpOnly cookies + Bcrypt hashování hesel

---

## 📂 Architektura Databáze & Schémat

Všechna Mongoose schémata se nacházejí v adresáři `src/models/`.

### 1. `Teacher` (`src/models/Teacher.ts`)
* Reprezentuje jak běžné **Učitele**, tak **Administrátory**.
* **DŮLEŽITÉ**: Pevně zakódovaný administrátor byl odstraněn. Administrátor je nyní plnohodnotným dokumentem v kolekci `teachers` s polem `role: "admin"`.
* Vyžadovaná pole: `firstName`, `lastName`, `email`, `username`, `password` (hashované), `role` (buď `"teacher"` nebo `"admin"`).

### 2. `Student` (`src/models/Student.ts`)
* Reprezentuje žáky přiřazené do konkrétních tříd.
* Obsahuje pole `passwordPlain` sloužící pro zobrazení čitelného přístupového hesla učitelům a administrátorům.
* Vyžadovaná pole: `firstName`, `lastName`, `email`, `username`, `password` (hashované), `passwordPlain` (čitelné heslo), `classroomId`.

### 3. `Classroom` (`src/models/Classroom.ts`)
* Reprezentuje školní třídy (např. `"0.A"`).
* **DŮLEŽITÉ**: ID třídy může být libovolný řetězec (string), nikoli pouze Mongoose ObjectId. Backend proto nesmí používat `findById`, ale vždy `findOne({ _id: id })`.

---

## 🔌 Vlastní Agenti, Skilly & Workflows

Projekt obsahuje integrované skripty a workflow definované v adresáři `.agents/`:

* **`fbs-to-agy-export`** (`.agents/skills/fbs-to-agy-export/`):
  * Skill pro migraci a přípravu Firebase dat pro lokální MongoDB instanci v Antigravity.
* **`developing-genkit-js`** (`.agents/skills/developing-genkit-js/`):
  * Pokročilý vývoj AI agentů a flow pomocí Genkit v Node.js/TypeScript.

---

## 🌟 Aktuální Stav Implementovaných Funkcí

### 1. Sjednocené Přihlášení (Unified Login)
* Přihlašovací formulář v `src/app/page.tsx` má pouze **dvě záložky**: **"Učitel"** (Teacher) a **"Student"** (Žák).
* Tlačítko **"Admin"** bylo z přihlašovacího rozhraní zcela odstraněno.
* Administrátor se přihlašuje pod záložkou **"Učitel"** (credentials: `admin` / `admin123`). Backend zkontroluje roli v dokumentu `Teacher` a přihlásí ho jako admina.

### 2. Správa a Viditelnost Hesel Studentů
* Učitelé i administrátoři vidí přístupová hesla studentů v čitelné podobě přímo ve svých přehledech.
* Obojí rozhraní obsahují reaktivní dialog (modal) pro změnu hesla studenta, která se okamžitě bez reloadu synchronizuje s MongoDB a lokálním frontend storem.

### 3. Databázový Seeding (`/api/seed`)
* Endpoint `/api/seed` je plně opraven. Při spuštění automaticky vyčistí databázi a vytvoří:
  * Administrátora (`admin` / `admin123`)
  * Učitele (`testu` / `heslo`)
  * Třídu `"0.A"`
  * Dva testovací studenty (`tests1` / `123456` a `nina.sekerkova` / `QWERT135`)

---

## 🚀 Bezprostřední Roadmapa pro Další Agenty

Následující úkol byl definován uživatelem a je připraven k implementaci:

### 📍 Úkol: Zápis žáků přímo z Administrátorského dashboardu
* **Kontext**: Administrátor má ve svém dashboardu záložku **"Žáci"** (students), kde vidí seznam všech studentů.
* **Požadavek**: Umožnit administrátorovi přidávat nové studenty (buď jednotlivě, přiřazením stávajícího, nebo importem z CSV souboru) přímo z této záložky.
* **Návod k implementaci**:
  1. Do záhlaví sekce seznamu žáků v administrátorském rozhraní (`adminTab === 'students'`) přidejte tlačítko **"Zapsat žáka"** s ikonou `<UserPlus className="w-4 h-4" />`.
  2. Implementujte dialog (modal) podobný tomu, který používá učitel, s přepínačem akcí (Vytvořit, Přiřadit, Z CSV).
  3. Vzhledem k tomu, že administrátor vidí žáky globálně, dialog musí navíc obsahovat **výběrové pole (select dropdown) pro volbu cílové třídy** (`targetClassId`) ze všech dostupných tříd v `store.classes`.
  4. Po vytvoření/importu se musí data okamžitě zapsat do MongoDB a reaktivně obnovit v seznamu.
