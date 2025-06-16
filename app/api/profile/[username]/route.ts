import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || "$2a$10$1xQmd.rdYJNeC3PVl/96POxA4QjaRapDk2j9JA/akazrcFpcGvZpO"
const JSONBIN_BASE_URL = "https://api.jsonbin.io/v3"
const USERS_BIN_ID = process.env.USERS_BIN_ID || "676f8a5ce41b4d34e45c5c8a"

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    // Remove @ from username if present
    const username = params.username.startsWith("@") ? params.username.slice(1) : params.username

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

    // Find user by username
    const user = users.find((u: any) => u.username === username)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return public profile data
    return NextResponse.json({
      profile: {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        description: user.description || "",
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("Error loading profile:", error)
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const currentUser = await getUser(request)
    const username = params.username.startsWith("@") ? params.username.slice(1) : params.username

    if (!currentUser || currentUser.username !== username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
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

    // Find and update user
    const userIndex = users.findIndex((u: any) => u.username === username)

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    users[userIndex] = {
      ...users[userIndex],
      name: name.trim(),
      description: description.trim(),
      updatedAt: new Date().toISOString(),
    }

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
      throw new Error("Failed to update user")
    }

    return NextResponse.json({
      profile: {
        id: users[userIndex].id,
        username: users[userIndex].username,
        name: users[userIndex].name,
        description: users[userIndex].description,
        createdAt: users[userIndex].createdAt,
      },
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
