# Gemini AI Setup Guide

## Getting Your Gemini API Key

1. **Visit Google AI Studio**
   - Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account

2. **Create an API Key**
   - Click "Create API Key"
   - Choose "Create API key in new project" or select an existing project
   - Copy the generated API key

3. **Add to Environment Variables**
   - Open your `.env` file in the backend directory
   - Replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Restart the Server**
   - Stop the development server (Ctrl+C)
   - Run `npm run dev` again

## Important Notes

- **Free Tier**: Gemini API has a generous free tier with rate limits
- **Security**: Never commit your API key to version control
- **Fallback Mode**: The app works without the API key but with limited AI features
- **Rate Limits**: Be aware of API rate limits in production

## Troubleshooting

### "GEMINI_API_KEY is required" Error
- This error has been fixed. The app now runs in fallback mode without the API key.

### API Key Not Working
- Verify the API key is correct
- Check if you have API access enabled
- Ensure you haven't exceeded rate limits

### Rate Limit Exceeded
- The app will automatically fall back to basic responses
- Consider upgrading your API plan for higher limits

## Features Available

### With Gemini API Key:
- ✅ Personalized AI responses based on user data
- ✅ Context-aware conversations
- ✅ Dynamic recommendations
- ✅ Advanced fitness coaching

### Without Gemini API Key (Fallback Mode):
- ✅ Basic fitness guidance
- ✅ Chat history functionality
- ✅ Voice input/output
- ✅ Quick prompts
- ⚠️ Limited to predefined responses

The application is designed to work seamlessly in both modes!