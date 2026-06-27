# Luồng chức năng hệ thống quản lý hoạt động PTIT

Tài liệu này dùng để thuyết trình đồ án. Mỗi chức năng được trình bày theo 4 phần:

- Người dùng thao tác gì trên giao diện.
- Frontend đi qua component/hook/API route nào.
- Backend đi qua controller/service/repository nào.
- Kết quả nghiệp vụ thay đổi ra sao.

Quy ước luồng code:

```text
Giao diện -> Hook/Context -> Next.js API route -> Spring Boot Controller -> Service -> Repository -> Database
```

## 1. Tổng quan kiến trúc

Hệ thống gồm 2 phần:

- `Frontend_APTIT`: Next.js, React component, hook, context và API route proxy.
- `ECO_PTIT`: Spring Boot, JWT security, controller, service, repository, entity.

Luồng tổng quát:

```text
Browser
  -> Frontend_APTIT/app/page.jsx
  -> AuthProvider trong lib/auth-context.jsx
  -> RoleProvider trong lib/role-context.jsx
  -> Dashboard theo role
  -> Component chức năng
  -> Hook gọi API nội bộ /api/...
  -> app/api/.../route.js proxy sang backend
  -> ECO_PTIT Controller
  -> Service xử lý nghiệp vụ
  -> Repository thao tác database
```

Các vai trò chính:

| Vai trò | Dashboard | Chức năng chính |
|---|---|---|
| `student` | `components/dashboards/student-dashboard.jsx` | Xem hoạt động, đăng ký, hủy đăng ký, check-in, xem điểm, xem thông báo |
| `organizer` | `components/dashboards/organizer-dashboard.jsx` | Tạo hoạt động, sửa/xóa/gửi duyệt, quản lý sinh viên, điểm danh, nộp báo cáo |
| `manager` | `components/dashboards/manager-dashboard.jsx` | Duyệt hoạt động, từ chối, hủy, duyệt báo cáo, thống kê sinh viên |
| `admin` | `components/dashboards/admin-dashboard.jsx` | Quản lý người dùng, vai trò, thông báo, cấu hình, backup, log |

## 2. Luồng đăng nhập và phân quyền

### Mục đích

Người dùng đăng nhập để hệ thống biết vai trò và hiển thị đúng dashboard.

### Luồng code

```text
components/login-form.jsx
  -> gọi useAuth().login(username, password)
  -> lib/auth-context.jsx login()
  -> POST /api/auth/login
  -> app/api/auth/login/route.js
  -> POST backend /auth/token
  -> AuthenticationController.authenticate()
  -> AuthenticationService.authenticate()
  -> UserRepository.findByUsername()
  -> JwtUtil.generateToken()
  -> trả accessToken, refreshToken, user
  -> auth-context lưu token vào localStorage
  -> app/page.jsx đọc user.role
  -> render dashboard theo role
```

### Điểm thuyết trình

Khi đăng nhập thành công, backend sinh JWT có claim `scopes`, ví dụ `ADMIN`, `MANAGER`, `ORGANIZER`, `STUDENT`. Frontend đọc role từ token để điều hướng giao diện. Backend vẫn kiểm tra quyền lần nữa bằng `SecurityConfig.java` và `@PreAuthorize`, nên người dùng không thể chỉ sửa giao diện để vượt quyền.

## 3. Luồng xem danh sách hoạt động

### Mục đích

Sinh viên và khách có thể xem các hoạt động; các vai trò khác cũng dùng dữ liệu hoạt động cho dashboard.

### Luồng code

```text
app/page.jsx
  -> RoleProvider trong lib/role-context.jsx
  -> useEffect fetchActivities()
  -> GET /api/activities?page=0&size=10&status=...&sponsor=...
  -> app/api/activities/route.js
  -> GET backend /api/v1/activities
  -> ActivityController.getAllActivities()
  -> ActivityService.searchActivities()
  -> ActivityRepository.searchActivities(...)
  -> ActivityMapper.toResponse()
  -> RoleProvider.transformActivity()
  -> setActivities()
  -> components/student/activity-grid.jsx render danh sách
```

### Bộ lọc hoạt động

```text
components/student/activity-filter.jsx
  -> StudentDashboard.handleFilterChange()
  -> hooks/use-url-filter-sync.js cập nhật query URL
  -> RoleProvider.applyFilters()
  -> gọi lại GET /api/activities với query mới
```

### Điểm thuyết trình

