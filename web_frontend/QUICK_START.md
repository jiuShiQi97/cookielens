# 🚀 Quick Start Guide

## Step 1: Start the Backend (if not already running)

Open a terminal and run:

```bash
cd /Users/lizhuolun/cursor/cookielens/backend
python app.py
```

You should see: `Uvicorn running on http://0.0.0.0:8000`

---

## Step 2: Install Frontend Dependencies

Open a **new terminal** and run:

```bash
cd /Users/lizhuolun/cursor/cookielens/web_frontend
npm install
```

Wait for dependencies to install (~1-2 minutes)

---

## Step 3: Start the Frontend

```bash
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:3000/
```

---

## Step 4: Open the App

Open your browser and go to:

**http://localhost:3000**

---

## Step 5: Test the Scanner

1. Enter a URL (example: `https://www.yami.com/en`)
2. Click **"🔍 Scan Website"**
3. Wait 30-90 seconds
4. View the results!

---

## 📸 What You Should See

### Input Screen
- Clean white card with URL input field
- Purple gradient background
- "🍪 CookieLens" header

### Results Screen
- **Scan Summary**: Number of cookies and third-party domains
- **AI Analysis**: Risk level and recommendations
- **Compliance Analysis** (click to expand): GDPR/CCPA scores

---

## 🐛 Troubleshooting

### "Failed to scan website"
- ✅ Check backend is running on port 8000
- ✅ Try: `curl http://localhost:8000/` (should return `{"status":"ok"}`)

### "Cannot GET /"
- ✅ Frontend not started - run `npm run dev`

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

### Dependencies Error
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Example Test Cases

### Test 1: E-commerce Site
**URL**: `https://www.yami.com/en`  
**Expected**: 29 cookies, 30 third-parties, Medium risk

### Test 2: News Site
**URL**: `https://www.cnn.com`  
**Expected**: Many advertising trackers

### Test 3: Simple Site
**URL**: `https://example.com`  
**Expected**: Few/no cookies

---

## 💡 Tips

- **Scan time varies**: 30-90 seconds depending on website complexity
- **Compliance section starts collapsed**: Click to expand
- **Real-time data**: Each scan queries the live website
- **Third-party limit**: UI shows first 10, full list in response

---

## 🎨 UI Features

### Color Coding
- 🟢 Green = Compliant (≥80%)
- 🟡 Yellow = Needs Improvement (60-79%)
- 🔴 Red = Non-Compliant (<60%)

### Interactive Elements
- Collapsible compliance section
- Responsive grid layouts
- Smooth animations
- Loading spinner during scan

---

## 📝 Next Steps

Want to customize the frontend?

1. **Change colors**: Edit `src/App.css`
2. **Add features**: Modify `src/App.jsx`
3. **Backend URL**: Update API endpoint in `App.jsx` line 23

---

**🎉 You're all set! Happy scanning!**

