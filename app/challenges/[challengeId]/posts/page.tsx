import { PostForm } from '@/components/posts/PostForm'
import { PostList } from '@/components/posts/PostList'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { supabaseDb } from '@/db'
import { getSupabaseUuid } from '@/utils/server-auth'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'

interface PostsPageProps {
  params: {
    challengeId: string
  }
}

export default async function PostsPage({ params }: PostsPageProps) {
  const uuid = await getSupabaseUuid()
  
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

  // 게시글 목록을 API를 통해 가져오기 (좋아요 및 댓글 수 포함)
  const host = headers().get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const apiUrl = `${protocol}://${host}/api/challenges/${params.challengeId}/posts`

  console.log(`API 호출: ${apiUrl}`)

  // API 호출
  const response = await fetch(apiUrl, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      // 인증을 위한 헤더 추가
      'Cookie': headers().get('cookie') || '',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`API 호출 실패 (${response.status}): ${errorText}`)
    return notFound()
  }

  const postsData = await response.json()
  console.log(`API 응답 받음, 게시글 수: ${postsData.length}`)

  // 응답 데이터에 likeCount와 commentCount가 있는지 확인
  const posts = postsData.map((post: any) => ({
    ...post,
    // likes와 likeCount, comments와 commentCount 둘 다 지원
    likeCount: post.likeCount !== undefined ? post.likeCount : (post.likes || 0),
    commentCount: post.commentCount !== undefined ? post.commentCount : (post.comments || 0),
    isLiked: !!post.isLiked
  }))

  // 데이터 검증 로그
  console.log(`처리된 게시글 첫 번째 항목 샘플:`, 
    posts.length > 0 ? 
      { id: posts[0].id, title: posts[0].title, likeCount: posts[0].likeCount, commentCount: posts[0].commentCount } : 
      'No posts'
  )

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">게시글 목록</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>새 게시글 작성</Button>
          </DialogTrigger>
          <DialogContent>
            <PostForm groupId={challenge.group_id} challenges={[challenge]} />
          </DialogContent>
        </Dialog>
      </div>
      <PostList posts={posts} challengeId={params.challengeId} userId={uuid} />
    </div>
  )
} 