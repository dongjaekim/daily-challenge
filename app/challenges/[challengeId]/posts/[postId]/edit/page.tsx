import { PostEditForm } from '@/components/posts/PostEditForm'
import { Button } from '@/components/ui/button'
import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'
import { getUserUuid } from '@/utils/server-auth'
import { notFound, redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface PostEditPageProps {
  params: {
    challengeId: string
    postId: string
  }
}

export default async function PostEditPage({ params }: PostEditPageProps) {
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

  // 그룹 멤버 여부 확인
  const memberArr = await supabaseDb.select('group_members', { group_id: challenge.group_id, user_id: uuid })
  if (!memberArr.length) {
    return notFound()
  }

  // 게시글 조회
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', params.postId)
    .eq('challenge_id', params.challengeId)
    .single()
  
  if (error || !post) {
    console.error("Post not found or error:", error)
    return notFound()
  }

  // 본인 게시글이 아니면 접근 불가
  if (post.user_id !== uuid) {
    return redirect(`/challenges/${params.challengeId}/posts/${params.postId}`)
  }

  // 그룹의 모든 챌린지 조회
  const groupChallenges = await supabaseDb.select('challenges', { group_id: challenge.group_id })

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">게시글 수정</h1>
      <PostEditForm 
        post={post}
        groupId={challenge.group_id}
        challengeId={post.challenge_id}
      />
    </div>
  )
} 