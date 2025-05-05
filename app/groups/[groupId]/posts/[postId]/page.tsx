import { Button } from '@/components/ui/button'
import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'
import { getUserUuid } from '@/utils/server-auth'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { MessageSquare, ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'
import { ImageGallery } from '@/components/posts/ImageGallery'
import { IPost } from '@/types'
import { supabase } from '@/lib/supabase'
import { LikeButton } from '@/components/posts/LikeButton'
import { CommentList } from '@/components/posts/CommentList'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PostDetail } from '@/components/posts/PostDetail'

// 아바타 폴백에 표시할 이니셜 생성 함수
function getInitials(name: string) {
  if (!name) return '?'
  return name.substring(0, 2).toUpperCase()
}

interface PostPageProps {
  params: {
    groupId: string
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
  
  // 그룹 멤버 여부 확인
  const memberArr = await supabaseDb.select('group_members', { 
    group_id: params.groupId, 
    user_id: uuid 
  })
  
  if (!memberArr.length) {
    return notFound()
  }
  
  // 게시글 조회
  const { data: postData, error } = await supabase
    .from('posts')
    .select(`
      *,
      users:user_id (
        id, name, email
      ),
      challenges:challenge_id (
        id, title
      )
    `)
    .eq('id', params.postId)
    .eq('group_id', params.groupId)
    .single()
  
  if (error || !postData) {
    console.error("Post not found or error:", error)
    return notFound()
  }
  
  // 사용자 정보 포맷팅
  const author = postData.users ? {
    ...postData.users
  } : null;
  
  // challenge 정보 포맷팅
  const challenge = postData.challenges ? {
    id: postData.challenges.id,
    title: postData.challenges.title
  } : null;
  
  // 최종 게시글 객체 생성
  const post = {
    ...postData,
    author: author,
    challenge: challenge
  };
  
  // 좋아요 수 조회
  const likesArr = await supabaseDb.select('post_likes', { post_id: params.postId })
  
  // 댓글 수 조회
  const commentsArr = await supabaseDb.select('post_comments', { post_id: params.postId })
  
  // 그룹 정보 조회
  const groupArr = await supabaseDb.select('groups', { id: params.groupId })
  const group = groupArr[0]
  
  if (!group) {
    return notFound()
  }
  
  // 게시글의 이미지 처리 (이전 버전과 호환)
  const imageUrls = post.image_urls || (post.image_url ? [post.image_url] : [])
  
  // 현재 사용자의 좋아요 여부 확인
  const userLike = await supabaseDb.select('post_likes', { 
    post_id: params.postId, 
    user_id: uuid 
  })
  const hasLiked = userLike.length > 0
  
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
  
  // PostDetail 컴포넌트에 전달할 포맷으로 데이터 변환
  const formattedPost = {
    id: post.id,
    title: post.title,
    content: post.content,
    created_at: post.created_at,
    imageUrls: imageUrls,
    author: {
      id: post.author?.id || '',
      clerkId: post.author?.clerk_id || '',
      name: post.author?.name || '알 수 없음',
      avatar_url: post.author?.avatar_url
    },
    isAuthor: post.user_id === uuid,
    likes: likesArr.length,
    comments: commentsArr.length,
    // 필드 호환성을 위한 추가 필드
    likeCount: likesArr.length,
    commentCount: commentsArr.length,
    isLiked: hasLiked,
    challengeId: post.challenge_id,
    groupId: post.group_id
  }
  
  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex items-start bg-white rounded-lg shadow-sm p-4 md:p-6">
        <Button variant="ghost" size="sm" asChild className="mr-2 sm:mr-6 mt-1 md:h-10">
          <Link href={`/groups/${params.groupId}?tab=posts`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" /> 
            <span className="hidden sm:inline md:text-base">돌아가기</span>
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
            <Avatar className="h-8 w-8 hidden sm:flex md:h-10 md:w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(post.author?.name || '?')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{post.title}</h1>
              <div className="flex flex-wrap gap-2 text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
                <span className="font-medium">{post.author.name}</span>
                <span>·</span>
                <span>{format(new Date(post.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}</span>
                <span>·</span>
                <Link href={`/groups/${params.groupId}/challenges/${post.challenge_id}`}>
                  <span className="bg-muted px-1.5 py-0.5 rounded text-xs md:text-sm hover:bg-muted/80">
                    {post.challenge.title}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-0">
        <PostDetail 
          post={formattedPost}
          comments={formattedComments}
          challengeId={post.challenge_id}
          postId={params.postId}
          currentUserId={clerkUserId}
        />
      </div>
    </div>
  )
} 