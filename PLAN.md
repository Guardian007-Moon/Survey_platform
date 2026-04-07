# Course-to-Skill Mapping Survey Platform

## Tech Stack
- **Frontend:** React (Vite) + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **Email:** Nodemailer

---

## Supabase Setup

### 1. Create Project
- Go to [supabase.com](https://supabase.com), sign up, create new project
- Note your **Project URL** and **API Keys** (anon + service_role)

### 2. Run Schema SQL
Paste this into Supabase SQL Editor:

```sql
-- Admins
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  credits INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Surveys
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey-Course mapping
CREATE TABLE survey_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE
);

-- Survey-Skill mapping
CREATE TABLE survey_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE
);

-- Experts
CREATE TABLE experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey invitations (unique access tokens)
CREATE TABLE survey_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'submitted')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);

-- Responses (the actual mappings)
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID REFERENCES survey_invitations(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(invitation_id, course_id, skill_id)
);
```

### 3. Seed Admin Account
Use the `/api/admin/register` endpoint to create your first admin:
```bash
curl -X POST http://localhost:4000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

---

## Quick Start

### 1. Configure Supabase
Edit `server/.env` with your Supabase credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=any_random_secret_string
```

### 2. Run Schema
Copy the SQL from `schema.sql` and paste it into your Supabase SQL Editor.

### 3. Start the Server
```bash
cd server && npm run dev
```

### 4. Start the Client
```bash
cd client && npm run dev
```

### 5. Access the App
- Admin panel: http://localhost:5173/admin/login
- Survey page: http://localhost:5173/survey/:token (accessed via invitation link)

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/register` | No | Create admin account |
| POST | `/api/admin/login` | No | Login and get JWT token |
| GET | `/api/courses` | Yes | List all courses |
| POST | `/api/courses` | Yes | Add a course |
| POST | `/api/courses/bulk` | Yes | Bulk import courses |
| PUT | `/api/courses/:id` | Yes | Update a course |
| DELETE | `/api/courses/:id` | Yes | Delete a course |
| GET | `/api/skills` | Yes | List all skills |
| POST | `/api/skills` | Yes | Add a skill |
| POST | `/api/skills/bulk` | Yes | Bulk import skills |
| PUT | `/api/skills/:id` | Yes | Update a skill |
| DELETE | `/api/skills/:id` | Yes | Delete a skill |
| GET | `/api/surveys` | Yes | List all surveys |
| POST | `/api/surveys` | Yes | Create a survey |
| PUT | `/api/surveys/:id` | Yes | Update survey status |
| DELETE | `/api/surveys/:id` | Yes | Delete a survey |
| GET | `/api/experts` | Yes | List all experts |
| POST | `/api/experts` | Yes | Add an expert |
| POST | `/api/experts/bulk` | Yes | Bulk import experts |
| DELETE | `/api/experts/:id` | Yes | Delete an expert |
| POST | `/api/experts/invite` | Yes | Send survey invitations via email |
| GET | `/api/responses/validate/:token` | No | Validate survey token and get survey data |
| POST | `/api/responses/submit` | No | Submit survey responses |
| POST | `/api/responses/save-draft` | No | Save draft responses |
| GET | `/api/export/survey/:surveyId` | Yes | Download Excel results |
| GET | `/api/export/survey/:surveyId/csv` | Yes | Download CSV results |

---

## Project Structure
```
built_survey/
├── client/
│   ├── src/
│   │   ├── api/index.js              # Axios instance with auth interceptor
│   │   ├── pages/
│   │   │   ├── AdminLogin.jsx        # Admin login page
│   │   │   ├── AdminLayout.jsx       # Admin sidebar layout
│   │   │   ├── AdminDashboard.jsx    # Dashboard with stats
│   │   │   ├── ManageCourses.jsx     # CRUD + bulk import for courses
│   │   │   ├── ManageSkills.jsx      # CRUD + bulk import for skills
│   │   │   ├── CreateSurvey.jsx      # Create survey with course/skill selection
│   │   │   ├── ManageExperts.jsx     # CRUD + send invitations
│   │   │   ├── ViewResults.jsx       # Download results as Excel/CSV
│   │   │   └── SurveyPage.jsx        # Expert-facing matrix mapping survey
│   │   ├── App.jsx                   # Router setup
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # TailwindCSS import
│   └── package.json
├── server/
│   ├── src/
│   │   ├── lib/supabase.js           # Supabase client (service role)
│   │   ├── middleware/auth.js        # JWT auth middleware
│   │   ├── routes/
│   │   │   ├── admin.js              # Admin register/login
│   │   │   ├── courses.js            # Course CRUD
│   │   │   ├── skills.js             # Skill CRUD
│   │   │   ├── surveys.js            # Survey CRUD
│   │   │   ├── experts.js            # Expert CRUD + email invitations
│   │   │   ├── responses.js          # Survey submit/validate/draft
│   │   │   └── export.js             # Excel/CSV export
│   │   └── index.js                  # Express server entry
│   ├── .env                          # Environment variables
│   └── package.json
├── schema.sql                        # Supabase database schema
└── PLAN.md                           # This file
```

---

## UI Design System (2025-2026 Modern Standards)

### Design Tokens

```css
/* Color Palette */
Primary:       violet-600 (#7c3aed)
Primary hover: violet-500 (#8b5cf6)
Secondary:     indigo-600 (#4f46e5)
Accent:        sky-500 (#0ea5e9)

Background:    gray-50/50 (light) / gray-950 (dark)
Surface:       white (light) / gray-900 (dark)
Border:        gray-200/60 (light) / gray-800 (dark)

Text primary:  gray-900 (light) / white (dark)
Text secondary: gray-500 (light) / gray-400 (dark)
Text muted:    gray-400 (light) / gray-500 (dark)

Semantic:
  Success: emerald-600 / emerald-500
  Warning: amber-600 / amber-500
  Error:   red-600 / red-500
  Info:    blue-600 / blue-500

/* Typography (Inter font) */
Page title:    text-2xl font-bold
Section title: text-lg font-semibold
Card title:    text-base font-semibold
Body:          text-sm
Secondary:     text-sm text-gray-500
Label/Caption: text-xs font-medium uppercase tracking-wider

/* Spacing */
Page padding:     p-6 lg:p-8
Card padding:     p-5 or p-6
Cell padding:     px-6 py-4
Cell compact:     px-4 py-3
Gap between cards: gap-4 lg:gap-6
Form field gap:   space-y-4
Label-input gap:  space-y-1.5

/* Border radius */
Inputs/buttons:  rounded-xl (12px)
Cards:           rounded-2xl (16px)
Avatars/icons:   rounded-xl or rounded-full
Badges/pills:    rounded-full
Tables:          rounded-2xl (parent container)

/* Shadows */
Card default:    shadow-sm
Card hover:      shadow-lg shadow-gray-200/50
CTA button:      shadow-lg shadow-violet-500/25
CTA hover:       shadow-violet-500/40
Dropdown/modal:  shadow-xl or shadow-2xl

/* Transitions */
Hover states:    transition-all duration-200
Layout changes:  transition-all duration-300
Progress bars:   transition-all duration-700 ease-out
Button press:    active:scale-95 transition-transform duration-100
```

### Component Patterns

#### 1. Login Page

**Layout:** Split-screen (brand panel left, form right)
- Left: `bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500` with decorative `blur-3xl` blobs
- Right: `bg-gray-50 dark:bg-gray-950` with centered form card
- Social login buttons above email form
- `rounded-xl` inputs with `focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500`
- CTA: `bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all duration-300`

#### 2. Admin Dashboard Shell

**Layout:** Fixed sidebar (w-64) + sticky top bar + scrollable main content
- Sidebar: `fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200/60`
- Top bar: `sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60`
- Main: `lg:pl-64` with `p-6 lg:p-8`

**Stat Cards:**
```html
<div class="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
  <div class="flex items-center justify-between mb-3">
    <div class="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
      <!-- Icon -->
    </div>
    <span class="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">+12.5%</span>
  </div>
  <p class="text-2xl font-bold text-gray-900 dark:text-white">2,847</p>
  <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Total Surveys</p>
</div>
```

#### 3. Data Tables

**Container:** Card-wrapped table with header toolbar
```html
<div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
  <!-- Toolbar: title + search + filters -->
  <div class="px-6 py-4 border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
    <!-- Search: relative wrapper with absolute icon -->
    <div class="relative">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input class="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all" />
    </div>
  </div>
  
  <!-- Table -->
  <table class="w-full">
    <thead>
      <tr class="border-b border-gray-100 dark:border-gray-800">
        <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <!-- Sortable: flex items-center gap-1 cursor-pointer -->
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
      <tr class="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors group">
        <!-- Actions: opacity-0 group-hover:opacity-100 transition-opacity -->
      </tr>
    </tbody>
  </table>
  
  <!-- Pagination: flex justify-between border-t px-6 py-4 -->
</div>
```

**Key patterns:**
- Row actions hidden until hover: `opacity-0 group-hover:opacity-100 transition-opacity`
- Status pills: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700`
- Status dot: `w-1.5 h-1.5 rounded-full bg-emerald-500`
- Row avatar: `w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500`
- Sticky header: `sticky top-0 z-10 bg-white dark:bg-gray-900`

#### 4. Form Inputs

```html
<div class="space-y-1.5">
  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Field Name <span class="text-red-500">*</span>
  </label>
  <input class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all duration-200" />
  <p class="text-xs text-gray-500">Helper text here</p>
</div>
```

**Bulk import / file upload:**
```html
<div class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center hover:border-violet-400 hover:bg-violet-50/50 transition-all duration-300 cursor-pointer group">
  <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-gray-100 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
    <!-- Upload icon -->
  </div>
  <p class="text-sm font-medium text-gray-700 mb-1">
    <span class="text-violet-600">Click to upload</span> or drag and drop
  </p>
  <p class="text-xs text-gray-500">CSV, XLSX, or JSON (max. 10MB)</p>
</div>
```

#### 5. Survey/Matrix Mapping Table

**Large checkbox grid with sticky column and header:**
```html
<div class="overflow-auto max-h-[600px]">
  <table class="w-full">
    <thead class="sticky top-0 z-10">
      <tr class="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <th class="sticky left-0 z-20 bg-gray-50/95 dark:bg-gray-800/95 px-4 py-3 min-w-[200px] border-r border-gray-200 dark:border-gray-700">
          Indicator
        </th>
        <!-- Survey columns -->
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
      <tr class="hover:bg-violet-50/30 dark:hover:bg-violet-500/5 transition-colors">
        <td class="sticky left-0 z-10 bg-white dark:bg-gray-900 px-4 py-3 border-r border-gray-100 dark:border-gray-800">
          <!-- Indicator name + sub-label -->
        </td>
        <td class="px-4 py-3 text-center">
          <!-- Custom checkbox (see below) -->
        </td>
        <!-- Coverage mini progress bar -->
        <td class="px-4 py-3 text-center">
          <div class="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-violet-500 rounded-full" style="width: 75%"></div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**Custom checkbox (larger, rounded):**
```html
<label class="inline-flex items-center justify-center cursor-pointer">
  <input type="checkbox" class="sr-only peer" />
  <div class="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 peer-checked:bg-violet-600 peer-checked:border-violet-600 flex items-center justify-center transition-all duration-200 hover:border-violet-400">
    <svg class="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </div>
</label>
```

#### 6. Navigation

**Sidebar nav items:**
- Active: `flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 font-medium text-sm`
- Inactive: `flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white text-sm transition-all`
- Section labels: `px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider`
- Badge counts: `ml-auto text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full`

**Top bar:**
- Breadcrumbs for page context
- Global search with `⌘K` hint: `flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg`
- Notification bell with dot: `absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900`
- User avatar: `w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500`

#### 7. Glassmorphism Effects

**Glass card recipe:**
```html
<div class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
  <!-- Content -->
</div>
```

**Blur scale:**
- `backdrop-blur-xs`: 4px
- `backdrop-blur-sm`: 8px
- `backdrop-blur-md`: 12px
- `backdrop-blur-lg`: 16px
- `backdrop-blur-xl`: 24px
- `backdrop-blur-2xl`: 40px

**Use cases:** top bar, modal overlays, floating cards on gradient backgrounds

#### 8. Micro-interactions & Animations

**Custom animations (add to tailwind.config.js):**
```js
theme: {
  extend: {
    animation: {
      'slide-up': 'slideUp 0.3s ease-out',
      'fade-in': 'fadeIn 0.2s ease-out',
      'scale-in': 'scaleIn 0.2s ease-out',
    },
    keyframes: {
      slideUp: {
        '0%': { transform: 'translateY(100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      scaleIn: {
        '0%': { transform: 'scale(0.95)', opacity: '0' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
    },
  },
}
```

**Common patterns:**
- Card hover lift: `hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300`
- Button press: `active:scale-95 transition-transform duration-100`
- Skeleton loading: `animate-pulse space-y-3` with `bg-gray-200 dark:bg-gray-800 rounded-lg`
- Progress bar: `transition-all duration-700 ease-out`
- Toast notification: `animate-slide-up` from bottom-right
- Select all / clear all buttons in matrix: small pill buttons with colored bg

#### 9. Dark Mode Strategy

**Class-based dark mode (`dark:` prefix):**
```
bg-white dark:bg-gray-900
bg-gray-50 dark:bg-gray-950
border-gray-200 dark:border-gray-800
text-gray-900 dark:text-white
text-gray-500 dark:text-gray-400
```

**Dark mode surfaces:**
- Deepest background: `gray-950` (not gray-900)
- Card surface: `gray-900`
- Elevated surface: `gray-800`
- Borders: `gray-800` (subtle separation)
- Input bg: `gray-900` with `border-gray-800`

**Semantic colors in dark mode (use opacity variants):**
```
Success: dark:bg-emerald-500/10 dark:text-emerald-400
Warning: dark:bg-amber-500/10 dark:text-amber-400
Error:   dark:bg-red-500/10 dark:text-red-400
Info:    dark:bg-blue-500/10 dark:text-blue-400
```