Danh sách hoạt động không hard-code trên giao diện. Frontend gọi API, backend tìm kiếm theo trạng thái, nhà tài trợ, thời gian, địa điểm rồi trả dữ liệu phân trang.

## 4. Luồng tạo hoạt động

### Người thao tác

`organizer`.

### Mục đích

Ban tổ chức/CLB tạo hoạt động mới, nhập thông tin thời gian, phòng, số lượng, điểm rèn luyện, nhà tài trợ và có thể lưu nháp hoặc gửi duyệt ngay.

### Luồng giao diện

```text
Sidebar chọn "create-activity"
  -> app/page.jsx set activeSection="create-activity"
  -> OrganizerDashboard
  -> CreateActivityPanel
  -> ActivityForm
```

### Luồng tạo bản nháp

```text
ActivityForm
  -> người dùng nhập form
  -> buildPayload(form)
  -> onSubmit(payload)
  -> useOrganizerData.createActivity(payload)
  -> POST /api/activities
  -> app/api/activities/route.js POST
  -> POST backend /api/v1/activities
  -> ActivityController.createActivity()
  -> ActivityService.createActivity()
  -> RoomRepository.findById() kiểm tra phòng
  -> ActivityRepository.save()
  -> ActivityMapper.toResponse()
  -> refreshAll()
  -> MyActivitiesPanel hiển thị hoạt động mới
```

### Luồng tạo và gửi duyệt

```text
ActivityForm
  -> bấm "Tạo và gửi duyệt"
  -> useOrganizerData.createActivity(payload, { submitAfterCreate: true })
  -> POST /api/activities
  -> tạo activity thành công
  -> PATCH /api/activities/{activityId}/submit
  -> app/api/activities/[id]/submit/route.js
  -> PATCH backend /api/v1/activities/{id}/submit
  -> ActivityController.submitForReview()
  -> ActivityService.submitForReview()
  -> ActivityRepository.save(status = Pending)
```

### Kiểm tra trùng lịch khi tạo hoạt động

```text
ActivityForm useEffect
  -> khi roomId, startTime, endTime thay đổi
  -> đợi 350ms
  -> useOrganizerData.checkScheduleConflicts()
  -> GET /api/activities/schedule-conflicts?roomId=...&startTime=...&endTime=...
  -> app/api/activities/schedule-conflicts/route.js
  -> GET backend /api/v1/activities/schedule-conflicts
  -> ActivityController.previewScheduleConflicts()
  -> ActivityService.previewScheduleConflicts()
  -> ActivityRepository.findScheduleConflicts()
  -> trả danh sách hoạt động bị trùng lịch
```

### Điểm thuyết trình

Chức năng tạo hoạt động không chỉ lưu dữ liệu. Hệ thống còn kiểm tra phòng, thời gian, số lượng, trạng thái hoạt động và hỗ trợ gửi duyệt. Organizer chỉ tạo được hoạt động, còn quyết định duyệt thuộc manager.

## 5. Luồng sửa, xóa và gửi duyệt hoạt động

### Người thao tác

`organizer`.

### Sửa hoạt động

```text
MyActivitiesPanel
  -> chọn hoạt động
  -> mở ActivityDetailDialog hoặc ActivityForm
  -> useOrganizerData.updateActivity(activityId, payload)
  -> PUT /api/activities/{activityId}
  -> app/api/activities/[id]/route.js PUT
  -> PUT backend /api/v1/activities/{id}
  -> ActivityController.updateActivity()
  -> ActivityService.updateActivity()
  -> ActivityService.ensureCanManageActivity()
  -> ActivityRepository.save()
```

### Xóa hoạt động

```text
MyActivitiesPanel
  -> bấm xóa
  -> useOrganizerData.deleteActivity(activityId)
  -> DELETE /api/activities/{activityId}
  -> app/api/activities/[id]/route.js DELETE
  -> DELETE backend /api/v1/activities/{id}
  -> ActivityController.deleteActivity()
  -> ActivityService.deleteActivity()
  -> ActivityRepository.delete()
```

### Gửi duyệt hoạt động

```text
MyActivitiesPanel
  -> bấm gửi duyệt
  -> useOrganizerData.submitActivity(activityId)
  -> PATCH /api/activities/{activityId}/submit
  -> ActivityController.submitForReview()
  -> ActivityService.submitForReview()
  -> ActivityRepository.save(status = Pending)
```

### Điểm thuyết trình

Organizer chỉ được quản lý hoạt động của mình. Backend có hàm `ensureCanManageActivity()` để kiểm tra quyền sở hữu hoặc quyền admin trước khi cho sửa/xóa.

