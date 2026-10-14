import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BackIcon } from '../components/Icons';
import { isEarned, loadCert, saveCert, drawCertificate, canvasToBlob } from '../lib/certificate';

export default function Certificate() {
  const [state, setState] = useState('loading'); // loading | locked | name | show
  const [cert, setCert] = useState(null);
  const [name, setName] = useState('');
  const [img, setImg] = useState('');
  const [msg, setMsg] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = loadCert();
    if (c) {
      setCert(c);
      setName(c.name);
      setState('show');
    } else if (isEarned()) setState('name');
    else setState('locked');
  }, []);

  useEffect(() => {
    if (state !== 'show' || !cert || !canvasRef.current) return;
    drawCertificate(canvasRef.current, cert).then((cv) => setImg(cv.toDataURL('image/png')));
  }, [state, cert]);

  const issue = () => {
    const n = name.trim();
    if (!n) return;
    setCert(saveCert(n));
    setImg('');
    setState('show');
  };

  const fileName = '楽典マスター認定証.png';

  const download = () => {
    const a = document.createElement('a');
    a.href = img;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMsg('保存できない時は、認定証の画像を長押しして「画像を保存」を選んでください。');
  };

  const share = async () => {
    setMsg('');
    try {
      const blob = await canvasToBlob(canvasRef.current);
      const file = new File([blob], fileName, { type: 'image/png' });
      const text = "ボーカル道場K's VOXの「楽典マスター」に認定されました! #KsVOX #楽典マスター";
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else {
        download();
        setMsg('この端末ではそのまま送れないため、画像を保存しました。SNSのアプリから画像を選んで投稿してください。');
      }
    } catch (e) {
      if (e && e.name !== 'AbortError') setMsg('送れませんでした。画像を保存してから、SNSのアプリで投稿してください。');
    }
  };

  return (
    <div className="app">
      <header className="board bhead">
        <div className="wood-top" />
        <div className="bhead-row">
          <Link href="/" className="back" aria-label="トップへ戻る">
            <BackIcon />
          </Link>
          <div className="bhead-titles">
            <div className="bhead-sub">音楽自習室</div>
            <div className="bhead-title">🏅 楽典マスター認定証</div>
          </div>
        </div>
      </header>

      <main className="paper q-area">
        {state === 'loading' && <p>読み込み中…</p>}

        {state === 'locked' && (
          <div className="cert-lock">
            <p style={{ fontSize: 40, margin: 0 }}>🔒</p>
            <p>上級編「耳コピ」の上級で8割以上正解すると、ここで認定証を受け取れます。</p>
            <Link href="/mid/ear?level=advanced" className="btn btn-ink">耳コピ(上級)に挑戦する</Link>
          </div>
        )}

        {state === 'name' && (
          <div className="cert-name">
            <p className="cert-congrats">おめでとうございます!</p>
            <p>上級の耳コピを見事にクリアしました。認定証に載せるお名前を入力してください。</p>
            <label className="cert-label">
              お名前
              <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="例:大声 歌子" />
            </label>
            <button className="btn btn-red" disabled={!name.trim()} onClick={issue}>認定証を受け取る</button>
          </div>
        )}

        {state === 'show' && (
          <>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {img ? (
              <img src={img} alt={`${cert.name}さんの楽典マスター認定証`} className="cert-img" />
            ) : (
              <p>認定証を作成中…</p>
            )}
            <div className="grid2">
              <button className="btn btn-line" disabled={!img} onClick={download}>画像を保存</button>
              <button className="btn btn-ink" disabled={!img} onClick={share}>SNSで送る</button>
            </div>
            {msg && <p className="q-sub" style={{ margin: 0 }}>{msg}</p>}
            <button className="hint-link" onClick={() => setState('name')}>名前を直す</button>
          </>
        )}
      </main>
      <footer className="footer">© ボーカル道場K's VOX</footer>
    </div>
  );
}
