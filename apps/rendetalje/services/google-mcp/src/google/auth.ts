import { google } from "googleapis";

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID as string;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN as string;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth credentials in env");
  }
  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

export function getGmail() {
  const auth = getOAuthClient();
  return google.gmail({ version: "v1", auth });
}

export function getCalendar() {
  const auth = getOAuthClient();
  return google.calendar({ version: "v3", auth });
}


