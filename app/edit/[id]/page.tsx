"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileCode, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

interface Paste {
  id: string
  content: string
  createdAt: string
  userId?: string
}

export default function EditPastePage({ params }: { params: { id: string } }) {
  const [paste, setPaste] = useState<Paste | null>(null)
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    loadPaste()
  }, [params.id, user, router])

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
      const pasteData = data.paste

      // Check if user owns this paste
      if (pasteData.userId !== user?.id) {
        setError("You can only edit your own pastes")
        return
      }

      setPaste(pasteData)
      setContent(pasteData.content)
    } catch (error) {
      setError("Failed to load paste")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError("Content cannot be empty")
      return
    }

    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/pastes/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to update paste")
      }

      setSuccess("Paste updated successfully!")
      setTimeout(() => {
        router.push(`/view/${params.id}`)
      }, 1500)
    } catch (error) {
      setError("Failed to update paste")
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading paste...</p>
        </div>
      </div>
    )
  }

  if (error && !paste) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <FileCode className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Cannot Edit Paste</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <FileCode className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Raw Me</h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href={`/view/${params.id}`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to View
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Edit Paste</h2>
            <p className="text-muted-foreground">Make changes to your paste content</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Edit Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label htmlFor="content" className="block text-sm font-medium mb-2">
                    Paste content:
                  </label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your code, text, or any content here..."
                    className="min-h-[400px] font-mono text-sm"
                    required
                  />
                </div>

                <Button type="submit" disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>

              {error && (
                <Alert className="mt-4" variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mt-4">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
