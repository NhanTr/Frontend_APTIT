import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function GET(req, { params }) {
  try {
    const { id } = await params
    return proxyBackendRequest(req, `/api/manager/activities/${id}/schedule-conflicts`)
  } catch (error) {
    console.error("Get schedule conflicts error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
