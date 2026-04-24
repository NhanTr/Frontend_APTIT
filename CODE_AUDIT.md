# 🔍 Code Audit Report - Frontend APTIT

**Date**: April 22, 2026  
**Status**: Clean up and optimize

---

## 📋 Essential Functions (Chức Năng Cần Thiết)

### 1. Authentication Context (`lib/auth-context.jsx`)

#### Required Functions:
```
✅ decodeToken()               - Giải mã JWT token
✅ isTokenExpired()            - Kiểm tra token hết hạn
✅ refreshAccessToken()        - Refresh token tự động
✅ login()                     - Đăng nhập user
✅ register()                  - Đăng ký user mới
✅ logout()                    - Đăng xuất
✅ changePassword()            - Đổi mật khẩu
✅ verifyAuth on Mount         - Kiểm tra token khi mở app
```

#### State Management:
```
✅ user                        - Thông tin user (id, username, role, email)
✅ accessToken                 - JWT token hiện tại
✅ loading                     - Loading state
✅ error                       - Error message
✅ isAuthenticated             - Boolean flag
```

---

### 2. Role Context (`lib/role-context.jsx`)

#### Required Functions:
```
✅ fetchActivities()           - Lấy danh sách activities (có pagination + filter)
✅ createActivity()            - Tạo activity mới (organizer)
✅ approveActivity()           - Approve activity (admin/manager)
✅ rejectActivity()            - Reject activity (admin/manager)
✅ updateActivityStatus()      - Cập nhật status activity
✅ loadMore()                  - Load thêm activities (pagination)
✅ applyFilters()              - Apply filter và reset page
✅ makeAuthenticatedRequest()  - Helper API call với token refresh
✅ transformActivity()         - Transform backend format → frontend
```

#### State Management:
```
✅ activities[]                - Danh sách activities
✅ currentUser                 - User info từ auth context
✅ loading, error              - Loading/error states
✅ currentPage, pageSize       - Pagination
✅ totalPages, hasMore         - Pagination info
✅ filters{}                   - Filter params (status, sponsor, startTime, endTime, location)
```

#### Filter Parameters:
```
✅ status                      - "draft" | "approved" | "cancelled" | "completed"
✅ sponsor                     - Text search
✅ startTime                   - ISO datetime
✅ endTime                     - ISO datetime
✅ location                    - Text search
```

---

### 3. Student Enrollment Hook (`hooks/use-student-enrollment.ts`)

#### Required Functions:
```
✅ makeAuthenticatedRequest()  - API call với token + refresh
✅ getUserEnrollments()        - Lấy danh sách activities đã đăng ký
✅ getAllActivities()          - Lấy tất cả activities
✅ handleEnroll()              - Đăng ký activity
✅ handleUnenroll()            - Hủy đăng ký activity
```

#### State Management:
```
✅ enrollingActivityIds[]      - IDs đang enroll (UI loading)
✅ unenrollingActivityIds[]    - IDs đang unenroll (UI loading)
✅ enrollmentError             - Error message
```

---

### 4. API Routes (`app/api/**/route.js`)

#### Required Endpoints:
```
✅ GET  /api/activities        - Lấy activities (+ pagination + filter)
✅ POST /api/activities        - Tạo activity
✅ PATCH /api/activities/:id   - Update activity
✅ DELETE /api/activities/:id  - Delete activity

✅ GET  /api/registrations     - Lấy enrollments user
✅ POST /api/registrations     - Enroll activity
✅ DELETE /api/registrations   - Unenroll activity

✅ POST /api/auth/login        - Đăng nhập
✅ POST /api/auth/register     - Đăng ký
✅ POST /api/auth/refresh      - Refresh token
✅ POST /api/auth/logout       - Đăng xuất

✅ GET  /api/profile           - Lấy user profile
✅ PUT  /api/profile           - Update profile
```

---

## 🗑️ Code Redundancy (Code Dư Thừa)

### 1. Excessive Console Logs

**Location**: Across all files

**Current**:
```javascript
console.log('📡 Fetching activities from:', url)
console.log('📊 Response status:', response.status, response.statusText)
console.log('✅ API response data:', data)
console.log('📋 Transformed activities count:', activitiesList.length)
// ... many more emoji logs
```

**Action**: Remove debug logs in production. Keep only ERROR logs.

**Files affected**:
- `lib/auth-context.jsx` - 10+ console.log statements
- `lib/role-context.jsx` - 8+ console.log statements
- `hooks/use-student-enrollment.ts` - 6+ console.log statements
- `components/dashboards/student-dashboard.jsx` - 3+ console.log statements
- `components/app-sidebar.jsx` - 1 console.log
- `components/profile/personal-profile-panel.jsx` - 2 console.log statements

---

