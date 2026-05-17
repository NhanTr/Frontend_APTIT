import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function PATCH(req, { params }) {
  try {
    const { activityId, studentId } = await params
    return proxyBackendRequest(
      req,
      `/api/manager/registrations/${activityId}/students/${studentId}/approve`,
      { method: "PATCH" },
    )
  } catch (error) {
    console.error("Approve registration error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
