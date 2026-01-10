-- Update Futurise API credentials to include endpoints configuration
-- This fixes the 404 "Application not found" error

UPDATE api_credentials
SET credentials = jsonb_set(
  credentials,
  '{endpoints}',
  '{
    "captcha": "/v1/captcha",
    "login": "/v1/login",
    "charge": "/v1/meter-recharge/recharge-token/0",
    "manage": "/v1/meter-recharge/meter-token/0"
  }'::jsonb
)
WHERE service_name = 'futurise';

-- Verify the update
SELECT service_name, credentials 
FROM api_credentials 
WHERE service_name = 'futurise';
