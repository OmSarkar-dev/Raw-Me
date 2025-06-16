"use client"

import { useState, useEffect } from "react"

interface Paste {
  id: string
  content: string
  createdAt: string
}

export default function RawPastePage({ params }: { params: { id: string } }) {
  const [paste, setPaste] = useState<Paste | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadPaste()
  }, [params.id])

  const loadPaste = async () => {
    try {
      const response = await fetch(`/api/pastes/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("Paste not found")
        } else {
          throw new Error("Failed to load paste")
        }
        return
      }

      const data = await response.json()
      setPaste(data.paste)
    } catch (error) {
      setError("Failed to load paste")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>Loading...</div>
  }

  if (error) {
    return <div style={{ padding: "20px", textAlign: "center", color: "#ff0000" }}>Paste not found</div>
  }

  if (!paste) return null

  return (
    <pre
      style={{
        margin: 0,
        padding: 0,
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        fontFamily: "'Courier New', Consolas, Monaco, monospace",
        fontSize: "14px",
        lineHeight: "1.4",
        background: "#fff",
        color: "#000",
      }}
    >
      {paste.content}
    </pre>
  )
}
