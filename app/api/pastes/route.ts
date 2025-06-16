import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || "$2a$10$1xQmd.rdYJNeC3PVl/96POxA4QjaRapDk2j9JA/akazrcFpcGvZpO"
const JSONBIN_BASE_URL = "https://api.jsonbin.io/v3"
const JSONBIN_COLLECTION_ID = process.env.JSONBIN_COLLECTION_ID || "684e42ec8561e97a502479f7"

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Get user from session
    const user = await getUser(request)

    const pasteData = {
      content: content.trim(),
      createdAt: new Date().toISOString(),
      userId: user?.id || null,
      username: user?.username || null,
    }

    const response = await fetch(`${JSONBIN_BASE_URL}/b`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY,
        "X-Collection-Id": JSONBIN_COLLECTION_ID,
      },
      body: JSON.stringify(pasteData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const pasteId = data.metadata.id

    return NextResponse.json({ pasteId })
  } catch (error) {
    console.error("Error creating paste:", error)
    return NextResponse.json({ error: "Failed to create paste" }, { status: 500 })
  }
}
