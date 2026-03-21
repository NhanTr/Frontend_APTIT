# 📊 Luồng Hoạt Động Chi Tiết Từng File

## 1️⃣ KHỞI ĐỘNG APPLICATION

```
next.config.mjs (Cấu hình Next.js)
   ↓
package.json (Định nghĩa dependencies)
   ↓
app/layout.jsx (Root Layout)
   • Import globals.css
   • Thiết lập metadata
   • Render {children}
   ↓
app/page.jsx (Main Page)
   • Import RoleProvider từ lib/role-context.jsx
   • Wrap <RoleProvider> để cung cấp context toàn cầu
   • Render <AppContent />
```

---

## 2️⃣ TRẠNG THÁI BAN ĐẦU - CHƯA ĐĂNG NHẬP

**File chính: `app/page.jsx` → `AppContent` component**

```
AppContent() {
  const { isAuthenticated, currentUser } = useRole()
  // isAuthenticated = false (ban đầu)
  
  if (!isAuthenticated) {
    return <LoginForm />  ← Hiển thị form đăng nhập
  }
}
```

### **Tệp liên quan:**
- `app/page.jsx` - Logic kiểm tra trạng thái
- `components/login-form.jsx` - Giao diện đăng nhập
- `lib/role-context.jsx` - Context provider (chứa `useRole()` hook)

---

## 3️⃣ QUY TRÌNH ĐĂNG NHẬP

### **Step 1: Người dùng mở trang**

```
components/login-form.jsx
├── State: selectedRole = null
├── State: showPassword = false
├── State: isLoading = false
└── Hiển thị: 3 nút chọn vai trò (Admin, Teacher, Student)
```

### **Step 2: Người dùng chọn vai trò (VD: Admin)**

```
components/login-form.jsx
├── onClick handler → handleRoleSelection('admin')
├── Set selectedRole = 'admin'
├── Tìm user trong mockUsers có role = 'admin'
│  └── Import từ lib/mock-data.js
├── Điền tự động:
│  ├── email = 'admin@eduactivity.com'
│  └── password = 'demo123'
└── Hiển thị form đăng nhập (credentials form)
```

**Tệp liên quan:**
- `components/login-form.jsx` - Xử lý chọn vai trò
- `lib/mock-data.js` - Dữ liệu mock users

### **Step 3: Người dùng nhấn "Sign In"**

```
components/login-form.jsx
├── onClick handler → handleSignIn()
├── Gọi: useRole() hook → getContext RoleContext
├── Gọi: setRole('admin')  ← từ lib/role-context.jsx
│  ├── Tìm user từ mockUsers có role = 'admin'
│  ├── Set currentUser = { id, name, email, role: 'admin' }
│  └── Set isAuthenticated = true
├── Context state cập nhật
└── AppContent re-render
```

**Flow file:**
```
components/login-form.jsx
    ↓ (gọi setRole)
lib/role-context.jsx (RoleContext)
    ↓ (update context state)
app/page.jsx (AppContent)
    ↓ (check isAuthenticated)
    → isAuthenticated = true ✓
```

---

## 4️⃣ HIỂN THỊ DASHBOARD (AFTER LOGIN)

**File chính: `app/page.jsx` → `AppContent` component**

```
AppContent() {
  const { isAuthenticated, currentUser } = useRole()
  
  if (!isAuthenticated) return <LoginForm />
  
  // currentUser.role = 'admin' | 'teacher' | 'student'
  
  const { title, subtitle, component: Dashboard } = 
    dashboardConfig[currentUser.role]
  
  return (
    <div className="flex h-screen">
      ├── <AppSidebar isOpen={sidebarOpen} />
      │   └── components/app-sidebar.jsx
      │
      ├── <div className="flex flex-1 flex-col">
      │   ├── <DashboardHeader />
      │   │   └── components/dashboard-header.jsx
      │   │
      │   └── <main>
      │       ├── <AdminDashboard />      (nếu role = 'admin')
      │       ├── <TeacherDashboard />    (nếu role = 'teacher')
      │       └── <StudentDashboard />     (nếu role = 'student')
      │           └── từ components/dashboards/
      │
      └── State: sidebarOpen (mobile sidebar toggle)
  )
}
```

