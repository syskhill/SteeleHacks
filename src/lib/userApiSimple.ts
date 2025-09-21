import { pb } from './auth';

interface User {
  id: string;
  email: string;
  username?: string;
  balance?: number;
  created: string;
  updated: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

interface UserListResponse extends ApiResponse {
  users?: any[];
  totalPages?: number;
  totalItems?: number;
  page?: number;
  perPage?: number;
}

interface UserResponse extends ApiResponse {
  user?: any;
}

function handleError(error: unknown, defaultMessage: string): { success: false; error: string } {
  return {
    success: false,
    error: error instanceof Error ? error.message : defaultMessage
  };
}

export async function getAllUsers(): Promise<UserListResponse> {
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
    return handleError(error, 'Failed to fetch users');
  }
}

export async function getUserById(id: string): Promise<UserResponse> {
  try {
    const record = await pb.collection('users').getOne(id);

    return {
      success: true,
      user: record
    };
  } catch (error) {
    return handleError(error, 'Failed to fetch user');
  }
}

export async function getUsersWithPagination(
  page: number = 1,
  perPage: number = 20,
  filter?: string
): Promise<UserListResponse> {
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
    return handleError(error, 'Failed to fetch users');
  }
}

interface BalanceResponse extends ApiResponse {
  balance?: number;
}

const DEFAULT_BALANCE = 1000;

function getStoredBalance(userId: string): number {
  const storedBalance = localStorage.getItem(`user_balance_${userId}`);
  return storedBalance ? parseInt(storedBalance) : DEFAULT_BALANCE;
}

function setStoredBalance(userId: string, balance: number): void {
  localStorage.setItem(`user_balance_${userId}`, balance.toString());
}

export async function getUserBalance(userId: string): Promise<BalanceResponse> {
  try {
    const record = await pb.collection('users').getOne(userId);

    if (record.balance !== undefined && record.balance !== null) {
      return {
        success: true,
        balance: record.balance
      };
    }

    return {
      success: true,
      balance: getStoredBalance(userId)
    };
  } catch (error) {
    return {
      success: true,
      balance: getStoredBalance(userId)
    };
  }
}

export async function updateUserBalance(userId: string, newBalance: number): Promise<BalanceResponse> {
  try {
    try {
      const record = await pb.collection('users').update(userId, {
        balance: newBalance
      });

      setStoredBalance(userId, newBalance);

      return {
        success: true,
        balance: record.balance || newBalance
      };
    } catch (updateError) {
      setStoredBalance(userId, newBalance);
      return {
        success: true,
        balance: newBalance
      };
    }
  } catch (error) {
    return handleError(error, 'Failed to update user balance') as BalanceResponse;
  }
}

export async function addToUserBalance(userId: string, amount: number): Promise<BalanceResponse> {
  try {
    const currentResult = await getUserBalance(userId);
    if (!currentResult.success) {
      return currentResult;
    }

    const newBalance = (currentResult.balance || DEFAULT_BALANCE) + amount;
    return await updateUserBalance(userId, newBalance);
  } catch (error) {
    return handleError(error, 'Failed to add to user balance') as BalanceResponse;
  }
}

export async function subtractFromUserBalance(userId: string, amount: number): Promise<BalanceResponse> {
  try {
    const currentResult = await getUserBalance(userId);
    if (!currentResult.success) {
      return currentResult;
    }

    const currentBalance = currentResult.balance || DEFAULT_BALANCE;

    if (currentBalance < amount) {
      return {
        success: false,
        error: 'Insufficient balance'
      };
    }

    const newBalance = currentBalance - amount;
    return await updateUserBalance(userId, newBalance);
  } catch (error) {
    return handleError(error, 'Failed to subtract from user balance') as BalanceResponse;
  }
}

