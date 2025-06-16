import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || "$2a$10$1xQmd.rdYJNeC3PVl/96POxA4QjaRapDk2j9JA/akazrcFpcGvZpO"
const JSONBIN_BASE_URL = "https://api.jsonbin.io/v3"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const response = await fetch(`${JSONBIN_BASE_URL}/b/${params.id}`, {
      headers: {
        "X-Master-Key": JSONBIN_API_KEY,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Paste not found" }, { status: 404 })
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({ paste: { id: params.id, ...data.record } })
  } catch (error) {
    console.error("Error loading paste:", error)
    return NextResponse.json({ error: "Failed to load paste" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { content } = await request.json()
    const user = await getUser(request)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // First, get the existing paste to check ownership
    const getResponse = await fetch(`${JSONBIN_BASE_URL}/b/${params.id}`, {
      headers: {
        "X-Master-Key": JSONBIN_API_KEY,
      },
    })

    if (!getResponse.ok) {
      return NextResponse.json({ error: "Paste not found" }, { status: 404 })
    }

    const existingData = await getResponse.json()

    // Check if user owns this paste
    if (existingData.record.userId !== user.id) {
      return NextResponse.json({ error: "You can only edit your own pastes" }, { status: 403 })
    }

    const updatedData = {
      ...existingData.record,
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    }

    const response = await fetch(`${JSONBIN_BASE_URL}/b/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY,
      },
      body: JSON.stringify(updatedData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating paste:", error)
    return NextResponse.json({ error: "Failed to update paste" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(request)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // First, get the existing paste to check ownership
    const getResponse = await fetch(`${JSONBIN_BASE_URL}/b/${params.id}`, {
      headers: {
        "X-Master-Key": JSONBIN_API_KEY,
      },
    })

    if (!getResponse.ok) {
      return NextResponse.json({ error: "Paste not found" }, { status: 404 })
    }

    const existingData = await getResponse.json()

    // Check if user owns this paste
    if (existingData.record.userId !== user.id) {
      return NextResponse.json({ error: "You can only delete your own pastes" }, { status: 403 })
    }

    const response = await fetch(`${JSONBIN_BASE_URL}/b/${params.id}`, {
      method: "DELETE",
      headers: {
        "X-Master-Key": JSONBIN_API_KEY,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Paste not found" }, { status: 404 })
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting paste:", error)
    return NextResponse.json({ error: "Failed to delete paste" }, { status: 500 })
  }
}
