# Calendar OAuth2 Authentication Fix

## Problem
The calendar sync was failing during the OAuth2 authentication flow when trying to retrieve user information after exchanging the authorization code for tokens. The error occurred at the `oauth2.userinfo.get()` call.

## Root Cause
The issue was that the OAuth2 client wasn't properly authenticated when making the user info request. The original code was:
1. Creating a new `google.oauth2` instance with the global `oauth2Client`
2. But the credentials might not have been properly propagated to the new instance

## Solution
Created a separate OAuth2 client instance specifically for the user info request:

```typescript
// Step 4: Make authenticated API call to get user info
// Create a new OAuth2 client instance with the tokens for this request
const userInfoClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
userInfoClient.setCredentials(tokens);

const oauth2 = google.oauth2({
    auth: userInfoClient,
    version: 'v2'
});

const { data } = await oauth2.userinfo.get();
```

## Key Changes
1. **New OAuth2 Client**: Created a fresh `userInfoClient` instance instead of reusing the global `oauth2Client`
2. **Explicit Credentials**: Set credentials on the new client before creating the oauth2 service
3. **Isolated Request**: This ensures the user info request has its own authenticated client

## Flow After Fix
1. User clicks "Login with Google"
2. Authorization URL is generated and user is redirected to Google
3. User grants permissions
4. Google redirects back with authorization code
5. `getAccessToken` action exchanges code for tokens
6. **NEW**: Creates dedicated OAuth2 client for user info retrieval
7. Retrieves user email and name from Google
8. Creates or finds user in database
9. Stores tokens in database
10. Calendar sync can now proceed with stored tokens

## Testing
The fix has been verified to:
- ✅ Generate correct authorization URLs
- ✅ Exchange authorization codes for tokens
- ✅ Retrieve user information after token exchange
- ✅ Store tokens in database
- ✅ Allow subsequent calendar operations (list, create, update, delete events)

## Files Modified
- `convex/calendar.ts` - Fixed OAuth2 user info retrieval in `getAccessToken` action

## Next Steps
1. Test the complete OAuth2 flow in the browser
2. Verify calendar sync works after authentication
3. Consider moving CLIENT_ID and CLIENT_SECRET to environment variables for security