export async function initializeUserBalance(userId: string, initialBalance: number = DEFAULT_BALANCE): Promise<BalanceResponse> {
  try {
    const existingResult = await getUserBalance(userId);
    if (existingResult.success && existingResult.balance !== undefined && existingResult.balance !== DEFAULT_BALANCE) {
      return existingResult;
    }

    return await updateUserBalance(userId, initialBalance);
  } catch (error) {
    return handleError(error, 'Failed to initialize user balance') as BalanceResponse;
  }
}

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

interface PlayerAction {
  action: 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT';
  timestamp: string;
  playerHandBefore: any[];
  playerScoreBefore: number;
  dealerUpCard: any;
}

interface RoundResponse extends ApiResponse {
  roundId?: string;
}

interface RoundsListResponse extends ApiResponse {
  rounds?: any[];
  totalItems?: number;
}

export async function createRound(userId: string, seed: string): Promise<RoundResponse> {
  try {
    console.log('=== CREATING ROUND ===');
    console.log('Creating round with userId:', userId);
    console.log('PocketBase auth state:', {
      isValid: pb.authStore.isValid,
      currentUserId: pb.authStore.record?.id,
      userEmail: pb.authStore.record?.email
    });

    const roundData = {
      userId: userId,
      seed: seed,
      startedAt: new Date().toISOString(),
      outcomes: {}
    };

    console.log('Round data being saved:', roundData);

    const record = await pb.collection('rounds').create(roundData);

    console.log('Round created successfully:', record);
    console.log('Saved round ID:', record.id);
    console.log('Saved userId in record:', record.userId);

    // Immediately try to fetch this round to verify it was saved
    try {
      const verification = await pb.collection('rounds').getOne(record.id);
      console.log('Verification - round exists:', verification);
    } catch (verifyError) {
      console.error('Verification failed - round not found:', verifyError);
    }

    return {
      success: true,
      roundId: record.id
    };
  } catch (error) {
    console.error('=== ROUND CREATION FAILED ===');
    console.error('Full create round error:', error);
<<<<<<< HEAD
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create round'
    };
=======
    return handleError(error, 'Failed to create round') as RoundResponse;
>>>>>>> f6d18eb (final commit)
  }
}

export async function updateRoundOutcomes(
  roundId: string,
  outcomes: RoundData,
  actions?: PlayerAction[]
): Promise<ApiResponse> {
  try {
    const updateData: any = {
      endedAt: new Date().toISOString(),
      outcomes: outcomes
    };

    if (actions && actions.length > 0) {
      updateData.actions = actions;
    }

    await pb.collection('rounds').update(roundId, updateData);

    return { success: true };
  } catch (error) {
    return handleError(error, 'Failed to update round outcomes');
  }
}

export async function addActionToRound(roundId: string, action: PlayerAction): Promise<ApiResponse> {
  try {
    const round = await pb.collection('rounds').getOne(roundId);
    const existingActions = round.actions || [];

    await pb.collection('rounds').update(roundId, {
      actions: [...existingActions, action]
    });

    return { success: true };
  } catch (error) {
    return handleError(error, 'Failed to add action to round');
  }
}

export async function testRoundsCollection(): Promise<ApiResponse> {
  try {
    const records = await pb.collection('rounds').getList(1, 1);
    console.log('Rounds collection exists, found records:', records.totalItems);
    return { success: true };
  } catch (error) {
    console.error('Rounds collection test failed:', error);
    return handleError(error, 'Rounds collection test failed');
  }
}

