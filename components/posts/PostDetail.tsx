'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger, 
  DialogTitle,
  DialogDescription,
  DialogHeader
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ImageGallery } from '@/components/posts/ImageGallery'
import { LikeButton } from '@/components/posts/LikeButton'
import { CommentList } from '@/components/posts/CommentList'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Edit, Loader2, MessageSquare, Trash } from 'lucide-react'
import { usePostsStore } from '@/store/posts'
import { useChallengeRecordsStore } from '@/store/challenge-records'
import { useChallengesStore } from '@/store/challenges'

interface IAuthor {
  id: string
  clerkId: string
  name: string
  avatar_url?: string
}

interface IPost {
  id: string
  title: string
  content: string
  imageUrls: string[]
  created_at: string
  author: IAuthor
  likes: number
  comments: number
  isLiked: boolean
  isAuthor: boolean
  challengeId: string
  groupId: string
}

interface IComment {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  post_id: string
  parent_id: string | null
  author: IAuthor
  isAuthor?: boolean
  is_deleted?: boolean
  replies?: IComment[]
}

interface PostDetailProps {
  post: IPost
  comments: IComment[]
  challengeId: string
  postId: string
  currentUserId: string
}

export function PostDetail({ post, comments, challengeId, postId, currentUserId }: PostDetailProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [commentCount, setCommentCount] = useState(post.comments)
  const [updatedComments, setUpdatedComments] = useState<IComment[]>(comments)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()
  
  // 게시글 스토어 접근
  const deletePost = usePostsStore(state => state.deletePost)
  const updateCommentCount = usePostsStore(state => state.updateCommentCount)
  
  // 챌린지 레코드 스토어 접근
  const invalidateRecordsCache = useChallengeRecordsStore(state => state.invalidateCache)
  const updateRecordsCacheTimestamp = useChallengeRecordsStore(state => state.updateCacheTimestamp)
  
  // 챌린지 스토어 접근
  const invalidateChallengesCache = useChallengesStore(state => state.invalidateCache)
  const updateChallengesCacheTimestamp = useChallengesStore(state => state.updateCacheTimestamp)

  // 댓글 상태 초기화
  useEffect(() => {
    setUpdatedComments(comments)
  }, [comments])

  const handleLikeToggle = (newIsLiked: boolean) => {
    setIsLiked(newIsLiked)
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1)
  }

  const handleCommentSubmit = (newComment: any) => {
    // CommentForm에서 받은 댓글을 완전한 IComment 형식으로 변환
    const fullComment: IComment = {
      ...newComment,
      updated_at: newComment.created_at,
      user_id: newComment.author?.id || '',
      post_id: postId,
      parent_id: newComment.parent_id || null,
      is_deleted: false
    }
    
    setUpdatedComments(prev => [...prev, fullComment])
    setCommentCount(prev => prev + 1)
    
    // 스토어에 댓글 수 업데이트
    if (post.groupId) {
      updateCommentCount(post.groupId, postId, true)
    }
  }
  
  const handleCommentDelete = (commentId: string) => {
    setUpdatedComments(prev => prev.filter(comment => comment.id !== commentId))
    setCommentCount(prev => prev - 1)
    
    // 스토어에 댓글 수 업데이트
    if (post.groupId) {
      updateCommentCount(post.groupId, postId, false)
    }
  }
  
  const handlePostDelete = async () => {
    setIsDeleteLoading(true)
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('게시글 삭제에 실패했습니다')
      }
      
      toast({
        title: '성공',
        description: '게시글이 삭제되었습니다',
      })
      
      // 스토어에서 게시글 삭제
      deletePost(post.groupId, postId)
      
      // 챌린지 레코드와 챌린지 캐시 타임스탬프 업데이트
      updateRecordsCacheTimestamp(post.groupId)
      updateChallengesCacheTimestamp(post.groupId)
      
      // 모임의 게시판 뷰로 이동
      router.push(`/groups/${post.groupId}?tab=posts`)
      router.refresh()
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '게시글 삭제 중 오류가 발생했습니다',
        variant: 'destructive',
      })
    } finally {
      setIsDeleteLoading(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <div className="space-y-6 md:space-y-8 p-4 md:p-6">
        <div className="flex items-start sm:items-center justify-between">
          <div className="space-y-1 md:space-y-2">
            <div className="flex items-center space-x-2 text-sm md:text-base text-muted-foreground">
              <span>{format(new Date(post.created_at), 'yyyy년 MM월 dd일 HH:mm', {
                locale: ko,
              })}</span>
            </div>
          </div>
          {post.isAuthor && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/groups/${post.groupId}/posts/${post.id}/edit`)}
                size="sm"
                className="md:h-10 md:px-4 md:py-2 md:text-base"
              >
                <Edit className="h-4 w-4 mr-2 md:h-5 md:w-5" />
                수정
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                size="sm"
                className="md:h-10 md:px-4 md:py-2 md:text-base"
              >
                <Trash className="h-4 w-4 mr-2 md:h-5 md:w-5" />
                삭제
              </Button>
            </div>
          )}
        </div>

        <div className="prose prose-slate max-w-none md:prose-lg">
          <p className="whitespace-pre-wrap text-base md:text-lg">{post.content}</p>
        </div>

        {post.imageUrls.length > 0 && (
          <div className="mt-4 md:mt-6">
            <ImageGallery images={post.imageUrls} postTitle={post.title} />
          </div>
        )}

        <div className="flex items-center space-x-4 pt-4 md:pt-6 border-t">
          <LikeButton
            postId={post.id}
            initialLikeCount={likeCount}
            initialLiked={isLiked}
            onLikeToggle={handleLikeToggle}
          />
          <div className="flex items-center text-muted-foreground">
            <MessageSquare className="h-4 w-4 md:h-5 md:w-5 mr-1" />
            <span className="text-sm md:text-base">{commentCount}개의 댓글</span>
          </div>
        </div>

        <div className="pt-6 md:pt-8">
          <CommentList 
            comments={updatedComments} 
            postId={post.id} 
            currentUserId={currentUserId} 
            onCommentSubmitted={handleCommentSubmit} 
            onCommentDeleted={handleCommentDelete}
          />
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>게시글 삭제</DialogTitle>
            <DialogDescription>
              정말 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={handlePostDelete}
              disabled={isDeleteLoading}
            >
              {isDeleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  삭제 중...
                </>
              ) : '삭제'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 