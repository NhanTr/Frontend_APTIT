import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const params = new URLSearchParams()
    for (const key of ["roomId", "startTime", "endTime"]) {
      const value = searchParams.get(key)
      if (value) params.set(key, value)
    }

    return proxyBackendRequest(req, `/api/v1/activities/schedule-conflicts?${params.toString()}`)
  } catch (error) {
    console.error("Preview schedule conflicts error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
