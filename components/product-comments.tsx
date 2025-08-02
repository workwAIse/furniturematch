"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Send, Edit, Trash2, X, Check } from "lucide-react"
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [showComments, setShowComments] = useState(false)

  // Load comments on mount and when productId changes
  useEffect(() => {
    if (showComments) {
      loadComments()
    }
  }, [productId, showComments])

  const loadComments = async () => {
    try {
      const fetchedComments = await DatabaseService.getComments(productId)
      setComments(fetchedComments)
    } catch (error) {
      console.error('Error loading comments:', error)
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

  return (
    <div className="space-y-3">
      {/* Comments Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="w-full h-8 text-xs"
      >
        <MessageCircle className="h-3 w-3 mr-1" />
        Comments ({comments.length})
      </Button>

      {showComments && (
        <Card>
          <CardContent className="p-3 space-y-3">
            {/* Add Comment */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                className="flex-1 h-8 text-xs"
                disabled={isLoading}
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!newComment.trim() || isLoading}
                className="h-8 px-2"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-2">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                        {getUserAvatar(comment.user_id)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="h-6 text-xs"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleEditComment(comment.id)}
                              disabled={isLoading}
                              className="h-6 px-2"
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
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
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
                                  className="h-4 w-4 p-0 text-gray-400 hover:text-gray-600"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="h-4 w-4 p-0 text-red-400 hover:text-red-600"
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