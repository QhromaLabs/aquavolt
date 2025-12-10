# 🚀 M-Pesa on Localhost - Quick Start Guide

## What You Need
1. ✅ Your production M-Pesa credentials (Consumer Key & Secret)
2. ⚠️ **Your production passkey** (different from sandbox!)
3. ✅ Localtunnel or ngrok (for public callback URL)

---

## 🎯 Quick Setup (3 Steps)

### Step 1: Update your `.env` file
Add these lines to your `.env` file:

```env
# M-Pesa Proxy Server Configuration
MPESA_KEY=Sk9iveI4ZAJ7PIbMyGgKLOozsd52xbCALmERpSzpif1V1gsd
MPESA_SECRET=K2qJMLSj8tgAeGXi6IpuW2ZEPUL72QoFvMXb7YQs6UoGBzbAQQqBtgo4Av83t3CL
MPESA_SHORTCODE=4214025
MPESA_PASSKEY=YOUR_PRODUCTION_PASSKEY_HERE  # ← REPLACE THIS!
MPESA_CALLBACK_URL=http://localhost:3001/api/mpesa/callback  # We'll update this in step 2
```

### Step 2: Get a public URL for callbacks

**Option A: Localtunnel (Easiest - No signup)**
```bash
# Terminal 1: Start proxy
npm run proxy

# Terminal 2: Start tunnel
npx localtunnel --port 3001
```

You'll get a URL like: `https://funny-cat-12.loca.lt`

**Option B: ngrok (More stable)**
```bash
# Install: https://ngrok.com/download
ngrok http 3001
```

You'll get a URL like: `https://abc123.ngrok.io`

### Step 3: Update callback URL in `.env`
Copy your tunnel URL and update `.env`:

```env
MPESA_CALLBACK_URL=https://funny-cat-12.loca.lt/api/mpesa/callback
```

**Then restart your proxy server!**

---

## 🎬 Automated Start (Windows)

Just double-click: **`start_mpesa_localhost.bat`**

This will:
- Start your proxy server
- Start localtunnel
- Show you instructions

---

## 🧪 Testing

1. Start your React app: `npm run dev`
2. Go to the Buy Token page
3. Enter amount and phone number
4. Click "Buy Token"
5. Check your phone for the STK push prompt!

**Watch the proxy terminal** - you'll see:
- `[Proxy] M-Pesa Request Received`
- `[Proxy] Initiating STK Push to 254...`
- `[M-Pesa Callback] Received at: ...` (when you complete payment)

---

## 🔍 Troubleshooting

### "merchant doesn't exist"
- ❌ Wrong passkey (you're using sandbox passkey with production credentials)
- ✅ Get your production passkey from Safaricom

### "Invalid Access Token"
- ❌ Wrong Consumer Key or Secret
- ✅ Double-check your credentials

### STK push works but no callback
- ❌ Tunnel URL not updated in `.env`
- ❌ Proxy server not restarted after updating `.env`
- ✅ Make sure `MPESA_CALLBACK_URL` in `.env` matches your tunnel URL

### Tunnel URL keeps changing
- This is normal with free localtunnel/ngrok
- Update `.env` each time you restart
- For production, use a permanent hosted URL (Railway, Heroku, etc.)

---

## 📝 Where to Find Your Production Passkey

1. **Email from Safaricom** - Check when they activated your account
2. **Developer Portal**: https://developer.safaricom.co.ke
   - Login → My Apps → Your App → Keys
   - Look for "Lipa Na M-Pesa Online Passkey"
3. **M-Pesa Business Portal**: https://org.ke.m-pesa.com
   - Go to your app settings

---

## ✅ Checklist Before Testing

- [ ] Production passkey added to `.env`
- [ ] Tunnel running (localtunnel or ngrok)
- [ ] `MPESA_CALLBACK_URL` updated with tunnel URL
- [ ] Proxy server restarted after `.env` changes
- [ ] React app running (`npm run dev`)
- [ ] Phone number is registered with M-Pesa

---

## 🎉 Success Looks Like

**In proxy terminal:**
```
[Proxy] M-Pesa Request Received
[Proxy] Initiating STK Push to 254712345678
[Proxy] M-Pesa Response: { ResponseCode: '0', ... }
[M-Pesa Callback] Received at: 2025-12-09T07:20:00.000Z
[M-Pesa Callback] Body: { ... ResultCode: 0 ... }
```

**On your phone:**
- STK push prompt appears
- Enter M-Pesa PIN
- Payment confirmation SMS

**In your app:**
- "STK Push Sent! Enter PIN" message
- Token appears after payment

---

Good luck! 🚀
