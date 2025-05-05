import { supabaseDb } from '@/db'
import { getSupabaseUuid } from '@/utils/server-auth'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PostEditForm } from '@/components/posts/PostEditForm'

interface EditPostPageProps {
  params: {
    groupId: string
    postId: string
  }
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const uuid = await getSupabaseUuid()
  
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
        id, name, email, clerk_id
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
  
  // 작성자만 수정 가능하도록 검증
  if (postData.user_id !== uuid) {
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
  
  // 게시글의 이미지 처리 (이전 버전과 호환)
  const imageUrls = post.image_urls || (post.image_url ? [post.image_url] : [])
  
  // PostEditForm에 전달할 데이터 포맷
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
    },
    challengeId: post.challenge_id,
    groupId: post.group_id
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href={`/groups/${params.groupId}/posts/${params.postId}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> 
            돌아가기
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">게시글 수정</h1>
      </div>
      
      <PostEditForm
        post={formattedPost}
        groupId={params.groupId}
        challengeId={post.challenge_id}
      />
    </div>
  )
} 