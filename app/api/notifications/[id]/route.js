import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function GET(req, { params }) {
  try {
    const { id } = await params
    return proxyBackendRequest(req, `/api/notifications/${id}`)
  } catch (error) {
    console.error("Get notification detail error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
