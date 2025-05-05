'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { PenSquare, Image as ImageIcon, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { IPost } from '@/types'
import { usePostsStore } from '@/store/posts'
import { useChallengesStore } from '@/store/challenges'
import { LikeButton } from '@/components/posts/LikeButton'

interface IChallenge {
  id: string
  title: string
  description: string
  created_at: string
  group_id: string
  created_by: string
}

interface GroupPostsViewProps {
  groupId: string
  challenges: IChallenge[]
}

export function GroupPostsView({ groupId, challenges }: GroupPostsViewProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<string>('all')
  const [posts, setPosts] = useState<IPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  // 포스트 스토어 
  const { setPosts: setStorePosts, getPosts: getStorePosts, arePostsCached } = usePostsStore()
  
  // 챌린지 스토어 
  const { setChallenges: setStoreChallenges } = useChallengesStore()
  
  // 최초 마운트 시 챌린지 저장
  useEffect(() => {
    if (challenges && challenges.length > 0) {
      setStoreChallenges(groupId, challenges)
    }
  }, [challenges.length, groupId, setStoreChallenges])
  
  useEffect(() => {
    async function fetchPosts() {
      if (!groupId) return
      
      setIsLoading(true)
      
      // 캐시에 있고 유효하면 스토어에서 가져오기
      const challengeId = selectedChallenge !== 'all' ? selectedChallenge : null
      
      // 캐시 검사
      if (arePostsCached(groupId, challengeId)) {
        const cachedPosts = getStorePosts(groupId, challengeId)
        if (cachedPosts) {
          console.log('캐시된 게시글 데이터 사용:', cachedPosts.length)
          setPosts(cachedPosts)
          setIsLoading(false)
          return
        }
      }
      
      try {
        // 실제 API를 통해 게시글 데이터 가져오기
        const url = `/api/groups/${groupId}/posts${selectedChallenge !== 'all' ? `?challengeId=${selectedChallenge}` : ''}`
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('게시글을 불러오는데 실패했습니다.')
        }
        
        const data = await response.json()
        
        // 필드 이름 호환성 처리 - 전체 데이터에 likeCount, commentCount 필드가 있는지 확인하고 없으면 추가
        const formattedPosts = data.map((post: any) => ({
          ...post,
          // likes와 likeCount, comments와 commentCount 둘 다 지원
          likeCount: post.likeCount !== undefined ? post.likeCount : (post.likes || 0),
          commentCount: post.commentCount !== undefined ? post.commentCount : (post.comments || 0),
        }))
        
        // 상태 및 스토어 업데이트
        setPosts(formattedPosts)
        setStorePosts(groupId, formattedPosts, challengeId)
      } catch (error) {
        console.error('게시글을 불러오는 중 오류가 발생했습니다:', error)
        setPosts([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPosts()
  }, [groupId, selectedChallenge, getStorePosts, setStorePosts, arePostsCached])
  
  const handleWriteClick = () => {
    router.push(`/groups/${groupId}/write`)
  }
  
  // 게시글의 이미지 처리 (이전 버전과 호환)
  const getPostImages = (post: IPost) => {
    return post.image_urls || (post.image_url ? [post.image_url] : [])
  }
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 pb-6">
        <div>
          <CardTitle className="h-6">게시판 뷰</CardTitle>
          <CardDescription>모임 내 게시글을 확인하세요</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <Select
            value={selectedChallenge}
            onValueChange={setSelectedChallenge}
          >
            <SelectTrigger className="w-full sm:w-[200px] md:w-[250px]">
              <SelectValue placeholder="모든 챌린지" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 챌린지</SelectItem>
              {challenges.map((challenge) => (
                <SelectItem key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleWriteClick} className="flex items-center gap-2 w-full sm:w-auto justify-center md:px-6">
            <PenSquare className="h-4 w-4" />
            <span>글쓰기</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-10">로딩 중...</div>
        ) : posts.length > 0 ? (
          <div className="space-y-4 md:space-y-5">
            {posts.map((post) => {
              const postImages = getPostImages(post)
              
              return (
                <div key={post.id} className="border rounded-lg p-4 md:p-5 space-y-3 transition-all hover:bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-base md:text-lg">{post.title}</h3>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-1">
                        <span>{post.author?.name}</span>
                        <span>·</span>
                        <span>{format(new Date(post.created_at), 'yyyy년 MM월 dd일', { locale: ko })}</span>
                        <span>·</span>
                        <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {post.challenge?.title}
                        </span>
                        
                        {postImages.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <ImageIcon className="h-3.5 w-3.5" />
                              {postImages.length}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Link href={`/groups/${groupId}/posts/${post.id}`} className="mt-1 sm:mt-0">
                      <Button variant="outline" size="sm" className="md:px-4">보기</Button>
                    </Link>
                  </div>
                  
                  <p className="text-sm md:text-base line-clamp-2 text-muted-foreground">{post.content}</p>
                  
                  {postImages.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-1 md:gap-2 pt-1">
                      {postImages.slice(0, 3).map((imageUrl, index) => (
                        <div key={index} className="relative aspect-video w-full overflow-hidden rounded-md">
                          <img
                            src={imageUrl}
                            alt={`${post.title} 이미지 ${index + 1}`}
                            className="object-cover w-full h-full"
                          />
                          
                          {/* 이미지가 3개 이상이고 현재 3번째 이미지인 경우 ... 표시 */}
                          {index === 2 && postImages.length > 3 && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                              <span className="text-white font-medium">
                                +{postImages.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex text-sm text-muted-foreground gap-3 pt-1">
                    <LikeButton 
                      postId={post.id} 
                      initialLikeCount={post.likeCount || 0} 
                      initialLiked={post.isLiked || false}
                      size="sm"
                      variant="ghost"
                      groupId={groupId}
                    />
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" /> {post.commentCount}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 md:py-20 text-muted-foreground">
            {challenges.length > 0 
              ? '아직 게시글이 없습니다. 첫 게시글을 작성해보세요!'
              : '등록된 챌린지가 없습니다. 챌린지를 먼저 등록해주세요.'}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 