import { NextRequest, NextResponse } from 'next/server';

// TODO: Import PocketBase SDK and game engine helpers

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // 1. Parse table ID from params
  // 2. Validate user/session (optional for MVP)
  // 3. Lock bets, deal cards, update table state
  // 4. Return updated table/round state

  // Placeholder response
  return NextResponse.json({ message: 'startRound endpoint hit', tableId: params.id });
}
