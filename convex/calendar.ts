"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { google } from "googleapis";
import { api, internal } from "./_generated/api";

// Read Google OAuth config from Convex environment variables
// Set these via `convex env set <deployment> GOOGLE_CLIENT_ID ...` etc.
function getRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI || "http://localhost:5174/auth/google/callback";
}

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getRedirectUri();
  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth env vars: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export const getAuthorizationUrl = action({
  args: {},
  handler: async () => {
    const scopes = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    // Add userinfo scopes so we can call oauth2.userinfo.get()
    scopes.push(
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    );


    const oauth2Client = getOAuthClient();
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });
  },
});

export const getAccessToken = action({
    args: { code: v.string() },
    handler: async (ctx, { code }) => {
        try {
            const oauth2Client = getOAuthClient();
            const redirectUri = getRedirectUri();
            const clientId = process.env.GOOGLE_CLIENT_ID;
            console.log("Starting OAuth2 token exchange", {
                code: code ? "present" : "missing",
                redirectUri,
                clientId: clientId ? 'set' : 'missing'
            });

            // Step 1: Exchange authorization code for tokens
            let tokenResponse;
            try {
                tokenResponse = await oauth2Client.getToken({
                    code,
                    redirect_uri: redirectUri
                });
                console.log("Token exchange successful:", {
                    hasAccessToken: !!tokenResponse.tokens.access_token,
                    hasRefreshToken: !!tokenResponse.tokens.refresh_token,
                    expiresAt: tokenResponse.tokens.expiry_date
                });
            } catch (tokenError) {
                console.error("Token exchange failed:", tokenError);
                const message = tokenError instanceof Error ? tokenError.message : 'Unknown error';
                throw new Error(`Token exchange failed: ${message}`);
            }

            // Step 2: Extract and validate tokens
            const { tokens } = tokenResponse;
            if (!tokens || !tokens.access_token) {
                console.error("No access token received:", tokens);
                throw new Error("OAuth2 token exchange failed: no access_token received");
            }

            // Step 3: Set credentials on the OAuth2 client
            oauth2Client.setCredentials(tokens);
            console.log("Credentials set on OAuth2 client");

            // Step 4: Make authenticated API call to get user info
            // Create a new OAuth2 client instance with the tokens for this request
            const userInfoClient = getOAuthClient();

            // Ensure the token has the correct structure for setCredentials
            const credentialsToSet = {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: tokens.expiry_date,
                token_type: tokens.token_type || 'Bearer'
            };

            userInfoClient.setCredentials(credentialsToSet);
            console.log("Credentials set on userInfoClient with access token");

            const oauth2 = google.oauth2({
                auth: userInfoClient,
                version: 'v2'
            });

            const { data } = await oauth2.userinfo.get();
            console.log("User info retrieved:", { email: data.email, name: data.name });

            // Determine which user account to attach tokens to
            const identity = await ctx.auth.getUserIdentity();
            const primaryEmail = identity?.email ?? data.email!;

            // Try to find existing user by the primary email (prefer current logged-in user)
            let user = await ctx.runQuery(api.users.getUserByEmail, { email: primaryEmail });
            let accountResult;

            if (!user) {
                console.log("Creating new user and workspace:", primaryEmail);
                accountResult = await ctx.runMutation(api.users.createAccount, {
                    email: primaryEmail,
                    name: data.name || identity?.name || "Google User",
                });
                // Get the newly created user
                user = await ctx.runQuery(api.users.getUser, { userId: accountResult.userId });
            } else {
                console.log("Existing user found, attaching tokens to user:", user._id);
                // Ensure the user has a workspace; create one if missing
                const existingWorkspace = await ctx.runQuery(api.users.getWorkspaceByOwner, { userId: user._id });
                if (!existingWorkspace) {
                  await ctx.runMutation(api.users.createWorkspace, {
                    name: `${data.name || identity?.name || "User"}'s Workspace`,
                    ownerId: user._id,
                  });
                }
                // We'll get the workspace info through the standard setup query
                accountResult = {
                  userId: user._id,
                  workspaceId: null, // Will be populated by getDefaultWorkspace query
                };
            }

            if (!user || !accountResult) {
                throw new Error("User authentication failed");
            }

            console.log("Authentication and account setup successful for user:", user._id);
            
            // Store calendar tokens in database
            await ctx.runMutation(internal.internal.storeUserTokens, {
                userId: user._id,
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token ?? undefined,
                expiresAt: tokens.expiry_date ?? undefined,
            });

            console.log("Authentication complete for user:", user._id);
            return tokens;
        } catch (error) {
            console.error("OAuth2 error:", error);
            throw error;
        }
    },
});

export const refreshAccessToken = action({
  args: { refreshToken: v.string() },
  handler: async (ctx, { refreshToken }) => {
    try {
      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      // Refresh the access token
      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error("Failed to refresh access token");
      }

      console.log("Access token refreshed successfully");

      // Update stored tokens in database
      const user = await ctx.runQuery(api.users.getCurrentUser);
      if (user) {
        await ctx.runMutation(internal.internal.storeUserTokens, {
          userId: user._id,
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token ?? refreshToken,
          expiresAt: credentials.expiry_date ?? undefined,
        });
      }

      return {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token ?? refreshToken,
        expiry_date: credentials.expiry_date,
      };
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    }
  },
});