## 6. Luồng duyệt hoạt động

### Người thao tác

`manager` hoặc `admin`.

### Mục đích

Manager kiểm tra hoạt động do organizer gửi lên, xem chi tiết, kiểm tra lịch, sau đó duyệt hoặc từ chối.

### Tải danh sách hoạt động cần duyệt

```text
ManagerDashboard
  -> useManagerData()
  -> refreshActivities()
  -> GET /api/manager/activities?page=0&size=20&statuses=...
  -> app/api/manager/activities/route.js
  -> GET backend /api/manager/activities
  -> ManagerActivityController.searchActivities()
  -> ActivityService.searchActivitiesForManager()
  -> ActivityRepository.searchActivitiesForManager()
  -> ActivityApprovalTable render
```

### Bắt đầu xem xét

```text
ActivityApprovalTable.viewDetails(activity)
  -> nếu status là Pending
  -> useManagerData.startActivityReview(activity.id)
  -> PATCH /api/manager/activities/{id}/review
  -> app/api/manager/activities/[id]/review/route.js
  -> PATCH backend /api/manager/activities/{id}/review
  -> ManagerActivityController.startReview()
  -> ActivityService.startActivityReview()
  -> ActivityRepository.save(status = Reviewing)
```

### Duyệt hoạt động

```text
ActivityDetailPanel
  -> bấm "Duyệt"
  -> useManagerData.approveActivity(activity.id)
  -> PATCH /api/manager/activities/{id}/approve
  -> app/api/manager/activities/[id]/approve/route.js
  -> PATCH backend /api/manager/activities/{id}/approve
  -> ManagerActivityController.approveActivity()
  -> ActivityService.approveActivityWithWarnings()
  -> ActivityService.approveActivity()
  -> ActivityRepository.findScheduleConflicts()
  -> ActivityRepository.save(status = Approved)
  -> trả ActivityReviewResponse, có thể kèm cảnh báo trùng lịch
```

### Từ chối hoạt động

```text
ActivityDetailPanel
  -> nhập lý do từ chối
  -> useManagerData.rejectActivity(activity.id, reason)
  -> PATCH /api/manager/activities/{id}/reject
  -> app/api/manager/activities/[id]/reject/route.js
  -> PATCH backend /api/manager/activities/{id}/reject
  -> ManagerActivityController.rejectActivity()
  -> ActivityService.rejectActivity()
  -> ActivityRepository.save(status = Rejected, rejectReason = reason)
```

### Điểm thuyết trình

Luồng duyệt có các trạng thái rõ ràng: `Pending -> Reviewing -> Approved` hoặc `Rejected`. Việc duyệt không xử lý ở frontend mà được quyết định ở backend trong `ActivityService`, đảm bảo logic tập trung và đúng quyền.

## 7. Luồng đăng ký hoạt động

### Người thao tác

`student`.

### Mục đích

Sinh viên chọn hoạt động và gửi yêu cầu đăng ký. Đăng ký có thể ở trạng thái chờ duyệt hoặc đã duyệt tùy nghiệp vụ backend.

### Luồng code

```text
StudentDashboard activeSection="browse-activities"
  -> ActivityGrid
  -> bấm "Đăng ký"
  -> ActivityGrid.handleEnroll(activityId)
  -> StudentDashboard.handleEnrollClick(activityId)
  -> useStudentEnrollment.handleEnroll(activityId)
  -> POST /api/registrations body { activityId }
  -> app/api/registrations/route.js POST
  -> POST backend /api/v1/registrations/{activityId}
  -> RegistrationController.registerActivity()
  -> RegistrationService.registerActivity()
  -> ActivityService.getActivityEntity()
  -> RegistrationRepository.findByActivityIdAndStudentId()
  -> RegistrationRepository.save()
  -> trả RegistrationResponse
```

Sau khi đăng ký:

```text
StudentDashboard.refreshRegistrations()
  -> useStudentEnrollment.getUserRegistrations()
  -> GET /api/registrations
  -> app/api/registrations/route.js GET
  -> GET backend /api/v1/registrations/my-registrations
  -> RegistrationController.getUserRegistrations()
  -> RegistrationService.getUserRegistrations()
  -> RegistrationRepository.findByStudentIdOrderByCreatedAtDesc()
  -> cập nhật localEnrolled và registrationStatusByActivity
```

### Các kiểm tra nghiệp vụ thường có ở service

