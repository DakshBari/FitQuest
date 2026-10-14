# Gemini AI Setup Guide (Free Tier)

FitQuest uses Google's **Gemini 1.5 Flash** for the AI Coach and Meal Nutrition Analysis services. The Gemini API includes a **100% free tier** that requires no credit card.

---

## 1. How to Get Your Free Gemini API Key (Takes 1 minute)

1. **Visit Google AI Studio**:
   - Go to: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account.

2. **Create the API Key**:
   - Click the blue **"Create API Key"** button.
   - Choose your existing project (e.g., `FitQuest`), or choose **"Create API key in new project"**.
   - Copy your newly generated API key (it starts with `AIzaSy...`).

---

## 2. Where to Update Your Key

### In Your Local Backend:
Open [`backend/.env`](file:///d:/FitQuest/backend/.env) and update:
```env
GEMINI_API_KEY=your_new_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### In Your Render Production Backend:
1. Open [Render Dashboard](https://dashboard.render.com/) > click **`fitquest-backend`**.
2. Go to the **Environment** tab on the left.
3. Find **`GEMINI_API_KEY`**, replace it with your new key.
4. (Optional) Add **`GEMINI_MODEL`** with value `gemini-1.5-flash`.
5. Click **Save Changes**.

---

## 3. Gemini Free Tier Limits

| Metric | Free Tier Allowance |
| :--- | :--- |
| **Model** | `gemini-1.5-flash` (Fast, multimodal, high accuracy) |
| **Requests Per Minute (RPM)** | **15 RPM** |
| **Requests Per Day (RPD)** | **1,500 requests / day** (Free forever) |
| **Tokens Per Minute (TPM)** | **1,000,000 TPM** |
| **Credit Card Required?** | **No** |

---

## 4. Fallback Mode
If your API key reaches rate limits or is omitted, FitQuest automatically switches to local fallback heuristics for basic fitness tips and meal calculations so user flows never crash.