export const listEvents = action({
  args: {
    timeMin: v.string(),
    timeMax: v.string(),
    accessToken: v.optional(v.string()),
  },
  handler: async (ctx, { timeMin, timeMax, accessToken }) => {
    console.log("listEvents called with:", {
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length,
      accessTokenStart: accessToken?.substring(0, 20)
    });

    // Prefer explicit accessToken from client if provided
    let credentials: { access_token: string; refresh_token?: string | null; expiry_date?: number | null; token_type?: string } | null = null;
    if (accessToken) {
      credentials = {
        access_token: accessToken,
        token_type: 'Bearer'
      };
      console.log("Using provided access token");
    } else {
      // Try to get tokens from the authenticated user
      const tokenFromQuery = await ctx.runQuery(api.users.getUserTokens);
      if (tokenFromQuery && tokenFromQuery.access_token) {
        credentials = {
          ...tokenFromQuery,
          token_type: 'Bearer'
        };
        console.log("Using stored access token from database");
      }
    }

    if (!credentials || !credentials.access_token) {
      console.error("No valid credentials for listEvents");
      return [];
    }

    try {
      console.log("Setting credentials on OAuth2 client");
      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials(credentials);

      // Try to refresh if we have a refresh token and the access token might be expired
      if (credentials.refresh_token && credentials.expiry_date && credentials.expiry_date < Date.now()) {
        console.log("Access token expired, attempting refresh");
        try {
          const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();
          if (newCredentials.access_token) {
            console.log("Token refreshed successfully");
            oauth2Client.setCredentials(newCredentials);
          }
        } catch (refreshError) {
          console.warn("Token refresh failed, continuing with existing token:", refreshError);
        }
      }

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      console.log("Calling calendar.events.list");
      const res = await calendar.events.list({
        calendarId: "primary",
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: "startTime",
      });
      console.log("Successfully retrieved", res.data.items?.length || 0, "events");
      return res.data.items || [];
    } catch (error) {
      console.error("Error listing calendar events:", error);
      throw error;
    }
  },
});

export const createEvent = action({
    args: {
        title: v.string(),
        startTime: v.string(),
        endTime: v.string(),
        accessToken: v.optional(v.string()),
    },
    handler: async (ctx, { title, startTime, endTime, accessToken }) => {
        // Prefer explicit accessToken from client if provided
        let credentials: { access_token: string; refresh_token?: string | null; expiry_date?: number | null; token_type?: string } | null = null;
        if (accessToken) {
            credentials = {
                access_token: accessToken,
                token_type: 'Bearer'
            };
        } else {
            const tokenFromQuery = await ctx.runQuery(api.users.getUserTokens);
            if (tokenFromQuery && tokenFromQuery.access_token) {
                credentials = {
                    ...tokenFromQuery,
                    token_type: 'Bearer'
                };
            }
        }
        if (!credentials || !credentials.access_token) {
            throw new Error("User not authenticated");
        }
        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials(credentials);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const event = {
            summary: title,
            start: {
                dateTime: startTime,
                timeZone: "America/Los_Angeles",
            },
            end: {
                dateTime: endTime,
                timeZone: "America/Los_Angeles",
            },
        };
        const res = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
        });
        return res.data;
    },
});

export const updateEvent = action({
    args: {
        eventId: v.string(),
        title: v.string(),
        startTime: v.string(),
        endTime: v.string(),
        accessToken: v.optional(v.string()),
    },
    handler: async (ctx, { eventId, title, startTime, endTime, accessToken }) => {
        // Prefer explicit accessToken from client if provided
        let credentials: { access_token: string; refresh_token?: string | null; expiry_date?: number | null; token_type?: string } | null = null;
        if (accessToken) {
            credentials = {
                access_token: accessToken,
                token_type: 'Bearer'
            };
        } else {
            const tokenFromQuery = await ctx.runQuery(api.users.getUserTokens);
            if (tokenFromQuery && tokenFromQuery.access_token) {
                credentials = {
                    ...tokenFromQuery,
                    token_type: 'Bearer'
                };
            }
        }
        if (!credentials || !credentials.access_token) {
            throw new Error("User not authenticated");
        }
        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials(credentials);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const event = {
            summary: title,
            start: {
                dateTime: startTime,
                timeZone: "America/Los_Angeles",
            },
            end: {
                dateTime: endTime,
                timeZone: "America/Los_Angeles",
            },
        };
        const res = await calendar.events.update({
            calendarId: "primary",
            eventId,
            requestBody: event,
        });
        return res.data;
    },
});

export const deleteEvent = action({
    args: {
        eventId: v.string(),
        accessToken: v.optional(v.string()),
    },
    handler: async (ctx, { eventId, accessToken }) => {
        // Prefer explicit accessToken from client if provided
        let credentials: { access_token: string; refresh_token?: string | null; expiry_date?: number | null; token_type?: string } | null = null;
        if (accessToken) {
            credentials = {
                access_token: accessToken,
                token_type: 'Bearer'
            };
        } else {
            const tokenFromQuery = await ctx.runQuery(api.users.getUserTokens);
            if (tokenFromQuery && tokenFromQuery.access_token) {
                credentials = {
                    ...tokenFromQuery,
                    token_type: 'Bearer'
                };
            }
        }
        if (!credentials || !credentials.access_token) {
            throw new Error("User not authenticated");
        }
        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials(credentials);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        await calendar.events.delete({
            calendarId: "primary",
            eventId,
        });
    },
});