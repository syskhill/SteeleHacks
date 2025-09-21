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
    // PocketBase OAuth2 with Google
    const authData = await pb.collection("users").authWithOAuth2({
      provider: "google",
      createData: {
        chips: 1000, // Default starting chips for new Google users
      }
    });

    console.log("Google OAuth successful");
    console.log("Is valid?", pb.authStore.isValid);
    console.log("User:", pb.authStore.record);

    return {
      success: true,
      user: authData?.record,
    };
  } catch (error: any) {
    console.error("Google login error:", error);

    // More specific error handling
    let errorMessage = "Google login failed";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.data?.message) {
      errorMessage = error.data.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}


export async function logout() {
  pb.authStore.clear();
}

export function isAuthenticated() {
  return pb.authStore.isValid;
}