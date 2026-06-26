function getBackendUrl() {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
}

async function proxyAdminRequest(req, { params }) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const path = Array.isArray(resolvedParams?.path) ? resolvedParams.path.join('/') : ''
    const incomingUrl = new URL(req.url)
    const backendUrl = new URL(`${getBackendUrl()}/api/admin/${path}`)
    incomingUrl.searchParams.forEach((value, key) => backendUrl.searchParams.append(key, value))

    const headers = {
      Authorization: `Bearer ${token}`,
    }

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
      headers: {
        'Content-Type': responseContentType,
      },
    })
  } catch (error) {
    console.error('Admin proxy error:', error)
    return Response.json({ error: error.message || 'Admin proxy failed' }, { status: 500 })
  }
}

export const GET = proxyAdminRequest
export const POST = proxyAdminRequest
export const PUT = proxyAdminRequest
export const PATCH = proxyAdminRequest
export const DELETE = proxyAdminRequest
