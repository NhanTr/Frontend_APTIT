import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const backendParams = new URLSearchParams()

    const year = searchParams.get("year")
    const semester = searchParams.get("semester")
    if (year) backendParams.set("year", year)
    if (semester) backendParams.set("semester", semester)

    const query = backendParams.toString()
    return proxyBackendRequest(req, `/api/v1/registrations/my-points${query ? `?${query}` : ""}`)
  } catch (error) {
    console.error("Get student points error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
