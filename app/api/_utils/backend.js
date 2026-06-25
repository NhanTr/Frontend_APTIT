export function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
}

export function getBearerToken(req) {
  const authHeader = req.headers.get("authorization")
  return authHeader?.replace("Bearer ", "")
}

export async function proxyBackendRequest(req, path, options = {}) {
  const {
    method = "GET",
    body,
    requireAuth = true,
  } = options

  const token = getBearerToken(req)
  if (requireAuth && !token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const headers = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${getBackendUrl()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await response.text()
  const data = text
    ? (() => {
        try {
          return JSON.parse(text)
        } catch {
          return { message: text }
        }
      })()
    : null

  if (!response.ok) {
    return new Response(
      JSON.stringify({
        error: data?.message || data?.error || response.statusText || "Backend request failed",
      }),
      { status: response.status },
    )
  }

  return new Response(JSON.stringify(data), { status: response.status })
}
