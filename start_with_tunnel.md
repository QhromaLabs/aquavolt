# Running M-Pesa on Localhost with Public Callback

## The Problem
M-Pesa needs to send payment confirmations to your server, but it can't reach `localhost:3001` from the internet.

## The Solution
Use **localtunnel** to create a public URL that forwards to your localhost.

## Steps:

### 1. Start your proxy server (Terminal 1)
```bash
npm run proxy
```
This runs on `http://localhost:3001`

### 2. Start localtunnel (Terminal 2)
```bash
npx localtunnel --port 3001
```

You'll get output like:
```
your url is: https://funny-cat-12.loca.lt
```

### 3. Update the callback URL in your code
Open `proxy-server.cjs` and change line 101 to use your tunnel URL:

```javascript
"CallBackURL": "https://funny-cat-12.loca.lt/api/mpesa/callback",
```

**Important:** Replace `funny-cat-12` with YOUR actual subdomain from step 2!

### 4. Restart the proxy server
Stop the proxy (Ctrl+C) and restart:
```bash
npm run proxy
```

### 5. Test M-Pesa STK Push
Now when you trigger a payment, M-Pesa can reach your localhost through the tunnel!

## Notes:
- The tunnel URL changes each time you restart localtunnel
- You'll need to update line 101 each time
- Keep both terminals running while testing
- First time visiting the URL in browser, click "Continue" on the localtunnel warning page

## Alternative: ngrok (More stable, requires signup)
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3001
```
Then use the ngrok URL in your callback.
