# APTIT Frontend — Quản lý hoạt động sinh viên PTIT

## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc](#kiến-trúc)
- [Vai trò người dùng](#vai-trò-người-dùng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt & Chạy](#cài-đặt--chạy)
- [Cấu hình](#cấu-hình)
- [Cấu trúc trang (Dashboard)](#cấu-trúc-trang-dashboard)
- [API Routes](#api-routes)
- [Components](#components)
- [Hooks & Context](#hooks--context)

---

## Tổng quan

**APTIT Frontend** là ứng dụng web của hệ thống **quản lý hoạt động sinh viên** trường PTIT. Được xây dựng trên **Next.js** với **Radix UI** và **Tailwind CSS**, cung cấp giao diện riêng biệt cho từng vai trò (Admin, Manager, Organizer, Student, Guest). Frontend giao tiếp với backend thông qua các API routes trung gian (Next.js API routes) để proxy requests tới ECO_PTIT backend.

---

## Kiến trúc

```
User Browser
    │
    ▼
Next.js App (Frontend - APTIT)
Port: 3000 (mặc định)
    │
    │  API Routes (proxy)
    ▼
ECO_PTIT Backend (Java Spring Boot)
Port: 8080
    │
    ▼
MySQL Database
```

Frontend sử dụng **Next.js App Router**, giao tiếp với backend qua các API route handlers trong `app/api/`, mỗi route chỉ đóng vai trò proxy trung gian chuyển tiếp request đến Spring Boot backend.

---

## Vai trò người dùng

| Role | Dashboard | Mô tả |
|------|-----------|--------|
| `ADMIN` | `admin-dashboard.jsx` | Quản trị toàn phần: người dùng, cấu hình, backup, thống kê hệ thống |
| `MANAGER` | `manager-dashboard.jsx` | Quản lý cấp khoa: duyệt hoạt động, duyệt báo cáo, thống kê |
| `ORGANIZER` | `organizer-dashboard.jsx` | Người tổ chức CLB: tạo hoạt động, gửi duyệt, điểm danh, chấm điểm |
| `STUDENT` | `student-dashboard.jsx` | Sinh viên: xem hoạt động, đăng ký, xem điểm rèn luyện |
| `GUEST` | `guest-dashboard.jsx` | Khách: xem danh sách hoạt động công khai |

---

## Cấu trúc dự án

```
aptit-frontend/
├── app/                        # Next.js App Router
│   ├── api/                    # API Routes (proxy đến backend)
│   │   ├── _utils/
│   │   │   └── backend.js      # Utility proxy: getBearerToken, proxyBackendRequest
│   │   ├── activities/        # CRUD hoạt động, báo cáo, hủy
│   │   ├── admin/              # Proxy admin endpoints
│   │   ├── auth/              # Đăng nhập, đăng ký, token
│   │   ├── manager/           # Duyệt hoạt động, thống kê
│   │   ├── notifications/     # Thông báo
│   │   ├── organizer/         # Điểm danh, chấm điểm
│   │   ├── registrations/     # Đăng ký hoạt động
│   │   ├── rooms/            # Danh sách phòng
│   │   ├── student/          # Hoạt động đã đăng ký, điểm
│   │   ├── profile/          # Hồ sơ cá nhân
│   │   └── users/            # Quản lý users
│   ├── guest/                # Trang cho khách
│   ├── globals.css           # Global styles (Tailwind)
│   ├── layout.jsx            # Root layout
│   └── page.jsx              # Trang chủ / điều hướng theo role
│
├── components/
│   ├── dashboards/            # Dashboard components theo vai trò
│   │   ├── admin-dashboard.jsx
│   │   ├── guest-dashboard.jsx
│   │   ├── manager-dashboard.jsx
│   │   ├── organizer-dashboard.jsx
│   │   └── student-dashboard.jsx
│   ├── notifications/         # Panel thông báo
│   ├── profile/              # Hồ sơ cá nhân, đổi mật khẩu
│   ├── student/              # Grid hoạt động, bộ lọc, thông báo
│   ├── ui/                   # Radix UI primitive components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx / toaster.tsx
│   │   ├── table.tsx
│   │   ├── chart.tsx
│   │   ├── calendar.tsx
│   │   └── ... (30+ components)
│   ├── app-sidebar.jsx       # Sidebar điều hướng
│   ├── dashboard-header.jsx  # Header của dashboard
│   ├── login-form.jsx        # Form đăng nhập
│   ├── stat-card.jsx         # Card thống kê
│   ├── status-badge.jsx      # Badge trạng thái
│   └── theme-provider.tsx    # Theme provider (shadcn/ui)
│
├── hooks/                    # Custom React hooks
│   ├── use-manager-data.js
│   ├── use-organizer-data.js
│   ├── use-student-enrollment.ts
│   ├── use-mobile.ts
│   ├── use-toast.ts
│   └── use-url-filter-sync.js
│
├── lib/
│   ├── auth-context.jsx      # Auth context (login, logout, user state)
│   ├── role-context.jsx      # Role context (phân quyền UI)
│   └── utils.ts              # Utility functions
│
├── public/                   # Static assets
│   ├── icon.svg, icon-dark-32x32.png, icon-light-32x32.png
│   ├── placeholder-user.jpg, placeholder.jpg
│   └── apple-icon.png
│
├── styles/
│   └── globals.css
│
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Công nghệ sử dụng

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|-----------|
| **Next.js** | 14+ | Framework React, App Router |
| **React** | 18+ | Thư viện giao diện |
| **TypeScript** | — | Type safety |
| **Tailwind CSS** | 3.x | Styling |
| **Radix UI** | — | Headless UI primitives |
| **shadcn/ui** | — | Component library (30+ components) |
| **@hookform/resolvers** | 3.9.1 | Form validation |
| **sonner** | — | Toast notifications |
| **@vercel/analytics** | 1.6.1 | Analytics |

---

## Cài đặt & Chạy

### Yêu cầu

- **Node.js** 18+ 
- **npm** hoặc **pnpm** hoặc **yarn**
- Backend **ECO_PTIT** đang chạy tại `http://localhost:8080`

### Cài đặt

```bash
# Clone repository (nếu chưa có)
# Di chuyển vào thư mục frontend
npm install
```

### Chạy ứng dụng

```bash
# Development
npm run dev

# Build production
npm run build

# Production server
npm run start
```

Frontend mặc định chạy tại: `http://localhost:3000`

---

## Cấu hình

Tạo file `.env.local` trong thư mục gốc của frontend:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

---

## Cấu trúc trang (Dashboard)

### Admin Dashboard (`admin-dashboard.jsx`)

Giao diện quản trị toàn phần với các phần:

- **Activities Panel** — Quản lý hoạt động toàn hệ thống
- **Users Panel** — Tạo, chỉnh sửa, khóa người dùng
- **Announcements Panel** — Gửi thông báo broadcast
- **Settings Panel** — Cấu hình hệ thống, backup, restore, xem logs

### Manager Dashboard (`manager-dashboard.jsx`)

Giao diện quản lý cấp khoa:

- **Activities Pending** — Danh sách hoạt động chờ duyệt
- **Activity Detail Panel** — Chi tiết, duyệt/từ chối hoạt động
- **Reports Panel** — Duyệt báo cáo hoạt động
- **Statistics** — Thống kê hoạt động, thống kê sinh viên
- **Student Management** — Duyệt/từ chối đăng ký sinh viên

### Organizer Dashboard (`organizer-dashboard.jsx`)

Giao diện người tổ chức câu lạc bộ:

- **My Activities** — Hoạt động của CLB
- **Create Activity Panel** — Tạo hoạt động mới
- **Activity Detail Panel** — Chi tiết hoạt động, gửi duyệt
- **Check-in Panel** — Điểm danh sinh viên
- **Award Points Panel** — Chấm điểm sinh viên
- **Statistics** — Thống kê hoạt động CLB

### Student Dashboard (`student-dashboard.jsx`)

Giao diện sinh viên:

- **Activity Grid** — Xem & lọc hoạt động
- **Activity Filter** — Bộ lọc theo loại, trạng thái, thời gian
- **My Enrollments** — Hoạt động đã đăng ký
- **My Points** — Xem điểm rèn luyện
- **Notifications Panel** — Thông báo cá nhân

### Guest Dashboard (`guest-dashboard.jsx`)

Trang công khai cho khách:

- Xem danh sách hoạt động công khai
- Liên kết đăng nhập/đăng ký

---

## API Routes

Base URL: `/api`

### `app/api/_utils/backend.js`

Utility trung gian cho tất cả API routes:

```javascript
getBackendUrl()              // Lấy backend URL
getBearerToken(req)          // Trích xuất token từ header
proxyBackendRequest(req, path, options) // Proxy request đến backend
```

### Các nhóm API Routes

| Nhóm | Prefix | Mô tả |
|------|--------|--------|
| **Auth** | `/auth/*` | Đăng nhập, đăng ký, logout, refresh token, đổi mật khẩu |
| **Activities** | `/activities/*` | CRUD hoạt động, báo cáo, hủy, gửi duyệt |
| **Manager** | `/manager/*` | Duyệt/từ chối hoạt động, báo cáo, thống kê |
| **Admin** | `/admin/*` | Proxy toàn bộ admin endpoints |
| **Registrations** | `/registrations/*` | Đăng ký, hủy đăng ký |
| **Attendance** | `/attendance/*`, `/organizer/attendance/*` | Điểm danh |
| **Notifications** | `/notifications/*` | Thông báo |
| **Profile** | `/profile/*` | Hồ sơ cá nhân |
| **Student** | `/student/*` | Hoạt động đã đăng ký, điểm |
| **Rooms** | `/rooms/*` | Danh sách phòng |
| **Users** | `/users/*` | Thông tin user |

---

## Components

### Dashboards

| Component | Vai trò | Chức năng |
|-----------|---------|-----------|
| `admin-dashboard.jsx` | ADMIN | Quản trị hệ thống |
| `manager-dashboard.jsx` | MANAGER | Quản lý hoạt động |
| `organizer-dashboard.jsx` | ORGANIZER | Tổ chức hoạt động CLB |
| `student-dashboard.jsx` | STUDENT | Xem & đăng ký hoạt động |
| `guest-dashboard.jsx` | GUEST | Xem hoạt động công khai |

### UI Components (shadcn/ui)

| Component | File |
|-----------|------|
| Buttons | `button.tsx`, `button-group.tsx` |
| Forms | `form.tsx`, `field.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `input-otp.tsx` |
| Layout | `card.tsx`, `dialog.tsx`, `sheet.tsx`, `sidebar.tsx`, `drawer.tsx`, `collapsible.tsx` |
| Navigation | `tabs.tsx`, `breadcrumb.tsx`, `navigation-menu.tsx`, `menubar.tsx` |
| Feedback | `alert.tsx`, `alert-dialog.tsx`, `toast.tsx`, `toaster.tsx`, `skeleton.tsx`, `progress.tsx`, `spinner.tsx` |
| Data Display | `table.tsx`, `badge.tsx`, `avatar.tsx`, `tooltip.tsx`, `separator.tsx`, `empty.tsx`, `popover.tsx` |
| Media | `carousel.tsx`, `aspect-ratio.tsx` |
| Charts | `chart.tsx` |
| Utils | `accordion.tsx`, `context-menu.tsx`, `resizable.tsx`, `scroll-area.tsx`, `slider.tsx`, `toggle.tsx`, `toggle-group.tsx`, `item.tsx`, `input-group.tsx`, `label.tsx`, `kbd.tsx`, `hover-card.tsx` |

### Shared Components

| Component | File | Mô tả |
|-----------|------|--------|
| `app-sidebar.jsx` | — | Sidebar điều hướng với menu theo vai trò |
| `dashboard-header.jsx` | — | Header với user info và notifications |
| `login-form.jsx` | — | Form đăng nhập |
| `stat-card.jsx` | — | Card hiển thị số liệu thống kê |
| `status-badge.jsx` | — | Badge hiển thị trạng thái hoạt động/đăng ký |
| `notifications-panel.jsx` | — | Panel thông báo |
| `personal-profile-panel.jsx` | — | Hồ sơ cá nhân |
| `change-password-dialog.jsx` | — | Dialog đổi mật khẩu |

---

## Hooks & Context

### Context

| Context | File | Mô tả |
|---------|------|-------|
| `AuthContext` | `lib/auth-context.jsx` | Quản lý trạng thái đăng nhập, user info, token |
| `RoleContext` | `lib/role-context.jsx` | Quản lý vai trò hiện tại, điều hướng dashboard |

### Custom Hooks

| Hook | File | Mô tả |
|------|------|--------|
| `useManagerData` | `hooks/use-manager-data.js` | Load dữ liệu cho Manager dashboard |
| `useOrganizerData` | `hooks/use-organizer-data.js` | Load dữ liệu cho Organizer dashboard |
| `useStudentEnrollment` | `hooks/use-student-enrollment.ts` | Load hoạt động đã đăng ký của sinh viên |
| `useUrlFilterSync` | `hooks/use-url-filter-sync.js` | Đồng bộ filter với URL params |
| `useMobile` | `hooks/use-mobile.ts` | Kiểm tra thiết bị di động |
| `useToast` | `hooks/use-toast.ts` | Toast notification hook |

---

## Luồng nghiệp vụ chính

### Luồng đăng nhập

```
login-form.jsx
  → POST /api/auth/login
  → AuthenticationController.login()
  → JWT token
  → auth-context.jsx (lưu token, user info)
  → role-context.jsx (xác định dashboard)
  → Điều hướng đến dashboard tương ứng
```

### Luồng tạo hoạt động (Organizer)

```
organizer-dashboard.jsx
  → CreateActivityPanel
  → POST /api/activities
  → ActivityController.createActivity()
  → ActivityService.createActivity()
  → status = Draft
  → Organizer gửi duyệt: PATCH /api/activities/{id}/submit
  → status = Pending
```

### Luồng đăng ký hoạt động (Student)

```
student-dashboard.jsx
  → Activity Grid → Click đăng ký
  → POST /api/registrations
  → RegistrationController.register()
  → NotificationService gửi thông báo cho organizer
  → Registration status = Pending
```

### Luồng duyệt hoạt động (Manager)

```
manager-dashboard.jsx
  → Activities Pending → Click chi tiết
  → Activity Detail Panel
  → PATCH /api/manager/activities/{id}/approve
  → ManagerActivityController.approveActivity()
  → Activity status = Approved
  → NotificationService gửi thông báo cho organizer
```

### Luồng điểm danh

```
organizer-dashboard.jsx
  → Check-in Panel
  → PATCH /api/organizer/attendance/check-in
  → AttendanceService.checkIn()
  → Tạo/cập nhật Attendance record
  → Organizer chấm điểm: POST /api/organizer/attendance/points
```
