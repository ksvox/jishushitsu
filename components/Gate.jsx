import { useEffect, useState } from 'react';

// 門弟アプリの通行証を確認(?kspass=... で開かれた時はCookieに切り替える)
async function ensurePass() {
  const u = new URL(window.location.href);
  const p = u.searchParams.get('kspass');
  try {
    const r = await fetch('/api/pass' + (p ? '?kspass=' + encodeURIComponent(p) : ''), { cache: 'no-store' });
    const j = await r.json();
    if (p) {
      u.searchParams.delete('kspass');
      window.history.replaceState(window.history.state, '', u.pathname + u.search);
    }
    return j.ok;
  } catch {
    return null; // オフラインなどで確認できない時は開く
  }
}

export default function Gate({ children }) {
  const [state, setState] = useState('checking');

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
