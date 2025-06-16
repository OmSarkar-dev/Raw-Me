import { type NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || "$2a$10$1xQmd.rdYJNeC3PVl/96POxA4QjaRapDk2j9JA/akazrcFpcGvZpO"
const JSONBIN_BASE_URL = "https://api.jsonbin.io/v3"
const USERS_BIN_ID = process.env.USERS_BIN_ID || "676f8a5ce41b4d34e45c5c8a"
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    // Get users from JSONBin
    const response = await fetch(`${JSONBIN_BASE_URL}/b/${USERS_BIN_ID}`, {
      headers: {
        "X-Master-Key": JSONBIN_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch users")
    }

    const data = await response.json()
    const users = data.record.users || []

    // Find user
    const user = users.find((u: any) => u.username === username && u.password === password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token
    const token = await new SignJWT({ userId: user.id, username: user.username })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET)

    const responseData = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
      },
    })

    // Set HTTP-only cookie
    responseData.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return responseData
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
