// 門弟アプリの「通行証」を確かめ、12時間有効の門下生モード(Cookie)にする
// (SingFlex・Showcaseと同じ形式「接頭辞.期限(秒).署名」/ 環境変数 KS_APP_PASS_SECRET を共用)
import crypto from 'crypto';

const SECRET = () => process.env.KS_APP_PASS_SECRET || '';
const COOKIE = 'jsr_stu';
const HOURS = 12;

const sign = (text) => crypto.createHmac('sha256', SECRET()).update(text).digest('base64url');
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

function check(token, prefix) {
  const [p, exp, sig] = String(token || '').split('.');
  if (p !== prefix || !exp || !sig || !SECRET()) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  try {
    return same(sig, sign(`${p}.${exp}`));
  } catch {
    return false;
  }
}

// 門弟アプリが発行した通行証(5分間有効)
export const verifyMonteiPass = (pass) => check(pass, 'p');

export function issueCookie(res) {
  const exp = Math.floor(Date.now() / 1000) + HOURS * 3600;
  res.setHeader('Set-Cookie', `${COOKIE}=s.${exp}.${sign(`s.${exp}`)}; Path=/; Max-Age=${HOURS * 3600}; HttpOnly; Secure; SameSite=Lax`);
}

export function cookieOk(req) {
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)jsr_stu=([^;]+)/);
  return m ? check(decodeURIComponent(m[1]), 's') : false;
}
