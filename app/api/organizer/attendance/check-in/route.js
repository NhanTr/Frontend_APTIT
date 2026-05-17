import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function POST(req) {
  try {
    const body = await req.json()
    return proxyBackendRequest(req, "/api/organizer/attendance/check-in", {
      method: "POST",
      body,
    })
  } catch (error) {
    console.error("Check in attendance error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
