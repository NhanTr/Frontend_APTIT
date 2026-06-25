import { proxyBackendRequest } from "@/app/api/_utils/backend"

function buildManagerActivitiesPath(req) {
  const { searchParams } = new URL(req.url)
  const params = new URLSearchParams()

  for (const [key, value] of searchParams.entries()) {
    if (value !== "") {
      params.append(key, value)
    }
  }

  const query = params.toString()
  return `/api/manager/activities${query ? `?${query}` : ""}`
}

export async function GET(req) {
  try {
    return proxyBackendRequest(req, buildManagerActivitiesPath(req))
  } catch (error) {
    console.error("Search manager activities error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
