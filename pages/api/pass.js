import { verifyMonteiPass, issueCookie, cookieOk } from '../../lib/pass';
import { isAdmin } from '../../lib/adminCheck';

// 門弟アプリから ?kspass=... 付きで開かれた時、または開くたびに呼ばれる
// 管理者(info@ksvox.net)としてログイン中なら、通行証がなくても開ける
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const token = req.query.kspass;
    if (token && verifyMonteiPass(token)) {
      issueCookie(res);
      return res.json({ ok: true });
    }
    if (cookieOk(req)) return res.json({ ok: true });
    if (await isAdmin(req)) return res.json({ ok: true, admin: true });
    return res.json({ ok: false });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
