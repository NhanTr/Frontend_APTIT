import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function GET(req) {
  try {
    return proxyBackendRequest(req, "/api/v1/rooms", { requireAuth: false })
  } catch (error) {
    console.error("Load rooms error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
