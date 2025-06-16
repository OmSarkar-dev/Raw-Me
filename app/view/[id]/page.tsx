"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileCode, Copy, FileText, Plus, Check, Calendar, Hash, Eye, Edit, Trash2, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { ProfileAvatar } from "@/components/profile-avatar"
import { CodeBlock } from "@/components/code-block"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface Paste {
  id: string
  content: string
  createdAt: string
  updatedAt?: string
  userId?: string
  username?: string
}

export default function ViewPastePage({ params }: { params: { id: string } }) {
  const [paste, setPaste] = useState<Paste | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

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

  const copyToClipboard = async () => {
    if (!paste) return

    try {
      await navigator.clipboard.writeText(paste.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const deletePaste = async () => {
    if (!paste || !confirm("Are you sure you want to delete this paste?")) return

    try {
      const response = await fetch(`/api/pastes/${paste.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete paste")

      router.push("/dashboard")
    } catch (error) {
      setError("Failed to delete paste")
    }
  }

  const detectLanguage = (content: string): string => {
    const lowerContent = content.toLowerCase()

    if (lowerContent.includes("<!doctype") || lowerContent.includes("<html")) return "html"
    if (
      lowerContent.includes("```") ||
      lowerContent.includes("#") ||
      lowerContent.includes("**") ||
      lowerContent.includes("*") ||
      (lowerContent.includes("[") && lowerContent.includes("]("))
    )
      return "markdown"
    if (lowerContent.includes("function") && lowerContent.includes("{")) return "javascript"
    if (lowerContent.includes("def ") && lowerContent.includes(":")) return "python"
    if (lowerContent.includes("<?php")) return "php"
    if (lowerContent.includes("#include") || lowerContent.includes("int main")) return "c"
    if (lowerContent.includes("public class") || lowerContent.includes("import java")) return "java"
    if (lowerContent.includes("SELECT") || lowerContent.includes("INSERT")) return "sql"
    if (lowerContent.includes("{") && lowerContent.includes("}")) return "css"

    return "text"
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const isOwner = user && paste && paste.userId === user.id

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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <FileCode className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Paste not found</h2>
            <p className="text-muted-foreground mb-4">
              The paste you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Paste
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!paste) return null

  const language = detectLanguage(paste.content)
  const isHtml = language === "html"
  const isMarkdown = language === "markdown"

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link href="/" className="flex items-center gap-2">
              <FileCode className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Raw Me</h1>
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={copyToClipboard} variant="outline">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Link href={`/raw/${paste.id}`}>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Raw View
                </Button>
              </Link>
              {(isHtml || isMarkdown) && (
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? "Code View" : isMarkdown ? "Markdown Preview" : "HTML Preview"}
                </Button>
              )}
              {isOwner && (
                <>
                  <Link href={`/edit/${paste.id}`}>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={deletePaste} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
              <Link href="/">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Paste
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Paste Details
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(paste.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {paste.id}
                </span>
                <span>{formatBytes(paste.content.length)}</span>
                {paste.username && (
                  <div className="flex items-center gap-2">
                    <ProfileAvatar name={paste.username} size="sm" />
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      by{" "}
                      <Link href={`/profile/@${paste.username}`} className="hover:underline font-medium">
                        @{paste.username}
                      </Link>
                    </span>
                  </div>
                )}
                {paste.updatedAt && <Badge variant="secondary">Updated</Badge>}
                <Badge variant="outline">{language}</Badge>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {showPreview && isHtml ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b">
                    <span className="text-sm font-medium">HTML Preview</span>
                  </div>
                  <div className="p-4">
                    <iframe
                      srcDoc={paste.content}
                      className="w-full h-96 border rounded"
                      title="HTML Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              ) : showPreview && isMarkdown ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b">
                    <span className="text-sm font-medium">Markdown Preview</span>
                  </div>
                  <div className="p-6">
                    <MarkdownRenderer content={paste.content} />
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <CodeBlock code={paste.content} language={language} title={`${language.toUpperCase()} Code`} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
