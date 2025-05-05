import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'

export async function POST(
  request: Request,
  { params }: { params: { challengeId: string; postId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 좋아요 추가
    const like = await supabaseDb.insert('post_likes', {
      post_id: params.postId,
      user_id: userId,
      created_at: new Date().toISOString()
    })

    return NextResponse.json(like)
  } catch (error) {
    console.error('Error creating like:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { challengeId: string; postId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 좋아요 삭제
    const like = await supabaseDb.delete('post_likes', {
      post_id: params.postId,
      user_id: userId
    })

    return NextResponse.json(like)
  } catch (error) {
    console.error('Error deleting like:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 