# Activity Management - Current Data Flow & State Tracking

## 1. ACTIVITY DATA FLOW

### Source
```
lib/mock-data.js
  └─ mockActivities (8 hardcoded records)
     ├── a1: Basketball Tournament
     ├── a2: Science Fair
     ├── a3: Drama Club Performance
     ├── a4: Coding Hackathon
     ├── a5: Community Cleanup Drive
     ├── a6: Math Olympiad Prep
     ├── a7: Photography Workshop
     └── a8: Robotics Club
```

### How Each Dashboard Uses Activity Data

#### ADMIN DASHBOARD
```javascript
// Imports all activities
import { mockActivities } from "@/lib/mock-data"

// Displays:
- ActivityTable: Shows all 8 activities
  - Mobile: Card view per activity
  - Desktop: Table with 7 columns
  - Buttons: "New Activity" (not implemented), More menu (not implemented)

// Stat Cards:
- totalActivities = mockActivities.length = 8
- activeActivities = filter(status === "ongoing" || "upcoming") = 5
```

#### ORGANIZER DASHBOARD (James Wilson, t1)
```javascript
// Filtered to organizer's activities
const organizerActivities = mockActivities.filter(a => a.instructorId === "t1")
// Result: [a1: Basketball Tournament, a5: Community Cleanup Drive]

// Displays:
- MyActivities: Card grid showing 2 activities
- MyStudents: Lists 4 students in organizer's activities
- AttendanceTracker: Checkbox interface for local attendance state

// Stat Cards:
- myActivities = organizerActivities.length = 2
- totalEnrolled = sum of (activity.enrolled) = 42 + 87 = 129
- upcoming = filter(status === "upcoming").length = 1
```

#### STUDENT DASHBOARD (Emily Parker, s3)
```javascript
// Student hardcoded enrollment
const enrolledIds = ["a1", "a4"]
const enrolledActivities = mockActivities.filter(a => enrolledIds.includes(a.id))
// Result: [a1: Basketball Tournament, a4: Coding Hackathon]

// Displays:
- BrowseActivities: Card grid of all activities (except cancelled)
  - Enroll button: If not enrolled AND not full AND not completed
  - Unenroll button: If enrolled
  - Disabled states: If full or completed

// Local State Tracking:
const [enrolled, setEnrolled] = useState(enrolledIds) // LOCAL STATE
// On enroll: setEnrolled(prev => [...prev, activityId])
// On unenroll: setEnrolled(prev => prev.filter(id => id !== activityId))
// NOTE: This state is LOST on page refresh!

// Stat Cards:
- enrolledActivities.length = 2
- availableActivities = filter(not enrolled & not cancelled) = 4
- upcoming = filter(enrolled & status === "upcoming").length = varies
```

---

## 2. ACTIVITY PROPERTIES

Each activity object has:
```javascript
{
  id: "a1",                    // Unique identifier
  title: "Activity Name",      // Display name
  description: "...",          // Long-form description
  category: "sports",          // sports | academic | cultural | technology | community
  status: "upcoming",          // upcoming | ongoing | completed | cancelled
  date: "2026-03-15",          // YYYY-MM-DD format
  time: "14:00",               // HH:MM format
  location: "Main Gymnasium",  // Physical location
  capacity: 60,                // Max enrollment
  enrolled: 42,                // Current enrollments
  instructor: "James Wilson",  // Display name
  instructorId: "t1"           // Reference to organizer
}
```

### Status Meanings
- **upcoming**: Not yet started (future date)
- **ongoing**: Currently happening
- **completed**: Finished
- **cancelled**: Won't happen

### Categories
- **sports**: Physical activities
- **academic**: Educational/learning
- **cultural**: Arts & performance
- **technology**: Programming/tech
- **community**: Volunteer/service

---

## 3. ENROLLMENT FLOW

### Current Behavior (Mock Only)

#### Student Perspective
```
1. Student lands on "Browse Activities" tab
   ├─ Sees all activities except cancelled ones
   ├─ Each activity card shows:
   │  ├─ Category & Status badges
   │  ├─ Title, Description
   │  ├─ Date, Time, Location, Instructor
   │  ├─ Enrollment bar (enrolled/capacity)
   │  └─ Action button (Enroll/Unenroll/Disabled)
   │
   2. Student clicks "Enroll Now"
      ├─ Button checks: not enrolled && not full && not completed
      ├─ Calls: setEnrolled(prev => [...prev, activityId])
      ├─ Button immediately changes to "Unenroll"
      └─ NO API CALL, NO PERSISTENCE
   │
   3. Activity appears in "My Enrollments" tab
      ├─ Shows in enrolledActivities array
      └─ Disappears on page refresh
   │
   4. Student clicks "Unenroll"
      ├─ Calls: setEnrolled(prev => prev.filter(id !== activityId))
      ├─ Removed from "My Enrollments"
      └─ NO API CALL, NO PERSISTENCE
```

