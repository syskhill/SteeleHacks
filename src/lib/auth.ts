import PocketBase from 'pocketbase';

// Initialize PocketBase
export const pb = new PocketBase('https://8cadc2ad641b.ngrok-free.app'); // Replace with your PocketBase URL

export async function login(email: string, password: string) {
  try {
    const authData = await pb.collection('users').authWithPassword(
      email,
      password
    );

    return {
      success: true,
      user: authData.record
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid email or password'
    };
  }
}



export async function guestLogin() {
  try {
    // Clear any existing authentication
    pb.authStore.clear();

    // Create a temporary anonymous user
    const guestUser = {
      id: 'guest_' + Date.now(),
      email: 'guest@anonymous.com',
      chips: 1000,
      isGuest: true
    };

    // Store guest user in localStorage for persistence
    localStorage.setItem('guestUser', JSON.stringify(guestUser));

    return {
      success: true,
      user: guestUser
    };
  } catch (error) {
    return {
      success: false,
      error: 'Guest login failed'
    };
  }
}

export function getGuestUser() {
  if (typeof window !== 'undefined') {
    const guestData = localStorage.getItem('guestUser');
    return guestData ? JSON.parse(guestData) : null;
  }
  return null;
}

export function isGuestUser() {
  const guestUser = getGuestUser();
  return !!guestUser;
}

export async function logout() {
  pb.authStore.clear();
  // Also clear guest user data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('guestUser');
  }
}

export function isAuthenticated() {
  return pb.authStore.isValid || isGuestUser();
}

