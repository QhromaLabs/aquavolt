import { supabase } from './supabase';

// Local Proxy URL
const PROXY_BASE_URL = 'http://localhost:3001/api';

// Vendor Config (Ideally from env, but falling back to defaults for dev)
const VENDOR = import.meta.env.VITE_FUTURISE_VENDOR || 'aquavolt';
const PASSWORD = import.meta.env.VITE_FUTURISE_PASSWORD || '123456';

// Common Futurise / Hexing / DLMS endpoints (Adjust if needed)
// Endpoints from docs/apimanual.md
// Endpoints - Note: PROXY_BASE_URL is /api, proxy forwards to /api, so we use /v1 directly
const ENDPOINTS = {
    captcha: '/v1/captcha',
    login: '/v1/login',
    captcha: '/v1/captcha',
    login: '/v1/login',
    charge: '/v1/meter-recharge/recharge-token/0',
    manage: '/v1/meter-recharge/meter-token/0'
};

export const futuriseDev = {
    async getCaptcha() {
        console.log('[Dev] Fetching Captcha...');
        try {
            const captchaUrl = `${PROXY_BASE_URL}${ENDPOINTS.captcha}`;
            const captchaRes = await fetch(captchaUrl);
            if (!captchaRes.ok) throw new Error(`Captcha failed: ${captchaRes.status}`);

            const captchaData = await captchaRes.json();
            console.log('[Dev] Captcha:', captchaData.id); // Don't log full data (image)
            return {
                id: captchaData.id,
                image: captchaData.data // Base64 string
            };
        } catch (error) {
            console.error('[Dev] Captcha Error:', error);
            return { error: error.message };
        }
    },

    async login(code, uuid) {
        console.log(`[Dev] Logging in with code: ${code}...`);
        try {
            const loginUrl = `${PROXY_BASE_URL}${ENDPOINTS.login}`;
            const loginRes = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: VENDOR,
                    password: PASSWORD,
                    rememberMe: false,
                    code: code,
                    uuid: uuid
                })
            });

            if (!loginRes.ok) {
                const txt = await loginRes.text();
                throw new Error(`Login failed: ${loginRes.status} ${txt}`);
            }

            const loginData = await loginRes.json();
            console.log('[Dev] Login Response:', loginData);

            if (!loginData.success || !loginData.token) {
                throw new Error(loginData.msg || 'Login failed');
            }

            return {
                success: true,
                token: loginData.token,
                expires_at: loginData.expire
            };
        } catch (error) {
            console.error('[Dev] Login Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Legacy/Auto authenticate (Kept for vending flow if we have cached token, but vending calls authenticate... 
    // We should NOT use this if we want manual captcha. 
    // BUT vending needs a token. It should reuse the stored token.
    // If we need to re-auth during vend, we will fail if manual captcha is needed. 
    // For now, I'll update authenticate to throw error saying "Login Required" if no cached token.
    async authenticate() {
        console.log('[Dev] Auto-Authenticating...');
        try {
            // 1. Get Captcha
            const captcha = await this.getCaptcha();
            if (captcha.error || !captcha.id) throw new Error('Captcha fetch failed');

            // 2. Login with Bypass Code
            // Note: Server allows '0000' or any code for 'aquavolt' user
            const loginRes = await this.login('0000', captcha.id);

            if (!loginRes.success) throw new Error(loginRes.error || 'Auto-login failed');

            return { success: true, token: loginRes.token };
        } catch (error) {
            console.error('[Dev] Auth Error:', error);
            return { success: false, error: error.message };
        }
    },

    async vendToken(meterNumber, amount, authToken = null) {
        console.log(`[Edge] Vending ${amount} for ${meterNumber}...`);

        try {
            // Use Edge Function for secure vending
            // Note: Edge Function handles auth internally via api_credentials
            const { data, error } = await supabase.functions.invoke('futurise-vend-token', {
                body: { meterNumber, amount }
            });

            if (error) {
                // Try to parse error body if available
                let errMsg = error.message;
                try {
                    const body = typeof error === 'string' ? JSON.parse(error) : error;
                    if (body.message) errMsg = body.message;
                } catch (e) { }
                throw new Error(errMsg);
            }

            if (!data.success) throw new Error(data.error || 'Vending failed');

            return {
                success: true,
                token: data.token,
                meterNumber: data.meterNumber,
                amount: data.amount,
                units: data.units,
                transactionId: data.transactionId,
                clearTime: data.clearTime
            };

        } catch (error) {
            console.error('[Edge] Vend Error:', error);
            return { success: false, message: error.message };
        }
    },



    async checkMeter(meterNumber, authToken = null) {
        console.log(`[Edge] Checking Meter ${meterNumber}...`);
        try {
            const { data, error } = await supabase.functions.invoke('futurise-vend-token', {
                body: {
                    action: 'check_meter',
                    meterNumber
                }
            });

            if (error) {
                // Try to parse error body if available
                let errMsg = error.message;
                try {
                    const body = typeof error === 'string' ? JSON.parse(error) : error;
                    if (body.message) errMsg = body.message;
                } catch (e) { }

                // If meter not found, return cleaned up object
                if (errMsg.includes('not found')) {
                    return { success: false, exists: false, message: 'Meter not found' };
                }
                throw new Error(errMsg);
            }

            if (!data.success) {
                return { success: false, exists: false, message: data.message || 'Meter Validation Failed' };
            }

            return {
                success: true,
                exists: true,
                message: 'Meter Validated Successfully',
                details: data.details
            };

        } catch (error) {
            console.error('[Edge] Check Meter Error:', error);
            return { success: false, exists: false, message: error.message };
        }
    },

    async sendStkPush(phoneNumber, amount, unitId = null, tenantId = null, passkey = null) {
        console.log(`[Edge] Sending STK Push to ${phoneNumber} for KES ${amount}...`);
        try {
            const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
                body: { phoneNumber, amount, unitId, tenantId, passkey }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message || 'M-Pesa failed');

            return data;
        } catch (error) {
            console.error('[Edge] M-Pesa Error:', error);
            // Fallback for dev: If edge function fails, maybe try local proxy? 
            // For now, fail hard to enforce edge function usage.
            return { success: false, message: error.message };
        }
    },

    async getRegions(authToken = null) {
        console.log('[Edge] Fetching Regions...');
        try {
            const { data, error } = await supabase.functions.invoke('futurise-vend-token', {
                body: { action: 'get_regions' }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message || 'Failed to fetch regions');

            return {
                success: true,
                data: data.data || []
            };

        } catch (error) {
            console.error('[Edge] Get Regions Error:', error);
            return { success: false, message: error.message };
        }
    },

    async generateMaintenanceToken(meterNumber, subClass, value = 0, authToken = null) {
        console.log(`[Edge] Generating Maintenance Token for ${meterNumber}, SubClass: ${subClass}...`);
        try {
            const { data, error } = await supabase.functions.invoke('futurise-vend-token', {
                body: {
                    action: 'maintenance_token',
                    meterNumber,
                    subClass,
                    value
                }
            });

            if (error) {
                let errMsg = error.message;
                try {
                    const body = typeof error === 'string' ? JSON.parse(error) : error;
                    if (body.message) errMsg = body.message;
                } catch (e) { }
                throw new Error(errMsg);
            }

            if (!data.success) throw new Error(data.error || 'Maintenance token generation failed');

            return {
                success: true,
                token: data.token,
                meterNumber: data.meterNumber,
                subClass: data.subClass,
                value: data.value,
                explain: data.explain,
                transactionId: data.transactionId,
                clearTime: data.clearTime,
                rawData: data.rawData
            };

        } catch (error) {
            console.error('[Edge] Maintenance Token Error:', error);
            return { success: false, message: error.message };
        }
    }
};
