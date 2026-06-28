"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Bell, CheckCheck, Eye, Loader2, RefreshCw, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function unwrapNotifications(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.result)) return data.result
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.notifications)) return data.notifications
  return []
}

function formatDateTime(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function simplifyTargetLabel(label) {
  const value = String(label || "").trim()
  const normalized = value.toLowerCase()

  if (!value) return ""
  if (normalized === "tat ca vai tro" || normalized === "tất cả vai trò") return "Tất cả vai trò"

  const simpleRoles = ["admin", "manager", "organizer", "student"]
  const matchedRole = simpleRoles.find((role) => normalized === role || normalized.startsWith(`${role} -`))
  if (matchedRole) return matchedRole

  return value
}

function getRecipientLabel(notification) {
  return simplifyTargetLabel(notification?.targetLabel) || notification?.receiverName || notification?.receiverId || "Không rõ"
}

function groupSentNotifications(notifications) {
  const groups = new Map()

  notifications.forEach((notification) => {
    const key = [
      notification.senderId || "",
      notification.title || "",
      notification.content || "",
      notification.type || "",
      notification.createdAt || "",
      notification.targetLabel || "",
    ].join("|")

    const existing = groups.get(key)
    if (!existing) {
      groups.set(key, {
        ...notification,
        receiverIds: notification.receiverId ? [notification.receiverId] : [],
        receiverNames: notification.receiverName ? [notification.receiverName] : [],
      })
      return
    }

    if (notification.receiverId && !existing.receiverIds.includes(notification.receiverId)) {
      existing.receiverIds.push(notification.receiverId)
    }
    if (notification.receiverName && !existing.receiverNames.includes(notification.receiverName)) {
      existing.receiverNames.push(notification.receiverName)
    }
  })

  return Array.from(groups.values()).map((notification) => {
    if (notification.targetLabel) {
      return notification
    }

    const names = notification.receiverNames.length ? notification.receiverNames : notification.receiverIds
    return {
      ...notification,
      targetLabel: names.length > 1 ? names.join(", ") : names[0] || notification.receiverId,
    }
  })
}

async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem("accessToken")
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Yêu cầu thất bại")
  }
  return data
}

export function NotificationsPanel({ title = "Thông báo", description = "Các cập nhật hệ thống và hoạt động mới nhất" }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState("")
  const [detailLoadingId, setDetailLoadingId] = useState("")
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [error, setError] = useState("")

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.isRead === false).length,
    [notifications],
  )

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await authenticatedFetch("/api/notifications")
      setNotifications(unwrapNotifications(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thông báo")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const setReadStatus = async (notification, isRead) => {
    setActionLoadingId(notification.id)
    setError("")
    try {
      const action = isRead ? "read" : "unread"
      const data = await authenticatedFetch(`/api/notifications/${notification.id}/${action}`, {
        method: "PATCH",
      })
      const updated = data?.result || data?.data || { ...notification, isRead }
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, ...updated, isRead } : item)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật thông báo")
    } finally {
      setActionLoadingId("")
    }
  }

  const viewDetail = async (notification) => {
    setDetailLoadingId(notification.id)
    setError("")
    try {
      const data = await authenticatedFetch(`/api/notifications/${notification.id}`)
      const detail = data?.result || data?.data || notification
      setSelectedNotification({
        ...notification,
        ...detail,
        targetLabel: detail?.targetLabel || notification.targetLabel,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải chi tiết thông báo")
    } finally {
      setDetailLoadingId("")
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Bell className="size-5" />
              {title}
              {unreadCount > 0 && <Badge variant="outline">{unreadCount} chưa đọc</Badge>}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadNotifications} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            Tải lại
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tải thông báo...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <Bell className="size-10 opacity-50" />
              <p className="text-sm">Chưa có thông báo.</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const isUnread = notification.isRead === false
              return (
                <div
                  key={notification.id}
                  className={`rounded-lg border p-4 ${
                    isUnread ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-medium text-card-foreground">{notification.title || "Thông báo"}</p>
                        {notification.type && <Badge variant="outline">{notification.type}</Badge>}
                        {isUnread && <Badge>Mới</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Từ: {notification.senderName || notification.senderId || "Hệ thống"}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {notification.content || "Chưa có nội dung"}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(notification.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={detailLoadingId === notification.id}
                        onClick={() => viewDetail(notification)}
                      >
                        {detailLoadingId === notification.id ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Eye className="mr-2 size-4" />
                        )}
                        Xem
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoadingId === notification.id}
                        onClick={() => setReadStatus(notification, isUnread)}
                      >
                        {actionLoadingId === notification.id ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <CheckCheck className="mr-2 size-4" />
                        )}
                        {isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <NotificationDetailDialog notification={selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)} />
    </>
  )
}

export function SentNotificationsPanel({ title = "Thông báo đã gửi", description = "Các thông báo bạn đã gửi" }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailLoadingId, setDetailLoadingId] = useState("")
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [error, setError] = useState("")

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await authenticatedFetch("/api/notifications/sent")
      setNotifications(unwrapNotifications(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thông báo đã gửi")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    const handler = () => loadNotifications()
    window.addEventListener("notifications:refresh", handler)
    return () => window.removeEventListener("notifications:refresh", handler)
  }, [loadNotifications])

  const groupedNotifications = useMemo(() => groupSentNotifications(notifications), [notifications])

  const viewDetail = async (notification) => {
    setDetailLoadingId(notification.id)
    setError("")
    try {
      const data = await authenticatedFetch(`/api/notifications/${notification.id}`)
      const detail = data?.result || data?.data || notification
      setSelectedNotification({
        ...notification,
        ...detail,
        targetLabel: detail?.targetLabel || notification.targetLabel,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải chi tiết thông báo")
    } finally {
      setDetailLoadingId("")
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Send className="size-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadNotifications} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            Tải lại
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tải thông báo đã gửi...
            </div>
          ) : groupedNotifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <Send className="size-10 opacity-50" />
              <p className="text-sm">Chưa có thông báo đã gửi.</p>
            </div>
          ) : (
            groupedNotifications.map((notification) => (
              <div key={notification.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="font-medium text-card-foreground">{notification.title || "Thông báo"}</p>
                      {notification.type && <Badge variant="outline">{notification.type}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Đến: {getRecipientLabel(notification)}
                    </p>
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {notification.content || "Chưa có nội dung"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(notification.createdAt)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={detailLoadingId === notification.id}
                    onClick={() => viewDetail(notification)}
                  >
                    {detailLoadingId === notification.id ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Eye className="mr-2 size-4" />
                    )}
                    Xem
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <NotificationDetailDialog notification={selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)} />
    </>
  )
}

function NotificationDetailDialog({ notification, onOpenChange }) {
  return (
    <Dialog open={!!notification} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{notification?.title || "Chi tiết thông báo"}</DialogTitle>
          <DialogDescription>{notification?.id}</DialogDescription>
        </DialogHeader>
        {notification && (
          <div className="grid gap-4 text-sm">
            <div className="grid gap-3 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Từ</p>
                <p className="font-medium text-card-foreground">{notification.senderName || notification.senderId || "Hệ thống"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Đến</p>
                <p className="font-medium text-card-foreground">{getRecipientLabel(notification)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Loại</p>
                <p className="font-medium text-card-foreground">{notification.type || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Thời gian gửi</p>
                <p className="font-medium text-card-foreground">{formatDateTime(notification.createdAt) || "-"}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-muted-foreground">Nội dung</p>
              <p className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 leading-relaxed text-card-foreground">
                {notification.content || "Chưa có nội dung"}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
