'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Send } from 'lucide-react'

interface IAuthor {
  id: string
  clerkId: string
  name: string
  avatar_url?: string
}

interface IComment {
  id: string
  content: string
  created_at: string
  author: IAuthor
  isAuthor: boolean
  parent_id?: string
}

interface CommentFormProps {
  postId: string
  parentId?: string | null
  onCommentSubmitted: (comment: IComment) => void
  placeholder?: string
  buttonText?: string
  autoFocus?: boolean
  onCancel?: () => void
}

export function CommentForm({
  postId,
  parentId = null,
  onCommentSubmitted,
  placeholder = '댓글을 작성해보세요...',
  buttonText = '댓글 작성',
  autoFocus = false,
  onCancel
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast({
        title: '댓글을 입력해주세요',
        variant: 'destructive',
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parentId
        }),
      })
      
      if (!response.ok) {
        throw new Error('댓글 작성에 실패했습니다.')
      }
      
      const comment = await response.json()
      
      // 성공적으로 댓글이 작성됨
      toast({
        title: '댓글이 작성되었습니다',
      })
      
      setContent('')
      onCommentSubmitted(comment)
      
      if (onCancel) {
        onCancel()
      }
      
    } catch (error) {
      toast({
        title: '오류',
        description: '댓글 작성 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        className="resize-none min-h-[80px] focus-visible:ring-primary"
        autoFocus={autoFocus}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isLoading || !content.trim()}
          className="gap-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> 
              작성 중...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> 
              {buttonText}
            </>
          )}
        </Button>
      </div>
    </form>
  )
} 