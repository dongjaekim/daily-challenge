import { supabaseDb } from '@/db'
import { NextResponse } from 'next/server'
import { getSupabaseUuid } from '@/utils/server-auth'
import { supabase } from '@/lib/supabase'

// 좋아요 추가/삭제 토글
export async function POST(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const uuid = await getSupabaseUuid()
    
    if (!uuid) {
      return new NextResponse('User not found', { status: 404 })
    }

    // 게시글이 존재하는지 확인
    const postArr = await supabaseDb.select('posts', { id: params.postId })
    
    if (!postArr.length) {
      return new NextResponse('Post not found', { status: 404 })
    }

    // 이미 좋아요를 눌렀는지 확인
    const likeArr = await supabaseDb.select('post_likes', { 
      post_id: params.postId, 
      user_id: uuid 
    })
    
    // 이미 좋아요가 있으면 삭제, 없으면 추가 (토글)
    if (likeArr.length > 0) {
      // 좋아요 삭제
      await supabaseDb.delete('post_likes', { 
        post_id: params.postId, 
        user_id: uuid 
      })
      
      return NextResponse.json({ liked: false })
    } else {
      // 좋아요 추가
      await supabaseDb.insert('post_likes', {
        post_id: params.postId,
        user_id: uuid,
        created_at: new Date().toISOString()
      })
      
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('[POST_LIKES_POST]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// 좋아요 상태 조회
export async function GET(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const uuid = await getSupabaseUuid()
    
    if (!uuid) {
      return new NextResponse('User not found', { status: 404 })
    }
    
    // 게시글의 총 좋아요 수 조회
    const { count: totalLikes } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', params.postId)
    
    // 사용자가 좋아요를 눌렀는지 확인
    const likeArr = await supabaseDb.select('post_likes', { 
      post_id: params.postId, 
      user_id: uuid 
    })
    
    const hasLiked = likeArr.length > 0
    
    return NextResponse.json({
      totalLikes,
      hasLiked
    })
  } catch (error) {
    console.error('[POST_LIKES_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 