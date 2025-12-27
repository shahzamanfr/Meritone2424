# Deployment Guide 🚀

Your application is built with a **Hybrid Architecture**:
1.  **Frontend**: Vite SPA (Static site).
2.  **API Backend**: Express server (Running as a Netlify Function).
3.  **Database/Auth**: Supabase (Backend-as-a-Service).

---

## 🏗️ Deployment to Netlify (Recommended)

Netlify is the easiest way to deploy this project because it handles the frontend and the backend API automatically.

### Step 1: Push to GitHub
Ensure all your latest changes are pushed to your GitHub repository.
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Connect to Netlify
1.  Log in to [Netlify](https://app.netlify.com/).
2.  Click **"Add new site"** -> **"Import an existing project"**.
3.  Select **GitHub** and choose your repository.
4.  Netlify will automatically detect the `netlify.toml` file and set the build settings for you.

### Step 3: Configure Environment Variables (CRITICAL)
Before the site will work, you **must** add your secret keys in the Netlify dashboard:
1.  Go to **Site configuration** > **Environment variables**.
2.  Add the following variables:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | *Your URL* | From Supabase Project Settings > API |
| `VITE_SUPABASE_ANON_KEY` | *Your Key* | From Supabase Project Settings > API |
| `VITE_GROQ_API_KEY` | *Your Key* | From Groq Cloud Dashboard (for AI Features) |

*Note: You do NOT need to upload your `.env` file. These settings replace it safely.*

### Step 4: Trigger Deploy
1.  Go to the **Deploys** tab.
2.  Click **"Trigger deploy"** > **"Deploy site"**.
3.  Once the status is "Published", your site is live!

---

## 🗄️ Supabase Backend Setup

Since you are using Supabase as your database, your "backend" is already live. However, make sure your database schema is correct:

1.  Open your **Supabase Dashboard**.
2.  Go to the **SQL Editor**.
3.  Run the query mentioned in the `fix-trades-foreign-key.sql` file if you haven't already.
4.  Ensure **Row Level Security (RLS)** is enabled on your tables for production security.

---

## 🧪 Post-Deployment Verification

Once live, verify these features:
1.  [ ] **Authentication**: Can you Sign Up and Sign In?
2.  [ ] **Trades**: Can you create and view trades?
3.  [ ] **AI Features**: Does the Resume builder work (uses Groq)?
4.  [ ] **Mobile**: Does the menu look correct on your phone?

---

## � Security Checklist
- [x] API Keys removed from code and moved to Env Vars.
- [x] `.env` file is in `.gitignore`.
- [ ] Database RLS policies are active.
- [ ] Only required `VITE_` variables are public.

---

## 🎯 Summary
Deployment on Netlify is automatic. Just connect your GitHub, add your three keys (`Supabase URL`, `Anon Key`, and `Groq Key`), and you're done!
