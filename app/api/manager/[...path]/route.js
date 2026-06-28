function getBackendUrl() {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
}

async function proxyManagerRequest(req, { params }) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const path = Array.isArray(resolvedParams?.path) ? resolvedParams.path.join('/') : ''
    const incomingUrl = new URL(req.url)
    const backendUrl = new URL(`${getBackendUrl()}/api/manager/${path}`)
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

    if (response.status === 204 || response.status === 205) {
      return new Response(null, { status: response.status, headers: {} })
    }
    const responseContentType = response.headers.get('content-type') || 'application/json'
    const responseBody = await response.arrayBuffer()
    const responseHeaders = { 'Content-Type': responseContentType }
    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Manager proxy error:', error)
    return Response.json({ error: error.message || 'Manager proxy failed' }, { status: 500 })
  }
}

export const GET = proxyManagerRequest
export const POST = proxyManagerRequest
export const PUT = proxyManagerRequest
export const PATCH = proxyManagerRequest
export const DELETE = proxyManagerRequest