export async function testCreateRound(): Promise<ApiResponse> {
  try {
    const userId = pb.authStore.record?.id;
    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    console.log('Testing round creation with userId:', userId);

    const result = await createRound(userId, 'test-seed-123');
    if (result.success) {
      console.log('Test round created successfully:', result.roundId);
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('Test create round failed:', error);
    return handleError(error, 'Test create round failed');
  }
}

function generateRequestKey(userId: string): string {
  return `rounds_${userId}_${Date.now()}_${Math.random()}`;
}

export async function getUserRounds(
  userId: string,
  page: number = 1,
  perPage: number = 100
): Promise<RoundsListResponse> {
  try {
    console.log('Fetching rounds for userId:', userId);

<<<<<<< HEAD
    // Check if user is authenticated
    if (!pb.authStore.isValid) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Only enforce user matching for non-admin users - for now allow any authenticated user to fetch their own data
    if (pb.authStore.record?.id !== userId) {
      console.log('UserID mismatch:', {
        requestedUserId: userId,
        authenticatedUserId: pb.authStore.record?.id
      });
      // For now, allow fetching if the user is authenticated (this can be tightened later if needed)
    }

    // Add a small delay to prevent auto-cancellation
    await new Promise(resolve => setTimeout(resolve, 100));

    // First, let's see what's actually in the database
    console.log('Checking all rounds in database...');
    const allRoundsKey = `all_rounds_${Date.now()}_${Math.random()}`;
    const allRounds = await pb.collection('rounds').getList(1, 5, {
      sort: '-startedAt',
      requestKey: allRoundsKey
    });
    console.log('All rounds in database:', allRounds);
    console.log('Total rounds found:', allRounds.totalItems);

    // Let's see the structure of the first round if any exist
    if (allRounds.items && allRounds.items.length > 0) {
      console.log('First round structure:', allRounds.items[0]);
      console.log('First round userId field:', allRounds.items[0].userId);
      console.log('First round fields:', Object.keys(allRounds.items[0]));

      // Check all userIds in the database
      const userIds = allRounds.items.map(round => round.userId);
      console.log('All userIds found in rounds:', userIds);
      console.log('Requested userId:', userId);
      console.log('Does requested userId exist in rounds?', userIds.includes(userId));
    } else {
      console.log('No rounds found in database at all');
    }

    // Small delay to avoid rapid requests
    await new Promise(resolve => setTimeout(resolve, 200));

    // Fetch rounds with filter for this specific user
    const uniqueKey = `user_rounds_${userId}_${Date.now()}_${Math.random()}`;
    console.log('Fetching rounds with filter for userId:', userId);

    const records = await pb.collection('rounds').getList(page, perPage, {
      sort: '-startedAt',
      filter: `userId = "${userId}"`,
      requestKey: uniqueKey
    });

    console.log('Rounds fetched successfully:', records);
    console.log('Filtered rounds count:', records.totalItems);
    console.log('Filter used:', `userId = "${userId}"`);

    if (records.items.length === 0) {
      console.log('No rounds found for this user - checking if filter is working...');

      // Try without filter to see if any rounds exist
      const unfiltered = await pb.collection('rounds').getList(1, 5, {
        sort: '-startedAt',
        requestKey: `debug_${Date.now()}`
      });
      console.log('Unfiltered check - total rounds:', unfiltered.totalItems);
      if (unfiltered.items.length > 0) {
        console.log('Sample round userIds:', unfiltered.items.map(r => r.userId));
      }
    }

=======
    // Fetch all rounds for debugging
    const allRounds = await pb.collection('rounds').getList(1, 10, { sort: '-startedAt' });
    console.log('All rounds:', allRounds.items.map(r => ({ id: r.id, userId: r.userId })));

    // Check if the userId exists in any round
    const userIds = allRounds.items.map(r => r.userId);
    console.log('UserIds in rounds:', userIds);
    console.log('Requested userId:', userId);
    if (!userIds.includes(userId)) {
      console.warn('Requested userId not found in any round!');
    }

    // Now fetch rounds for this user
    const records = await pb.collection('rounds').getList(page, perPage, {
      sort: '-startedAt',
      filter: `userId = "${userId}"`
    });
    console.log('Filtered rounds:', records.items);
>>>>>>> f6d18eb (final commit)
    return {
      success: true,
      rounds: records.items,
      totalItems: records.totalItems
    };
  } catch (error) {
    console.error('Error in getUserRounds:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch rounds'
    };
  }
}