import { NextRequest, NextResponse } from 'next/server';
import pb from '../../../lib/pb';

// GET /api/users - List all users
export async function GET() {
  try {
    const records = await pb.collection('users').getFullList();
    return NextResponse.json(records);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const record = await pb.collection('users').create(data);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