### **Tệp liên quan:**
```
app/page.jsx
├── Import: AppSidebar (components/app-sidebar.jsx)
├── Import: DashboardHeader (components/dashboard-header.jsx)
├── Import: AdminDashboard (components/dashboards/admin-dashboard.jsx)
├── Import: TeacherDashboard (components/dashboards/teacher-dashboard.jsx)
├── Import: StudentDashboard (components/dashboards/student-dashboard.jsx)
└── Hook: useRole() từ lib/role-context.jsx
```

---

## 5️⃣ CHI TIẾT MỖI DASHBOARD

### **🔴 ADMIN DASHBOARD**

```
components/dashboards/admin-dashboard.jsx
│
├── Import mock data từ lib/mock-data.js
│  ├── mockActivities
│  ├── mockStudents
│  ├── mockTeachers
│  └── mockAnnouncements
│
├── State: searchTerm, selectedCategory, selectedStatus
│
├── Render:
│  ├── Statistics Cards (StatCard component)
│  │  ├── components/stat-card.jsx
│  │  └── Hiển thị: Total Activities, Students, Teachers, Reports
│  │
│  ├── Filter UI:
│  │  ├── Search input (tìm kiếm hoạt động)
│  │  ├── Category filter dropdown
│  │  └── Status filter dropdown
│  │
│  ├── Activities Table:
│  │  ├── Bảng danh sách hoạt động
│  │  ├── Cột: Title, Category, Status, Students, Actions
│  │  ├── Actions: View, Edit, Delete
│  │  └── Import: table.tsx (UI component từ components/ui/)
│  │
│  └── Charts (Recharts):
│     ├── Activity distribution by category
│     └── Import: chart.tsx từ components/ui/
│
└── Chưa có tính năng tương tác (CRUD) - chỉ hiển thị dữ liệu
```

**Tệp liên quan:**
```
components/dashboards/admin-dashboard.jsx
├── Import: lib/mock-data.js (dữ liệu)
├── Import: components/stat-card.jsx (thẻ thống kê)
├── Import: components/ui/table.tsx (bảng)
├── Import: components/ui/chart.tsx (biểu đồ)
├── Import: components/ui/button.tsx (nút)
├── Import: components/ui/input.tsx (ô nhập liệu)
├── Import: components/ui/select.tsx (dropdown)
└── Import: lucide-react (icons)
```

---

### **👨‍🏫 TEACHER DASHBOARD**

```
components/dashboards/teacher-dashboard.jsx
│
├── Import mock data từ lib/mock-data.js
│  ├── mockActivities
│  └── mockStudents
│
├── State: activeTab ('activities' | 'students')
│
├── Logic: Filter dữ liệu theo currentUser (giáo viên)
│  ├── Lấy: instructorId từ currentUser hoặc hardcode = 't1'
│  ├── My Activities: Filter activities có instructorId = 't1'
│  └── My Students: Filter students có enrolledActivities từ activities của teacher
│
├── Render:
│  ├── Tabs (2 tabs):
│  │  ├── Import: components/ui/tabs.tsx
│  │  │
│  │  ├── Tab 1: "My Activities"
│  │  │  ├── Activity Cards:
│  │  │  │  ├── Import: components/stat-card.jsx (hoặc card tùy chỉnh)
│  │  │  │  ├── Hiển thị: Title, Description, Category, Date, Status
│  │  │  │  ├── Button: "Edit", "View Details"
│  │  │  │  └── Badge: Status (ongoing/upcoming/completed)
│  │  │  │      └── Import: components/status-badge.jsx
│  │  │  │
│  │  │  └── Nếu không có activity:
│  │  │     └── Hiển thị: "No activities yet"
│  │  │
│  │  └── Tab 2: "My Students"
│  │     ├── Table hoặc List:
│  │     │  ├── Import: components/ui/table.tsx
│  │     │  ├── Cột: Student Name, Email, Activities Count, Joined Date
│  │     │  ├── Actions: View Profile, View Details
│  │     │  │
│  │     │  └── Dữ liệu: Lọc từ mockStudents
│  │     │     ├── Chỉ hiển thị students có activities của teacher này
│  │     │     └── Tính: activities count
│  │     │
│  │     └── Nếu không có student:
│  │        └── Hiển thị: "No students yet"
│  │
│  └── Filter/Search (nếu có):
│     ├── Input tìm kiếm
│     └── Import: components/ui/input.tsx
│
└── Chưa có tính năng crud - chỉ xem dữ liệu
```

