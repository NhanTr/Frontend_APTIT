# 📚 Essential Functions Inventory

## Core Functionality Map

### 🔐 Authentication System
```
FLOW: Login → Token Storage → Auto-Refresh → Logout

Functions:
├── login(username, password)
│   └── Returns: { user, accessToken, refreshToken }
│
├── register(username, email, password, fullName, role)
│   └── Returns: { user }
│
├── refreshAccessToken()
│   └── Returns: boolean (success/fail)
│   └── Auto-called on 401 response
│
├── logout()
│   └── Clears tokens & user state
│   └── Redirects to login
│
└── changePassword(oldPassword, newPassword)
    └── Returns: success boolean

Helper Functions:
├── decodeToken(token) → Payload object
├── isTokenExpired(token) → boolean
└── Token stored in localStorage (accessToken, refreshToken, username)
```

### 🏃 Activity Management System
```
FLOW: Fetch → Filter → Paginate → Display

Functions:
├── fetchActivities(page, size, filters)
│   ├── Parameters: status, sponsor, startTime, endTime, location
│   ├── Returns: { activities[], totalPages, currentPage }
│   └── Auto-refresh on filter change
│
├── createActivity(data)
│   └── Only: Organizer role
│   └── Returns: { newActivity }
│
├── approveActivity(activityId)
│   └── Only: Admin/Manager role
│   └── Updates: activity.approvalStatus = "approved"
│
├── rejectActivity(activityId)
│   └── Only: Admin/Manager role
│   └── Updates: activity.approvalStatus = "rejected"
│
├── updateActivityStatus(activityId, status)
│   └── Updates: activity.status
│
├── loadMore()
│   └── Pagination: currentPage++
│   └── Appends to existing activities[]
│
└── applyFilters(filterObject)
    └── Updates filter state
    └── Resets page to 0
    └── Triggers new fetchActivities()

Helper Functions:
├── transformActivity(backendData) → Frontend format
├── makeAuthenticatedRequest(url, options) → Response
│   ├── Auto-adds Authorization header
│   ├── Auto-refreshes token on 401
│   └── Returns null if refresh fails
│
└── Activities structure:
    {
      id, title, description, category, status,
      approvalStatus, date, time, location, capacity,
      enrolled, instructor, instructorId,
      startTime, endTime, budget, sponsor,
      targetAudience, purpose, trainingPoints
    }
```

### ✍️ Enrollment System
```
FLOW: Get Enrollments → Enroll/Unenroll → Update UI

Functions:
├── getUserEnrollments()
│   └── Returns: activityId[] (enrolled activities)
│   └── Endpoint: GET /api/registrations
│
├── handleEnroll(activityId)
│   ├── Sets loading state: enrollingActivityIds.push(id)
│   ├── Endpoint: POST /api/registrations
│   ├── Returns: boolean (success/fail)
│   └── Clears loading state on complete
│
├── handleUnenroll(activityId)
│   ├── Sets loading state: unenrollingActivityIds.push(id)
│   ├── Endpoint: DELETE /api/registrations
│   ├── Returns: boolean (success/fail)
│   └── Clears loading state on complete
│
└── getAllActivities()
    └── Returns: activities[] (all activities)
    └── Endpoint: GET /api/activities

Error Handling:
├── enrollmentError state → User message
└── Auto-retry on token refresh
```

### 🔄 Filter System
```
Filter Fields:
├── status: "draft" | "approved" | "cancelled" | "completed"
├── sponsor: string (text search)
├── startTime: ISO 8601 datetime
├── endTime: ISO 8601 datetime
└── location: string (text search)

Behavior:
├── Reactive: Each field change triggers API call (no search button)
├── Auto-reset: Page resets to 0 on filter change
├── Clear All: Removes all filters at once
└── API: Parameters added to query string (?status=draft&sponsor=...)
```

### 📄 Profile System
```
Functions:
├── getUserProfile()
│   └── Returns: { userId, name, email, phone, ... }
│   └── Endpoint: GET /api/profile
│
├── updateProfile(data)
│   └── Updates: name, email, phone, bio, etc.
│   └── Endpoint: PUT /api/profile
│   └── Returns: { updatedProfile }
│
└── Auto-create empty profile on first access
    └── If 404, creates default profile
```

---

## 🗺️ State Management Map

### AuthContext State
```
{
  user: {
    id: string,
    username: string,
    name: string,
    email: string,
    role: "admin" | "organizer" | "manager" | "student" | "guest",
    expiresAt: number
  },
  accessToken: string,
  loading: boolean,
  error: string | null,
  isAuthenticated: boolean
}
```

