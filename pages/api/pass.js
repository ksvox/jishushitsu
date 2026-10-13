import { verifyMonteiPass, issueCookie, cookieOk } from '../../lib/pass';

// 門弟アプリから ?kspass=... 付きで開かれた時、または開くたびに呼ばれる
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const token = req.query.kspass;
    if (token && verifyMonteiPass(token)) {
      issueCookie(res);
      return res.json({ ok: true });
    }
    return res.json({ ok: cookieOk(req) });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
