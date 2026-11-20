// Password gate for the whole portal.
// The password lives in the Vercel environment variable APP_PASSWORD (never in this file).
// A correct password sets a cookie holding a hash of the password, valid for 30 days.
// Changing APP_PASSWORD (and redeploying) logs everyone out.

const COOKIE = 'ar_auth';
const MAX_AGE = 60 * 60 * 24 * 30;

async function token(pw) {
  const data = new TextEncoder().encode('active-recall|' + pw);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(req, name) {
  const h = req.headers.get('cookie') || '';
  const m = h.split(/;\s*/).find(p => p.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
}

function loginPage(error) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Active Recall · Sign in</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;flex-direction:column;font-family:"Plus Jakarta Sans",system-ui,-apple-system,Segoe UI,sans-serif;background:#f6f4ef;color:#1f1d2b}
  .ribbon{background:#0f3c78;color:#fff;text-align:center;font-size:12px;font-weight:800;letter-spacing:.22em;padding:8px}
  .ribbon b{color:#f5b52e}
  main{flex:1;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{width:100%;max-width:400px;background:#fff;border:1px solid #e7e2d8;border-radius:22px;padding:36px 32px;box-shadow:0 10px 30px rgba(40,30,10,.06);text-align:center}
  h1{font-size:24px;margin:0 0 6px}
  p{margin:0 0 22px;color:#6b6776;font-size:15px}
  input{width:100%;font:inherit;font-size:17px;padding:13px 16px;border:1.5px solid #ddd6c8;border-radius:14px;outline:none}
  input:focus{border-color:#0f3c78}
  button{margin-top:14px;width:100%;font:inherit;font-size:16px;font-weight:800;padding:13px;border:0;border-radius:14px;background:#0f3c78;color:#fff;cursor:pointer}
  .err{margin:12px 0 0;color:#b3261e;font-size:14px;font-weight:600}
</style></head><body>
<div class="ribbon">✦ PRELIMS NAVIGATOR PROGRAM <b>2027</b> ✦</div>
<main><form class="card" method="POST" action="/__login">
  <h1>Active Recall</h1>
  <p>Enter the password to open the portal.</p>
  <input type="password" name="password" placeholder="Password" autofocus required autocomplete="current-password">
  <button type="submit">Open portal</button>
  ${error ? '<div class="err">Wrong password. Please try again.</div>' : ''}
</form></main></body></html>`;
}

function html(body, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });
}

export default async function middleware(request) {
  const password = process.env.APP_PASSWORD;
  if (!password) return html('<h1>Portal locked</h1><p>No password has been set.</p>', 503);

  const url = new URL(request.url);
  const good = await token(password);

  if (url.pathname === '/__logout') {
    return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });
  }

  if (url.pathname === '/__login') {
    if (request.method !== 'POST') return Response.redirect(new URL('/', url), 303);
    const form = await request.formData();
    const given = String(form.get('password') || '');
    if (given && (await token(given)) === good) {
      return new Response(null, {
        status: 303,
        headers: { Location: '/', 'Set-Cookie': `${COOKIE}=${good}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax` },
      });
    }
    return html(loginPage(true), 200);
  }

  if (readCookie(request, COOKIE) === good) return; // signed in: serve the site as normal

  // Not signed in: page requests get the password screen, everything else (data, images) is refused.
  const wantsPage = (request.headers.get('accept') || '').includes('text/html');
  return wantsPage ? html(loginPage(false), 200) : new Response('Password required', { status: 401, headers: { 'cache-control': 'no-store' } });
}
