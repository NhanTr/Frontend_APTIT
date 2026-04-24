# 🔧 Code Cleanup Action Plan

## Phase 1: Quick Wins (Remove Console Logs)

### Files to Clean:

#### 1. `lib/auth-context.jsx` - Remove 15+ console.logs
```javascript
// REMOVE these lines:
Line ~96:  console.log('✅ Token refreshed successfully')
Line ~140: console.log('⏰ Access token expired on startup, attempting refresh token...')
Line ~286: console.log('⏰ Token about to expire, attempting refresh...')
// + 12 more console.error statements (keep ERROR level only)
```

#### 2. `lib/role-context.jsx` - Remove 12+ console.logs
```javascript
// REMOVE these lines:
Line ~80:  console.log('⏰ Token expired (401), attempting to refresh...')
Line ~84:  console.log('✅ Token refreshed, retrying request...')
Line ~137: console.log('📡 Fetching activities from:', url)
Line ~140: console.log('📊 Response status:', response.status, response.statusText)
Line ~149: console.log('✅ API response data:', data)
Line ~156: console.log('📋 Transformed activities count:', activitiesList.length)
// + 6 more
```

#### 3. `hooks/use-student-enrollment.ts` - Remove 8+ console.logs
```javascript
// REMOVE these lines:
Lines with: "📡 Request:", "🔐 Headers:", "📦 Body:", "📊 Response:"
Lines with: "📥 Fetching user enrollments..."
Lines with: "✅ Raw enrollment response:", "🎯 Extracted activity IDs:"
```

#### 4. `components/dashboards/student-dashboard.jsx` - Remove 3 console.logs
```javascript
// REMOVE these lines:
Line ~26:  console.log("📋 Loading enrollments from database...")
Line ~36:  console.log("🔄 Reloading enrollments after enroll attempt...")
Line ~45:  console.log("🔄 Reloading enrollments after unenroll attempt...")
```

#### 5. `components/app-sidebar.jsx` - Remove 1 console.log
```javascript
// REMOVE this line:
Line ~73:  console.log('📍 Sidebar - Role:', userRole, 'Active Menu:', activeMenu)
```

#### 6. `components/profile/personal-profile-panel.jsx` - Remove 2 console.logs
```javascript
// REMOVE these lines:
Line ~106: console.log("📝 Profile not found (404), auto-creating empty profile...")
Line ~170: console.log("✅ Empty profile created successfully")
```

**Total removable**: ~41 console.log statements (approximately 50 lines)

---

## Phase 2: Extract Shared Utilities

### 1. Create `lib/api-client.ts`

```typescript
// Consolidate makeAuthenticatedRequest() logic
// Currently duplicated in:
// - lib/role-context.jsx (~33 lines)
// - hooks/use-student-enrollment.ts (~55 lines)

// SAVE: ~80 lines (remove duplicates)

export async function makeAuthenticatedRequest(
  url: string,
  options?: RequestInit,
  retryCount = 0
): Promise<Response | null> {
  // ... shared implementation
}

export async function buildAuthHeaders(): Promise<Record<string, string>> {
  // Build headers with Authorization
}
```

### 2. Create `lib/token-utils.ts`

```typescript
// Move token-related functions
// From: lib/auth-context.jsx (~40 lines)

export function decodeToken(token: string): TokenPayload | null
export function isTokenExpired(token: string): boolean
export function getTokenExpiry(token: string): number | null
export function validateToken(token: string): boolean
```

### 3. Create `lib/activity-utils.ts`

```typescript
// Move activity transformation logic
// From: lib/role-context.jsx (~30 lines)

export function transformActivity(backendActivity: any): Activity
export function buildActivityFilterQuery(filters: FilterObject): string
export function isActivityAvailable(activity: Activity): boolean
```

**Total lines saved**: ~150 lines of duplicate/cleaner code

---

## Phase 3: Remove Unused Code

### 1. Unused Hooks
```
hooks/use-mobile.ts        - Check if used in components
hooks/use-toast.ts         - Check if used in components

Action: Search for imports
If NOT imported anywhere → DELETE
If imported but unused → DELETE import
```

### 2. Unused State Variables
```
lib/role-context.jsx:
- const [enrolled, setEnrolled] = useState([])
  → Not used. Should be in useStudentEnrollment hook
  → REMOVE or move

Action: 
1. Search for setEnrolled usage
2. If not used, remove both lines
3. ~5 lines saved
```

### 3. Unused Imports
```
Check all imports are actually used:
- Component imports
- Icon imports  
- Utility imports

Action: Remove unused imports (~10 lines)
```

---

## Phase 4: Optimize Token Refresh

### Current Issue:
```javascript
// auth-context.jsx lines ~285-305
useEffect(() => {
  const interval = setInterval(() => {
    // Check and refresh token every 30 seconds
    // This is AGGRESSIVE - calls refresh even if not needed
  }, 30000)
  return () => clearInterval(interval)
}, [])
```

