import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'
import { supabase } from '@/lib/supabase'
import { getUserUuid } from '@/utils/server-auth'
import { convertToKST, convertToUTC, startOfDay as getStartOfDay, endOfDay as getEndOfDay } from '@/utils/date'

export async function GET(
  request: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // clerk_id로 Supabase users 테이블에서 UUID 조회
    const uuid = await getUserUuid(clerkUserId)
    
    if (!uuid) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 챌린지의 게시물 조회 (is_deleted가 false인 게시글만)
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (
          id, name, email, avatar_url
        )
      `)
      .eq('challenge_id', params.challengeId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json(
        { error: 'Database Error' },
        { status: 500 }
      )
    }

    // 각 게시글에 좋아요 수와 댓글 수 추가
    const postsWithStats = await Promise.all((posts || []).map(async (post) => {
      try {
        // 좋아요 수 조회
        const { data: likes } = await supabase
          .from('post_likes')
          .select('*')
          .eq('post_id', post.id)
        
        const likeCount = likes?.length || 0
        
        // 현재 사용자가 좋아요 눌렀는지 확인
        const userLiked = likes?.some(like => like.user_id === uuid) || false
        
        // 댓글 수 조회 (삭제된 댓글도 포함)
        const { data: comments } = await supabase
          .from('post_comments')
          .select('*')
          .eq('post_id', post.id)
        
        const commentCount = comments?.length || 0
        
        // author 필드 포맷팅
        const author = post.users ? {
          id: post.users.id,
          name: post.users.name,
          avatar_url: post.users.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.users.name || 'User')}`
        } : null

        // 변환된 데이터
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          created_at: post.created_at,
          challenge_id: post.challenge_id,
          user_id: post.user_id,
          group_id: post.group_id,
          likeCount,
          commentCount,
          isLiked: userLiked,
          isAuthor: post.user_id === uuid,
          author,
          imageUrls: post.image_urls || []
        }
      } catch (statsError) {
        console.error('[POST_STATS_ERROR]', statsError, post.id)
        // 통계 조회 실패해도 게시글 기본 정보는 반환
        return {
          ...post,
          likeCount: 0,
          commentCount: 0,
          isLiked: false,
          isAuthor: post.user_id === uuid,
          author: post.users,
          imageUrls: post.image_urls || []
        }
      }
    }))

    // 응답 데이터 로그
    console.log(`게시글 데이터 응답 (${postsWithStats.length}개):`, 
      postsWithStats.map(post => ({
        id: post.id, 
        title: post.title, 
        likeCount: post.likeCount, 
        commentCount: post.commentCount
      }))
    )

    return NextResponse.json(postsWithStats)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // clerk_id로 Supabase users 테이블에서 UUID 조회
    const uuid = await getUserUuid(clerkUserId)
    
    if (!uuid) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, content, imageUrls } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // 챌린지 정보 확인
    const challengeArr = await supabaseDb.select('challenges', { id: params.challengeId })
    if (!challengeArr.length) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    const challenge = challengeArr[0]

    // 동일한 챌린지에 오늘 게시글을 이미 작성했는지 확인
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
    
    const { data: existingPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', uuid)
      .eq('challenge_id', params.challengeId)
      .eq('is_deleted', false)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
    
    if (existingPosts && existingPosts.length > 0) {
      return NextResponse.json(
        { error: '이미 오늘 이 챌린지에 게시글을 작성했습니다. 하루에 챌린지당 1개의 게시글만 작성할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 이미지 URL 배열 검증
    const validImageUrls = Array.isArray(imageUrls) ? imageUrls : []

    // 게시물 생성
    const post = await supabaseDb.insert('posts', {
      title,
      challenge_id: params.challengeId,
      group_id: challenge.group_id,
      user_id: uuid,
      content,
      image_urls: validImageUrls,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    // 챌린지 진행 상태 생성 또는 업데이트
    try {
      // 현재 KST 날짜 가져오기
      const now = new Date();
      const kstNow = convertToKST(now);
      
      // 오늘 날짜의 시작과 끝 (KST 기준)
      const todayStart = getStartOfDay(kstNow);
      const todayEnd = getEndOfDay(kstNow);
      
      // UTC로 변환하여 쿼리에 사용
      const utcTodayStart = convertToUTC(todayStart).toISOString();
      const utcTodayEnd = convertToUTC(todayEnd).toISOString();
      
      console.log('시간대 디버깅:', {
        현재시간: now.toISOString(),
        KST변환: kstNow.toISOString(),
        KST_시작: todayStart.toISOString(),
        KST_종료: todayEnd.toISOString(),
        UTC_시작: utcTodayStart,
        UTC_종료: utcTodayEnd
      });
      
      try {
        // 해당 날짜의 기존 progress 확인 (created_at 컬럼으로 오늘 날짜 범위 확인)
        const { data: existingProgress, error } = await supabase
          .from('challenge_progress')
          .select('*')
          .eq('challenge_id', params.challengeId)
          .eq('user_id', uuid)
          .gte('created_at', utcTodayStart)
          .lt('created_at', utcTodayEnd)
          .maybeSingle()
        
        if (existingProgress) {
          console.log('기존 진행 상태 업데이트:', existingProgress.id);
          // 이미 오늘 데이터가 있으면 업데이트
          await supabaseDb.update('challenge_progress', {
            progress: 1.0,
            updated_at: now.toISOString()
          }, {
            id: existingProgress.id
          })
        } else if (!error) {
          console.log('새 진행 상태 생성');
          // 신규 생성
          try {
            // KST 날짜를 date 컬럼에 문자열 형태로 저장하고, created_at은 현재 시간으로 설정
            const kstDateStr = `${kstNow.getFullYear()}-${String(kstNow.getMonth() + 1).padStart(2, '0')}-${String(kstNow.getDate()).padStart(2, '0')}`;
            
            await supabaseDb.insert('challenge_progress', {
              challenge_id: params.challengeId,
              user_id: uuid,
              date: kstDateStr, // KST 날짜 문자열
              progress: 1.0,
              created_at: now.toISOString(),
              updated_at: now.toISOString()
            })
          } catch (insertError) {
            console.error('챌린지 진행도 기록 생성 실패:', insertError);
          }
        }
      } catch (progressQueryError) {
        console.error('챌린지 진행도 조회 실패:', progressQueryError);
      }
    } catch (progressError) {
      console.error('[CHALLENGE_PROGRESS_ERROR]', progressError)
      // 챌린지 진행 상태 오류가 있어도 게시글 생성은 실패하지 않도록 처리
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 