### RoleContext State
```
{
  currentUser: { id, name, email, role },
  activities: [activity],
  loading: boolean,
  error: string | null,
  
  // Pagination
  currentPage: number (0-based),
  pageSize: number,
  totalPages: number,
  hasMore: boolean,
  
  // Filters
  filters: {
    status: string,
    sponsor: string,
    startTime: string,
    endTime: string,
    location: string
  }
}
```

### useStudentEnrollment State
```
{
  enrollingActivityIds: string[],
  unenrollingActivityIds: string[],
  enrollmentError: string | null
}
```

---

## 🔌 API Endpoints (Frontend Calls)

### Authentication
```
POST   /api/auth/login                  - Login
POST   /api/auth/register               - Register
POST   /api/auth/refresh                - Refresh token
POST   /api/auth/logout                 - Logout
POST   /api/auth/change-password        - Change password
GET    /api/auth/introspect             - Check token validity
GET    /api/auth/me                     - Get current user
```

### Activities
```
GET    /api/activities                  - List activities (paginated + filtered)
  Query: page, size, status, sponsor, startTime, endTime, location
POST   /api/activities                  - Create activity (Organizer)
GET    /api/activities/:id              - Get single activity
PATCH  /api/activities/:id              - Update activity
DELETE /api/activities/:id              - Delete activity

GET    /api/activities/status/:status   - Get activities by status
GET    /api/activities/organizer/:id    - Get organizer's activities
```

### Registrations (Enrollments)
```
GET    /api/registrations               - Get user enrollments
POST   /api/registrations               - Enroll in activity
DELETE /api/registrations               - Unenroll from activity
GET    /api/registrations/:activityId   - Get enrollments for activity
```

### Users & Profile
```
GET    /api/users/:id                   - Get user details
PUT    /api/users/:id                   - Update user

GET    /api/profile                     - Get current user profile
PUT    /api/profile                     - Update current user profile
```

---

## 🎯 Role-Based Access Control

### Guest (Not Logged In)
✅ Browse activities (all)
✅ View activity details
❌ Enroll
❌ Create/manage activities

### Student
✅ Browse activities
✅ Enroll/unenroll
✅ View my enrollments
✅ View profile
✅ Update profile

### Organizer
✅ Create activities
✅ View my activities
✅ Edit/delete own activities
✅ View enrolled students
✅ View profile

### Admin
✅ Approve/reject activities
✅ View all activities
✅ View all users
✅ Manage user roles
✅ View reports

### Manager (Similar to Admin)
✅ Approve/reject activities
✅ Review activities
✅ View reports

---

## 🚨 Error Handling Strategy

### Token Errors (401)
```
Trigger: 401 response
Action:
  1. Call refreshAccessToken()
  2. Retry request with new token
  3. If refresh fails, logout user
  4. Show: "Phiên đăng nhập đã hết hạn"
```

### API Errors (400, 404, 500)
```
Trigger: Non-401 error response
Action:
  1. Extract error message from response
  2. Show in enrollmentError or error state
  3. Display to user
  4. No auto-retry
```

### Network Errors
```
Trigger: Fetch throws error
Action:
  1. Catch and log error
  2. Set error state
  3. Show generic message
  4. Manual retry available
```

---

## ⚙️ Configuration

### Token Settings
```
Access Token TTL: ~15-30 minutes (backend)
Refresh Token TTL: ~7-30 days (backend)
Token check interval: 30 seconds (auth-context)
Token refresh threshold: 1 minute before expiry
```

### Pagination
```
Default page size: 10 items
Page numbering: 0-based (0, 1, 2, ...)
Load more strategy: Append to existing list
```

### Filter Debounce
```
Currently: Immediate (no debounce)
Recommendation: Add 300ms debounce for text inputs
```

---

## 📌 Summary Table

| Component | Lines | Complexity | Status |
|-----------|-------|-----------|--------|
| auth-context.jsx | ~300 | High | ✅ Working |
| role-context.jsx | ~350 | High | ✅ Working |
| use-student-enrollment.ts | ~250 | Medium | ✅ Working |
| API routes | ~200 | Medium | ✅ Working |
| Filters | N/A | Low | ✅ Working |
| Pagination | N/A | Low | ✅ Working |

**Total Essential Logic**: ~1,100 lines of code
**Test Coverage**: TBD
**Type Safety**: Partial (some TypeScript)
