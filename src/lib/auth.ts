import PocketBase from 'pocketbase';

// Initialize PocketBase
export const pb = new PocketBase('https://1e3cb110514d.ngrok-free.app'); // Replace with your PocketBase URL

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

export async function googleLogin() {
  try {
    const authData = await pb.collection("users").authWithOAuth2({ provider: "google" })
    console.log("Is valid?", pb.authStore.isValid);
    console.log("Token:", pb.authStore.token);
    console.log("User:", pb.authStore.record);

    return {
      success: true,
      user: authData?.record,
    };
  } catch (error) {
    return {
      success: false,
      error: "Google login failed",
    };
  }
}


export async function logout() {
  pb.authStore.clear();
}

export function isAuthenticated() {
  return pb.authStore.isValid;
}