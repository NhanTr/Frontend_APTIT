export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return new Response(JSON.stringify({ error: "Không tìm thấy token" }), { status: 401 })
    }

    const { oldPassword, newPassword, confirmPassword } = await req.json()

    if (!oldPassword || !newPassword || !confirmPassword) {
      return new Response(
        JSON.stringify({ error: "Vui lòng nhập mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu" }),
        { status: 400 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"

    const response = await fetch(`${backendUrl}/auth/change-password`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        oldPassword,
        newPassword,
        confirmPassword,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Thay đổi mật khẩu thất bại" }))
      return new Response(
        JSON.stringify({ 
          error: errorData.message || errorData.error || "Thay đổi mật khẩu thất bại" 
        }),
        { status: response.status }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (error) {
    console.error("Change password error:", error)
    return new Response(JSON.stringify({ error: error.message || "Thay đổi mật khẩu thất bại" }), { status: 500 })
  }
}