**Tệp liên quan:**
```
components/dashboards/teacher-dashboard.jsx
├── Import: lib/mock-data.js (dữ liệu)
├── Import: lib/role-context.jsx (useRole hook để lấy currentUser)
├── Import: components/ui/tabs.tsx (tabs)
├── Import: components/ui/table.tsx (bảng)
├── Import: components/ui/card.tsx (card)
├── Import: components/stat-card.jsx (thẻ thống kê)
├── Import: components/status-badge.jsx (badge trạng thái)
├── Import: components/ui/button.tsx (nút)
└── Import: lucide-react (icons)
```

---

### **👨‍🎓 STUDENT DASHBOARD**

```
components/dashboards/student-dashboard.jsx
│
├── Import mock data từ lib/mock-data.js
│  ├── mockActivities
│  └── mockStudents (để lấy enrolled list của sinh viên)
│
├── State: activeTab ('browse' | 'enrollments')
├── State: selectedCategory (filter)
├── State: searchTerm (tìm kiếm)
│
├── Logic: Filter dữ liệu theo currentUser (sinh viên)
│  ├── Lấy: enrolledIds từ currentUser hoặc hardcode = ['a1', 'a4']
│  └── My Enrollments: Activities có id trong enrolledIds
│
├── Render:
│  ├── Tabs (2 tabs):
│  │  ├── Import: components/ui/tabs.tsx
│  │  │
│  │  ├── Tab 1: "Browse Activities"
│  │  │  ├── Filter UI:
│  │  │  │  ├── Search input
│  │  │  │  └── Category dropdown
│  │  │  │     └── Import: components/ui/select.tsx
│  │  │  │
│  │  │  ├── Activity Cards (Grid):
│  │  │  │  ├── Import: components/ui/card.tsx
│  │  │  │  ├── Hiển thị: Title, Description, Category, Date, Location, Status
│  │  │  │  ├── Progress: "Enrolled: X/Capacity"
│  │  │  │  │  └── Import: components/ui/progress.tsx
│  │  │  │  │
│  │  │  │  ├── Button: "Enroll" (nếu chưa enroll)
│  │  │  │  │  └── onClick: Thêm activity id vào enrolledIds
│  │  │  │  │
│  │  │  │  └── Button: "Unenroll" (nếu đã enroll và có confirm)
│  │  │  │     └── onClick: Xóa activity id khỏi enrolledIds
│  │  │  │
│  │  │  └── Nếu không có hoạt động:
│  │  │     └── Hiển thị: Empty state (icon + message)
│  │  │        └── Import: components/empty.tsx
│  │  │
│  │  └── Tab 2: "My Enrollments"
│  │     ├── List hoặc Cards:
│  │     │  ├── Hiển thị: Title, Date, Location, Progress, Status
│  │     │  │
│  │     │  ├── Progress bar:
│  │     │  │  └── Thể hiện: % hoàn thành hoặc % attending
│  │     │  │
│  │     │  ├── Actions:
│  │     │  │  ├── "View Details" button
│  │     │  │  └── "Unenroll" button (confirm)
│  │     │  │
│  │     │  └── Dữ liệu: mockActivities filtered by enrolledIds
│  │     │
│  │     └── Nếu không có enrolled activity:
│  │        └── Hiển thị: "No enrolled activities"
│  │
│  └── Notifications/Announcements (nếu có):
│     ├── Import: 🔔 notification badge từ dashboard-header
│     └── Announcement list (có thể từ mockAnnouncements)
│
└── State management: enrolledIds (có thể từ context hoặc local state)
```

