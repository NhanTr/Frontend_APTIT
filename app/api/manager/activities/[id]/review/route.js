import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function PATCH(req, { params }) {
  try {
    const { id } = await params
    return proxyBackendRequest(req, `/api/manager/activities/${id}/review`, {
      method: "PATCH",
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
