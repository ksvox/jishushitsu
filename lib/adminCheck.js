// 管理者(門弟アプリと同じ info@ksvox.net)としてログイン中かを確かめる
// ログインの証明(IDトークン)の確認だけなので、秘密鍵などの環境変数は不要
import admin from 'firebase-admin';

const PROJECT_ID = 'ksvox-montei';

function auth() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  return admin.auth();
}

export async function isAdmin(req) {
  const h = req.headers.authorization || '';
  const token = (h.startsWith('Bearer ') ? h.slice(7) : '') || req.headers['x-id-token'] || '';
  if (!token) return false;
  try {
    const t = await auth().verifyIdToken(String(token));
    const email = (t.email || '').toLowerCase();
    return email === (process.env.ADMIN_EMAIL || 'info@ksvox.net').toLowerCase();
  } catch {
    return false;
  }
}
