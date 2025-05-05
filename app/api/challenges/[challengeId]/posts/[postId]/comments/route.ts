import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'

export async function GET(
  request: Request,
  { params }: { params: { challengeId: string; postId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 게시물의 댓글 조회
    const comments = await supabaseDb.select('post_comments', {
      post_id: params.postId
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { challengeId: string; postId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // 댓글 생성
    const comment = await supabaseDb.insert('post_comments', {
      post_id: params.postId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 