### What Happens on Page Refresh
```
Student's local `enrolled` state resets to initial value:
const [enrolled, setEnrolled] = useState(enrolledIds)

enrolledIds = ["a1", "a4"] (hardcoded)
↓
All enrollments made during session are LOST
↓
Only a1 and a4 will show as enrolled
```

---

## 4. ATTENDANCE FLOW

### Current Behavior (Organizer Only)

#### Attendance Tracker Component
```javascript
const [checked, setChecked] = useState({}) // LOCAL STATE

// Organization: 4 hardcoded students filtered for organizer t1
const organizerStudents = mockStudents.filter(s => ["s1", "s4", "s3", "s7"].includes(s.id))

// For Each Student:
1. Display checkbox + student details
2. On click:
   ├─ setChecked(prev => ({ ...prev, [studentId]: !!newValue }))
   ├─ Checkbox toggles checked state locally
   ├─ Status badge changes: "Pending" → "Present"
   └─ NO PERSISTENCE

3. "Submit" Button
   ├─ Button exists and is styled
   ├─ onClick handler does not persist attendance
   └─ Data is lost on page refresh
```

### Attendance Object (Not Stored)
```javascript
{
  studentId: "s1",
  activityId: "a1", // Implied: Basketball Tournament
  date: "2026-03-15", // From activity.date
  attendanceDate: new Date().toLocaleDateString(),
  present: true,
  checkedAt: timestamp // Not tracked
}
```

---

## 5. ANNOUNCEMENT FLOW

### Current Behavior (Read-Only)

#### Source
```javascript
mockAnnouncements from lib/mock-data.js
[
  { id: "an1", title: "Spring Activities Registration Open", priority: "high", ... },
  { id: "an2", title: "Basketball Tournament Schedule Update", priority: "medium", ... },
  { id: "an3", title: "New Computer Lab Equipment", priority: "low", ... },
  { id: "an4", title: "Community Service Hours Reminder", priority: "medium", ... }
]
```

#### Display Locations
- Admin Dashboard: "Announcements" tab
  - Shows all 4 announcements
  - "View All" button (not implemented)

- Organizer Dashboard: No announcements display
  - Could be added but isn't currently

- Student Dashboard: "News" tab
  - Shows all 4 announcements
  - High priority shows AlertCircle icon + badge
  - Others show CheckCircle icon

### What Cannot Be Done
- No create announcement form
- No edit functionality
- No delete functionality
- No priority management
- No scheduling/scheduling publish dates
- No per-user broadcast control

---

## 6. STATE MANAGEMENT SUMMARY

### Global State (RoleContext)
```javascript
{
  currentUser: {
    id: "u1",
    name: "Sarah Chen",
    email: "sarah.chen@school.edu",
    role: "admin" | "organizer" | "student"
  },
  isAuthenticated: true | false
}
```

### Local States (Per Component)

#### LoginForm
```javascript
{
  selectedRole: null | "admin" | "organizer" | "student",
  email: string,
  password: string
}
```

#### StudentDashboard (BrowseActivities)
```javascript
{
  enrolled: ["a1", "a4", ...] // Current session enrollments
}
```

#### OrganizerDashboard (AttendanceTracker)
```javascript
{
  checked: {
    "s1": true,  // Student ID → attendance boolean
    "s4": false,
    "s3": true,
    "s7": false
  }
}
```

#### AppSidebar
```javascript
// No local state, receives `isOpen` via props
// onClose callback from parent
```

---

## 7. DATA PERSISTENCE CHECKLIST

| Feature | Persists? | How | Storage |
|---------|-----------|-----|---------|
| Authentication | ❌ No | Demo mode only | N/A |
| Activity Data | ❌ No | Hardcoded mock | memory |
| Student Enrollments | ❌ No | Local state only | Session |
| Attendance Records | ❌ No | Local state only | Session |
| Announcements | ❌ No | Hardcoded mock | memory |
| User Settings | ❌ No | Not implemented | N/A |
| Activity Edits | ❌ No | Not implemented | N/A |
| Activity Creation | ❌ No | Not implemented | N/A |

---

## 8. ACTIVITY MANAGEMENT ACTIONS BY ROLE

