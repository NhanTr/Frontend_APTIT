import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function PATCH(req, { params }) {
  try {
    const { reportId } = await params
    return proxyBackendRequest(req, `/api/manager/activities/reports/${reportId}/approve`, {
      method: "PATCH",
    })
  } catch (error) {
    console.error("Approve report error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
