import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'
import { NextResponse } from 'next/server'
import { getUserUuid } from '@/utils/server-auth'
import { supabase } from '@/lib/supabase'

// 댓글 수정
export async function PATCH(
  req: Request,
  { params }: { params: { commentId: string } }
) {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // clerk_id로 Supabase users 테이블에서 UUID 조회
    const uuid = await getUserUuid(clerkUserId)
    
    if (!uuid) {
      return new NextResponse('User not found', { status: 404 })
    }

    const body = await req.json()
    const { content } = body

    if (!content) {
      return new NextResponse('Content is required', { status: 400 })
    }

    // 댓글이 존재하는지 확인
    const commentArr = await supabaseDb.select('post_comments', { id: params.commentId })
    
    if (!commentArr.length) {
      return new NextResponse('Comment not found', { status: 404 })
    }

    // 댓글 작성자인지 확인
    if (commentArr[0].user_id !== uuid) {
      return new NextResponse('Unauthorized to modify this comment', { status: 403 })
    }

    // 댓글 수정
    await supabaseDb.update('post_comments', {
      content,
      updated_at: new Date().toISOString()
    }, {
      id: params.commentId
    })

    // 수정된 댓글 정보 조회 (사용자 정보 포함)
    const { data: updatedComment } = await supabase
      .from('post_comments')
      .select(`
        *,
        users:user_id (
          id, name, email, avatar_url
        )
      `)
      .eq('id', params.commentId)
      .single()
    
    // 사용자 정보
    const author = updatedComment?.users ? {
      ...updatedComment.users,
      avatar_url: updatedComment.users.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(updatedComment.users.name || 'User')}`
    } : null
    
    return NextResponse.json({
      ...updatedComment,
      author
    })
  } catch (error) {
    console.error('[COMMENT_PATCH]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// 댓글 삭제
export async function DELETE(
  req: Request,
  { params }: { params: { commentId: string } }
) {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // clerk_id로 Supabase users 테이블에서 UUID 조회
    const uuid = await getUserUuid(clerkUserId)
    
    if (!uuid) {
      return new NextResponse('User not found', { status: 404 })
    }

    // 댓글이 존재하는지 확인
    const commentArr = await supabaseDb.select('post_comments', { id: params.commentId })
    
    if (!commentArr.length) {
      return new NextResponse('Comment not found', { status: 404 })
    }

    // 댓글 작성자인지 확인
    if (commentArr[0].user_id !== uuid) {
      return new NextResponse('Unauthorized to delete this comment', { status: 403 })
    }

    // 소프트 딜리트 구현 - 모든 경우에 is_deleted 필드만 업데이트
    await supabaseDb.update('post_comments', {
      content: '삭제된 댓글입니다.',
      is_deleted: true,
      updated_at: new Date().toISOString()
    }, {
      id: params.commentId
    })
    
    return NextResponse.json({ deleted: false, contentUpdated: true, is_deleted: true })
  } catch (error) {
    console.error('[COMMENT_DELETE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 