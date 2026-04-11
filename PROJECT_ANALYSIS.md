# EduActivity Frontend - Comprehensive Project Analysis

## Project Overview

**Project Name:** EduActivity Management System  
**Type:** Student Activity Management Dashboard  
**Tech Stack:** Next.js 16, React, TypeScript/JavaScript, Tailwind CSS, Radix UI  
**Status:** In Development  
**Purpose:** Multi-role dashboard for managing educational activities (sports, academic, cultural, technology, community)

---

## Table of Contents

1. [Kiến Trúc Dự Án](#kiến-trúc-dự-án)
2. [Authentication & Token Management](#authentication--token-management)
3. [Role-Based System](#role-based-system)
4. [Core Features by Role](#core-features-by-role)
5. [API Integration](#api-integration)
6. [State Management](#state-management)
7. [File Structure & Responsibilities](#file-structure--responsibilities)

---

## Kiến Trúc Dự Án

### Folder Structure
```
frontend_APTIT/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.js
│   │   │   ├── register/route.js
│   │   │   ├── logout/route.js
│   │   │   ├── refresh/route.js
│   │   │   └── me/route.js
│   │   ├── activities/
│   │   │   ├── route.js (GET all activities with pagination)
│   │   │   └── [id]/route.js (GET/PATCH/DELETE single activity)
│   │   ├── registrations/
│   │   │   └── route.js (POST enroll, DELETE unenroll, GET user enrollments)
│   │   ├── profile/
│   │   │   └── route.js (GET/PUT user profile without userId param)
│   │   └── users/
│   │       ├── route.js (GET all users, POST create user)
│   │       └── [id]/route.js (GET/PUT/DELETE single user)
│   ├── layout.jsx
│   ├── page.jsx (Main entry point)
│   └── globals.css
│
├── components/
│   ├── dashboards/
│   │   ├── admin-dashboard.jsx
│   │   ├── manager-dashboard.jsx
│   │   ├── organizer-dashboard.jsx
│   │   ├── student-dashboard.jsx
│   │   └── guest-dashboard.jsx
│   ├── profile/
│   │   └── personal-profile-panel.jsx
│   ├── student/
│   │   ├── activity-grid.jsx
│   │   ├── my-enrollments.jsx
│   │   └── announcements.jsx
│   ├── app-sidebar.jsx
│   ├── dashboard-header.jsx
│   ├── login-form.jsx
│   ├── stat-card.jsx
│   ├── status-badge.jsx
│   ├── theme-provider.tsx
│   └── ui/ (Radix UI components)
│
├── lib/
│   ├── auth-context.jsx (Authentication state & token management)
│   ├── role-context.jsx (Activities & role-based state)
│   └── utils.ts
│
├── hooks/
│   ├── use-student-enrollment.ts (Enrollment API calls)
│   ├── use-mobile.ts (Responsive utility)
│   └── use-toast.ts
│
├── public/
├── styles/
├── PROJECT_ANALYSIS.md (this file)
└── PROJECT_WORKFLOW.md
```

---

## Authentication & Token Management

### Token Structure

**Frontend Storage:**
```javascript
localStorage {
  accessToken: "JWT token (short-lived, ~15-30 min)",
  refreshToken: "Refresh token (long-lived, ~7-30 days)",
  username: "Cached username for display"
}
```

### Authentication Flow

1. **User Login**
   ```
   LoginForm → /api/auth/login (POST)
      ↓
   Backend validates credentials & returns:
      {
        accessToken: "...",
        refreshToken: "...",
        user: { id, username, email, role }
      }
      ↓
   Frontend stores tokens in localStorage
      ↓
   AuthProvider updates state → Router navigates to dashboard
   ```

2. **On App Startup (Bootstrap)**
   ```
   AuthProvider useEffect() {
      1. Check localStorage for accessToken
      2. If NO accessToken → Check refreshToken
      3. If NO refreshToken → Logout
      4. If accessToken EXPIRED → Try refreshToken
      5. If refreshToken valid → Get new accessToken
      6. If refreshToken invalid/expired → Logout
   }
   ```

3. **Automatic Token Refresh**
   ```
   Any API call gets 401 response:
      ↓
   makeAuthenticatedRequest() detects 401
      ↓
   Calls refreshAccessToken()
      ↓
   POST /api/auth/refresh { refreshToken }
      ↓
   Backend validates & returns new accessToken
      ↓
   Update localStorage & retry original request
      ↓
   If refresh fails → logout()
   ```

4. **Periodic Token Check**
   ```
   Every 30 seconds:
      ↓
   Check if accessToken expires in < 1 minute
      ↓
   If yes → Automatically refresh before expiry
      ↓
   No user interruption
   ```

### Key Files

- `lib/auth-context.jsx` - Auth state, login/logout, token refresh logic
- `app/api/auth/` - Backend proxy endpoints
- `hooks/use-student-enrollment.ts` - API wrapper with auto-refresh
- `lib/role-context.jsx` - Activity data with auto-refresh

---

## Core Data Model

### Users (3 roles)
```json
{
  "id": "u1",
  "name": "Sarah Chen",
  "email": "sarah.chen@school.edu",
  "role": "admin|organizer|student"
}
```

### Activities (8 mock records)
```json
{
  "id": "a1",
  "title": "Basketball Tournament",
  "description": "...",
  "category": "sports|academic|cultural|technology|community",
  "status": "upcoming|ongoing|completed|cancelled",
  "date": "2026-03-15",
  "time": "14:00",
  "location": "Main Gymnasium",
  "capacity": 60,
  "enrolled": 42,
  "instructor": "James Wilson",
  "instructorId": "t1"
}
```

### Students (8 mock records)
```json
{
  "id": "s1",
  "name": "Emily Parker",
  "email": "emily.parker@school.edu",
  "grade": "10th",
  "enrolledActivities": ["a1", "a4"],
  "joinDate": "2024-09-01"
}
```

### Organizers (4 mock records - instructors/teachers)
```json
{
  "id": "t1",
  "name": "James Wilson",
  "email": "james.w@school.edu",
  "department": "Physical Education",
  "activitiesManaged": ["a1", "a5"]
}
```

### Announcements (4 mock records)
```json
{
  "id": "an1",
  "title": "Spring Activities Registration Open",
  "content": "...",
  "author": "Sarah Chen",
  "date": "2026-03-01",
  "priority": "high|medium|low"
}
```

---

## Role-Based System

### Authentication Flow
1. User starts on LoginForm component
2. User selects role (Admin, Organizer, or Student)
3. Form credentials auto-populate based on role
4. On submit, `setRole()` is called → updates RoleContext
5. `isAuthenticated` becomes `true`
6. Dashboard component dynamically loads based on `currentUser.role`

### Navigation by Role

#### ADMIN Navigation
- Dashboard (default)
- Activities
- Students
- Organizers
- Reports
- Announcements
- Settings

#### ORGANIZER Navigation
- Dashboard (default)
- My Activities
- My Students
- Attendance
- Announcements

#### STUDENT Navigation
- Dashboard (default)
- Browse Activities
- My Enrollments
- Announcements

---

## Authentication & Navigation

### RoleContext (lib/role-context.jsx)
Manages global state:
- `currentUser` - Current logged-in user
- `isAuthenticated` - Whether user is logged in
- `setRole(role)` - Login function
- `logout()` - Logout function

### AppSidebar (components/app-sidebar.jsx)
- Displays role-specific navigation
- Shows user profile & email
- Mobile-responsive (fixed overlay on mobile)
- Logout button in footer
- First menu item (Dashboard) is always marked as active

### DashboardHeader (components/dashboard-header.jsx)
- Dynamic title & subtitle based on dashboard
- Mobile menu button (toggles sidebar)
- Search bar (desktop only)
- Notification bell (static, shows 3 notifications)

---

## Dashboard Functionality by Role

### 1. ADMIN DASHBOARD

#### Key Metrics (Stat Cards)
- Total Activities: 8
- Active Activities: 5 (ongoing + upcoming)
- Total Students: 8
- Total Organizers: 4

#### Tabs & Features

**Activities Tab:**
- Complete activity list (all 8 activities)
- Mobile: Card view per activity
- Desktop: Table view with columns:
  - Activity name
  - Category badge
  - Status badge
  - Date
  - Enrollment progress bar
  - Instructor
  - Action menu (More button)
- **Action:** "New Activity" button (not implemented)
- **Action:** More menu per activity (not implemented)

**Students Tab:**
- List of all 8 students
- Mobile: Card view
- Desktop: Table view
- Display: Name, Email, Grade, Activity count, Join date
- **Action:** "Add Student" button (not implemented)

**Announcements Tab:**
- 4 announcements displayed
- Color-coded by priority (high/medium/low)
- Shows: Title, Content, Author, Date
- **Action:** "View All" button (not implemented)

---

### 2. ORGANIZER DASHBOARD

**Note:** Organizer (James Wilson, id: t1) manages activities a1 and a5

#### Key Metrics
- My Activities: 2
- Total Students (across activities): Value calculated from enrolled count
- Upcoming Events: 1
- Attendance Rate: 92% (static)

#### Tabs & Features

**Activities Tab (My Activities):**
- Card grid layout (2 per row on tablet, 1 on mobile)
- Shows: Category, Status, Title, Description
- Details: Date, Time, Location
- Enrollment progress bar
- **Actions per card:**
  - "Manage" button (not implemented)
  - "View Details" button (not implemented)

**Students Tab (Enrolled Students):**
- Lists 4 students enrolled in organizer's activities
- Mobile: Card view
- Desktop: Row view with avatar
- Shows: Student name, Grade badge, Email
- Activity enrollment badges (colored)
- **No actions available**

**Attendance Tab (Take Attendance):**
- Pre-filled with 4 students
- Checkbox interface to mark attendance
- Mobile: Card view with checkboxes
- Desktop: Table with checkbox column
- Status badges: "Present" (green) or "Pending" (gray)
- **Action:** "Submit" button (not implemented - local state only)

---

### 3. STUDENT DASHBOARD

**Note:** Student (Emily Parker, id: s3) is enrolled in activities: a1, a4

#### Key Metrics
- Enrolled Activities: 2
- Available Activities: 4 (not enrolled, not cancelled/completed)
- Upcoming Events: Number of upcoming in enrollments
- Announcements: 4 (static)

#### Tabs & Features

**Browse Activities Tab:**
- Card grid: 3 columns on large, 2 on tablet, 1 on mobile
- Each activity card shows:
  - Category & Status badges
  - Title & Description (clamped to 2 lines)
  - Date, Time, Location, Instructor
  - Spots remaining / Capacity
  - Enrollment progress bar
- **Action buttons (conditional):**
  - If already enrolled: "Unenroll" button → removes from local state
  - If completed: "Completed" button (disabled)
  - If full: "Full" button (disabled)
  - Otherwise: "Enroll Now" button → adds to local state

**My Enrollments Tab:**
- Lists activities student is enrolled in (2 items)
- Desktop: Row layout with calendar icon
- Mobile: Full-width cards
- Shows: Title, Status, Date, Time, Location
- **Action:** "Details" button (not implemented)
- Empty state message if no enrollments

**Announcements Tab (News):**
- 4 announcements
- Icon varies by priority (AlertCircle for high, CheckCircle for others)
- Color-coded badges for high priority
- Shows: Title, Content, Date

---

## Activity Management Workflow

### Current State: READ-ONLY + LIMITED LOCAL STATE

#### What Can Be Done:
1. **Students can:**
   - View all activities (filtered by non-cancelled)
   - Enroll in activities (local state only - resets on refresh)
   - Unenroll from activities (local state only)
   - View their enrollments
   - View announcements

2. **Organizers can:**
   - View their assigned activities (2/8)
   - View their enrolled students (4/8)
   - Mark attendance with checkboxes (local state only)
   - View announcements

3. **Admins can:**
   - View all activities
   - View all students
   - View all organizers
   - View all announcements

#### What CANNOT Be Done (Unimplemented):
1. **Activity Creation:**
   - Admin "New Activity" button exists but not implemented
   - No form, no API call, no persistence

2. **Activity Editing:**
   - No edit functionality
   - More/action menus exist but not implemented

3. **Activity Deletion:**
   - No delete functionality

4. **Attendance Submission:**
   - Organizer can check boxes but Submit button doesn't persist
   - Data is stored in local React state only

5. **Enrollment Persistence:**
   - Student enrollments are local state only
   - Resets on page refresh

6. **Announcements Management:**
   - No create/edit/delete
   - View All button not implemented

### Data Flow Architecture

```
LoginForm (select role)
    ↓
RoleContext.setRole() → isAuthenticated = true
    ↓
AppContent renders Dashboard based on currentUser.role
    ↓
Dashboard fetches mockData from lib/mock-data.js
    ↓
Components display data + render UI elements
    ↓
Click handlers → LOCAL STATE ONLY (no API calls)
    ↓
State reset on page refresh (no persistence)
```

---

## Current Limitations

### Data Persistence
- ❌ No backend/database
- ❌ No API endpoints
- ❌ All data stored in mock-data.js
- ❌ User actions (enroll, attendance) stored in local React state only
- ❌ No persistence across page refreshes

### Authentication
- ❌ No real authentication
- ❌ No password validation
- ❌ No session management
- ❌ No token/JWT implementation
- ✅ Demo mode - select role to auto-login

### Activity Management Features
- ❌ No create activity form
- ❌ No edit activity form
- ❌ No delete activity functionality
- ❌ No activity template/duplication
- ❌ No activity filtering (admin only shows all)
- ❌ No bulk actions

### Attendance & Enrollment
- ❌ Attendance data not persisted
- ❌ Enrollment data not persisted
- ❌ No attendance history/reports
- ❌ No enrollment history
- ❌ No waitlist functionality
- ❌ No capacity enforcement (client-side only)

### User Management
- ❌ No real user database
- ❌ No user creation/editing
- ❌ No user deletion
- ❌ No role management for existing users
- ❌ No permission system (beyond role name)

### Communication
- ❌ Announcements are static (not creatable)
- ❌ No notifications pushed to users
- ❌ No email system

### Reporting
- ❌ Admin Reports tab shows nothing
- ❌ No analytics
- ❌ No attendance reports
- ❌ No enrollment reports

---

## Recommendations for Structural Changes

### If Building Backend Integration:

1. **Create API Layer**
   ```
   /api/
     /auth/*.ts (login, logout, validate-token)
     /activities/*.ts (CRUD operations)
     /students/*.ts (CRUD)
     /enrollments/*.ts (enroll, unenroll)
     /attendance/*.ts (submit, get)
     /announcements/*.ts (CRUD)
   ```

2. **Replace Mock Data Context**
   - Remove direct mockData imports
   - Create data fetching hooks (useFetch, SWR, React Query)
   - Implement proper error handling & loading states

3. **Add State Management**
   - Consider Redux/Zustand for global state
   - Separate auth state from app state
   - Cache API responses

4. **Enhance Forms**
   - Create form components for:
     - Activity creation/editing
     - User management
     - Announcement Publishing
   - Use React Hook Form + Zod validation

5. **Add Loading & Error States**
   - Currently no loading skeletons
   - No error boundaries
   - No error messages

### If Expanding Activity Features:

1. **Activity Details Page**
   - Deep dive into single activity
   - Participant list
   - Activity history
   - Related activities

2. **Search & Filtering**
   - Filter by category, status, date range
   - Full-text search on titles/descriptions
   - Saved searches/bookmarks

3. **Calendar Integration**
   - Calendar view of activities
   - Time conflict detection
   - iCal export

4. **Advanced Enrollment**
   - Waitlist functionality
   - Registration deadline tracking
   - Pre-requisites/requirements
   - Group enrollments

5. **Reporting Dashboard**
   - Admin analytics
   - Attendance reports
   - Enrollment trends
   - Revenue tracking (if paid)

### If Scaling to Organizations:

1. **Multi-tenancy**
   - Multiple schools/institutions
   - Isolated data per tenant
   - Custom branding

2. **User Hierarchy**
   - School admin > Department head > Instructor
   - Permission inheritance
   - Delegation capabilities

3. **Integration Points**
   - Active Directory/LDAP sync
   - Google Classroom API
   - Calendar sync (Google Calendar, Outlook)
   - Email notifications (SendGrid, Mailgun)

---

## File Summary

### Entry Points
- **app/page.jsx** - Main application entry (46 lines)
  - Sets up RoleProvider
  - Handles authentication redirect
  - Dashboard routing

- **app/layout.jsx** - Next.js layout (imports globals)

### Authentication
- **lib/role-context.jsx** - Auth context (29 lines)
  - Mock user selection
  - isAuthenticated state
  - setRole() & logout() functions

- **components/login-form.jsx** - Login UI (98 lines)
  - Role selection interface
  - Form with email/password (auto-filled)
  - Demo mode notice

### Navigation
- **components/app-sidebar.jsx** - Navigation sidebar (98 lines)
  - Role-based menu items
  - User profile footer
  - Mobile overlay + close button

- **components/dashboard-header.jsx** - Header bar (52 lines)
  - Dynamic title/subtitle
  - Mobile menu button
  - Notifications bell
  - Search bar (desktop)

### Dashboards
- **components/dashboards/admin-dashboard.jsx** - Admin view (320 lines)
  - 4 stat cards
  - Activities table (with mobile cards)
  - Students list
  - Announcements panel
  - Tab navigation

- **components/dashboards/organizer-dashboard.jsx** - Organizer view (248 lines)
  - 4 stat cards (personalized)
  - My Activities cards
  - Enrolled Students list
  - Attendance tracker (with checkboxes)
  - Tab navigation

- **components/dashboards/student-dashboard.jsx** - Student view (220 lines)
  - 4 stat cards
  - Browse Activities (with enroll/unenroll buttons)
  - My Enrollments list
  - Announcements
  - Tab navigation

### Data
- **lib/mock-data.js** - Mock database (230 lines)
  - mockUsers (3 records)
  - mockActivities (8 records)
  - mockStudents (8 records)
  - mockOrganizers (4 records)
  - mockAnnouncements (4 records)

### Components
- **components/stat-card.jsx** - KPI display (16 lines)
- **components/status-badge.jsx** - Status/Category badges (26 lines)
- **components/ui/** - Radix UI component library (60+ components)

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Total Components | 60+ |
| Mock Data Records | 27 (activities, users, etc) |
| Lines of Code (dashboards) | ~800 |
| Features Implemented | ~40% |
| Fully Functional Features | Viewing, Basic Filtering |
| Unimplemented Features | CRUD operations, Persistence |
| API Integration | 0% |
| Database | 0% |
| Authentication | Demo mode only |

---

## Next Steps for Development

### Priority 1 (Core Functionality)
1. Set up backend (Next.js API routes or separate server)
2. Create database schema
3. Implement real authentication
4. Add activity CRUD operations
5. Implement enrollment persistence

### Priority 2 (User Experience)
1. Add loading states & skeletons
2. Implement real error handling
3. Add form validation
4. Create confirmation dialogs for destructive actions
5. Add toast notifications

### Priority 3 (Advanced Features)
1. Search & filtering
2. Reporting/analytics
3. Calendar integration
4. Email notifications
5. File uploads (for activity materials)

