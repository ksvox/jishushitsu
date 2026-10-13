import { useEffect, useState } from 'react';

async function askPass(kspass, idToken) {
  const headers = idToken ? { Authorization: 'Bearer ' + idToken, 'X-Id-Token': idToken } : {};
  const r = await fetch('/api/pass' + (kspass ? '?kspass=' + encodeURIComponent(kspass) : ''), { cache: 'no-store', headers });
  return r.json();
}

// 門弟アプリの通行証 → Cookie → 管理者ログイン の順に確認する
async function ensurePass() {
  const u = new URL(window.location.href);
  const p = u.searchParams.get('kspass');
  try {
    const j = await askPass(p);
    if (p) {
      u.searchParams.delete('kspass');
      window.history.replaceState(window.history.state, '', u.pathname + u.search);
    }
    if (j.ok) return true;
    const { currentToken } = await import('../lib/client/fb');
    const t = await currentToken();
    if (!t) return false;
    return (await askPass(null, t)).ok;
  } catch {
    return null; // オフラインなどで確認できない時は開く
  }
}

function AdminLogin({ onDone }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setMsg('');
    try {
      const { login } = await import('../lib/client/fb');
      const t = await login(email.trim(), pw);
      const j = await askPass(null, t);
      if (j.ok) onDone();
      else setMsg('このアカウントは管理者ではありません。');
    } catch {
      setMsg('ログインできませんでした。メールアドレスとパスワードを確認してください。');
    }
    setBusy(false);
  };
  return (
    <div className="admin-login">
      <label>
        メールアドレス
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        パスワード
        <input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
      </label>
      {msg && <p className="admin-msg">{msg}</p>}
      <button className="btn btn-yellow" disabled={busy || !email || !pw} onClick={submit}>
        {busy ? '確認中…' : '管理者としてログイン'}
      </button>
    </div>
  );
}

export default function Gate({ children }) {
  const [state, setState] = useState('checking');
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    ensurePass().then((ok) => setState(ok === false ? 'locked' : 'ok'));
  }, []);

  if (state === 'ok') return children;

  return (
    <div className="app">
      <div className="board framed-page">
        <div className="wood-top" />
        <div className="lock-box">
          <div className="lock-title">音楽自習室</div>
          {state === 'checking' ? (
            <p>読み込み中…</p>
          ) : (
            <>
              <p>
                このアプリは門下生専用です。
                <br />
                門弟アプリの「音楽自習室」から開いてください。
              </p>
              <a className="btn btn-yellow" href="https://montei.ksvox.net">門弟アプリを開く</a>
              {showLogin ? (
                <AdminLogin onDone={() => setState('ok')} />
              ) : (
                <button className="admin-link" onClick={() => setShowLogin(true)}>管理者の方はこちら</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
