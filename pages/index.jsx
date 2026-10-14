import Link from 'next/link';
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
];

export default function Home() {
  return (
    <div className="app">
      <header className="board">
        <div className="wood-top" />
        <div className="top-head">
          <div className="top-school">ボーカル道場 K's VOX</div>
          <div className="top-title-row">
            <h1 className="top-title">音楽自習室</h1>
            <span className="top-tag">初級編</span>
          </div>
          <p className="top-subtitle">〜 度数から調号まで 〜</p>
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
        {CHAPTERS.map((c) => (
          <section className="chapter" key={c.no}>
            <div className="chapter-head">
              <span className="chapter-badge">{c.badge}</span>
              <h2 className="chapter-name" style={{ margin: 0 }}>{c.name}</h2>
            </div>
            <p className="chapter-desc">{c.desc}</p>
            <div className="chapter-btns">
              <Link href={`/learn/${c.no}`} className="btn btn-line">覚える</Link>
              <Link href={`/practice/${c.no}`} className="btn btn-line">練習</Link>
              <Link href={`/practice/${c.no}?mode=test`} className="btn btn-ink">実力テスト</Link>
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
        <section className="mid-row">
          <div className="mid-name"><small>STEP5</small>耳コピ</div>
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
