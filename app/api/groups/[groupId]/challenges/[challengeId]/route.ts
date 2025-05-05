import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'
import { NextResponse } from 'next/server'
import { getUserUuid } from '@/utils/server-auth'

export async function GET(
  req: Request,
  { params }: { params: { groupId: string; challengeId: string } }
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

    // 그룹 멤버 여부 확인 (이제 uuid 사용)
    const memberArr = await supabaseDb.select('group_members', { group_id: params.groupId, user_id: uuid })
    if (!memberArr.length) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const challengeArr = await supabaseDb.select('challenges', { group_id: params.groupId, id: params.challengeId })
    const challenge = challengeArr[0]
    if (!challenge) {
      return new NextResponse('Not found', { status: 404 })
    }

    return NextResponse.json(challenge)
  } catch (error) {
    console.log('[CHALLENGE_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { groupId: string; challengeId: string } }
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

    // 그룹 멤버 여부 확인 (이제 uuid 사용)
    const memberArr = await supabaseDb.select('group_members', { group_id: params.groupId, user_id: uuid })
    if (!memberArr.length) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { title, description } = body

    const challenge = await supabaseDb.update(
      'challenges',
      {
        title,
        description,
        updated_at: new Date().toISOString(),
      },
      { group_id: params.groupId, id: params.challengeId }
    )

    if (!challenge) {
      return new NextResponse('Not found', { status: 404 })
    }

    return NextResponse.json(challenge)
  } catch (error) {
    console.log('[CHALLENGE_PATCH]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { groupId: string; challengeId: string } }
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

    // 그룹 멤버 여부 확인 (이제 uuid 사용)
    const memberArr = await supabaseDb.select('group_members', { group_id: params.groupId, user_id: uuid })
    if (!memberArr.length) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const challenge = await supabaseDb.delete(
      'challenges',
      { group_id: params.groupId, id: params.challengeId }
    )

    if (!challenge) {
      return new NextResponse('Not found', { status: 404 })
    }

    return NextResponse.json(challenge)
  } catch (error) {
    console.log('[CHALLENGE_DELETE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 