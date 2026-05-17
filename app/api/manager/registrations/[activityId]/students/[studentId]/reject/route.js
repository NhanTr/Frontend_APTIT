import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function PATCH(req, { params }) {
  try {
    const { activityId, studentId } = await params
    const body = await req.json()
    return proxyBackendRequest(
      req,
      `/api/manager/registrations/${activityId}/students/${studentId}/reject`,
      {
        method: "PATCH",
        body,
      },
    )
  } catch (error) {
    console.error("Reject registration error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
