"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FileCode, Edit, Save, X, Calendar, Hash, Eye, FileText, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { ProfileAvatar } from "@/components/profile-avatar"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface UserProfile {
  id: string
  username: string
  name: string
  description: string
  createdAt: string
}

interface Paste {
  id: string
  content: string
  createdAt: string
  updatedAt?: string
  username?: string
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [pastes, setPastes] = useState<Paste[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editForm, setEditForm] = useState({ name: "", description: "" })
  const { user } = useAuth()
  const router = useRouter()

  // Remove @ from username if present
  const username = params.username.startsWith("@") ? params.username.slice(1) : params.username

  useEffect(() => {
    loadProfile()
    loadUserPastes()
  }, [username])

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/profile/${username}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("User not found")
        } else {
          throw new Error("Failed to load profile")
        }
        return
      }

      const data = await response.json()
      setProfile(data.profile)
      setEditForm({ name: data.profile.name, description: data.profile.description })
    } catch (error) {
      setError("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserPastes = async () => {
    try {
      const response = await fetch(`/api/profile/${username}/pastes`)
      if (response.ok) {
        const data = await response.json()
        setPastes(data.pastes || [])
      }
    } catch (error) {
      console.error("Failed to load user pastes:", error)
    }
  }

  const handleSave = async () => {
    if (!profile || !user || user.username !== profile.username) return

    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/profile/${username}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const data = await response.json()
      setProfile(data.profile)
      setIsEditing(false)
      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getPreview = (content: string) => {
    return content.length > 100 ? content.substring(0, 100) + "..." : content
  }

  const isOwnProfile = user && profile && user.username === profile.username

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) return null

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
                    <Button variant="outline">My Profile</Button>
                  </Link>
                  <span className="text-sm text-muted-foreground">Welcome, {user.username}</span>
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-6">
                <ProfileAvatar name={profile.name} size="lg" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      {isEditing ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="text-2xl font-bold mb-2"
                          placeholder="Your name"
                        />
                      ) : (
                        <h1 className="text-3xl font-bold">{profile.name}</h1>
                      )}
                      <p className="text-muted-foreground">@{profile.username}</p>
                    </div>
                    {isOwnProfile && (
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button onClick={handleSave} disabled={isSaving} size="sm">
                              {isSaving ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-3 w-3 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                              <X className="h-3 w-3 mr-2" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                            <Edit className="h-3 w-3 mr-2" />
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {isEditing ? (
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Tell us about yourself... (Markdown supported)"
                        className="min-h-[100px]"
                      />
                    ) : profile.description ? (
                      <MarkdownRenderer content={profile.description} />
                    ) : (
                      <p className="text-muted-foreground italic">No description provided.</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {formatDate(profile.createdAt)}
                      </span>
                      <span>{pastes.length} pastes</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* User's Pastes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                {isOwnProfile ? "My Pastes" : `${profile.name}'s Pastes`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pastes.length === 0 ? (
                <div className="text-center py-8">
                  <FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "You haven't created any pastes yet." : "This user hasn't created any pastes yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastes.map((paste) => (
                    <Card key={paste.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Hash className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono text-sm">{paste.id}</span>
                              {paste.updatedAt && (
                                <Badge variant="secondary" className="text-xs">
                                  Updated
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDate(paste.createdAt)}</p>
                          </div>
                          <div className="flex gap-2">
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
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                          <code>{getPreview(paste.content)}</code>
                        </pre>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Created by{" "}
                          <Link href={`/profile/@${profile.username}`} className="hover:underline font-medium">
                            @{profile.username}
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
