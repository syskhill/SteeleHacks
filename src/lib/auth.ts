import PocketBase from 'pocketbase';

// Initialize PocketBase
export const pb = new PocketBase('https://e0871e346ffb.ngrok-free.app'); // Replace with your PocketBase URL

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
    // First check if OAuth2 providers are available
    const authMethods = await pb.collection('users').listAuthMethods();

    if (!authMethods.oauth2 || !authMethods.oauth2.providers) {
      throw new Error("OAuth2 providers not configured in PocketBase");
    }

    const googleProvider = authMethods.oauth2.providers.find((p: any) => p.name === 'google');
    if (!googleProvider) {
      throw new Error("Google OAuth2 provider not configured");
    }

    console.log("Available OAuth2 providers:", authMethods.oauth2.providers);

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

    if (error.message?.includes("OAuth2 providers not configured")) {
      errorMessage = "Google login is not set up on this server";
    } else if (error.message?.includes("Google OAuth2 provider not configured")) {
      errorMessage = "Google login is not available";
    } else if (error.message) {
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

export async function isGoogleOAuthAvailable(): Promise<boolean> {
  try {
    const authMethods = await pb.collection('users').listAuthMethods();

    if (!authMethods.oauth2 || !authMethods.oauth2.providers) {
      return false;
    }

    const googleProvider = authMethods.oauth2.providers.find((p: any) => p.name === 'google');
    return !!googleProvider;
  } catch (error) {
    console.error("Error checking OAuth availability:", error);
    return false;
  }
}