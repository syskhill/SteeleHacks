import PocketBase from 'pocketbase';

// Initialize PocketBase
export const pb = new PocketBase('http://127.0.0.1:8090'); // Replace with your PocketBase URL

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

export async function logout() {
  pb.authStore.clear();
}

export function isAuthenticated() {
  return pb.authStore.isValid;
}