**Tệp liên quan:**
```
components/dashboards/student-dashboard.jsx
├── Import: lib/mock-data.js (dữ liệu)
├── Import: lib/role-context.jsx (useRole hook)
├── Import: components/ui/tabs.tsx (tabs)
├── Import: components/ui/card.tsx (card)
├── Import: components/ui/button.tsx (nút)
├── Import: components/ui/input.tsx (input tìm kiếm)
├── Import: components/ui/select.tsx (dropdown filter)
├── Import: components/ui/progress.tsx (progress bar)
├── Import: components/empty.tsx (empty state)
├── Import: components/ui/dialog.tsx (dialog xác nhận unenroll)
├── Import: lucide-react (icons)
└── State: activeTab, selectedCategory, searchTerm
```

---

## 6️⃣ SIDEBAR & HEADER

### **AppSidebar**

```
components/app-sidebar.jsx
│
├── Props: isOpen (boolean), onClose (function)
│
├── Import: lib/role-context.jsx (useRole hook)
│ 
├── Logic: Tạo navigation items dựa trên role
│  ├── Admin role:
│  │  ├── Dashboard
│  │  ├── Activities
│  │  ├── Users
│  │  ├── Reports
│  │  └── Settings
│  │
│  ├── Teacher role:
│  │  ├── Dashboard
│  │  ├── My Activities
│  │  ├── My Students
│  │  └── Reports
│  │
│  └── Student role:
│     ├── Dashboard
│     ├── Browse Activities
│     ├── My Enrollments
│     └── Profile
│
├── Render:
│  ├── Logo/Brand
│  │  └── "EduActivity Manager"
│  │
│  ├── Navigation Menu:
│  │  ├── Import: components/ui/navigation-menu.tsx
│  │  │           hoặc components/ui/menubar.tsx
│  │  └── navigation items (role-based)
│  │
│  ├── User Profile Card (bottom):
│  │  ├── Avatar: currentUser.name
│  │  │  └── Import: components/ui/avatar.tsx
│  │  │
│  │  ├── User Info:
│  │  │  ├── Name: currentUser.name
│  │  │  ├── Role: currentUser.role (formatted)
│  │  │  └── Email: currentUser.email
│  │  │
│  │  └── Actions:
│  │     ├── Settings button (icon)
│  │     └── Logout button:
│  │        ├── Gọi: logout() từ useRole hook
│  │        ├── Set isAuthenticated = false
│  │        ├── Clear currentUser
│  │        └── Back to LoginForm
│  │           └── app/page.jsx (re-render)
│  │
│  └── Close button (mobile):
│     └── onClick: onClose() từ props
│
├── Styling:
│  ├── Responsive: w-full sm:w-64 (mobile: full width, desktop: 256px)
│  └── Import: components/ui/sidebar.tsx
│
└── Mobile: Drawer/Sheet overlay
   └── Import: components/ui/sheet.tsx
```

**Tệp liên quan:**
```
components/app-sidebar.jsx
├── Import: lib/role-context.jsx (useRole hook - logout)
├── Import: components/ui/sidebar.tsx
├── Import: components/ui/navigation-menu.tsx
├── Import: components/ui/avatar.tsx
├── Import: components/ui/button.tsx
├── Import: components/ui/sheet.tsx (mobile drawer)
├── Import: lucide-react (icons)
└── Props từ: app/page.jsx (isOpen, onClose)
```

---

### **DashboardHeader**

