import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자의 챌린지 조회
    const challenges = await supabaseDb.select('challenges', {
      user_id: userId
    })

    return NextResponse.json(challenges)
  } catch (error) {
    console.error('Error fetching challenges:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { groupId, title, description, startDate, endDate } = body

    if (!groupId || !title) {
      return NextResponse.json(
        { error: 'Group ID and title are required' },
        { status: 400 }
      )
    }

    // 챌린지 생성
    const challenge = await supabaseDb.insert('challenges', {
      group_id: groupId,
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    return NextResponse.json(challenge)
  } catch (error) {
    console.error('Error creating challenge:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 