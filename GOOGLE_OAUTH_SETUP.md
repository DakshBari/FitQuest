# Google OAuth Setup Guide for FitQuest

FitQuest uses a dual-support Google OAuth flow:
1. **In-page Google Popup (Primary / Recommended)**: Powered by `@react-oauth/google` on the frontend and token verification via `google-auth-library` on the backend.
2. **Server-Side Redirect Flow (Fallback)**: Standard OAuth 2.0 redirect via `/api/auth/google` and `/api/auth/google/callback`.

---

## 1. Google Cloud Console Setup (Step-by-Step)

### Step 1: Open Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with your Google account.
3. In the top-left navigation, click the project selector dropdown and click **"NEW PROJECT"**.
4. Name the project (e.g. `FitQuest`) and click **"CREATE"**.

---

### Step 2: Configure the OAuth Consent Screen
1. In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (unless you are using Google Workspace organization) and click **CREATE**.
3. Fill in the **App Information**:
   - **App name**: `FitQuest`
   - **User support email**: Select your email address.
   - **Developer contact information**: Enter your email address.
4. Click **SAVE AND CONTINUE**.
5. On the **Scopes** page:
   - Click **ADD OR REMOVE SCOPES**.
   - Select:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **UPDATE**, then click **SAVE AND CONTINUE**.
6. On the **Test users** page:
   - While the app is in "Testing" publishing status, add your own Google email address (and any tester emails) by clicking **+ ADD USERS**.
   - Click **SAVE AND CONTINUE**, then return to the Dashboard.

---

### Step 3: Create OAuth 2.0 Web Client Credentials
1. In the left sidebar, click **Credentials**.
2. Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
3. Under **Application type**, choose **Web application**.
4. Set **Name** to `FitQuest Web App`.
5. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   - `http://localhost:3000`
   - `http://localhost:5000` *(optional, for direct backend calls)*
   *(For production, also add your production frontend domain, e.g. `https://fitquest.app`)*
6. Under **Authorized redirect URIs**, click **+ ADD URI** and add:
   - `http://localhost:3000`
   - `http://localhost:5000/api/auth/google/callback`
   *(For production, add `https://your-domain.com` and `https://api.your-domain.com/api/auth/google/callback`)*
7. Click **CREATE**.
8. A modal will pop up with your:
   - **Client ID** (e.g., `1234567890-abcdef.apps.googleusercontent.com`)
   - **Client Secret** (e.g., `GOCSPX-xxxxxxxxxxxxxx`)

---

## 2. Update Environment Variables

### Backend: `backend/.env`
Open `backend/.env` and fill in the values:
```env
GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### Frontend: `Frontend/.env.local`
Open `Frontend/.env.local` and add:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
```

> **Note**: In Next.js, whenever you update `.env.local`, restart the Next.js dev server for changes to take effect!

---

## 3. How It Works Under The Hood

1. **User Clicks Google Button**:
   - `GoogleSignInButton.tsx` triggers Google's official OAuth modal using `@react-oauth/google`.
2. **Token Exchange**:
   - Google returns the authentication response to the frontend.
   - The frontend sends the token to `POST /api/auth/google`.
3. **Backend Verification**:
   - The backend validates the Google token using Google's public keys via `google-auth-library`.
4. **User Creation & Linking**:
   - If an account already exists with that Google email, FitQuest automatically links the accounts.
   - If it's a new user, FitQuest creates a character profile with a unique username, default stats (Strength: 50, Agility: 50, Endurance: 50), and Google avatar.
5. **Session Initiation**:
   - Backend returns a signed FitQuest JWT token and user profile.
   - Frontend stores the token in `localStorage` and `cookie`, updates `AuthContext`, and redirects straight into `/dashboard`.

---

## 4. Testing Your Setup

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```
2. Start the frontend:
   ```bash
   cd Frontend
   npm run dev
   ```
3. Visit `http://localhost:3000/login` or `http://localhost:3000/signup`.
4. Click the **Google** button.
5. Choose your Google account from the popup.
6. You will be authenticated and redirected to your FitQuest Dashboard!
