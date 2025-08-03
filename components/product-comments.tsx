"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Send, Edit, Trash2, X, Check, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DatabaseService } from "@/lib/database"
import type { Comment } from "@/lib/supabase"

interface ProductCommentsProps {
  productId: string
  currentUserId: string
}

export function ProductComments({ productId, currentUserId }: ProductCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [showComments, setShowComments] = useState(false)

  // Load comments on mount and when productId changes
  useEffect(() => {
    loadComments()
  }, [productId])

  const loadComments = async () => {
    try {
      const fetchedComments = await DatabaseService.getComments(productId)
      setComments(fetchedComments)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setIsInitialLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || isLoading) return

    setIsLoading(true)
    try {
      const comment = await DatabaseService.addComment({
        product_id: productId,
        user_id: currentUserId,
        content: newComment.trim()
      })
      
      setComments(prev => [...prev, comment])
      setNewComment("")
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editingContent.trim() || isLoading) return

    setIsLoading(true)
    try {
      const updatedComment = await DatabaseService.updateComment(commentId, editingContent.trim())
      setComments(prev => prev.map(comment => 
        comment.id === commentId ? updatedComment : comment
      ))
      setEditingCommentId(null)
      setEditingContent("")
    } catch (error) {
      console.error('Error updating comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (isLoading) return

    if (!confirm('Are you sure you want to delete this comment?')) return

    setIsLoading(true)
    try {
      await DatabaseService.deleteComment(commentId)
      setComments(prev => prev.filter(comment => comment.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingCommentId(null)
    setEditingContent("")
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getUserDisplayName = (userId: string) => {
    return userId === 'user1' ? 'Alex' : 'Moritz'
  }

  const getUserAvatar = (userId: string) => {
    return userId === 'user1' ? '👨‍💻' : '👩‍💻'
  }

  const getUserInitials = (userId: string) => {
    return userId === 'user1' ? 'A' : 'M'
  }

  return (
    <div className="space-y-3">
      {/* Enhanced Comments Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="w-full h-8 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-purple-200 hover:border-purple-300"
        disabled={isInitialLoading}
      >
        <MessageCircle className="h-3 w-3 mr-2" />
        <span className="font-medium">Comments</span>
        <Badge variant="secondary" className="ml-2 text-xs bg-purple-100 text-purple-700">
          {isInitialLoading ? "..." : comments.length}
        </Badge>
      </Button>

      {showComments && (
        <Card className="border-0 bg-gray-50/50 backdrop-blur-sm">
          <CardContent className="p-3 space-y-3">
            {/* Enhanced Comment Input */}
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-purple-600">
                  {getUserInitials(currentUserId)}
                </span>
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  className="border-0 bg-white focus:ring-2 focus:ring-purple-500 shadow-sm h-8 text-xs"
                  disabled={isLoading || isInitialLoading}
                />
              </div>
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!newComment.trim() || isLoading || isInitialLoading}
                className="h-8 px-2 bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>

            {/* Enhanced Comments List */}
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {isInitialLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-4">
                  <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600">
                        {getUserInitials(comment.user_id)}
                      </span>
                    </div>
                    <div className="flex-1 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="h-6 text-xs border-gray-200 focus:ring-2 focus:ring-purple-500"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleEditComment(comment.id)}
                              disabled={isLoading}
                              className="h-6 px-2 bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditing}
                              className="h-6 px-2"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-800">
                              {getUserDisplayName(comment.user_id)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(comment.created_at)}
                            </span>
                            {comment.user_id === currentUserId && (
                              <div className="flex gap-1 ml-auto">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditing(comment)}
                                  className="h-4 w-4 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="h-4 w-4 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 