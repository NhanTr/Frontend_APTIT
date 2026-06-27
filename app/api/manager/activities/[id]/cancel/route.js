import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function PATCH(req, { params }) {
  try {
    const { id } = await params
    const body = await req.json()
    return proxyBackendRequest(req, `/api/manager/activities/${id}/cancel`, {
      method: "PATCH",
      body,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
