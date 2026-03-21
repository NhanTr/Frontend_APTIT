# Quick Reference: Code Locations & Implementation Paths

## File Structure with Line Counts

```
TOTAL: ~1,800 lines of code (excluding UI library components)

app/
├─ page.jsx (46 lines)                    - Main entry point
├─ layout.jsx (imports)                   - Next.js layout
└─ globals.css                            - Global styles

components/
├─ login-form.jsx (98 lines)              - Authentication UI
├─ app-sidebar.jsx (98 lines)             - Navigation
├─ dashboard-header.jsx (52 lines)        - Header bar
├─ stat-card.jsx (16 lines)               - KPI cards
├─ status-badge.jsx (26 lines)            - Status/Category badges
├─ dashboards/
│  ├─ admin-dashboard.jsx (320 lines)     - Admin view
│  ├─ organizer-dashboard.jsx (248 lines) - Organizer view
│  └─ student-dashboard.jsx (220 lines)   - Student view
└─ ui/ (60+ components)                   - Radix UI library

lib/
├─ role-context.jsx (29 lines)            - Auth context
├─ mock-data.js (230 lines)               - Mock database
└─ utils.ts                               - Utilities

Total lines in main application: ~1,383
Total lines in UI library: ~2,000+
```

---

## WHERE TO FIND EACH FEATURE

### 1. ACTIVITY VIEWING

#### Admin View - All Activities
```
FILE: components/dashboards/admin-dashboard.jsx
FUNCTION: ActivityTable()
LINES: 23-113

DATA SOURCE:
- Line 1: import { mockActivities, ... } from "@/lib/mock-data"

RENDERING:
- Line 29: Activities list from mockActivities
- Line 35: Mobile card layout
- Line 60: Desktop table layout
- Line 72: Loop through mockActivities

BUTTON:
- Line 25: "New Activity" button (onClick NOT IMPLEMENTED)
- Line 26: More menu button (onClick NOT IMPLEMENTED)
```

#### Organizer View - My Activities
```
FILE: components/dashboards/organizer-dashboard.jsx
FUNCTION: MyActivities()
LINES: 28-68

DATA FILTERING:
- Line 1: import { mockActivities, mockStudents } from "@/lib/mock-data"
- Line 14: const organizerActivities = mockActivities.filter(a => a.instructorId === "t1")

RENDERING:
- Line 30: Grid layout
- Line 31: Loop through organizerActivities (2 activities)

BUTTONS:
- Line 62: "Manage" button (onClick NOT IMPLEMENTED)
- Line 63: "View Details" button (onClick NOT IMPLEMENTED)
```

#### Student View - Browse Activities
```
FILE: components/dashboards/student-dashboard.jsx
FUNCTION: BrowseActivities()
LINES: 29-96

STATE MANAGEMENT:
- Line 30: const [enrolled, setEnrolled] = useState(enrolledIds)
  └─ Local state tracking student's session enrollments

DATA FILTERING:
- Line 8: const enrolledIds = ["a1", "a4"]
- Line 37: mockActivities.filter(a => a.status !== "cancelled")

ENROLLMENT LOGIC:
- Line 40-41: isEnrolled = enrolled.includes(activity.id)
- Line 42: isFull = activity.enrolled >= activity.capacity
- Line 73: isEnrolled → "Unenroll" button
  └─ onClick: handleUnenroll(activity.id) [Line 35]
  └─ setEnrolled(prev => prev.filter(id => id !== activityId))
- Line 80: !isFull → "Enroll Now" button
  └─ onClick: handleEnroll(activity.id) [Line 31]
  └─ setEnrolled(prev => [...prev, activityId])
```

---

### 2. ATTENDANCE TRACKING

#### Organizer Attendance
```
FILE: components/dashboards/organizer-dashboard.jsx
FUNCTION: AttendanceTracker()
LINES: 102-177

STATE MANAGEMENT:
- Line 104: const [checked, setChecked] = useState({})
  └─ Local state for attendance checkboxes

DATA SOURCE:
- Line 14: const organizerStudents = mockStudents.filter(...)

CHECKBOX HANDLERS:
- Line 127 (mobile): onCheckedChange={v => setChecked(...)}
- Line 160 (desktop): onCheckedChange={v => setChecked(...)}
- Line 125/155: setChecked(prev => ({ ...prev, [studentId]: !!v }))

SUBMIT BUTTON:
- Line 110: Button with onClick handler (NOT IMPLEMENTED)
- Currently no persistence logic

STATUS DISPLAY:
- Line 137: checked[student.id] ? "Present" : "Pending"
```

