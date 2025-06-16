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

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Get existing users from JSONBin
    const response = await fetch(`${JSONBIN_BASE_URL}/b/${USERS_BIN_ID}`, {
      headers: {
        "X-Master-Key": JSONBIN_API_KEY,
      },
    })

    let users = []
    if (response.ok) {
      const data = await response.json()
      users = data.record.users || []
    }

    // Check if username already exists
    if (users.find((u: any) => u.username === username)) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      username,
      password, // In production, hash this password
      name: username, // Default name to username
      description: "", // Empty description by default
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)

    // Update users in JSONBin
    const updateResponse = await fetch(`${JSONBIN_BASE_URL}/b/${USERS_BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY,
      },
      body: JSON.stringify({ users }),
    })

    if (!updateResponse.ok) {
      throw new Error("Failed to save user")
    }

    // Create JWT token
    const token = await new SignJWT({ userId: newUser.id, username: newUser.username })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET)

    const responseData = NextResponse.json({
      user: {
        id: newUser.id,
        username: newUser.username,
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
    console.error("Register error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
