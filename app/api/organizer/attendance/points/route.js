import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function PATCH(req) {
  try {
    const body = await req.json()
    return proxyBackendRequest(req, "/api/organizer/attendance/points", {
      method: "PATCH",
      body,
    })
  } catch (error) {
    console.error("Award attendance points error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
