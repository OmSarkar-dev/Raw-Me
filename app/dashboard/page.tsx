"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FileCode, Eye, FileText, Edit, Trash2, Plus, Calendar, Hash, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { ProfileAvatar } from "@/components/profile-avatar"

interface Paste {
  id: string
  content: string
  createdAt: string
  updatedAt?: string
  username?: string
}

export default function DashboardPage() {
  const [pastes, setPastes] = useState<Paste[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    loadUserPastes()
  }, [user, router])

  const loadUserPastes = async () => {
    try {
      const response = await fetch("/api/user/pastes")
      if (!response.ok) throw new Error("Failed to load pastes")

      const data = await response.json()
      setPastes(data.pastes || [])
    } catch (error) {
      setError("Failed to load your pastes")
    } finally {
      setIsLoading(false)
    }
  }

  const deletePaste = async (pasteId: string) => {
    if (!confirm("Are you sure you want to delete this paste?")) return

    try {
      const response = await fetch(`/api/pastes/${pasteId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete paste")

      setPastes(pastes.filter((paste) => paste.id !== pasteId))
    } catch (error) {
      setError("Failed to delete paste")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPreview = (content: string) => {
    return content.length > 100 ? content.substring(0, 100) + "..." : content
  }

  if (!user) return null

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
              <span className="text-sm text-muted-foreground">Welcome, {user.username}</span>
              <Button variant="ghost" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">My Pastes</h2>
              <p className="text-muted-foreground mt-2">Manage your code snippets and text pastes</p>
            </div>
            <Link href="/">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Paste
              </Button>
            </Link>
          </div>

          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your pastes...</p>
            </div>
          ) : pastes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pastes yet</h3>
                <p className="text-muted-foreground mb-4">Create your first paste to get started</p>
                <Link href="/">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Paste
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pastes.map((paste) => (
                <Card key={paste.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          {paste.id}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(paste.createdAt)}
                          </span>
                          <div className="flex items-center gap-2">
                            <ProfileAvatar name={paste.username || "Anonymous"} size="sm" />
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              by{" "}
                              {paste.username ? (
                                <Link href={`/profile/@${paste.username}`} className="hover:underline font-medium">
                                  @{paste.username}
                                </Link>
                              ) : (
                                "Anonymous"
                              )}
                            </span>
                          </div>
                          {paste.updatedAt && <Badge variant="secondary">Updated</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/view/${paste.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/raw/${paste.id}`}>
                          <Button size="sm" variant="outline">
                            <FileText className="h-3 w-3 mr-1" />
                            Raw
                          </Button>
                        </Link>
                        <Link href={`/edit/${paste.id}`}>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deletePaste(paste.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                      <code>{getPreview(paste.content)}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
