import { getBackendUrl } from "@/app/api/_utils/backend"

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params
    const path = Array.isArray(resolvedParams?.path) ? resolvedParams.path.join("/") : ""
    const response = await fetch(`${getBackendUrl()}/uploads/${path}`)
    const headers = new Headers()
    headers.set("Content-Type", response.headers.get("content-type") || "application/octet-stream")
    const contentLength = response.headers.get("content-length")
    if (contentLength) {
      headers.set("Content-Length", contentLength)
    }

    return new Response(response.body, {
      status: response.status,
      headers,
    })
  } catch (error) {
    console.error("Proxy uploaded file error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
