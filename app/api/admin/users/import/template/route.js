// Stream the CSV import template from the Spring Boot backend to the browser.

export const dynamic = "force-dynamic"

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
    const response = await fetch(`${backendUrl}/api/admin/users/import/template`, {
      method: "GET",
      headers: { Authorization: authHeader },
    })

    if (!response.ok) {
      const text = await response.text()
      let data
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = { message: text }
      }
      return new Response(
        JSON.stringify({
          error: data?.message || data?.error || response.statusText || "Failed to download template",
        }),
        { status: response.status },
      )
    }

    const csv = await response.text()
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=UTF-8",
        "Content-Disposition": 'attachment; filename="users_import_template.csv"',
      },
    })
  } catch (error) {
    console.error("Template download proxy error:", error)
    return new Response(
      JSON.stringify({ error: "Lỗi proxy: " + error.message }),
      { status: 500 },
    )
  }
}