- Sinh viên đã đăng ký hoạt động này chưa.
- Hoạt động còn hạn đăng ký không.
- Hoạt động còn chỗ không.
- Hoạt động có ở trạng thái cho phép đăng ký không.
- Sinh viên có đúng vai trò `STUDENT` không.

### Điểm thuyết trình

Frontend chỉ gửi `activityId`. Toàn bộ việc kiểm tra trùng đăng ký, số lượng tối đa, trạng thái hoạt động được backend xử lý trong `RegistrationService`, giúp dữ liệu không bị sai dù nhiều sinh viên đăng ký cùng lúc.

## 8. Luồng hủy đăng ký hoạt động

### Người thao tác

`student`.

### Luồng code

```text
ActivityGrid hoặc MyEnrollments
  -> bấm "Hủy đăng ký"
  -> StudentDashboard.handleUnenrollClick(activityId)
  -> useStudentEnrollment.handleUnenroll(activityId)
  -> DELETE /api/registrations body { activityId }
  -> app/api/registrations/route.js DELETE
  -> DELETE backend /api/v1/registrations/{activityId}
  -> RegistrationController.unregisterActivity()
  -> RegistrationService.unregisterActivity()
  -> RegistrationRepository.findByActivityIdAndStudentId()
  -> RegistrationRepository.save(status = Cancelled) hoặc delete theo logic service
  -> refreshRegistrations()
```

### Điểm thuyết trình

Khi hủy đăng ký, giao diện không tự ý xóa dữ liệu. Nó gọi API để backend cập nhật trạng thái đăng ký, sau đó tải lại danh sách đăng ký của sinh viên.

## 9. Luồng organizer duyệt sinh viên đăng ký

### Người thao tác

`organizer`, `manager` hoặc `admin`.

### Tải danh sách đăng ký theo hoạt động

```text
OrganizerDashboard activeSection="my-students"
  -> StudentsPanelV2
  -> chọn hoạt động
  -> useOrganizerData.loadRegistrations(activityId)
  -> GET /api/registrations/{activityId}
  -> app/api/registrations/[activityId]/route.js GET
  -> GET backend /api/v1/registrations/activity/{activityId}
  -> RegistrationController.getActivityRegistrations()
  -> RegistrationService.getActivityRegistrations()
  -> RegistrationRepository.findByActivityId()
  -> render nhóm Pending, Approved, Rejected
```

### Duyệt sinh viên

```text
StudentsPanelV2
  -> bấm duyệt
  -> useOrganizerData.approveRegistration(activityId, studentId)
  -> PATCH /api/manager/registrations/{activityId}/students/{studentId}/approve
  -> app/api/manager/registrations/[activityId]/students/[studentId]/approve/route.js
  -> PATCH backend /api/manager/registrations/{activityId}/students/{studentId}/approve
  -> ManagerRegistrationController.approveRegistration()
  -> RegistrationService.approveRegistration()
  -> RegistrationRepository.findByActivityIdAndStudentId()
  -> RegistrationRepository.save(status = Approved)
```

### Từ chối sinh viên

```text
StudentsPanelV2
  -> nhập lý do
  -> useOrganizerData.rejectRegistration(activityId, studentId, reason)
  -> PATCH /api/manager/registrations/{activityId}/students/{studentId}/reject
  -> ManagerRegistrationController.rejectRegistration()
  -> RegistrationService.rejectRegistration()
  -> RegistrationRepository.save(status = Rejected, rejectReason = reason)
```

### Điểm thuyết trình

Đăng ký hoạt động là một bảng riêng `Registration`, không lưu trực tiếp trong activity. Vì vậy mỗi sinh viên có một bản ghi đăng ký với trạng thái riêng: pending, approved, rejected hoặc cancelled.

## 10. Luồng điểm danh

### Người thao tác

`organizer`, `manager`, `admin`; sinh viên có luồng tự check-in riêng.

### Organizer điểm danh sinh viên

```text
OrganizerDashboard activeSection="attendance"
  -> AttendancePanel
  -> chọn hoạt động
  -> loadRegistrations(activityId)
  -> lọc registration status = Approved
  -> bấm checkbox có mặt/vắng
  -> useOrganizerData.checkInRegistration(registrationId, isPresent)
  -> POST /api/organizer/attendance/check-in
  -> app/api/organizer/attendance/check-in/route.js
  -> POST backend /api/organizer/attendance/check-in
  -> AttendanceController.checkIn()
  -> AttendanceService.checkIn()
  -> RegistrationRepository.findById()
  -> AttendanceRepository.findByRegistrationId()
  -> AttendanceRepository.save()
```

### Sinh viên tự check-in