### ADMIN
| Action | Implemented | Current Function |
|--------|-------------|------------------|
| View all activities | ✅ Yes | Display in table/cards |
| Create activity | ❌ No | Button exists but no form |
| Edit activity | ❌ No | More menu exists but not functional |
| Delete activity | ❌ No | Not available |
| View activity details | ❌ No | Not available |
| Approve activities | ❌ No | Not in scope |
| Change activity status | ❌ No | Not available |

### ORGANIZER
| Action | Implemented | Current Function |
|--------|-------------|------------------|
| View assigned activities | ✅ Yes | Filtered to instructorId |
| View activity students | ✅ Yes | List from enrollments |
| Take attendance | ✅ Partial | Can check boxes, not saved |
| Edit own activities | ❌ No | Not available |
| View attendance history | ❌ No | Not available |
| Publish announcements | ❌ No | Not available |

### STUDENT
| Action | Implemented | Current Function |
|--------|-------------|------------------|
| Browse activities | ✅ Yes | Display with filtering |
| Enroll in activity | ✅ Partial | Local state only |
| Unenroll from activity | ✅ Partial | Local state only |
| View enrollments | ✅ Yes | List in dedicated tab |
| View activity details | ❌ No | Not available |
| Download materials | ❌ No | Not available |
| Rate activity | ❌ No | Not available |

---

## 9. COMPONENT INTERACTION MAP

```
app/page.jsx (Entry Point)
├─ RoleProvider
│  ├─ AppContent
│  │  ├─ LoginForm (if !isAuthenticated)
│  │  │  └─ Uses: useRole() → setRole()
│  │  │
│  │  └─ Dashboard Layout (if authenticated)
│  │     ├─ AppSidebar
│  │     │  ├─ Navigation items (role-specific)
│  │     │  ├─ User profile
│  │     │  └─ Logout button
│  │     │
│  │     ├─ DashboardHeader
│  │     │  ├─ Title/Subtitle
│  │     │  ├─ Menu toggle (mobile)
│  │     │  └─ Notifications bell
│  │     │
│  │     └─ Dashboard (role-specific)
│  │        ├─ AdminDashboard
│  │        │  ├─ StatCards (4)
│  │        │  ├─ Tabs
│  │        │  └─ ActivityTable, StudentsList, AnnouncementsPanel
│  │        │
│  │        ├─ OrganizerDashboard
│  │        │  ├─ StatCards (4)
│  │        │  ├─ Tabs
│  │        │  └─ MyActivities, MyStudents, AttendanceTracker
│  │        │
│  │        └─ StudentDashboard
│  │           ├─ StatCards (4)
│  │           ├─ Tabs
│  │           └─ BrowseActivities, MyEnrollments, StudentAnnouncements
```

---

## 10. ADDING NEW ACTIVITY MANAGEMENT FEATURES

### If You Want to Implement Activity Creation:

1. **Create Form Component**
   ```jsx
   // components/activity-form.jsx
   export function ActivityForm({ onSubmit }) {
     - Title input
     - Description textarea
     - Category select (sports, academic, etc)
     - Date picker
     - Time picker
     - Location input
     - Capacity number input
     - Instructor select
     // Would need to be added to admin dashboard
   }
   ```

2. **Handle Submission**
   - Call API (to be created): POST /api/activities
   - Payload would be new activity object
   - On success: refresh activity list

3. **Add to Admin Dashboard**
   - "New Activity" button currently styled
   - Add onClick → opens modal/form
   - Form submission updates mock data initially

### If You Want to Implement Enrollment Persistence:

1. **Move state higher**
   - Current: enrolled state in StudentDashboard
   - Should be: in RoleContext or separate ActivityContext

2. **Add backend**
   - Create enroll API: POST /api/enrollments
   - Create unenroll API: DELETE /api/enrollments/:id
   - Sync enrollment list from server on load

3. **Add loading states**
   - Show button disabled during API call
   - Disable/enable based on response

4. **Handle conflicts**
   - Check if activity is full (server-side validation)
   - Handle already enrolled errors
   - Sync capacity in real-time

---

## 11. PERFORMANCE CONSIDERATIONS

### Current Setup
- All activities loaded in memory at once
- No pagination or lazy loading
- Suitable for 8 activities, not for 1000+

### When to Refactor
- If activities > 100: Add pagination
- If activities > 500: Add server-side filtering
- If traffic > 100 users: Add query caching (React Query, SWR)
- If enrollments scale: Index by student and activity ID

### Optimization Opportunities
1. Memoize dashboard components
2. Use useMemo for filtered lists
3. Add virtualization for large lists
4. Cache announcement list (changes rarely)
5. Preload student's enrollment data

