// Thin proxy: /api/admin/announcements/* -> backend /api/admin/notifications/*
// Sửa lỗi: trước đây route này gọi /api/v1/admin/announcements không tồn tại.
// Đổi sang /api/admin/notifications để khớp với AdminNotificationController backend.

function getBackendUrl() {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
}

function resolveTarget(pathFromUrl, method) {
  const segments = Array.isArray(pathFromUrl) ? pathFromUrl : []
  // /api/admin/announcements            -> /api/admin/notifications
  // /api/admin/announcements/broadcast  -> /api/admin/notifications/broadcast
  return ['/api/admin/notifications', ...segments].join('/')
}

async function proxyAnnouncementRequest(req, { params }) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const resolvedParams = await params
    const incomingUrl = new URL(req.url)
    const backendUrl = new URL(`${getBackendUrl()}${resolveTarget(resolvedParams?.path)}`)
    incomingUrl.searchParams.forEach((value, key) => backendUrl.searchParams.append(key, value))

    const headers = { Authorization: `Bearer ${token}` }
    const contentType = req.headers.get('content-type')
    if (contentType) headers['Content-Type'] = contentType

    const method = req.method
    const hasBody = !['GET', 'HEAD'].includes(method)
    const response = await fetch(backendUrl.toString(), {
      method,
      headers,
      body: hasBody ? await req.text() : undefined,
    })

    const responseContentType = response.headers.get('content-type') || 'application/json'
    const responseBody = await response.arrayBuffer()

    return new Response(responseBody, {
      status: response.status,
      headers: { 'Content-Type': responseContentType },
    })
  } catch (error) {
    console.error('Admin announcements proxy error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Admin announcements proxy failed' }), { status: 500 })
  }
}

export const GET = proxyAnnouncementRequest
export const POST = proxyAnnouncementRequest
export const PUT = proxyAnnouncementRequest
export const PATCH = proxyAnnouncementRequest
export const DELETE = proxyAnnouncementRequest
