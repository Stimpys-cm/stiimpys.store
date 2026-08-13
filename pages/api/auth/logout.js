/**
 * pages/api/auth/logout.js
 */

const { serialize } = require('cookie');
const { TOKEN_COOKIE_NAME } = require('../../../lib/rbac/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader(
    'Set-Cookie',
    serialize(TOKEN_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  );

  return res.status(200).json({ ok: true });
}