```text
StudentDashboard activeSection="my-enrollments"
  -> MyEnrollments
  -> bấm check-in
  -> StudentDashboard.handleCheckInClick(registrationId)
  -> useStudentEnrollment.handleCheckIn(registrationId)
  -> POST /api/attendance/check-in
  -> app/api/attendance/check-in/route.js
  -> POST backend /api/organizer/attendance/self-check-in
  -> AttendanceController.selfCheckIn()
  -> AttendanceService.selfCheckIn()
  -> AttendanceRepository.save()
```

### Cập nhật điểm rèn luyện

```text
OrganizerDashboard
  -> useOrganizerData.awardPoints(registrationId, earnedPoints)
  -> PATCH /api/organizer/attendance/points
  -> app/api/organizer/attendance/points/route.js
  -> PATCH backend /api/organizer/attendance/points
  -> AttendanceController.awardPoints()
  -> AttendanceService.awardPoints()
  -> AttendanceRepository.save(earnedPoints)
```

### Điểm thuyết trình

Điểm danh không sửa trực tiếp bản ghi đăng ký. Hệ thống tạo hoặc cập nhật bảng `Attendance`, liên kết với `Registration`, từ đó tính được sinh viên có tham gia và được bao nhiêu điểm.

## 11. Luồng xem điểm rèn luyện của sinh viên

### Người thao tác

`student`.

### Luồng code

```text
StudentDashboard activeSection="my-points"
  -> MyPoints
  -> getMyPoints({ year, semester })
  -> useStudentEnrollment.getMyPoints()
  -> GET /api/student/points?year=...&semester=...
  -> app/api/student/points/route.js
  -> GET backend /api/v1/registrations/my-points
  -> RegistrationController.getMyPoints()
  -> RegistrationService.getMyPoints()
  -> RegistrationRepository / AttendanceRepository
  -> StudentPointsResponse
  -> MyPoints render tổng điểm và lịch sử hoạt động
```

### Điểm thuyết trình

Điểm sinh viên được tổng hợp từ các hoạt động đã được duyệt tham gia và có bản ghi điểm danh/điểm rèn luyện.

## 12. Luồng nộp báo cáo sau hoạt động

### Người thao tác

`organizer`.

### Mục đích

Sau khi hoạt động kết thúc, organizer nộp file báo cáo để manager duyệt.

### Luồng code

```text
OrganizerDashboard activeSection="reports-points"
  -> ReportsAndPointsPanel
  -> chọn hoạt động đã Closed
  -> chọn file Excel
  -> submitReport(event)
  -> useOrganizerData.submitReport(activityId, file)
  -> tạo FormData
  -> POST /api/activities/{activityId}/reports
  -> app/api/activities/[id]/reports/route.js
  -> POST backend /api/v1/activities/{id}/reports/upload
  -> ActivityController.uploadReport()
  -> ActivityService.submitReportFile()
  -> lưu file vào ECO_PTIT/uploads/activity-reports
  -> ActivityFileRepository.save()
  -> reportStatus = Pending
```

### Hủy báo cáo đã nộp

```text
ReportsAndPointsPanel
  -> bấm hủy báo cáo
  -> useOrganizerData.cancelReport(reportId)
  -> PATCH /api/activities/reports/{reportId}/cancel
  -> app/api/activities/reports/[reportId]/cancel/route.js
  -> PATCH backend /api/v1/activities/reports/{reportId}/cancel
  -> ActivityController.cancelReport()
  -> ActivityService.cancelMyReport()
  -> ActivityFileRepository.save(status = Cancelled)
```

### Điểm thuyết trình

File báo cáo được lưu ở thư mục upload, còn database chỉ lưu thông tin file, hoạt động liên quan và trạng thái duyệt báo cáo.

## 13. Luồng manager duyệt báo cáo

### Người thao tác

`manager` hoặc `admin`.

### Tải danh sách báo cáo

```text
ManagerDashboard activeSection="reports"
  -> ReportsPanel
  -> useManagerData.searchReports(filters)
  -> GET /api/manager/activities/reports?activityId=...&reportStatus=...
  -> app/api/manager/activities/reports/route.js
  -> GET backend /api/manager/activities/reports
  -> ManagerActivityController.searchReports()
  -> ActivityService.searchReports()
  -> ActivityFileRepository.searchReports()
```

### Tải/xem báo cáo

