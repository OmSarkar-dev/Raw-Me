"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileCode, Send, Eye, FileText, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export default function HomePage() {
  // Add loading state handling at the beginning of the component
  const { user, logout, isLoading } = useAuth()

  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ pasteId: string; viewUrl: string; rawUrl: string } | null>(null)
  const [error, setError] = useState("")
  const [copiedLink, setCopiedLink] = useState("")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError("Please enter some content before submitting.")
      return
    }

    setIsSubmitting(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/pastes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to create paste")
      }

      const data = await response.json()
      const baseUrl = window.location.origin

      setResult({
        pasteId: data.pasteId,
        viewUrl: `${baseUrl}/view/${data.pasteId}`,
        rawUrl: `${baseUrl}/raw/${data.pasteId}`,
      })

      setContent("")
    } catch (error) {
      setError("Failed to create paste. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = async (url: string, type: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(type)
      setTimeout(() => setCopiedLink(""), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
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
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="outline">My Pastes</Button>
                  </Link>
                  <Link href={`/profile/@${user.username}`}>
                    <Button variant="outline">Your Profile</Button>
                  </Link>
                  <span className="text-sm text-muted-foreground">Welcome, {user.username}</span>
                  <Button variant="ghost" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4">Share Your Code</h2>
            <p className="text-xl text-muted-foreground">
              Share your code and text instantly with syntax highlighting and preview
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Create New Paste
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="content" className="block text-sm font-medium mb-2">
                    Paste your content here:
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

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating paste...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </form>

              {error && (
                <Alert className="mt-4" variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result && (
                <Alert className="mt-4">
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-medium">Paste created successfully!</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <Link href={`/view/${result.pasteId}`} className="text-sm font-medium hover:underline">
                              View (Styled)
                            </Link>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.viewUrl, "view")}>
                            {copiedLink === "view" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <Link href={`/raw/${result.pasteId}`} className="text-sm font-medium hover:underline">
                              Raw (Plain Text)
                            </Link>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.rawUrl, "raw")}>
                            {copiedLink === "raw" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2024 Raw Me - Powered by JSONBin.io
        </div>
      </footer>
    </div>
  )
}