---

### 3. STUDENT ENROLLMENTS

#### Enrollment State
```
FILE: components/dashboards/student-dashboard.jsx
LINES: 29-96

STATE:
- Line 30: const [enrolled, setEnrolled] = useState(enrolledIds)

INITIAL DATA:
- Line 8: const enrolledIds = ["a1", "a4"]
  └─ Hardcoded enrollment for Student (Emily Parker)

ENROLL FUNCTION:
- Line 31-33: handleEnroll(activityId)
  └─ setEnrolled(prev => [...prev, activityId])
  └─ Adds activity to local session state

UNENROLL FUNCTION:
- Line 35-37: handleUnenroll(activityId)
  └─ setEnrolled(prev => prev.filter(id => id !== activityId))
  └─ Removes activity from local session state

ON PAGE REFRESH:
- All enrollments reset to ["a1", "a4"]
```

#### View Enrollments
```
FILE: components/dashboards/student-dashboard.jsx
FUNCTION: MyEnrollments()
LINES: 98-133

DATA SOURCE:
- Line 99-100: Uses enrolledActivities = filter by enrolledIds
- These are the INITIAL hard-coded enrollments

DISPLAY:
- Line 109: Loop through enrolledActivities
- Line 112-130: Card layout with activity details
```

---

### 4. AUTHENTICATION FLOW

#### Login Form
```
FILE: components/login-form.jsx

ROLE SELECTION:
- Line 44-86: Role button grid (3 roles)
- Line 52: onClick={() => handleSelectRole(role)}

ROLE SELECTION HANDLER:
- Line 35-40: handleSelectRole(role)
  ├─ setSelectedRole(role)
  ├─ Pre-fill email: `${role}@eduactivity.com`
  └─ Pre-fill password: "demo123"

LOGIN HANDLER:
- Line 42-47: handleLogin(e)
  ├─ Prevents default form submission
  ├─ Calls: setRole(selectedRole)
  └─ Updates RoleContext.isAuthenticated = true
```

#### Authentication Context
```
FILE: lib/role-context.jsx

CONTEXT SETUP:
- Line 5: const RoleContext = createContext(undefined)

PROVIDER:
- Line 7-18: RoleProvider component
  ├─ Line 8: currentUser state (from mockUsers[0])
  ├─ Line 9: isAuthenticated state (initially false)
  ├─ Line 11-15: setRole(role) function
  │  └─ Finds user by role from mockUsers
  │  └─ Sets currentUser & isAuthenticated = true
  └─ Line 17-18: logout() function

HOOK:
- Line 21-26: useRole() hook
  └─ Returns { currentUser, setRole, logout, isAuthenticated }
```

---

### 5. NAVIGATION & ROUTING

#### Navigation Config
```
FILE: components/app-sidebar.jsx
LINES: 13-66

ADMIN NAV:
- Line 13-20: 7 menu items

ORGANIZER NAV:
- Line 21-26: 5 menu items

STUDENT NAV:
- Line 27-31: 4 menu items

SIDEBAR STRUCTURE:
- Line 86-89: Header with logo
- Line 99-120: Navigation items loop
- Line 126-131: User profile footer
```

#### Dashboard Routing
```
FILE: app/page.jsx

CONFIG OBJECT:
- Line 12-17: dashboardConfig
  ├─ Maps role → { title, subtitle, component }
  └─ Components: AdminDashboard, OrganizerDashboard, StudentDashboard

RENDERING:
- Line 24: Selects dashboard by currentUser.role
- Line 26: const { component: Dashboard } = dashboardConfig[role]
- Line 39: <Dashboard /> renders appropriate dashboard
```

---

### 6. MOCK DATA STRUCTURE

#### mockUsers
```
FILE: lib/mock-data.js
LINES: 1-3

Records:
1. Sarah Chen (admin) - id: "u1"
2. James Wilson (organizer) - id: "u2"
3. Emily Parker (student) - id: "u3"
```