```
components/dashboard-header.jsx
│
├── Props: title (string), subtitle (string), onMenuClick (function)
│
├── Render:
│  ├── Header container:
│  │  ├── Menu toggle button (mobile):
│  │  │  └── onClick: onMenuClick() từ props
│  │  │     └── Set sidebarOpen = true ở app/page.jsx
│  │  │
│  │  ├── Page Title & Subtitle:
│  │  │  ├── Hiển thị: title, subtitle từ props
│  │  │  └── VD: "Admin Dashboard", "System overview and management"
│  │  │
│  │  ├── Search Bar (optional):
│  │  │  ├── Input tìm kiếm
│  │  │  └── Icon: Search (lucide-react)
│  │  │
│  │  └── Right Side Actions:
│  │     ├── Notifications bell:
│  │     │  ├── Icon: Bell
│  │     │  ├── Badge: notification count
│  │     │  └── onClick: Mở notification panel (nếu có)
│  │     │
│  │     └── Theme toggle (dark/light mode):
│  │        ├── Import: components/theme-provider.tsx
│  │        ├── Icon: Sun/Moon
│  │        └── onClick: Toggle theme
│  │
│  └── bottom: Divider
│     └── Import: components/ui/separator.tsx
│
├── Styling:
│  ├── Responsive: flex layout
│  ├── Row: flex items center justify-between
│  └── Sticky top (stays at top when scrolling)
│
└── Imports:
   ├── lucide-react (icons: Menu, Bell, Sun, Moon)
   ├── components/ui/button.tsx
   ├── components/ui/separator.tsx
   └── components/theme-provider.tsx
```

**Tệp liên quan:**
```
components/dashboard-header.jsx
├── Props từ: app/page.jsx (title, subtitle, onMenuClick)
├── Import: lucide-react (icons)
├── Import: components/ui/button.tsx
├── Import: components/ui/separator.tsx
├── Import: components/ui/input.tsx
├── Import: components/theme-provider.tsx
└── Import: components/ui/badge.tsx (notification badge)
```

---

## 7️⃣ LOGOUT FLOW

```
User clicks "Logout" button
    ↓
components/app-sidebar.jsx
├── Handler: handleLogout()
├── Gọi: logout() từ useRole hook
│
└── Navigate to: lib/role-context.jsx
   ├── Set: currentUser = null
   ├── Set: isAuthenticated = false
   └── Update global state
   
    ↓
app/page.jsx (AppContent re-render)
├── const { isAuthenticated } = useRole()
│  // isAuthenticated = false
│
├── if (!isAuthenticated) {
│  return <LoginForm />  ← Back to login
└── }
```

---

## 8️⃣ THEME PROVIDER (Dark/Light Mode)

```
components/theme-provider.tsx
│
├── Import: next-themes
│
├── Wrap: <ThemeProvider attribute="class" defaultTheme="system">
│  └── Wraps entire app (từ app/layout.jsx)
│
├── Provides:
│  ├── theme (current theme: 'light' | 'dark' | 'system')
│  ├── setTheme (function to change theme)
│  └── resolvedTheme (resolved theme value)
│
├── Usage:
│  ├── Access via: useTheme() hook
│  ├── Call: setTheme('dark') hoặc setTheme('light')
│  └── Stores: localStorage (persisted)
│
└── Applied to: app/layout.jsx (root)
   └── Cả app được wrap với theme provider
```

**Tệp liên quan:**
```
components/theme-provider.tsx
├── Import: next-themes
└── Export: ThemeProvider component (được sử dụng ở app/layout.jsx)
```

---

## 9️⃣ UI COMPONENTS LIBRARY

**Tất cả UI components được import từ `components/ui/` - Shadcn/ui library:**

```
components/ui/
├── accordion.tsx         → Collapsible sections
├── alert.tsx            → Alert messages
├── avatar.tsx           → User avatars
├── badge.tsx            → Status badges
├── button.tsx           → Buttons (primary, secondary)
├── card.tsx             → Card containers
├── chart.tsx            → Recharts wrapper
├── checkbox.tsx         → Checkboxes
├── dialog.tsx           → Modal dialogs
├── dropdown-menu.tsx    → Dropdown menus
├── empty.tsx            → Empty states
├── form.tsx             → Form wrapper (React Hook Form)
├── input.tsx            → Input fields
├── label.tsx            → Form labels
├── navigation-menu.tsx  → Navigation menus
├── pagination.tsx       → Pagination
├── progress.tsx         → Progress bars
├── select.tsx           → Select dropdowns
├── separator.tsx        → Dividers
├── sheet.tsx            → Drawer/Sheet (mobile sidebar)
├── sidebar.tsx          → Sidebar layout
├── skeleton.tsx         → Loading placeholders
├── status-badge.tsx     → Custom status badges
├── table.tsx            → Data tables
├── tabs.tsx             → Tab navigation
├── toast.tsx            → Toast notifications
├── toaster.tsx          → Toast container
├── tooltip.tsx          → Tooltips
├── use-mobile.tsx       → Mobile breakpoint hook
├── use-toast.ts         → Toast hook
└── ... (30+ components total)
```

