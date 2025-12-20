# Deployment Guide

## ✅ Critical Fixes Applied

### 1. Removed Hardcoded Credentials ✅
- Removed fallback Supabase credentials from code
- Added validation to ensure env vars are set
- Created .env.example template

### 2. Environment Configuration ✅
- .env file exists with development credentials
- .env.example created for reference
- Environment variables now required

---

## 🚀 Deployment Instructions

### For Vercel:
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add these variables:
   ```
   VITE_SUPABASE_URL = your_production_supabase_url
   VITE_SUPABASE_ANON_KEY = your_production_anon_key
   ```
4. Deploy!

### For Netlify:
1. Site settings → Build & deploy → Environment
2. Add environment variables:
   ```
   VITE_SUPABASE_URL = your_production_supabase_url
   VITE_SUPABASE_ANON_KEY = your_production_anon_key
   ```
3. Deploy!

### For Other Platforms:
- Add the same environment variables in your platform's dashboard
- Make sure they start with `VITE_` prefix

---

## ⚠️ IMPORTANT: Database Migration

Before deploying, verify the database migration was successful:

1. Go to Supabase SQL Editor
2. Run this query:
   ```sql
   SELECT constraint_name, table_name, column_name
   FROM information_schema.key_column_usage
   WHERE table_name = 'trades' AND column_name = 'user_id';
   ```
3. Should show: `trades_user_id_fkey` pointing to `profiles(user_id)`

If not found, run `fix-trades-foreign-key.sql` again!

---

## 🧪 Testing Before Deploy

1. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test these flows:**
   - [ ] Trades page loads
   - [ ] Can create a trade
   - [ ] Can view profiles from trades
   - [ ] Message button works
   - [ ] Pagination works

3. **Build test:**
   ```bash
   npm run build
   # Should succeed without errors
   ```

---

## 📋 Pre-Deployment Checklist

- [x] Removed hardcoded credentials
- [x] Created .env file
- [x] Created .env.example
- [x] Added environment validation
- [ ] Verified database migration (USER MUST CHECK)
- [ ] Tested locally
- [ ] Added env vars to deployment platform
- [ ] Ready to deploy!

---

## 🎯 Next Steps

1. **Restart your dev server** to use new .env file
2. **Test everything** works locally
3. **Add environment variables** to your deployment platform
4. **Deploy to staging** first
5. **Test in staging**
6. **Deploy to production**

---

## 🔒 Security Notes

- ✅ .env file should be in .gitignore (check this!)
- ✅ Never commit .env to git
- ✅ Use different credentials for production
- ✅ Rotate keys if accidentally exposed
