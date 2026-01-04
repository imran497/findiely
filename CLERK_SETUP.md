# Clerk Authentication Setup with Twitter/X OAuth

This guide will help you set up Clerk authentication with Twitter/X sign-in for Findiely.

## Prerequisites

- A Clerk account (sign up at [https://clerk.com](https://clerk.com))
- A Twitter/X Developer account with API access

## Step 1: Create a Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click "Add Application"
3. Enter your application name (e.g., "Findiely")
4. Select your preferred authentication options
5. Click "Create Application"

## Step 2: Get Clerk API Keys

1. In your Clerk dashboard, go to "API Keys"
2. Copy the following keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

3. Add these to your `.env.local` file:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   CLERK_SECRET_KEY=sk_test_your_secret_key_here
   ```

## Step 3: Set Up Twitter/X OAuth

### A. Create a Twitter/X App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click on "Projects & Apps" → "Create App"
3. Fill in the app details:
   - **App Name**: Findiely (or your app name)
   - **App Description**: Your app description
   - **Website URL**: Your production URL (e.g., https://findiely.com)

### B. Configure OAuth Settings

1. In your Twitter app settings, go to "User authentication settings"
2. Click "Set up" or "Edit"
3. Configure the following:
   - **App permissions**: Read (minimum required)
   - **Type of App**: Web App
   - **Callback URL**: Get this from Clerk (next step)
   - **Website URL**: Your production URL

### C. Get Twitter OAuth Credentials

1. In your Twitter app settings, go to "Keys and tokens"
2. Under "OAuth 2.0 Client ID and Client Secret", click "Generate"
3. Copy:
   - **Client ID** (OAuth 2.0)
   - **Client Secret** (OAuth 2.0)

### D. Add Twitter OAuth to Clerk

1. Go to your Clerk Dashboard
2. Navigate to "Social Connections" or "SSO Connections"
3. Find "Twitter/X" (or "X") in the list
4. Click "Configure" or the toggle to enable it
5. Enter your Twitter OAuth credentials:
   - **Client ID**: Paste your Twitter OAuth 2.0 Client ID
   - **Client Secret**: Paste your Twitter OAuth 2.0 Client Secret
6. Copy the **Redirect URI** provided by Clerk
7. Click "Save"

### E. Update Twitter App with Clerk Redirect URI

1. Go back to Twitter Developer Portal
2. Go to your app's "User authentication settings"
3. Click "Edit"
4. In the **Callback URL** field, paste the Clerk Redirect URI you copied
5. Example format: `https://your-app.clerk.accounts.dev/v1/oauth_callback`
6. Save the settings

## Step 4: Test Authentication

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your app (http://localhost:3001)
3. Click the "Sign In" button
4. You should see a Clerk modal with Twitter/X as a sign-in option
5. Click "Continue with X" to test the integration

## Step 5: Customize Clerk Appearance (Optional)

1. In Clerk Dashboard, go to "Customization"
2. Customize colors, logos, and branding to match your app
3. Set up email templates and other settings as needed

## Environment Variables Summary

Make sure your `.env.local` has these variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Custom routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## Production Deployment

When deploying to production:

1. Create a production Clerk application (or use the same one)
2. Add production domain to Twitter app's allowed callback URLs
3. Update environment variables with production keys (`pk_live_` and `sk_live_`)
4. Add environment variables to your hosting platform (Vercel, etc.)

## Troubleshooting

### "Invalid OAuth callback URL"
- Ensure the Clerk redirect URI is added to Twitter app's callback URLs
- Check that the URL is exactly the same (including https://)

### "Sign-in button not working"
- Verify Clerk environment variables are set correctly
- Restart your development server after adding env variables
- Check browser console for any errors

### "Twitter/X not showing as option"
- Ensure Twitter OAuth is enabled in Clerk dashboard
- Verify Client ID and Client Secret are entered correctly
- Check that all required fields in Twitter app settings are filled

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Twitter OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Clerk Social Connections](https://clerk.com/docs/authentication/social-connections/overview)

## Support

For issues with Clerk: [Clerk Support](https://clerk.com/support)
For issues with Twitter API: [Twitter Developer Forums](https://twittercommunity.com/)