---

## 🔟 MOCK DATA

```
lib/mock-data.js
│
├── mockUsers (3 users):
│  ├── Sarah Chen (admin@eduactivity.com)
│  ├── James Wilson (teacher@eduactivity.com)
│  └── Emily Parker (student@eduactivity.com)
│
├── mockActivities (8 activities):
│  ├── Fields: id, title, description, category, status, date, time, 
│  │           location, capacity, enrolled, instructorId
│  └── Example: 
│     {
│       id: 'a1',
│       title: 'Basketball Training',
│       category: 'sports',
│       status: 'ongoing',
│       instructorId: 't1' (James Wilson)
│     }
│
├── mockStudents (8 students):
│  ├── Fields: id, name, email, grade, enrolledActivities[], joinDate
│  └── Example:
│     {
│       id: 's1',
│       name: 'Emily Parker',
│       enrolledActivities: ['a1', 'a4']
│     }
│
├── mockTeachers (4 teachers):
│  ├── Fields: id, name, email, department, activitiesManaged[]
│  └── Used by: Admin Dashboard (view all teachers)
│
└── mockAnnouncements (4 announcements):
   ├── Fields: id, title, content, author, date, priority
   └── Display on: Dashboard headers (optional)
```

**Import này được sử dụng bởi:**
```
lib/mock-data.js ←
├── components/dashboards/admin-dashboard.jsx
├── components/dashboards/teacher-dashboard.jsx
├── components/dashboards/student-dashboard.jsx
├── components/login-form.jsx (tìm users từ mockUsers)
└── components/app-sidebar.jsx (optional - để lấy user info)
```

---

## 1️⃣1️⃣ COMPLETE REQUEST-RESPONSE FLOW (EXAMPLE)

**Scenario: Teacher đăng nhập → xem "My Activities"**

```
1. Browser loads http://localhost:3000/
   └── next.config.mjs → app/layout.jsx → app/page.jsx

2. app/page.jsx renders:
   ├── <RoleProvider> wraps AppContent
   └── RoleProvider initializes: isAuthenticated = false

3. AppContent checks isAuthenticated:
   ├── if (!isAuthenticated) return <LoginForm />

4. LoginForm displays:
   ├── 3 role buttons (Admin, Teacher, Student)
   └── User clicks "Teacher" button

5. User fills form:
   ├── Email: teacher@eduactivity.com (auto-filled)
   ├── Password: demo123 (auto-filled)
   └── User clicks "Sign In"

6. LoginForm calls setRole('teacher'):
   ├── Imports lib/mock-data.js
   ├── Finds: James Wilson { role: 'teacher', ... }
   ├── Updates context:
   │  ├── currentUser = James Wilson object
   │  └── isAuthenticated = true
   └── AppContent re-renders

7. AppContent now renders Dashboard:
   ├── isAuthenticated = true ✓
   ├── currentUser.role = 'teacher'
   │
   ├── Renders Layout:
   │  ├── <AppSidebar>
   │  │  ├── useRole() → Get currentUser
   │  │  ├── Create nav items for Teacher role
   │  │  ├── Show: "My Activities", "My Students"
   │  │  └── Show: currentUser name, email, logout button
   │  │
   │  ├── <DashboardHeader>
   │  │  ├── title = "Teacher Dashboard"
   │  │  ├── subtitle = "Manage your activities and students"
   │  │  └── Buttons: Menu (mobile), Search, Notifications
   │  │
   │  └── <TeacherDashboard>
   │     ├── Import: lib/mock-data.js
   │     ├── Import: lib/role-context.jsx (useRole)
   │     │
   │     ├── Render: 2 Tabs (My Activities, My Students)
   │     ├── Default tab: My Activities
   │     │
   │     ├── Filter logic:
   │     │  ├── Get: instructorId = currentUser.id = 't1'
   │     │  ├── Filter: mockActivities where instructorId = 't1'
   │     │  ├── Result: Activities managed by James Wilson
   │     │  └── Example: 'Basketball Training', 'Coding Workshop'
   │     │
   │     ├── Render Activity Cards:
   │     │  ├── Import: components/ui/card.tsx
   │     │  ├── Import: components/stat-card.jsx
   │     │  ├── Import: components/status-badge.jsx
   │     │  └── For each activity:
   │     │     ├── Card title: "Basketball Training"
   │     │     ├── Card description: "Learn basketball basics"
   │     │     ├── Status badge: "ongoing"
   │     │     ├── Button: "Edit 
", "View Details"
   │     │     └── Date/Time info
   │     │
   │     └── Bottom: "My Students" tab
   │        └── Click tab → Show filtered students
   │           ├── Get students enrolled in teacher's activities
   │           ├── Display: name, email, activity count, joined date
   │           └── Import: components/ui/table.tsx

8. User interactions:
   ├── Click "My Students" tab:
   │  └── State change: activeTab = 'students'
   │     └── Re-render: Show student list for this teacher
   │
   ├── Click logout button (AppSidebar):
   │  ├── Call: logout() hook
   │  ├── Update context: isAuthenticated = false
   │  └── AppContent re-renders → shows LoginForm
   │
   └── Click menu (mobile):
      ├── Set: sidebarOpen = true
      └── AppSidebar shows as overlay (Sheet/Drawer)
         └── Import: components/ui/sheet.tsx
```

