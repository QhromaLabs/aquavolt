import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        let { username, apiKey } = await req.json()

        if (!username || !apiKey) {
            throw new Error('Username and API Key are required')
        }

        username = username.trim()
        apiKey = apiKey.trim()

        console.log(`Verifying credentials for user: ${username}`)

        // Determine environment URL
        const isSandbox = username.toLowerCase() === 'sandbox'
        const baseUrl = isSandbox
            ? `https://api.sandbox.africastalking.com/version1`
            : `https://api.africastalking.com/version1`

        const messagingUrl = `${baseUrl}/messaging`

        // Attempt to send a test SMS to verify credentials
        const testMessage = 'This is a test message to verify Africa\'s Talking credentials.'
        const testRecipient = '+254711111111' // A dummy number for verification purposes

        const res = await fetch(messagingUrl, {
            method: 'POST',
            headers: {
                'apiKey': apiKey,
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                username: username,
                to: testRecipient,
                message: testMessage
            }).toString()
        })

        const responseText = await res.text()
        console.log('AT Raw Response:', responseText)
        console.log(`AT Status: ${res.status} ${res.statusText}`)

        let data
        try {
            data = JSON.parse(responseText)
        } catch (parseError) {
            console.error('Failed to parse AT response as JSON:', parseError)
            return new Response(
                JSON.stringify({
                    success: false,
                    message: `Invalid response from Africa's Talking API. Got HTML instead of JSON. This usually means authentication failed.`,
                    details: {
                        status: res.status,
                        rawResponse: responseText.substring(0, 200) // First 200 chars
                    }
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                }
            )
        }

        if (!res.ok) {
            // Africa's Talking usually returns 401 or 403 for bad credentials
            console.error('AT Verification Failed:', data)
            console.log(`AT Status: ${res.status} ${res.statusText}`)

            let errorMsg = data.message || 'Invalid Credentials or API Error';

            // Add diagnostic info based on common AT errors
            if (res.status === 401) errorMsg = `Authentication Failed (401). Check API Key for username: ${username}`;
            if (res.status === 404) errorMsg = `User/App Not Found (404). Check Username: ${username}`;
            if (res.status === 403) errorMsg = `Access Forbidden (403). Check IP Allowlist or App Balance.`;
            if (res.status === 400 && data.SMSMessageData && data.SMSMessageData.Recipients && data.SMSMessageData.Recipients[0] && data.SMSMessageData.Recipients[0].status === 'InvalidPhoneNumber') {
                // This specific error means the API key and username are likely valid, but the test number is invalid.
                // We can treat this as a success for credential verification.
                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'Credentials Verified Successfully (Test SMS failed due to invalid recipient, but API key and username are valid).',
                        details: {
                            status: res.status,
                            statusText: res.statusText,
                            resolvedUsername: username,
                            environment: isSandbox ? 'Sandbox' : 'Production',
                            atResponse: data
                        }
                    }),
                    {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200
                    }
                )
            }

            return new Response(
                JSON.stringify({
                    success: false,
                    message: errorMsg,
                    details: {
                        status: res.status,
                        statusText: res.statusText,
                        resolvedUsername: username,
                        environment: isSandbox ? 'Sandbox' : 'Production',
                        atResponse: data
                    }
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                }
            )
        }

        // If the response is OK, it means the credentials are valid enough to make an API call.
        // We can check the SMSMessageData for more details, but a 200 OK generally implies success.
        if (data.SMSMessageData && data.SMSMessageData.Recipients) {
            const recipientStatus = data.SMSMessageData.Recipients[0]?.status;
            const cost = data.SMSMessageData.Recipients[0]?.cost;

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Credentials Verified Successfully via Test SMS',
                    details: {
                        resolvedUsername: username,
                        environment: isSandbox ? 'Sandbox' : 'Production',
                        testSmsStatus: recipientStatus,
                        testSmsCost: cost,
                        atResponse: data
                    }
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                }
            )
        } else {
            return new Response(
                JSON.stringify({ success: false, message: 'Unexpected response from Africa\'s Talking messaging API' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

    } catch (error) {
        console.error('Verification Error:', error)
        return new Response(
            JSON.stringify({ success: false, message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
