import { supabaseDb } from '@/db'
import { NextResponse } from 'next/server'
import { getSupabaseUuid } from '@/utils/server-auth'
import { supabase } from '@/lib/supabase'

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const uuid = await getSupabaseUuid()
    
    if (!uuid) {
      return new NextResponse('User not found', { status: 404 })
    }

    const body = await req.json()
    const { title, content, challengeId, imageUrls } = body

    if (!title || !content || !challengeId) {
      return new NextResponse('Title, content, and challengeId are required', { status: 400 })
    }

    // 그룹 멤버인지 확인
    const memberArr = await supabaseDb.select('group_members', { 
      group_id: params.groupId, 
      user_id: uuid 
    })
    
    if (!memberArr.length) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 챌린지가 해당 그룹에 속하는지, 그리고 사용자가 참여한 챌린지인지 확인
    const challengeArr = await supabaseDb.select('challenges', { 
      id: challengeId,
      group_id: params.groupId 
    })
    
    if (!challengeArr.length) {
      return new NextResponse('Challenge not found in this group', { status: 404 })
    }

    // 동일한 챌린지에 오늘 게시글을 이미 작성했는지 확인
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
    
    const { data: existingPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', uuid)
      .eq('challenge_id', challengeId)
      .eq('is_deleted', false) // 삭제되지 않은 게시글만 고려
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
    
    if (existingPosts && existingPosts.length > 0) {
      return new NextResponse('이미 오늘 이 챌린지에 게시글을 작성했습니다. 하루에 챌린지당 1개의 게시글만 작성할 수 있습니다.', { status: 400 })
    }

    // 이미지 URL 배열 검증
    const validImageUrls = Array.isArray(imageUrls) ? imageUrls : []
    
    // 게시글 생성
    const post = await supabaseDb.insert('posts', {
      title,
      content,
      challenge_id: challengeId,
      user_id: uuid,
      group_id: params.groupId,
      image_urls: validImageUrls.length > 0 ? validImageUrls : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    // 챌린지 진행 상태 생성 또는 업데이트
    try {
      const today_date = new Date().toISOString().split('T')[0]
      const today_start = new Date(today_date).toISOString()
      const today_end = new Date(new Date(today_date).getTime() + 24 * 60 * 60 * 1000).toISOString()
      
      try {
        // 해당 날짜의 기존 progress 확인 (date 컬럼 대신 created_at 컬럼 사용)
        const { data: existingProgress, error } = await supabase
          .from('challenge_progress')
          .select('*')
          .eq('challenge_id', challengeId)
          .eq('user_id', uuid)
          .gte('created_at', today_start)
          .lt('created_at', today_end)
          .maybeSingle()
        
        if (existingProgress) {
          // 이미 오늘 데이터가 있으면 업데이트
          await supabaseDb.update('challenge_progress', {
            progress: 1.0,
            updated_at: new Date().toISOString()
          }, {
            id: existingProgress.id
          });
        } else if (!error) {
          // 신규 생성 (created_at 컬럼만 사용)
          try {
            await supabaseDb.insert('challenge_progress', {
              challenge_id: challengeId,
              user_id: uuid,
              progress: 1.0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          } catch (insertError) {
            console.error('챌린지 진행도 기록 생성 실패:', insertError);
          }
        }
      } catch (progressQueryError) {
        console.error('챌린지 진행도 조회 실패:', progressQueryError);
      }
    } catch (progressError) {
      console.error('[CHALLENGE_PROGRESS_ERROR]', progressError);
      // 챌린지 진행 상태 오류가 있어도 게시글 생성은 실패하지 않도록 처리
    }

    return NextResponse.json(post)
  } catch (error) {
    console.log('[POSTS_POST]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const uuid = await getSupabaseUuid()

    if (!uuid) {
      return new NextResponse('User not found', { status: 404 })
    }

    // 그룹 멤버인지 확인
    const memberArr = await supabaseDb.select('group_members', { 
      group_id: params.groupId, 
      user_id: uuid 
    })
    
    if (!memberArr.length) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // URL에서 쿼리 파라미터 추출
    const url = new URL(req.url)
    const challengeId = url.searchParams.get('challengeId')
    
    // 그룹의 게시글 조회 (챌린지 ID로 필터링 가능)
    // 삭제되지 않은 게시글만 조회
    let query = supabase
      .from('posts')
      .select(`
        *,
        users:user_id (
          id, name, email, avatar_url
        ),
        challenges:challenge_id (
          id, title
        )
      `)
      .eq('group_id', params.groupId)
      .eq('is_deleted', false) // 삭제되지 않은 게시글만 조회
    
    if (challengeId) {
      query = query.eq('challenge_id', challengeId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('[POSTS_GET] DB Error:', error)
      return new NextResponse('Database error', { status: 500 })
    }
    
    // 각 게시글에 좋아요 수와 댓글 수 추가
    const postsWithStats = await Promise.all((data || []).map(async (post) => {
      try {
        // 좋아요 수 조회
        const { data: likes } = await supabase
          .from('post_likes')
          .select('*')
          .eq('post_id', post.id);
        
        const likeCount = likes?.length || 0;
        
        // 현재 사용자가 좋아요 눌렀는지 확인
        const userLiked = likes?.some(like => like.user_id === uuid) || false;
        
        // 댓글 수 조회 (삭제된 댓글도 포함)
        const { data: comments } = await supabase
          .from('post_comments')
          .select('*')
          .eq('post_id', post.id);
        
        const commentCount = comments?.length || 0;
        
        // author 필드에 avatar_url 추가 (없는 경우 기본 이미지)
        const author = post.users ? {
          id: post.users.id,
          name: post.users.name,
          avatar_url: post.users.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.users.name || 'User')}`
        } : null;
        
        // challenge 필드 rename
        const challenge = post.challenges ? {
          id: post.challenges.id,
          title: post.challenges.title
        } : null;
        
        // 명확한 응답 구조 반환
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          created_at: post.created_at,
          challenge_id: post.challenge_id,
          user_id: post.user_id,
          group_id: post.group_id,
          image_urls: post.image_urls || [],
          imageUrls: post.image_urls || [], // 클라이언트 호환성 유지
          is_deleted: post.is_deleted,
          likeCount,
          commentCount,
          isLiked: userLiked,
          isAuthor: post.user_id === uuid,
          author,
          challenge
        };
      } catch (statsError) {
        console.error('[POST_STATS_ERROR]', statsError, post.id);
        // 통계 조회 실패해도 게시글 기본 정보는 반환
        return {
          ...post,
          likeCount: 0,
          commentCount: 0,
          isLiked: false,
          isAuthor: post.user_id === uuid,
          author: post.users,
          challenge: post.challenges,
          imageUrls: post.image_urls || []
        };
      }
    }))
    
    // 응답 데이터 로그
    console.log(`그룹 게시글 데이터 응답 (${postsWithStats.length}개):`, 
      postsWithStats.map(post => ({
        id: post.id, 
        title: post.title, 
        likeCount: post.likeCount, 
        commentCount: post.commentCount
      }))
    )

    return NextResponse.json(postsWithStats)
  } catch (error) {
    console.log('[POSTS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 