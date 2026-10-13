import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LEARN } from '../../components/LearnContent';
import { BackIcon } from '../../components/Icons';

export default function Learn() {
  const router = useRouter();
  const ch = Number(router.query.ch) || 1;
  const chapter = LEARN[ch] || LEARN[1];
  const [p, setP] = useState(0);

  useEffect(() => {
    setP(0);
  }, [ch]);
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, [p]);

  if (!router.isReady) return <div className="app board" style={{ minHeight: '100dvh' }} />;

  const page = chapter.pages[p];
  const Body = page.Body;
  const last = p === chapter.pages.length - 1;

  return (
    <div className="app">
      <div className="learn board">
        <div className="wood-top" />
        <div className="framed" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="bhead-row">
            <Link href="/" className="back" aria-label="トップへ戻る">
              <BackIcon />
            </Link>
            <div className="bhead-titles">
              <div className="bhead-sub">{chapter.badge} {chapter.name} ・ 覚える</div>
              <h1 className="bhead-title" style={{ margin: 0 }}>{page.title}</h1>
            </div>
            <div style={{ fontSize: 15, color: '#C9D6CC', paddingRight: 6, flexShrink: 0 }}>
              {p + 1} / {chapter.pages.length}
            </div>
          </div>
          <div className="dots" aria-hidden="true">
            {chapter.pages.map((_, i) => (
              <span key={i} className={i <= p ? 'on' : ''} />
            ))}
          </div>
          <div className="learn-body">
            <span className={`learn-tag ${page.tag === '暗記' ? 'memo' : ''}`}>{page.tag}</span>
            <Body />
          </div>
        </div>
        <nav className="tray">
          {p === 0 ? (
            <Link href="/" className="btn btn-wood">トップへ</Link>
          ) : (
            <button className="btn btn-wood" onClick={() => setP(p - 1)}>もどる</button>
          )}
          {last ? (
            <Link href={`/practice/${ch}`} className="btn btn-yellow">練習へ</Link>
          ) : (
            <button className="btn btn-yellow" onClick={() => setP(p + 1)}>次へ</button>
          )}
        </nav>
      </div>
    </div>
  );
}
