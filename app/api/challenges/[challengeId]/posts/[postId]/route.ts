import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { challengeId: string; postId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 챌린지 존재 여부 확인
    const challengeArr = await supabaseDb.select('challenges', { id: params.challengeId })
    if (!challengeArr.length) {
      return new NextResponse('Not found', { status: 404 })
    }
    const challenge = challengeArr[0]

    // 그룹 멤버 여부 확인
    const memberArr = await supabaseDb.select('group_members', { group_id: challenge.group_id, user_id: userId })
    if (!memberArr.length) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 게시글 조회
    const postArr = await supabaseDb.select('posts', { challenge_id: params.challengeId, id: params.postId })
    const post = postArr[0]
    if (!post) {
      return new NextResponse('Not found', { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.log('[POST_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { challengeId: string; postId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 챌린지 존재 여부 확인
    const challengeArr = await supabaseDb.select('challenges', { id: params.challengeId })
    if (!challengeArr.length) {
      return new NextResponse('Not found', { status: 404 })
    }
    const challenge = challengeArr[0]

    // 그룹 멤버 여부 확인
    const memberArr = await supabaseDb.select('group_members', { group_id: challenge.group_id, user_id: userId })
    if (!memberArr.length) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { content, imageUrl } = body

    const post = await supabaseDb.update(
      'posts',
      {
        content,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      },
      { challenge_id: params.challengeId, id: params.postId, user_id: userId }
    )

    if (!post) {
      return new NextResponse('Not found', { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.log('[POST_PATCH]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { challengeId: string; postId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 챌린지 존재 여부 확인
    const challengeArr = await supabaseDb.select('challenges', { id: params.challengeId })
    if (!challengeArr.length) {
      return new NextResponse('Not found', { status: 404 })
    }
    const challenge = challengeArr[0]

    // 그룹 멤버 여부 확인
    const memberArr = await supabaseDb.select('group_members', { group_id: challenge.group_id, user_id: userId })
    if (!memberArr.length) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 게시글을 실제 삭제하지 않고 is_deleted를 true로 설정
    const post = await supabaseDb.update(
      'posts',
      { 
        is_deleted: true,
        updated_at: new Date().toISOString()
      },
      { challenge_id: params.challengeId, id: params.postId, user_id: userId }
    )

    if (!post) {
      return new NextResponse('Not found', { status: 404 })
    }

    return NextResponse.json({ ...post, deleted: false, is_deleted: true })
  } catch (error) {
    console.log('[POST_DELETE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 