### Problem:
- Runs even when user is not interacting
- Makes unnecessary API calls
- Wastes bandwidth and server resources

### Solution:
Implement **Lazy Token Refresh** instead:
```javascript
// Only refresh when:
// 1. User makes an API call AND token is about to expire
// 2. User tries to do something AND token is expired
// 3. Explicitly asked (manual refresh)

// Remove aggressive interval
// Keep only:
// - Bootstrap check on app load
// - Refresh on 401 response
// - Refresh before token expiry (if action is about to happen)
```

**Benefit**: Reduce unnecessary token refresh calls by ~80%

---

## Phase 5: Consolidate Error Handling

### Current State:
```
Multiple error handling patterns:
- enrollmentError in useStudentEnrollment
- error in AuthContext
- error in RoleContext
- No consistent error interface
```

### Create `lib/error-handler.ts`:
```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message)
  }
}

export function handleApiError(error: any): string
export function handleAuthError(error: any): string
export function handleEnrollmentError(error: any): string
```

**Benefit**: 
- Consistent error messages
- Easier to handle errors
- ~30 lines of boilerplate saved

---

## 📊 Cleanup Summary

| Phase | Action | Files | Lines Removed | Priority |
|-------|--------|-------|----------------|----------|
| 1 | Remove console logs | 6 files | ~50 | 🔴 HIGH |
| 2 | Extract utilities | 3 new files | ~150 (refactor) | 🟠 MEDIUM |
| 3 | Remove unused | 3 files | ~30 | 🟢 LOW |
| 4 | Optimize refresh | 1 file | ~20 | 🟠 MEDIUM |
| 5 | Error handling | 1 new file | ~30 (refactor) | 🟢 LOW |

**Total Cleanup Impact**:
- Remove: ~80 lines (console logs + unused code)
- Refactor: ~210 lines (consolidate + extract)
- **Net Result**: Cleaner, more maintainable code with NO functionality loss

---

## 🎬 Execution Order

### Day 1 (Quick):
```
1. Remove console.log statements from 6 files (30 min)
   → Run tests to confirm no breaking changes
2. Delete unused hooks if confirmed unused (10 min)
   → Check for any import errors
3. Remove unused imports (15 min)
   → Run linter to catch any issues
```

### Day 2 (Medium):
```
1. Create lib/api-client.ts (30 min)
   → Copy makeAuthenticatedRequest logic
   → Test with existing calls
2. Create lib/token-utils.ts (20 min)
   → Move token functions
   → Update imports in auth-context
3. Create lib/activity-utils.ts (20 min)
   → Move transformActivity logic
   → Update imports in role-context
```

### Day 3 (Optimization):
```
1. Replace aggressive token refresh with lazy refresh (30 min)
   → Test token expiry scenarios
   → Monitor API calls (should decrease)
2. Create lib/error-handler.ts (20 min)
   → Consolidate error handling
   → Update error handling in contexts
3. Run full test suite (30 min)
   → Test all user flows
   → Verify no regressions
```

---

## ✅ Verification Checklist

After cleanup, verify:

```
□ No console.log statements in production code
□ All imports used (eslint will flag unused)
□ No unused state variables
□ Token refresh only happens when needed
□ All 6 authentication flows work:
  □ Login
  □ Register
  □ Token refresh on 401
  □ Logout
  □ Change password
  □ Auto-refresh on startup
□ All activity operations work:
  □ Browse activities
  □ Filter activities
  □ Paginate activities
  □ Create activity (organizer)
  □ Approve/reject activity (admin)
  □ Update activity status
□ All enrollment operations work:
  □ Enroll in activity
  □ Unenroll from activity
  □ View enrollments
  □ Enrollment errors handled
□ No performance degradation
□ No memory leaks (check dev tools)
```

---

## 🎯 Benefits After Cleanup

### Code Quality:
- ✅ -50 unnecessary lines
- ✅ -80 duplicate lines  
- ✅ Better code organization
- ✅ Easier to maintain
- ✅ Easier to test

### Performance:
- ✅ -80% unnecessary token refresh calls
- ✅ Reduced API overhead
- ✅ Faster response times
- ✅ Better network usage

### Developer Experience:
- ✅ Cleaner codebase
- ✅ Less console noise
- ✅ Shared utilities (DRY principle)
- ✅ Consistent error handling
- ✅ Better code reusability

### Bundle Size:
- ✅ Smaller bundle (removed unused code)
- ✅ Faster page load
- ✅ Better initial render time

---

## 📝 Notes

1. **Testing is critical**: After each phase, run tests to ensure nothing breaks
2. **Incremental approach**: Do one phase per session
3. **Git commits**: Commit after each successful phase
4. **Code review**: Each cleanup commit should be reviewed
5. **Performance monitoring**: Compare before/after API call counts

---

## References

- Current codebase: ~/Documents/Web/APTIT/frontend_APTIT
- Code audit: CODE_AUDIT.md
- Functions inventory: FUNCTIONS_INVENTORY.md
- This plan: CODE_CLEANUP_PLAN.md
