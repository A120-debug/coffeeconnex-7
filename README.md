
# CoffeeConnex AI Platform

A high-performance mentorship ecosystem built with React, Vite, and Gemini 3.0.

## 🚀 Live on Vercel (Deployment Steps)

1. **Push to GitHub**:
   Ensure all files are in your repository.
2. **Import to Vercel**:
   Go to [vercel.com](https://vercel.com), click **Add New > Project**, and select your GitHub repo.
3. **Configure Framework**:
   Vercel will auto-detect **Vite**. Keep the default build settings (`npm run build`).
4. **Environment Variables**:
   In the "Environment Variables" section, add:
   - **Key**: `API_KEY`
   - **Value**: Your Google Gemini API Key from [AI Studio](https://aistudio.google.com/app/apikey).
5. **Deploy**:
   Click **Deploy**. Your site will be live at a `.vercel.app` URL.

## 🛠 Solving Quota (429) Errors
The application now uses `gemini-3-flash-preview` by default. If you still encounter `RESOURCE_EXHAUSTED`:
- Go to Google AI Studio.
- Ensure your project is linked to a **paid billing account**.
- The "Free Tier" has strict RPM (Requests Per Minute) limits. The code includes a jittered retry mechanism to handle this gracefully.
