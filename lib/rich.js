import React from 'react';
// **強調** を <strong> に変換して表示
export function Rich({ text }) {
  const parts = String(text).split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <strong key={i} className="em">{p}</strong> : <React.Fragment key={i}>{p}</React.Fragment>))}
    </>
  );
}
