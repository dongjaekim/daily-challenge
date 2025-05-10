import { supabaseDb } from '@/db'
import { NextResponse } from 'next/server'
import { getSupabaseUuid } from '@/utils/server-auth'

export async function GET(
  req: Request,
  { params }: { params: { groupId: string; challengeId: string } }
) {
  try {
    const uuid = await getSupabaseUuid()
    
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
    const uuid = await getSupabaseUuid()
    
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
    const uuid = await getSupabaseUuid()
    
    if (!uuid) {
      return new NextResponse('User not found', { status: 404 })
    }

    // 그룹 멤버 여부 확인 (이제 uuid 사용)
    const memberArr = await supabaseDb.select('group_members', { group_id: params.groupId, user_id: uuid })
    if (!memberArr.length) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 본인이 챌린지 생성자인지 확인
    const checkChallengeCreator = await supabaseDb.select('challenges', { id: params.challengeId, created_by: uuid })
    if (!checkChallengeCreator) {
      return new NextResponse('Not found', { status: 404 })
    }

    await supabaseDb.update(
      'posts',
      {
        challenge_id: null,
      },
      {
        challenge_id: params.challengeId,
      }
    )

    // 챌린지 삭제 + 삭제되며 challenge_progress 데이터도 삭제 (cascade)
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