```text
ReportsPanel.downloadReport(report)
  -> useManagerData.downloadReport(report.id)
  -> PATCH /api/manager/activities/reports/{reportId}/download
  -> app/api/manager/activities/reports/[reportId]/download/route.js
  -> PATCH backend /api/manager/activities/reports/{reportId}/download
  -> ManagerActivityController.downloadReport()
  -> ActivityService.startReportReview()
  -> ActivityFileRepository.save(status = Reviewing)
  -> browser mở report.fileUrl
```

### Duyệt báo cáo

```text
ReportsPanel
  -> bấm duyệt
  -> useManagerData.approveReport(report.id)
  -> PATCH /api/manager/activities/reports/{reportId}/approve
  -> ManagerActivityController.approveReport()
  -> ActivityService.approveReport()
  -> ActivityFileRepository.save(status = Approved)
```

### Từ chối báo cáo

```text
ReportsPanel
  -> nhập lý do
  -> useManagerData.rejectReport(report.id, reason)
  -> PATCH /api/manager/activities/reports/{reportId}/reject
  -> ManagerActivityController.rejectReport()
  -> ActivityService.rejectReport()
  -> ActivityFileRepository.save(status = Rejected, reviewNote = reason)
```

### Điểm thuyết trình

Hoạt động có một vòng đời riêng, báo cáo sau hoạt động cũng có vòng đời riêng: `Pending -> Reviewing -> Approved/Rejected/Cancelled`.

## 14. Luồng yêu cầu hủy hoạt động

### Organizer gửi yêu cầu hủy

```text
MyActivitiesPanel
  -> nhập lý do hủy
  -> useOrganizerData.requestCancelActivity(activityId, reason)
  -> PATCH /api/activities/{activityId}/cancel-request
  -> app/api/activities/[id]/cancel-request/route.js
  -> PATCH backend /api/v1/activities/{id}/cancel-request
  -> ActivityController.requestCancelActivity()
  -> ActivityService.requestCancelActivity()
  -> ActivityRepository.save(status = CancellationRequested)
```

### Manager duyệt yêu cầu hủy

```text
ActivityRow trong ManagerDashboard
  -> bấm duyệt hủy
  -> useManagerData.approveCancelRequest(activity.id)
  -> PATCH /api/manager/activities/{id}/cancel-requests/approve
  -> ManagerActivityController.approveCancelRequest()
  -> ActivityService.approveCancelRequest()
  -> ActivityRepository.save(status = Cancelled)
```

### Manager từ chối yêu cầu hủy

```text
ActivityRow
  -> nhập lý do
  -> useManagerData.rejectCancelRequest(activity.id, reason)
  -> PATCH /api/manager/activities/{id}/cancel-requests/reject
  -> ManagerActivityController.rejectCancelRequest()
  -> ActivityService.rejectCancelRequest()
  -> ActivityRepository.save(status quay lại trạng thái hợp lệ)
```

### Điểm thuyết trình

Organizer không tự ý hủy hoạt động đã được duyệt. Họ chỉ gửi yêu cầu hủy, manager là người quyết định cuối cùng.

## 15. Luồng thông báo

### Nhận và đọc thông báo

```text
NotificationsPanel
  -> GET /api/notifications
  -> app/api/notifications/route.js
  -> GET backend /api/notifications
  -> NotificationController.getMyNotifications()
  -> NotificationService.getMyNotifications()
  -> NotificationRepository.findByReceiverIdOrderByCreatedAtDesc()
```

```text
NotificationsPanel
  -> PATCH /api/notifications/{id}/read hoặc /unread
  -> app/api/notifications/[id]/[action]/route.js
  -> NotificationController.markAsRead()/markAsUnread()
  -> NotificationService.markAsRead()/markAsUnread()
  -> NotificationRepository.save()
```

### Gửi thông báo theo danh sách user

```text
AdminNotificationSenderPanel hoặc Manager NotificationPanel
  -> POST /api/notifications
  -> app/api/notifications/route.js
  -> POST backend /api/notifications
  -> NotificationController.sendNotifications()
  -> NotificationService.sendNotifications()
  -> UserRepository.findByIdIn()
  -> NotificationRepository.saveAll()
```

### Gửi thông báo broadcast

```text
AdminNotificationSenderPanel hoặc Manager NotificationPanel
  -> POST /api/admin/notifications/broadcast
  -> app/api/admin/[...path]/route.js
  -> POST backend /api/admin/notifications/broadcast
  -> AdminNotificationController.broadcast()
  -> NotificationService.broadcastNotifications()
  -> UserRepository/ProfileRepository lọc người nhận theo role/lớp/khoa
  -> NotificationRepository.saveAll()
```

