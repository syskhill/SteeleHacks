import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pb';

export async function POST() {
  // TODO: Lock bets, deal cards, update state for single table
  return NextResponse.json({ message: 'startRound endpoint hit' });
}
