import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function GET(req) {
  try {
    return proxyBackendRequest(req, "/api/notifications/sent")
  } catch (error) {
    console.error("Get sent notifications error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
