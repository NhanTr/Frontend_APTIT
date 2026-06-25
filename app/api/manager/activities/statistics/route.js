import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const params = new URLSearchParams()

    for (const key of ["year", "semester"]) {
      const value = searchParams.get(key)
      if (value) params.set(key, value)
    }

    const query = params.toString()
    return proxyBackendRequest(req, `/api/manager/activities/statistics${query ? `?${query}` : ""}`)
  } catch (error) {
    console.error("Get manager statistics error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
