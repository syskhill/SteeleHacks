import { pb } from './auth';

interface User {
  id: string;
  email: string;
  username?: string;
  balance?: number;
  created: string;
  updated: string;
}

export async function getAllUsers() {
  try {
    const records = await pb.collection('users').getList(1, 50, {
      sort: '-created',
    });

    return {
      success: true,
      users: records.items,
      totalPages: records.totalPages,
      totalItems: records.totalItems
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users'
    };
  }
}

export async function getUserById(id: string) {
  try {
    const record = await pb.collection('users').getOne(id);

    return {
      success: true,
      user: record
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user'
    };
  }
}

export async function getUsersWithPagination(page: number = 1, perPage: number = 20, filter?: string) {
  try {
    const options: any = {
      sort: '-created',
    };

    if (filter) {
      options.filter = filter;
    }

    const records = await pb.collection('users').getList(page, perPage, options);

    return {
      success: true,
      users: records.items,
      page: records.page,
      perPage: records.perPage,
      totalPages: records.totalPages,
      totalItems: records.totalItems
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users'
    };
  }
}

// Simple balance management using localStorage as fallback
export async function getUserBalance(userId: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    // Try to get user record and check if it has balance field
    const record = await pb.collection('users').getOne(userId);

    if (record.balance !== undefined && record.balance !== null) {
      return {
        success: true,
        balance: record.balance
      };
    } else {
      // If no balance field exists, use localStorage or default
      const storedBalance = localStorage.getItem(`user_balance_${userId}`);
      return {
        success: true,
        balance: storedBalance ? parseInt(storedBalance) : 1000
      };
    }
  } catch (error) {
    // If user doesn't exist or other error, fall back to localStorage
    const storedBalance = localStorage.getItem(`user_balance_${userId}`);
    return {
      success: true,
      balance: storedBalance ? parseInt(storedBalance) : 1000
    };
  }
}

export async function updateUserBalance(userId: string, newBalance: number): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    // Try to update the user record with balance
    try {
      const record = await pb.collection('users').update(userId, {
        balance: newBalance
      });

      // Also store in localStorage as backup
      localStorage.setItem(`user_balance_${userId}`, newBalance.toString());

      return {
        success: true,
        balance: record.balance || newBalance
      };
    } catch (updateError) {
      // If update fails (probably because balance field doesn't exist), use localStorage only
      localStorage.setItem(`user_balance_${userId}`, newBalance.toString());
      return {
        success: true,
        balance: newBalance
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user balance'
    };
  }
}

export async function addToUserBalance(userId: string, amount: number): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const currentResult = await getUserBalance(userId);
    if (!currentResult.success) {
      return currentResult;
    }

    const newBalance = (currentResult.balance || 1000) + amount;
    return await updateUserBalance(userId, newBalance);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add to user balance'
    };
  }
}

export async function subtractFromUserBalance(userId: string, amount: number): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const currentResult = await getUserBalance(userId);
    if (!currentResult.success) {
      return currentResult;
    }

    const currentBalance = currentResult.balance || 1000;

    if (currentBalance < amount) {
      return {
        success: false,
        error: 'Insufficient balance'
      };
    }

    const newBalance = currentBalance - amount;
    return await updateUserBalance(userId, newBalance);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to subtract from user balance'
    };
  }
}

export async function initializeUserBalance(userId: string, initialBalance: number = 1000): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const existingResult = await getUserBalance(userId);
    if (existingResult.success && existingResult.balance !== undefined && existingResult.balance !== 1000) {
      return existingResult; // Return existing balance if it's not the default
    }

    return await updateUserBalance(userId, initialBalance);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize user balance'
    };
  }
}

// Round tracking functions
interface RoundData {
  playerHand: any[];
  dealerHand: any[];
  playerScore: number;
  dealerScore: number;
  betAmount: number;
  result: 'win' | 'lose' | 'push';
  payout: number;
  isBlackjack: boolean;
}

export async function createRound(userId: string, seed: string): Promise<{ success: boolean; roundId?: string; error?: string }> {
  try {
    const record = await pb.collection('rounds').create({
      userId: userId,
      seed: seed,
      startedAt: new Date().toISOString(),
      outcomes: {}
    });

    return {
      success: true,
      roundId: record.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create round'
    };
  }
}

export async function updateRoundOutcomes(roundId: string, outcomes: RoundData): Promise<{ success: boolean; error?: string }> {
  try {
    await pb.collection('rounds').update(roundId, {
      endedAt: new Date().toISOString(),
      outcomes: outcomes
    });

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update round outcomes'
    };
  }
}

export async function getUserRounds(userId: string, page: number = 1, perPage: number = 10): Promise<{ success: boolean; rounds?: any[]; totalItems?: number; error?: string }> {
  try {
    const records = await pb.collection('rounds').getList(page, perPage, {
      filter: `userId="${userId}"`,
      sort: '-startedAt'
    });

    return {
      success: true,
      rounds: records.items,
      totalItems: records.totalItems
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user rounds'
    };
  }
}