### 2. Duplicate makeAuthenticatedRequest() Function

**Location**: 
- `lib/role-context.jsx` (lines ~60-92)
- `hooks/use-student-enrollment.ts` (lines ~15-70)

**Issue**: Same logic duplicated in 2 places

**Recommendation**: Create shared utility function in `lib/api-client.ts`

---

### 3. Unused Variables/Imports

#### In `lib/role-context.jsx`:
```javascript
// UNUSED - never called in components
const [enrolled, setEnrolled] = useState([])  // Should be in use-student-enrollment hook

// NOT exported in context but defined
const createActivity()         // Only used by organizer
const approveActivity()        // Only used by admin/manager  
const rejectActivity()         // Only used by admin/manager
```

#### In `lib/auth-context.jsx`:
```javascript
// Token expiry check runs in interval but might be overkill
// Consider: Only refresh when actually needed (lazy refresh)
const tokenCheckInterval      // Heavy operation running every 30s
```

---

### 4. Unused Hooks

#### `hooks/use-mobile.ts`
- Defined but rarely used
- Should be used in responsive components but can be removed if not needed

#### `hooks/use-toast.ts`
- Defined but not actively used in current components
- Remove if no toast notifications needed

---

## 📊 Statistics

### Essential Code Lines (Non-UI):
- **auth-context.jsx**: ~300 lines (essential)
- **role-context.jsx**: ~350 lines (essential)
- **use-student-enrollment.ts**: ~250 lines (essential)
- **API routes**: ~200 lines (essential)
- **TOTAL Essential**: ~1,100 lines

### Redundant/Unused Code:
- **Console logs**: ~30 lines can be removed
- **Duplicate functions**: ~80 lines (makeAuthenticatedRequest)
- **Unused imports**: ~10 lines
- **TOTAL Removable**: ~120 lines

### Optimization Potential:
- **Extract shared functions**: -50 lines
- **Remove unused state**: -20 lines
- **Consolidate utils**: -30 lines

---

## ✅ Clean-up Action Plan

### Priority 1: High Impact (Quick Wins)
1. ✅ Remove all debug console.log statements
2. ✅ Extract `makeAuthenticatedRequest()` to shared utility
3. ✅ Remove unused hooks (use-mobile, use-toast) if not needed
4. ✅ Consolidate duplicate token refresh logic

### Priority 2: Medium Impact (Code Quality)
1. ✅ Move common functions to `lib/` shared utilities
2. ✅ Create `lib/api-client.ts` for authenticated requests
3. ✅ Refactor error handling to be consistent
4. ✅ Create `lib/token-utils.ts` for token operations

### Priority 3: Low Impact (Optimization)
1. ✅ Optimize token refresh interval (currently too aggressive)
2. ✅ Add request caching where applicable
3. ✅ Implement proper error boundaries
4. ✅ Add request/response interceptors

---

## 🎯 Summary

### ✅ What Works & Needed:
- ✅ Authentication flow (login, register, token refresh)
- ✅ Activity management (CRUD + filtering)
- ✅ Enrollment system (enroll, unenroll)
- ✅ Filter system (5 parameters)
- ✅ Pagination (page + size)
- ✅ Role-based access (admin, organizer, manager, student, guest)

### ❌ What to Remove/Optimize:
- ❌ Excessive console logging (30+ lines)
- ❌ Duplicate makeAuthenticatedRequest() (duplicate code)
- ❌ Unused hooks (use-mobile, use-toast)
- ❌ Overly aggressive token refresh interval
- ❌ Unused state in role-context

### 📈 Recommended Cleanup Order:
1. Remove console logs
2. Extract shared utilities
3. Consolidate duplicate functions
4. Remove unused imports/state
5. Optimize refresh logic
6. Add proper error handling

---

## 💡 Suggested New File Structure

```
lib/
  ├── auth-context.jsx          (300 lines - core auth)
  ├── role-context.jsx          (300 lines - core roles)
  ├── api-client.ts             (NEW - 100 lines - shared API logic)
  ├── token-utils.ts            (NEW - 50 lines - token helpers)
  ├── auth-utils.ts             (NEW - 40 lines - auth helpers)
  ├── utils.ts                  (existing)
  
hooks/
  ├── use-student-enrollment.ts (200 lines - keep, but refactor)
  ├── use-mobile.ts             (REMOVE if unused)
  ├── use-toast.ts              (REMOVE if unused)
```

**Estimated reduction**: ~150 lines of duplicate/redundant code
**Estimated organization improvement**: 40% (better code separation)

---

## 🚀 Next Steps

Would you like me to:
1. Remove all console logs?
2. Extract shared utilities?
3. Create consolidated api-client?
4. Optimize token refresh logic?
5. All of the above?