### Điểm thuyết trình

Thông báo có thể gửi trực tiếp đến danh sách người dùng hoặc phát theo nhóm. Mỗi thông báo có sender, receiver, trạng thái đọc/chưa đọc.

## 16. Luồng quản lý người dùng của admin

### Tải danh sách và lọc user

```text
AdminDashboard activeSection="users"
  -> UsersPanel
  -> useAdminResource(loader)
  -> GET /api/admin/users?q=...&roleId=...&status=...
  -> app/api/admin/[...path]/route.js
  -> GET backend /api/admin/users
  -> AdminUserController.searchUsers()
  -> UserService.searchUsers()
  -> UserRepository.searchUsers()
  -> ProfileRepository.findByUserIdIn()
```

### Tạo user

```text
UsersPanel.createUser()
  -> tạo payload gồm username, email, password, roleId, identity
  -> POST /api/admin/users
  -> app/api/admin/[...path]/route.js
  -> POST backend /api/admin/users
  -> AdminUserController.createUser()
  -> UserService.createUser()
  -> RoleAssignmentPolicy.validate()
  -> PasswordEncoder.encode()
  -> UserRepository.save()
  -> ProfileRepository.save() nếu có identity
```

### Khóa user

```text
UsersPanel.deactivateUser(userId)
  -> DELETE /api/admin/users/{userId}
  -> AdminUserController.deactivateUser()
  -> UserService.deactivateUser()
  -> UserRepository.findById()
  -> UserRepository.save(status = inactive)
```

### Điểm thuyết trình

Admin không chỉ tạo tài khoản mà còn gắn vai trò. Role quyết định dashboard người dùng nhìn thấy và quyền backend cho phép.

## 17. Luồng hồ sơ cá nhân

### Xem hồ sơ

```text
PersonalProfilePanel
  -> GET /api/profile
  -> app/api/profile/route.js
  -> GET backend /api/v1/profile
  -> ProfileController.getMyProfile()
  -> ProfileService.getMyProfile()
  -> ProfileRepository.findByUserId()
  -> ProfileMapper.toResponse()
```

### Cập nhật hồ sơ

```text
PersonalProfilePanel
  -> PUT /api/profile
  -> app/api/profile/route.js
  -> PUT backend /api/v1/profile
  -> ProfileController.updateProfile()
  -> ProfileService.updateProfile()
  -> ProfileRepository.save()
```

## 18. Luồng cấu hình hệ thống, backup và log

### Cấu hình hệ thống

```text
AdminDashboard activeSection="settings"
  -> SettingsPanel
  -> GET /api/admin/system-configs
  -> SystemConfigController.getAllConfigs()
  -> SystemConfigService.getAllConfigs()
  -> SystemConfigRepository.findAll()
```

```text
ConfigRow
  -> updateConfig(key, value)
  -> PUT /api/admin/system-configs/{key}
  -> SystemConfigController.updateConfig()
  -> SystemConfigService.updateConfig()
  -> SystemConfigRepository.save()
```

### Backup

```text
SettingsPanel.createBackup()
  -> POST /api/admin/backups/export
  -> BackupController.exportBackup()
  -> BackupService.createManualBackup()
  -> tạo file zip trong ECO_PTIT/backups
```

```text
SettingsPanel.restoreBackup()
  -> POST /api/admin/backups/restore
  -> BackupController.restoreBackup()
  -> BackupService.restoreBackup()
```

### Log hệ thống

```text
SettingsPanel
  -> GET /api/admin/system-logs?page=0&size=20
  -> SystemLogController.searchLogs()
  -> SystemLogService.searchLogs()
  -> SystemLogRepository.searchLogs()
```

## 19. Vòng đời đầy đủ của một hoạt động

Đây là phần nên trình bày khi demo tổng thể.

```text
1. Organizer tạo hoạt động
   -> ActivityService.createActivity()
   -> status = Draft

2. Organizer gửi duyệt
   -> ActivityService.submitForReview()
   -> status = Pending

3. Manager bắt đầu review
   -> ActivityService.startActivityReview()
   -> status = Reviewing

4. Manager duyệt
   -> ActivityService.approveActivity()
   -> status = Approved

5. Sinh viên đăng ký
   -> RegistrationService.registerActivity()
   -> registration status = Pending hoặc Approved

6. Organizer/Manager duyệt sinh viên
   -> RegistrationService.approveRegistration()
   -> registration status = Approved

7. Hoạt động diễn ra
   -> ActivityService.startDueActivities()
   -> status = Ongoing

8. Điểm danh
   -> AttendanceService.checkIn()
   -> tạo/cập nhật Attendance

9. Hoạt động kết thúc
   -> ActivityService.closeExpiredActivities()
   -> status = Closed

10. Organizer nộp báo cáo
    -> ActivityService.submitReportFile()
    -> report status = Pending

11. Manager duyệt báo cáo
    -> ActivityService.approveReport()
    -> report status = Approved
```

