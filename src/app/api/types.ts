// Types for blackjack API

export type ActionType = 'bet' | 'hit' | 'stand' | 'double';

export interface ActionRequest {
  userId: string;
  action: ActionType;
  amount?: number; // for bet/double
}

export interface Seat {
  id: string;
  tableId: string;
  userId: string;
  bet: number;
  hand: any;
  status: string;
}

export interface User {
  id: string;
  username: string;
  chips: number;
}