#### mockActivities
```
FILE: lib/mock-data.js
LINES: 5-86

8 activities with properties:
- id, title, description, category, status
- date, time, location, capacity, enrolled
- instructor, instructorId

CATEGORIES: sports, academic, cultural, technology, community
STATUSES: upcoming, ongoing, completed, cancelled
```

#### mockOrganizers
```
FILE: lib/mock-data.js
LINES: 148-153

4 organizers/instructors:
- James Wilson (t1): manages a1, a5
- Dr. Maria Lopez (t2): manages a2, a6
- Ms. Rachel Green (t3): manages a3, a7
- Prof. Alan Turing (t4): manages a4, a8
```

#### mockStudents
```
FILE: lib/mock-data.js
LINES: 103-111

8 students:
- Emily Parker (s3): enrolled in a1, a4 [SAME AS LOGGED-IN STUDENT]
- Others: various enrollments in mock activities
```

---

## COMMON MODIFICATION PATHS

### To Change Activity Display Format

#### Admin Dashboard Table
```
FILE: components/dashboards/admin-dashboard.jsx

For TABLE COLUMNS:
- Find: <TableHeader> section (Line 73-80)
- Edit: <TableHead> elements to add/remove columns
- Impact: Changes admin's all activities view

For MOBILE CARDS:
- Find: Mobile view section (Line 35-57)
- Edit: Card layout structure
- Impact: Changes mobile view for admin
```

#### Student Browse Cards
```
FILE: components/dashboards/student-dashboard.jsx

For CARD LAYOUT:
- Find: BrowseActivities() function (Line 29-96)
- Edit: Card structure (Line 45-95)
- Impact: Changes how students see activities

For BUTTON LOGIC:
- Find: handleEnroll & handleUnenroll (Line 31-37)
- Edit: State update logic
- Impact: Changes enrollment behavior
```

### To Add New Mock Data

```
FILE: lib/mock-data.js

TO ADD ACTIVITY:
- Copy from line 5-22 (one activity object)
- Assign new id: "a9"
- All dashboards will automatically show it

TO ADD STUDENT:
- Copy from line 103-104 (one student object)
- Assign new id: "s9"
- Update enrolledActivities array

TO ADD ANNOUNCEMENT:
- Copy from line 167-177 (one announcement)
- Assign new id: "an5"
- All dashboards will automatically show it
```

### To Change Stat Card Values

#### Admin Dashboard
```
FILE: components/dashboards/admin-dashboard.jsx
FUNCTION: AdminDashboard() returns
LINES: 267-297

STAT CALCULATIONS:
- Line 268: totalActivities = mockActivities.length
- Line 269: activeActivities = filter(...).length
- Line 270: totalStudents = mockStudents.length
- Line 271: totalOrganizers = mockOrganizers.length

TO MODIFY:
- Change the calculation expressions
- Stats will update automatically
```

#### Organizer Dashboard
```
FILE: components/dashboards/organizer-dashboard.jsx
FUNCTION: OrganizerDashboard() returns
LINES: 180-205

STAT CALCULATIONS:
- Line 181: totalEnrolled = reduce sum
- Line 182: upcoming = filter count

TO MODIFY:
- Adjust filter conditions
- Change calculation logic
```

### To Add New Tabs

#### Example: Adding "Analytics" Tab to Admin Dashboard

```javascript
// Step 1: Import Tabs component (already done)
// Step 2: Add component function
function AnalyticsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Your analytics content */}
      </CardContent>
    </Card>
  )
}

// Step 3: Add TabsTrigger
<TabsList className="w-full sm:w-auto">
  {/* existing tabs */}
  <TabsTrigger value="analytics">Analytics</TabsTrigger>
</TabsList>

// Step 4: Add TabsContent
<TabsContent value="analytics">
  <AnalyticsPanel />
</TabsContent>
```

---

## DATA FLOW SEQUENCES

### Sequence 1: User Login

```
1. User opens app
   ↓ app/page.jsx renders
   ↓ RoleProvider wraps AppContent
   ↓ useRole() returns { isAuthenticated: false }
   ↓
2. LoginForm displays (3 role buttons)
   ↓
3. User clicks role button
   ↓ handleSelectRole(role)
   ↓ setSelectedRole(role)
   ↓ Pre-fill email & password
   ↓
4. User clicks Login
   ↓ handleLogin(e)
   ↓ setRole(selectedRole)
   ↓
5. RoleContext updates:
   └─ currentUser = mockUsers.find(u => u.role === role)
   └─ isAuthenticated = true
   ↓
6. AppContent re-renders
   ↓ No longer shows LoginForm
   ↓ Shows sidebar + header + dashboard
   ↓
7. Dashboard loads by role
   └─ dashboardConfig[currentUser.role].component renders
```

