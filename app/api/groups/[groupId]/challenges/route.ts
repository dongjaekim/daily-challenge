import { supabaseDb } from '@/db'
import { NextResponse } from 'next/server'
import { getSupabaseUuid } from '@/utils/server-auth'

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
    const { title, description } = body

    if (!title) {
      return new NextResponse('Title is required', { status: 400 })
    }

    // 그룹 멤버 여부 확인 (이제 uuid 사용)
    const memberArr = await supabaseDb.select('group_members', { group_id: params.groupId, user_id: uuid })
    if (!memberArr.length) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const challenge = await supabaseDb.insert('challenges', {
      group_id: params.groupId,
      title,
      description,
      created_by: uuid, // 이제 uuid 사용
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json(challenge)
  } catch (error) {
    console.log('[CHALLENGES_POST]', error)
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

    // 그룹 멤버 여부 확인 (이제 uuid 사용)
    const memberArr = await supabaseDb.select('group_members', { group_id: params.groupId, user_id: uuid })
    if (!memberArr.length) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const groupChallenges = await supabaseDb.select('challenges', { group_id: params.groupId })
    return NextResponse.json(groupChallenges)
  } catch (error) {
    console.error('[CHALLENGES_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 