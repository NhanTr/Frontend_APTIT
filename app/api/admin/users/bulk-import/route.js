import { NextResponse } from "next/server"

function getBackendUrl() {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
}

export async function POST(req) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.replace("Bearer ", "")

  let formData
  try {
    formData = await req.formData()
  } catch (err) {
    return NextResponse.json(
      { error: "Yêu cầu multipart/form-data không hợp lệ. Vui lòng chọn lại file." },
      { status: 400 },
    )
  }

  const file = formData.get("file")

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Thiếu file CSV" }, { status: 400 })
  }

  const backendForm = new FormData()
  backendForm.append("file", file, file.name || "users.csv")

  try {
    const response = await fetch(`${getBackendUrl()}/api/admin/users/bulk-import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendForm,
    })

    const contentType = response.headers.get("content-type") || "application/json"
    const body = await response.text()

    if (!response.ok) {
      let message = body
      try {
        const parsed = JSON.parse(body)
        message = parsed?.message || parsed?.error || body
      } catch {
        if (!message) message = `Backend trả về HTTP ${response.status}`
      }
      return NextResponse.json(
        { error: typeof message === "string" ? message : "Import thất bại" },
        { status: response.status, headers: { "Content-Type": contentType } },
      )
    }

    return new Response(body, {
      status: response.status,
      headers: { "Content-Type": contentType },
    })
  } catch (error) {
    console.error("Bulk import proxy error:", error)
    return NextResponse.json(
      { error: error?.message || "Không thể kết nối tới máy chủ backend" },
      { status: 502 },
    )
  }
}