### Sequence 2: Student Enrolls in Activity

```
1. Student on "Browse" tab
   ↓ BrowseActivities() renders
   ↓ [enrolled, setEnrolled] = useState(["a1", "a4"])
   ↓
2. Student clicks "Enroll Now" on activity (e.g., a2)
   ↓ onClick = handleEnroll("a2")
   ↓ setEnrolled(prev => [...prev, "a2"])
   ↓
3. React re-renders BrowseActivities
   ↓ enrolled now = ["a1", "a4", "a2"]
   ↓ Activity "a2" now shows "Unenroll" button
   ↓
4. Activity appears in "My Enrollments" tab
   ↓ enrolledActivities = mockActivities.filter(a => enrolledIds.includes(a.id))
   └─ Wait, this uses enrolledIds, not enrolled state!
   └─ BUG: Enrollments don't show in MyEnrollments tab after enroll!

5. Student refreshes page
   ↓ Component remounts
   ↓ useState(enrolledIds) resets to ["a1", "a4"]
   ↓ "a2" enrollment is LOST
```

### Sequence 3: Organizer Takes Attendance

```
1. Organizer navigates to "Attendance" tab
   ↓ AttendanceTracker() renders
   ↓ [checked, setChecked] = useState({})
   └─ {} = empty object (no students checked initially)
   ↓
2. Organizer sees 4 students (organizerStudents)
   ↓ Shows checkboxes for each
   ↓ Status badges show "Pending" for all
   ↓
3. Organizer checks checkbox for student "s1"
   ↓ onCheckedChange callback fires
   ↓ setChecked(prev => ({ ...prev, ["s1"]: true }))
   ↓
4. React re-renders
   ↓ checked = { "s1": true }
   ↓ Checkbox is checked
   ↓ Status shows "Present" (green badge)
   ↓
5. Organizer clicks "Submit"
   ↓ Button exists with styling
   ↓ onClick handler NOT IMPLEMENTED
   ↓ Data remains in local state only
   ↓
6. Organizer navigates away or refreshes
   ↓ Component unmounts
   ↓ useState({ }) resets to {}
   ↓ All attendance LOST
```

---

## IMPORTANT NOTES FOR IMPLEMENTATION

### State Management Issues
1. **Student enrollments in BrowseActivities**
   - Separate from MyEnrollments hardcoded list
   - MyEnrollments uses enrolledIds constant, not enrolled state
   - This is a BUG if relying on enroll/unenroll buttons

2. **Attendance data structure**
   - Only stores boolean per student
   - No timestamp, no activity reference
   - Would need redesign for persistence

3. **No cross-component state sync**
   - Admin's "New Activity" button has no handler
   - Adding activity won't update other dashboards automatically
   - Would need global state management

### When Adding Backend

1. **Replace mockActivities imports**
   - Instead: Use API call to fetch activities
   - Add loading state
   - Add error handling

2. **Move enrollment state to context or server**
   - Current: Isolated in StudentDashboard component
   - Should be: In RoleContext or separate ActivityContext
   - Enable sync across tabs

3. **Add persistence to attendance**
   - Submit handler should call API
   - Send { studentId, activityId, present: true/false, date }
   - Add loading/error states to Submit button

4. **Implement optimistic updates**
   - Show UI change immediately
   - Send API call in background
   - Revert if API fails

### Performance Opportunities

1. **Memoization**
   ```javascript
   // Prevent re-render of ActivityTable when other state changes
   export const ActivityTable = memo(function ActivityTable() { ... })
   ```

2. **useMemo for filtering**
   ```javascript
   // Instead of filtering in render
   const organizerActivities = useMemo(() => 
     mockActivities.filter(a => a.instructorId === "t1"),
     [mockActivities]
   )
   ```

3. **Pagination for large lists**
   - Currently loads all 8 activities
   - At 1000+ activities, would need pagination

4. **Query parameters for routing**
   - Currently: Tab state is local
   - Could be: URL params for bookmarking (?tab=attendance)