## 20. Bảng nhớ nhanh khi thuyết trình

| Chức năng | Frontend bắt đầu | Hook/Context | API route | Backend controller | Service |
|---|---|---|---|---|---|
| Đăng nhập | `login-form.jsx` | `auth-context.jsx` | `/api/auth/login` | `AuthenticationController` | `AuthenticationService` |
| Xem hoạt động | `activity-grid.jsx` | `role-context.jsx` | `/api/activities` | `ActivityController` | `ActivityService` |
| Tạo hoạt động | `CreateActivityPanel` | `use-organizer-data.js` | `/api/activities` | `ActivityController` | `ActivityService` |
| Gửi duyệt hoạt động | `MyActivitiesPanel` | `use-organizer-data.js` | `/api/activities/{id}/submit` | `ActivityController` | `ActivityService` |
| Duyệt hoạt động | `ActivityDetailPanel` | `use-manager-data.js` | `/api/manager/activities/{id}/approve` | `ManagerActivityController` | `ActivityService` |
| Từ chối hoạt động | `ActivityDetailPanel` | `use-manager-data.js` | `/api/manager/activities/{id}/reject` | `ManagerActivityController` | `ActivityService` |
| Đăng ký hoạt động | `ActivityGrid` | `use-student-enrollment.ts` | `/api/registrations` | `RegistrationController` | `RegistrationService` |
| Hủy đăng ký | `ActivityGrid`, `MyEnrollments` | `use-student-enrollment.ts` | `/api/registrations` | `RegistrationController` | `RegistrationService` |
| Duyệt sinh viên | `StudentsPanelV2` | `use-organizer-data.js` | `/api/manager/registrations/.../approve` | `ManagerRegistrationController` | `RegistrationService` |
| Điểm danh | `AttendancePanel` | `use-organizer-data.js` | `/api/organizer/attendance/check-in` | `AttendanceController` | `AttendanceService` |
| Xem điểm | `MyPoints` | `use-student-enrollment.ts` | `/api/student/points` | `RegistrationController` | `RegistrationService` |
| Nộp báo cáo | `ReportsAndPointsPanel` | `use-organizer-data.js` | `/api/activities/{id}/reports` | `ActivityController` | `ActivityService` |
| Duyệt báo cáo | `ReportsPanel` | `use-manager-data.js` | `/api/manager/activities/reports/{id}/approve` | `ManagerActivityController` | `ActivityService` |
| Gửi thông báo | `NotificationPanel` | `useManagerData`/`useAdminApi` | `/api/notifications` | `NotificationController` | `NotificationService` |
| Quản lý user | `UsersPanel` | `useAdminApi` | `/api/admin/users` | `AdminUserController` | `UserService` |
| Hồ sơ cá nhân | `PersonalProfilePanel` | `useAuth` | `/api/profile` | `ProfileController` | `ProfileService` |

## 21. Gợi ý trình bày demo

Khi thuyết trình, nên đi theo 1 kịch bản liền mạch:

```text
1. Admin tạo tài khoản organizer, manager, student.
2. Organizer đăng nhập và tạo hoạt động.
3. Organizer gửi hoạt động lên manager duyệt.
4. Manager đăng nhập, xem hoạt động pending, kiểm tra lịch và duyệt.
5. Student đăng nhập, xem danh sách hoạt động và đăng ký.
6. Organizer xem danh sách sinh viên đăng ký và duyệt sinh viên.
7. Organizer điểm danh sinh viên khi hoạt động diễn ra.
8. Student xem điểm rèn luyện.
9. Organizer nộp báo cáo sau hoạt động.
10. Manager duyệt báo cáo.
11. Admin xem log/cấu hình/backup nếu cần.
```

Điểm cần nhấn mạnh:

- Frontend chỉ điều phối giao diện và gọi API.
- Backend là nơi quyết định quyền và nghiệp vụ.
- Mỗi vai trò có dashboard riêng.
- Hoạt động, đăng ký, điểm danh, báo cáo là các module liên kết với nhau qua database.
- JWT và `@PreAuthorize` bảo vệ endpoint theo vai trò.
