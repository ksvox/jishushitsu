import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isEarned, loadCert } from '../lib/certificate';
import { ClockIcon } from '../components/Icons';

const MID = [
  { no: 1, name: 'トライアド' },
  { no: 2, name: 'ダイアトニック' },
  { no: 3, name: 'ダイアトニックセブンス' },
  { no: 4, name: 'コード' },
];

const CHAPTERS = [
  { no: 1, badge: '第一章', name: '度数', desc: '2つの音の距離を、名前で言えるように' },
  { no: 2, badge: '第二章', name: '調号', desc: 'キーと#・♭の関係が、一瞬でわかるように' },
  { no: 3, badge: '第三章', name: '進行記号', desc: '譜面のどこへ進むのか、迷わず追えるように', practice: '/roadmap', noTest: true },
];

export default function Home() {
  const [cert, setCert] = useState(false);
  useEffect(() => {
    setCert(!!loadCert() || isEarned());
  }, []);
  return (
    <div className="app">
      <header className="board">
        <div className="wood-top" />
        <div className="top-head">
          <div className="top-school" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>ボーカル道場 K's VOX</span>
            {cert && <Link href="/certificate" className="cert-badge">🏅 認定証</Link>}
          </div>
          <div className="top-title-row">
            <h1 className="top-title">音楽自習室</h1>
          </div>
          <p className="top-subtitle">〜 ボーカルに必要な楽典基礎 〜</p>
          <p className="top-lead">
            楽なところは暗記。
            <br />
            忘れても、理屈で答えを導けるよ。
          </p>
          <svg aria-hidden="true" width="150" height="14" viewBox="0 0 150 14">
            <path d="M2 8 C30 3 60 12 90 6 C110 3 130 9 148 5" fill="none" stroke="#F59A8B" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </header>

      <main className="menu paper">
        <div className="mid-head" style={{ marginTop: 0 }}>
          <span className="chapter-badge">初級編</span>
          <span className="mid-note">覚える → 練習 → 実力テスト</span>
        </div>
        {CHAPTERS.map((c) => (
          <section className="chapter" key={c.no}>
            <div className="chapter-head">
              <span className="chapter-badge">{c.badge}</span>
              <h2 className="chapter-name" style={{ margin: 0 }}>{c.name}</h2>
            </div>
            <p className="chapter-desc">{c.desc}</p>
            <div className="chapter-btns" style={c.noTest ? { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } : undefined}>
              <Link href={`/learn/${c.no}`} className="btn btn-line">覚える</Link>
              <Link href={c.practice || `/practice/${c.no}`} className={`btn ${c.noTest ? 'btn-ink' : 'btn-line'}`}>練習</Link>
              {!c.noTest && <Link href={`/practice/${c.no}?mode=test`} className="btn btn-ink">実力テスト</Link>}
            </div>
          </section>
        ))}
        <div className="goal">
          <ClockIcon />
          <span>
            <strong>度数の目標:1問20秒以内</strong>(正門下生レベル)
          </span>
        </div>

        <div className="mid-head">
          <span className="chapter-badge">中級編</span>
          <span className="mid-note">練習問題のみ(先輩の指導を受けてから)</span>
        </div>
        {MID.map((m) => (
          <section className="mid-row" key={m.no}>
            <div className="mid-name"><small>STEP{m.no}</small>{m.name}</div>
            <div className="mid-btns">
              <Link href={`/mid/${m.no}`} className="btn btn-line">練習</Link>
              <Link href={`/mid/${m.no}?mode=test`} className="btn btn-ink">実力テスト</Link>
            </div>
          </section>
        ))}
        <div className="mid-head">
          <span className="chapter-badge">上級編</span>
          <span className="mid-note">自動で作られる曲のコードを聞き取る</span>
        </div>
        <section className="mid-row">
          <div className="mid-name">耳コピ</div>
          <div className="mid-btns three">
            <Link href="/mid/ear?level=beginner" className="btn btn-line">初級</Link>
            <Link href="/mid/ear?level=intermediate" className="btn btn-line">中級</Link>
            <Link href="/mid/ear?level=advanced" className="btn btn-line">上級</Link>
          </div>
        </section>
      </main>
      <footer className="footer">© ボーカル道場K's VOX</footer>
    </div>
  );
}
