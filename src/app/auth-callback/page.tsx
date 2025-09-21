"use client";

import { useEffect } from "react";
import { pb } from "../../lib/auth";

export default function AuthCallbackPage() {
    useEffect(() => {
        const finishAuth = async () => {
            try {
                // This grabs ?code= and ?state= from the URL and finalizes the login
                await pb.collection("users").authWithOAuth2Code(
                    "google",
                    // 1. The authorization code from the URL
                    new URL(window.location.href).searchParams.get("code")!,
                    // 2. The codeVerifier (PocketBase stored it for you automatically in localStorage)
                    localStorage.getItem("pkce_codeVerifier")!,
                    // 3. The redirect URL (must match what you set in Google & PocketBase)
                    window.location.origin + "/auth-callback"
                );

                window.location.href = "/";
            } catch (err) {
                console.error(err);
                alert("Login failed");
            }
        };

        finishAuth();
    }, []);

    return <p>Finishing login...</p>;
}
