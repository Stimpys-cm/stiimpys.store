/**
 * pages/api/upload.js
 * Sube una imagen a Cloudinary y devuelve la URL pública.
 * Portado de tu repo original, ahora protegido con el nuevo
 * requireAuth (JWT en cookie) en lugar del auth viejo.
 */

const crypto = require('crypto');
const { requireAuth } = require('../../lib/rbac/auth');

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { file } = req.body;
  if (!file) return res.status(400).json({ error: 'file requerido' });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'stiimpys-store';
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    return res.status(200).json({ url: data.secure_url, public_id: data.public_id });
  } catch (err) {
    console.error('[upload]', err);
    return res.status(500).json({ error: err.message });
  }
}

// Aumenta el límite de body para aceptar imágenes en base64
export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default requireAuth(handler);
