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

export async function getUserBalance(userId: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    // Try to get balance from user_balances collection first
    try {
      const balanceRecord = await pb.collection('user_balances').getFirstListItem(`user="${userId}"`);
      return {
        success: true,
        balance: balanceRecord.balance
      };
    } catch (balanceError) {
      // If no balance record exists, return default balance
      return {
        success: true,
        balance: 1000 // Default balance
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user balance'
    };
  }
}

export async function updateUserBalance(userId: string, newBalance: number): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    // Try to update existing balance record
    try {
      const existingRecord = await pb.collection('user_balances').getFirstListItem(`user="${userId}"`);
      const record = await pb.collection('user_balances').update(existingRecord.id, {
        balance: newBalance
      });
      return {
        success: true,
        balance: record.balance
      };
    } catch (notFoundError) {
      // Create new balance record if it doesn't exist
      const record = await pb.collection('user_balances').create({
        user: userId,
        balance: newBalance
      });
      return {
        success: true,
        balance: record.balance
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
    // Get current balance first
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
    // Get current balance first
    const currentResult = await getUserBalance(userId);
    if (!currentResult.success) {
      return currentResult;
    }

    const currentBalance = currentResult.balance || 1000;

    // Validate sufficient balance
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
    // Check if user already has a balance set
    const existingResult = await getUserBalance(userId);
    if (existingResult.success && existingResult.balance !== undefined) {
      return existingResult; // Return existing balance
    }

    // Set initial balance
    return await updateUserBalance(userId, initialBalance);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize user balance'
    };
  }
}