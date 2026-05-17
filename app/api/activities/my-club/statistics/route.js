import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.toString()
    const path = `/api/v1/activities/my-club/statistics${query ? `?${query}` : ""}`
    return proxyBackendRequest(req, path)
  } catch (error) {
    console.error("Get organizer statistics error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
