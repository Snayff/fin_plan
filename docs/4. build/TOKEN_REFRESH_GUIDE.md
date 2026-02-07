# Token Refresh Implementation Guide

## Overview

The application now implements automatic token refresh to handle expired access tokens gracefully. This provides a seamless user experience where users remain logged in even when their access token expires.

## How It Works

### Token Types

1. **Access Token**: Short-lived token (default: 15 minutes) used for API requests
2. **Refresh Token**: Long-lived token (default: 7 days) used to obtain new access tokens

### Token Refresh Flow

```
1. User makes API request with expired access token
   ↓
2. Backend returns 401 "Invalid or expired token"
   ↓
3. Frontend API client intercepts 401 error
   ↓
4. API client calls /api/auth/refresh with refresh token
   ↓
5a. Refresh successful:               5b. Refresh failed:
    - Get new access token                - Logout user
    - Update token in store               - Redirect to login
    - Retry original request              
    ↓
6. Return response to user
```

### Key Components

#### Backend

1. **`/api/auth/refresh` Endpoint** (`apps/backend/src/routes/auth.routes.ts`)
   - Accepts refresh token in request body
   - Validates refresh token
   - Issues new access token
   - Returns `{ accessToken: string }`

2. **`refreshAccessToken()` Function** (`apps/backend/src/services/auth.service.ts`)
   - Verifies refresh token using JWT utils
   - Looks up user in database
   - Generates new access token
   - Throws error if refresh token is invalid/expired

#### Frontend

1. **API Client Interceptor** (`apps/frontend/src/lib/api.ts`)
   - Detects 401 errors on protected endpoints
   - Calls `handleTokenRefresh()` automatically
   - Prevents multiple simultaneous refresh requests
   - Retries original request with new token
   - Logs out user if refresh fails

2. **Auth Service** (`apps/frontend/src/services/auth.service.ts`)
   - Added `refreshToken()` method to call backend refresh endpoint

3. **Auth Store** (`apps/frontend/src/stores/authStore.ts`)
   - Added `updateAccessToken()` method to update token without full re-authentication
   - Stores both access and refresh tokens in localStorage

## User Experience

### Scenario 1: Access Token Expires
- User continues working normally
- When access token expires, next API request automatically refreshes token
- User experiences no interruption
- ✅ **User stays logged in**

### Scenario 2: Refresh Token Expires
- Access token expires, automatic refresh is attempted
- Refresh token is also expired/invalid
- User is automatically logged out
- User is redirected to login page
- ⚠️ **User must log in again**

### Scenario 3: Both Tokens Valid
- All API requests work normally
- No token refresh needed
- ✅ **Normal operation**

## Configuration

Token expiration times are configured in your backend environment variables:

```env
# apps/backend/.env
JWT_EXPIRES_IN=15m          # Access token lifetime
JWT_REFRESH_EXPIRES_IN=7d   # Refresh token lifetime
```

**Recommended settings:**
- Access Token: 15 minutes to 1 hour (balance between security and UX)
- Refresh Token: 7 to 30 days (how long users stay logged in)

## Testing the Implementation

### Test 1: Verify Refresh Endpoint

```bash
# 1. Login and save tokens
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"your-password"}'

# Response includes: accessToken and refreshToken

# 2. Test refresh endpoint
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your-refresh-token-here"}'

# Should return: { "accessToken": "new-token-here" }
```

### Test 2: Simulate Token Expiry

To test the automatic refresh flow in the browser:

1. **Temporarily shorten access token lifetime:**
   ```env
   # apps/backend/.env
   JWT_EXPIRES_IN=30s  # 30 seconds for testing
   ```

2. **Restart backend server**

3. **Login to the application**

4. **Wait 30+ seconds** (until access token expires)

5. **Perform any action** (view accounts, add transaction, etc.)
   - Should work seamlessly without error
   - Check browser console - you'll see refresh request
   - Token refresh happens automatically

6. **Check Network tab in DevTools:**
   - Look for 401 response
   - Followed by `/api/auth/refresh` request
   - Followed by retry of original request with new token

### Test 3: Test Refresh Token Expiry

1. **Set short refresh token lifetime:**
   ```env
   JWT_EXPIRES_IN=30s
   JWT_REFRESH_EXPIRES_IN=1m
   ```

2. **Login to application**

3. **Wait 1+ minute** (until both tokens expire)

4. **Try to perform an action**
   - Should automatically logout
   - Should redirect to login page
   - Console shows: "Token refresh failed"

### Test 4: Concurrent Requests

The implementation prevents multiple simultaneous refresh requests:

1. Open browser DevTools Network tab
2. Trigger multiple API calls at once when token is expired
3. Observe only ONE `/api/auth/refresh` call is made
4. All original requests are retried with the new token

## Security Considerations

### ✅ What This Implementation Provides

- Short-lived access tokens reduce risk if compromised
- Automatic refresh improves UX without sacrificing security
- Refresh tokens are never sent in headers (only access tokens)
- Failed refresh attempts automatically logout users
- Prevents multiple concurrent refresh requests

### ⚠️ Additional Security Enhancements (Future)

Consider implementing these for production:

1. **Refresh Token Rotation**: Issue new refresh token with each refresh
2. **Token Blacklisting**: Track revoked tokens in Redis/database
3. **Device Fingerprinting**: Bind refresh tokens to specific devices
4. **HTTPS Only**: Ensure all requests use HTTPS in production
5. **HttpOnly Cookies**: Store refresh tokens in HttpOnly cookies instead of localStorage

## Troubleshooting

### Issue: "Invalid or expired token" persists

**Cause**: Refresh token is also expired or invalid

**Solution**: User needs to login again

### Issue: Infinite refresh loop

**Cause**: Refresh endpoint itself is being intercepted

**Solution**: Already handled - refresh endpoint is excluded from interception:
```typescript
if (endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login')
```

### Issue: Token not updating in subsequent requests

**Cause**: Auth store not properly updating

**Solution**: Verify `setUser()` is called after refresh:
```typescript
authStore.setUser(authStore.user!, accessToken, refreshToken);
```

### Issue: Multiple refresh requests

**Cause**: Race condition with concurrent requests

**Solution**: Already handled with `isRefreshing` flag and shared promise

## Migration Notes

### For Existing Users

- Existing access tokens continue to work until they expire
- First 401 error will trigger automatic refresh
- No manual intervention needed
- Users remain logged in through the transition

### Breaking Changes

None - this is backward compatible

## Summary

✅ **Access token expires** → Automatic refresh → User stays logged in  
⚠️ **Refresh token expires** → Automatic logout → User must login  
🔒 **Better security** → Short-lived access tokens  
😊 **Better UX** → Users stay logged in longer  

Your application now handles token expiration gracefully with automatic token refresh!
