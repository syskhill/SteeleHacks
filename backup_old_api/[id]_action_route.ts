import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pb';
import { ActionRequest, Seat, User } from '@/app/api/types';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const tableId = params.id;
  const body = await req.json();
  const { userId, action, amount } = body as ActionRequest;

  // Fetch user and seat
  const user = await pb.collection('users').getOne<User>(userId);
  const seatList = await pb.collection('seats').getFullList<Seat>({
    filter: `tableId = "${tableId}" && userId = "${userId}"`
  });
  const seat = seatList[0];

  if (!user || !seat) {
    return NextResponse.json({ error: 'User or seat not found' }, { status: 404 });
  }

  // Handle bet action
  if (action === 'bet') {
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
    }
    if (user.chips < amount) {
      return NextResponse.json({ error: 'Insufficient chips' }, { status: 400 });
    }
    // Deduct chips and set bet
    await pb.collection('users').update(user.id, { chips: user.chips - amount });
    await pb.collection('seats').update(seat.id, { bet: amount });
    return NextResponse.json({ message: 'Bet placed', chips: user.chips - amount, bet: amount });
  }

  // TODO: Implement hit, stand, double logic

  return NextResponse.json({ message: 'Action processed', action });
}
