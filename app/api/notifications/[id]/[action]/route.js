import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function PATCH(req, { params }) {
  try {
    const { id, action } = await params
    if (!["read", "unread"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid notification action" }), { status: 400 })
    }

    return proxyBackendRequest(req, `/api/notifications/${id}/${action}`, {
      method: "PATCH",
    })
  } catch (error) {
    console.error("Update notification error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
