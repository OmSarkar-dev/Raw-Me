import { type NextRequest, NextResponse } from "next/server"

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || "$2a$10$1xQmd.rdYJNeC3PVl/96POxA4QjaRapDk2j9JA/akazrcFpcGvZpO"
const JSONBIN_BASE_URL = "https://api.jsonbin.io/v3"
const JSONBIN_COLLECTION_ID = process.env.JSONBIN_COLLECTION_ID || "684e42ec8561e97a502479f7"
const USERS_BIN_ID = process.env.USERS_BIN_ID || "676f8a5ce41b4d34e45c5c8a"

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const username = params.username.startsWith("@") ? params.username.slice(1) : params.username

    // First, get the user ID from username
    const usersResponse = await fetch(`${JSONBIN_BASE_URL}/b/${USERS_BIN_ID}`, {
      headers: {
        "X-Master-Key": JSONBIN_API_KEY,
      },
    })

    if (!usersResponse.ok) {
      throw new Error("Failed to fetch users")
    }

    const usersData = await usersResponse.json()
    const users = usersData.record.users || []
    const user = users.find((u: any) => u.username === username)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get all bins from the collection
    const response = await fetch(`${JSONBIN_BASE_URL}/c/${JSONBIN_COLLECTION_ID}/bins`, {
      headers: {
        "X-Master-Key": JSONBIN_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch collection")
    }

    const data = await response.json()
    const bins = data || []

    // Fetch each bin's content and filter by user
    const userPastes = []

    for (const bin of bins) {
      try {
        const binResponse = await fetch(`${JSONBIN_BASE_URL}/b/${bin.id}`, {
          headers: {
            "X-Master-Key": JSONBIN_API_KEY,
          },
        })

        if (binResponse.ok) {
          const binData = await binResponse.json()
          const record = binData.record

          // Check if this paste belongs to the requested user
          if (record.userId === user.id) {
            userPastes.push({
              id: bin.id,
              content: record.content,
              createdAt: record.createdAt,
              updatedAt: record.updatedAt,
              username: record.username,
            })
          }
        }
      } catch (error) {
        // Skip bins that can't be fetched
        console.error(`Error fetching bin ${bin.id}:`, error)
      }
    }

    // Sort by creation date (newest first)
    userPastes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ pastes: userPastes })
  } catch (error) {
    console.error("Error loading user pastes:", error)
    return NextResponse.json({ error: "Failed to load pastes" }, { status: 500 })
  }
}
