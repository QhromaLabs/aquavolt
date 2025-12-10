import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const { data: creds, error: credsError } = await supabaseClient
            .from('api_credentials')
            .select('credentials')
            .eq('service_name', 'futurise')
            .single()

        if (credsError) throw new Error('Failed to fetch Futurise credentials')

        // Handle different actions
        // 1. Get Captcha (GET) or (POST action='get_captcha')
        // 2. Login (POST action='login')
        // 3. Store Token (POST action='store_token') - [NEW]

        let action = 'get_captcha' // Default
        let body: any = {}

        if (req.method === 'POST') {
            try {
                body = await req.json()
                action = body.action || 'login' // Default to login if no action specified for backward compatibility

                // If body has username/password/code but no action, it's a login
                if (body.code && body.uuid && !body.action) {
                    action = 'login'
                }
            } catch (e) {
                // If parsing fails but it's a POST, might be empty, treat as default? 
                // Actually if it's POST we expect a body usually.
                // But legacy might treat GET as get_captcha
            }
        } else if (req.method === 'GET') {
            action = 'get_captcha'
        }


        const { base_url, vendor, password, endpoints } = creds.credentials


        // --- ACTION: STORE TOKEN ---
        if (action === 'store_token') {
            console.log('Action: Store Token')
            const { token, expires_at } = body

            if (!token || !expires_at) {
                throw new Error('Missing token or expires_at')
            }

            // Verify user is admin (optional but recommended, currently relying on simple RLS or Anon key calls)
            // For now, we trust the caller has the Anon key. 
            // In PROD, we should check req.headers.authorization matches a real user who is admin.

            await supabaseClient
                .from('api_credentials')
                .update({
                    credentials: {
                        ...creds.credentials,
                        token: token,
                        token_expires_at: expires_at,
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('service_name', 'futurise')

            await supabaseClient.from('futurise_sync_log').insert({
                sync_type: 'token_store',
                status: 'success',
                items_synced: 1,
                response_data: { expires_at },
            })

            return new Response(
                JSON.stringify({ success: true, message: 'Token stored successfully' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }


        // --- ACTION: GET CAPTCHA ---
        if (action === 'get_captcha') {
            console.log('Attempting to fetch captcha from:', `${base_url}${endpoints.captcha}`)

            const captchaResponse = await fetch(`${base_url}${endpoints.captcha}`, {
                method: 'GET',
                // @ts-ignore - Deno specific option
                ...(base_url.startsWith('https://') && base_url.includes('47.90.150.122') ? {
                    agent: false
                } : {})
            })

            if (!captchaResponse.ok) {
                const errorText = await captchaResponse.text()
                throw new Error(`Failed to get captcha: ${captchaResponse.status} - ${errorText}`)
            }

            const captchaData = await captchaResponse.json()
            return new Response(
                JSON.stringify(captchaData),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }


        // --- ACTION: LOGIN ---
        if (action === 'login') {
            console.log('Attempting login...')
            const { code: captchaCode, uuid } = body

            // Use provided creds or defaults
            // Actually commonly we use defaults from DB

            const loginResponse = await fetch(`${base_url}${endpoints.login}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: vendor,
                    password: password,
                    rememberMe: false,
                    code: captchaCode,
                    uuid: uuid,
                }),
            })

            if (!loginResponse.ok) {
                const errorText = await loginResponse.text()
                throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`)
            }

            const loginData = await loginResponse.json()

            if (!loginData.success || !loginData.token) {
                throw new Error('Login unsuccessful: ' + (loginData.msg || 'Unknown error'))
            }

            const expiresAt = new Date(loginData.expire).toISOString()

            // Update credentials
            await supabaseClient
                .from('api_credentials')
                .update({
                    credentials: {
                        ...creds.credentials,
                        token: loginData.token,
                        token_expires_at: expiresAt,
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('service_name', 'futurise')

            await supabaseClient.from('futurise_sync_log').insert({
                sync_type: 'auth',
                status: 'success',
                items_synced: 1,
                response_data: { expires_at: expiresAt },
            })

            return new Response(
                JSON.stringify({
                    success: true,
                    token: loginData.token,
                    expires_at: expiresAt,
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }


        // --- ACTION: GET STATUS (NEW) ---
        if (action === 'get_status') {
            const { token, token_expires_at } = creds.credentials

            const now = new Date()
            const expires = token_expires_at ? new Date(token_expires_at) : null
            const isValid = token && expires && expires > now

            return new Response(
                JSON.stringify({
                    success: true,
                    active: isValid,
                    expires_at: token_expires_at,
                    message: isValid ? 'Active session found' : 'No active session'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }


        // --- ACTION: GET TOKEN (INTERNAL) ---
        if (action === 'get_token') {
            const { token, token_expires_at } = creds.credentials

            const now = new Date()
            const expires = token_expires_at ? new Date(token_expires_at) : null
            const isValid = token && expires && expires > now

            if (!isValid) {
                return new Response(
                    JSON.stringify({ success: false, message: 'No valid token found' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    token: token,
                    expires_at: token_expires_at
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        throw new Error(`Unknown action: ${action}`)

    } catch (error) {
        console.error('Futurise auth error:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
