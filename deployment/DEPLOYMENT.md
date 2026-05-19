# 🚀 NeuroBudget AI — Deployment Guide
## Stack: MongoDB Atlas + Render (Backend) + Vercel (Frontend)

---

## 📋 Overview

```
[User Browser]
      │
      ▼
[Vercel — Next.js Frontend]
      │  HTTPS API calls
      ▼
[Render — Node.js Backend]
      │  mongoose
      ▼
[MongoDB Atlas — Database]
      │
[Groq Cloud — llama3 AI]
```

**Estimated time:** ~25 minutes  
**Cost:** $0 (all free tiers)

---

## STEP 1 — Push Code to GitHub

### 1.1 Create a GitHub repo
Go to [github.com/new](https://github.com/new) and create a repo called `neurobudget-ai`.

### 1.2 Push your code

```bash
cd neurobudget-ai
git init
git add .
git commit -m "Initial commit — NeuroBudget AI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/neurobudget-ai.git
git push -u origin main
```

> ✅ Make sure `.env` files are NOT committed — `.gitignore` handles this.

---

## STEP 2 — MongoDB Atlas (Free Database)

### 2.1 Create account
Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → **Try Free**

### 2.2 Create a cluster
1. Click **"Build a Database"**
2. Choose **M0 FREE** (512MB, always free)
3. Select provider: **AWS**, region: closest to you (e.g. Mumbai `ap-south-1`)
4. Cluster name: `neurobudget-cluster` → **Create**

### 2.3 Create database user
1. Go to **Database Access** → **Add New Database User**
2. Username: `neurobudget`
3. Password: click **"Autogenerate Secure Password"** → **Copy it**
4. Role: **Atlas admin** → **Add User**

### 2.4 Whitelist all IPs (for Render)
1. Go to **Network Access** → **Add IP Address**
2. Click **"Allow Access from Anywhere"** → `0.0.0.0/0`
3. Click **Confirm**

> ⚠️ This allows Render's dynamic IPs to connect. Safe for this use case.

### 2.5 Get connection string
1. Go to **Database** → **Connect** → **Connect your application**
2. Driver: **Node.js**, Version: **5.5 or later**
3. Copy the string, it looks like:
```
mongodb+srv://neurobudget:<password>@neurobudget-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
4. Replace `<password>` with your actual password
5. Add the database name before `?`:
```
mongodb+srv://neurobudget:YOURPASSWORD@neurobudget-cluster.xxxxx.mongodb.net/neurobudget?retryWrites=true&w=majority
```
6. **Save this string** — you'll need it in Step 3.

---

## STEP 3 — Render (Backend API)

### 3.1 Create account
Go to [render.com](https://render.com) → **Get Started for Free** → Sign up with GitHub

### 3.2 Create Web Service
1. Dashboard → **New +** → **Web Service**
2. Connect your GitHub repo → Select `neurobudget-ai`
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `neurobudget-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

### 3.3 Add Environment Variables
Click **"Advanced"** → **Add Environment Variable** — add each one:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://neurobudget:PASS@cluster.xxxxx.mongodb.net/neurobudget?retryWrites=true&w=majority` |
| `JWT_SECRET` | Run this to generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `GROQ_API_KEY` | `gsk_your_key_from_console.groq.com` |
| `GROQ_MODEL` | `llama3-70b-8192` |
| `FRONTEND_URL` | Leave blank for now — add after Vercel deploy |

### 3.4 Deploy
Click **"Create Web Service"** → Render will build and deploy (~3-5 min).

### 3.5 Verify backend is live
Once deployed, visit:
```
https://neurobudget-backend.onrender.com/api/health
```
You should see:
```json
{ "status": "ok", "db": "connected", "env": "production" }
```

### 3.6 Seed demo data (optional)
Open Render dashboard → your service → **Shell** tab:
```bash
node seed.js
```

> 📝 Note your Render URL: `https://neurobudget-backend.onrender.com`

---

## STEP 4 — Vercel (Frontend)

### 4.1 Create account
Go to [vercel.com](https://vercel.com) → **Sign Up** with GitHub

### 4.2 Import project
1. Dashboard → **Add New** → **Project**
2. Import `neurobudget-ai` from GitHub
3. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` |
| **Framework Preset** | `Next.js` (auto-detected) |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |

### 4.3 Add Environment Variables
Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://neurobudget-backend.onrender.com/api` |

### 4.4 Deploy
Click **"Deploy"** → Vercel builds and deploys (~2-3 min).

Your frontend URL will be:
```
https://neurobudget-ai.vercel.app
```
(or similar — Vercel shows you the exact URL)

---

## STEP 5 — Connect Frontend ↔ Backend

### 5.1 Update CORS on Render
Go to Render dashboard → `neurobudget-backend` → **Environment**:

Update `FRONTEND_URL`:
```
https://neurobudget-ai.vercel.app
```
Click **Save Changes** → Render will auto-redeploy.

### 5.2 Test the full flow
1. Visit your Vercel URL
2. Register a new account
3. Add a transaction
4. Try the AI Assistant

---

## STEP 6 — Custom Domain (Optional)

### Vercel custom domain
1. Vercel → Project → **Settings** → **Domains**
2. Add your domain: `app.yourdomain.com`
3. Add CNAME record in your DNS: `app → cname.vercel-dns.com`

### Render custom domain
1. Render → Service → **Settings** → **Custom Domains**
2. Add: `api.yourdomain.com`
3. Add CNAME in DNS: `api → neurobudget-backend.onrender.com`

Then update `FRONTEND_URL` on Render and `NEXT_PUBLIC_API_URL` on Vercel accordingly.

---

## 🔁 Deploying Updates

Every `git push` to `main` auto-deploys to both Vercel and Render.

```bash
# Make changes, then:
git add .
git commit -m "feat: your change"
git push origin main
# → Vercel + Render both redeploy automatically
```

---

## ⚠️ Free Tier Limits & Notes

| Service | Free Limit | Note |
|---------|-----------|------|
| **MongoDB Atlas M0** | 512 MB storage | Enough for ~500k transactions |
| **Render Free** | 750 hrs/month | Spins down after 15min inactivity |
| **Vercel Hobby** | 100GB bandwidth | More than enough |
| **Groq Free** | 14,400 req/day | ~6,000 tokens/min on llama3-70b |

### Render cold start fix
Free Render services sleep after 15 min of inactivity. To prevent slow first loads, add a cron-based ping using [UptimeRobot](https://uptimerobot.com) (free):
1. Sign up at uptimerobot.com
2. Add monitor → HTTP → `https://neurobudget-backend.onrender.com/api/health`
3. Interval: **5 minutes**

This keeps your backend warm 24/7.

---

## 🆘 Troubleshooting

| Problem | Fix |
|---------|-----|
| `CORS error` in browser | Check `FRONTEND_URL` env var on Render matches your Vercel URL exactly |
| `MongoDB connection failed` | Check Atlas IP whitelist has `0.0.0.0/0` and connection string is correct |
| `401 Unauthorized` | JWT_SECRET mismatch — make sure it's set on Render |
| `Groq API error` | Check `GROQ_API_KEY` is set correctly on Render |
| Backend returns 404 | Check Root Directory is set to `backend` on Render |
| Vercel build fails | Check Root Directory is set to `frontend` on Vercel |
| Render spins down | Add UptimeRobot ping (see above) |

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] Atlas database user created
- [ ] Atlas IP whitelist set to `0.0.0.0/0`
- [ ] Atlas connection string copied
- [ ] Render service created with `backend` root dir
- [ ] All 6 env vars set on Render
- [ ] Render `/api/health` returns `{ "status": "ok" }`
- [ ] Vercel project created with `frontend` root dir
- [ ] `NEXT_PUBLIC_API_URL` set on Vercel
- [ ] Vercel frontend loads at `.vercel.app` URL
- [ ] `FRONTEND_URL` updated on Render with Vercel URL
- [ ] Can register, login, add transactions
- [ ] AI Assistant responds (Groq connected)
- [ ] UptimeRobot ping set up (optional but recommended)