---

## 1️⃣2️⃣ FILE DEPENDENCY TREE

```
app/page.jsx (MAIN ENTRY)
│
├── lib/role-context.jsx (Context Provider)
│  └── Provides: isAuthenticated, currentUser, setRole, logout
│
├── components/login-form.jsx (Auth UI)
│  ├── lib/mock-data.js (User data)
│  └── components/ui/* (Form components)
│
├── components/app-sidebar.jsx (Navigation)
│  ├── lib/role-context.jsx (useRole hook)
│  └── components/ui/* (Sidebar components)
│
├── components/dashboard-header.jsx (Header)
│  └── components/ui/* (Header components)
│
└── components/dashboards/* (Role-based dashboards)
   ├── admin-dashboard.jsx
   │  ├── lib/mock-data.js
   │  └── components/ui/* (Table, Chart, etc)
   │
   ├── teacher-dashboard.jsx
   │  ├── lib/mock-data.js
   │  ├── lib/role-context.jsx
   │  └── components/ui/* (Tabs, Card, etc)
   │
   └── student-dashboard.jsx
      ├── lib/mock-data.js
      ├── lib/role-context.jsx
      └── components/ui/* (Tabs, Card, Progress, etc)

Global:
├── app/layout.jsx
│  ├── components/theme-provider.tsx
│  └── globals.css
│
└── package.json (Dependencies)
   ├── next (Framework)
   ├── react (UI Library)
   ├── tailwindcss (Styling)
   ├── recharts (Charts)
   ├── react-hook-form (Forms)
   ├── zod (Validation)
   ├── next-themes (Theme)
   └── ... (30+ dependencies)
```

---

## Summary

| Phase | Files | Key Actions |
|-------|-------|-------------|
| **Initialization** | `app/layout.jsx` → `app/page.jsx` | Load app, setup context |
| **Login** | `components/login-form.jsx` → `lib/role-context.jsx` | User auth, set role |
| **Dashboard** | `components/dashboards/*.jsx` → `lib/mock-data.js` | Display role-specific UI |
| **Navigation** | `components/app-sidebar.jsx` | Role-based menu items |
| **Header** | `components/dashboard-header.jsx` | Page title, actions |
| **Theme** | `components/theme-provider.tsx` | Dark/light mode |
| **UI Library** | `components/ui/*.tsx` | Reusable UI components |
| **Logout** | `components/app-sidebar.jsx` → `lib/role-context.jsx` | Reset auth state |

