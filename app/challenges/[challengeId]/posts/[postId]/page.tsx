import { PostForm } from '@/components/posts/PostForm'
import { CommentForm } from '@/components/posts/CommentForm'
import { CommentList } from '@/components/posts/CommentList'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'
import { getUserUuid } from '@/utils/server-auth'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { PostDetail } from '@/components/posts/PostDetail'
import { supabase } from '@/lib/supabase'

interface PostPageProps {
  params: {
    challengeId: string
    postId: string
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { userId: clerkUserId } = auth()
  if (!clerkUserId) {
    return notFound()
  }

  // clerk_id로 Supabase users 테이블에서 UUID 조회
  const uuid = await getUserUuid(clerkUserId)
  
  if (!uuid) {
    console.error("User UUID not found")
    return notFound()
  }

  // 챌린지 존재 여부 확인
  const challengeArr = await supabaseDb.select('challenges', { id: params.challengeId })
  if (!challengeArr.length) {
    return notFound()
  }
  const challenge = challengeArr[0]

  // 그룹 멤버 여부 확인 (이제 uuid 사용)
  const memberArr = await supabaseDb.select('group_members', { group_id: challenge.group_id, user_id: uuid })
  if (!memberArr.length) {
    return notFound()
  }

  // 게시글 조회
  const postArr = await supabaseDb.select('posts', { id: params.postId, challenge_id: params.challengeId })
  if (!postArr.length) {
    return notFound()
  }
  const postRaw = postArr[0]
  
  // 게시글 작성자 정보 조회
  const userArr = await supabaseDb.select('users', { id: postRaw.user_id })
  const author = userArr[0] || { name: '알 수 없음' }
  
  // 댓글 목록 조회 (삭제된 댓글 포함)
  const commentsWithUsers = await supabase
    .from('post_comments')
    .select(`
      *,
      users:user_id (
        id, name, avatar_url, clerk_id
      )
    `)
    .eq('post_id', params.postId)
    .order('created_at', { ascending: true })
  
  // 댓글 데이터 포맷팅
  const formattedComments = (commentsWithUsers.data || []).map(comment => ({
    id: comment.id,
    content: comment.content,
    created_at: comment.created_at,
    updated_at: comment.updated_at || comment.created_at,
    user_id: comment.user_id,
    post_id: comment.post_id,
    parent_id: comment.parent_id,
    is_deleted: comment.is_deleted || false,
    author: {
      id: comment.users?.id,
      name: comment.users?.name || '알 수 없음',
      clerkId: comment.users?.clerk_id,
      avatar_url: comment.users?.avatar_url
    },
    isAuthor: comment.user_id === uuid
  }))
  
  // 좋아요 정보 조회
  const likesArr = await supabaseDb.select('post_likes', { post_id: params.postId })
  const isLiked = likesArr.some(like => like.user_id === uuid)
  
  // 이미지 URL 배열 처리
  const imageUrls = postRaw.image_urls || []
  
  // 게시글 데이터 구성
  const post = {
    id: postRaw.id,
    title: postRaw.title,
    content: postRaw.content,
    imageUrls: imageUrls,
    created_at: postRaw.created_at,
    author: {
      id: author.id,
      clerkId: clerkUserId, // 클라이언트에서 사용할 Clerk ID
      name: author.name
    },
    likes: likesArr.length,
    comments: formattedComments.length,
    // 추가 호환성을 위한 필드
    likeCount: likesArr.length,
    commentCount: formattedComments.length,
    isLiked,
    isAuthor: postRaw.user_id === uuid,
    challengeId: params.challengeId,
    groupId: challenge.group_id
  }

  return (
    <div className="space-y-8">
      <PostDetail 
        post={post} 
        comments={formattedComments} 
        challengeId={params.challengeId} 
        postId={params.postId} 
        currentUserId={clerkUserId}
      />
    </div>
  )
} 