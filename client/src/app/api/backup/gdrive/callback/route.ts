import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    const clientId = process.env.GDRIVE_CLIENT_ID || "";
    const clientSecret = process.env.GDRIVE_CLIENT_SECRET || "";
    const redirectUri = `${url.origin}/api/backup/gdrive/callback`;

    if (error) {
      return NextResponse.redirect(`${url.origin}/settings?error=gdrive_${encodeURIComponent(error)}`);
    }

    if (!code) {
      // Step 1: Redirect user to Google OAuth login screen
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `response_type=code&` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent("https://www.googleapis.com/auth/drive.file")}&` +
        `access_type=offline&` +
        `prompt=consent`;

      return NextResponse.redirect(authUrl);
    }

    // Step 2: Exchange code for refresh token and access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error("Failed to exchange OAuth code for tokens:", tokenData);
      return NextResponse.redirect(`${url.origin}/settings?error=gdrive_token_failed`);
    }

    const { access_token, refresh_token } = tokenData;

    // Save tokens in process.env and append/update .env file
    if (access_token) process.env.GDRIVE_ACCESS_TOKEN = access_token;
    if (refresh_token) process.env.GDRIVE_REFRESH_TOKEN = refresh_token;

    try {
      const envPath = path.join(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf8");

        if (access_token) {
          if (envContent.includes("GDRIVE_ACCESS_TOKEN=")) {
            envContent = envContent.replace(/GDRIVE_ACCESS_TOKEN=.*/g, `GDRIVE_ACCESS_TOKEN="${access_token}"`);
          } else {
            envContent += `\nGDRIVE_ACCESS_TOKEN="${access_token}"`;
          }
        }

        if (refresh_token) {
          if (envContent.includes("GDRIVE_REFRESH_TOKEN=")) {
            envContent = envContent.replace(/GDRIVE_REFRESH_TOKEN=.*/g, `GDRIVE_REFRESH_TOKEN="${refresh_token}"`);
          } else {
            envContent += `\nGDRIVE_REFRESH_TOKEN="${refresh_token}"`;
          }
        }

        fs.writeFileSync(envPath, envContent, "utf8");
        console.log("Successfully saved GDRIVE_ACCESS_TOKEN and GDRIVE_REFRESH_TOKEN to .env");
      }
    } catch (fsErr) {
      console.warn("Could not persist Google Drive tokens to .env file:", fsErr);
    }

    return NextResponse.redirect(`${url.origin}/settings?gdrive_connected=true`);
  } catch (err: any) {
    console.error("Google Drive OAuth Callback error:", err);
    return NextResponse.redirect(`/settings?error=gdrive_exception`);
  }
}
