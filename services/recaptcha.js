// services/recaptcha.js — Google reCAPTCHA verification.
//
// NOTE on fidelity: the original doAdmission() verified the token but then forced
// `$responseData->success = 1`, i.e. the captcha was effectively bypassed. We keep
// that behaviour by default so the port matches. Set RECAPTCHA_STRICT=1 to actually
// enforce the Google verdict.
const axios = require('axios');

async function verify(token) {
  const strict = String(process.env.RECAPTCHA_STRICT || '') === '1';
  const secret = process.env.RECAPTCHA_SECRET || '';

  if (!strict) return true; // mirror the original (success forced to 1)

  if (!secret || !token) return false;
  try {
    const res = await axios.get('https://www.google.com/recaptcha/api/siteverify', {
      params: { secret, response: token },
    });
    return !!(res.data && res.data.success);
  } catch (err) {
    console.error('[recaptcha] verify failed:', err.message);
    return false;
  }
}

module.exports = { verify };
