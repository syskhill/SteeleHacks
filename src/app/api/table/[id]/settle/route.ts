import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pb';
import { ActionRequest, Seat, User } from '@/app/api/types';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const tableId = params.id;
  // For MVP, just fetch all seats for this table
  const seatList = await pb.collection('seats').getFullList<Seat>({
    filter: `tableId = "${tableId}"`
  });

  // For each seat, get user and bet
  for (const seat of seatList) {
    const user = await pb.collection('users').getOne<User>(seat.userId);
    if (!user) continue;
    // Example: payout 2x for win, refund for push, nothing for loss
    if (seat.status === 'win') {
      await pb.collection('users').update(user.id, { chips: user.chips + seat.bet * 2 });
    } else if (seat.status === 'push') {
      await pb.collection('users').update(user.id, { chips: user.chips + seat.bet });
    }
    // For loss, chips already deducted on bet
    // Optionally, reset seat.bet to 0
    await pb.collection('seats').update(seat.id, { bet: 0 });
  }

  // TODO: Update table/round state, dealer logic, etc.

  return NextResponse.json({ message: 'Settlement complete', tableId });
}
