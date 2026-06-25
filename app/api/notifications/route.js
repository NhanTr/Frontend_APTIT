import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function GET(req) {
  try {
    return proxyBackendRequest(req, "/api/notifications")
  } catch (error) {
    console.error("Get notifications error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    return proxyBackendRequest(req, "/api/notifications", {
      method: "POST",
      body,
    })
  } catch (error) {
    console.error("Send notification error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
