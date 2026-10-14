// 認定証(上級の耳コピで8割以上正解した人だけ)
const EARNED = 'jsr_cert_earned';
const CERT = 'jsr_cert';

export const PASS_RATE = 0.8;

function safeGet(k) {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null');
  } catch {
    return null;
  }
}
function safeSet(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* 保存できなくても続ける */
  }
}

export const markEarned = () => {
  if (!safeGet(EARNED)) safeSet(EARNED, { at: Date.now() });
};
export const isEarned = () => !!safeGet(EARNED);
export const loadCert = () => safeGet(CERT);
export const saveCert = (name) => {
  const d = new Date();
  const prev = safeGet(CERT);
  // 名前を直しても、最初に受け取った日付はそのまま
  const cert = { name, date: (prev && prev.date) || `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日` };
  safeSet(CERT, cert);
  return cert;
};

/* ===== 賞状を描く(1080×1350、SNSに載せやすい縦長) ===== */
const W = 1080;
const H = 1350;
const GOLD = '#B08A3E';
const GOLD_L = '#D9BF7A';
const INK = '#2A2118';
const RED = '#B9301E';
const MINCHO = "'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif";

function center(ctx, text, y, size, weight = 700, color = INK, spacing = 0) {
  ctx.font = `${weight} ${size}px ${MINCHO}`;
  ctx.fillStyle = color;
  if (!spacing) {
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, y);
    return;
  }
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = W / 2 - total / 2;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
}

function corner(ctx, x, y, sx, sy) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 90);
  ctx.bezierCurveTo(0, 30, 30, 0, 90, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(18, 70);
  ctx.bezierCurveTo(22, 40, 40, 22, 70, 18);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(28, 28, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 朱色の落款(角印)
function seal(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.05);
  const s = 150;
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = RED;
  ctx.lineWidth = 7;
  ctx.strokeRect(-s / 2, -s / 2, s, s);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-s / 2 + 10, -s / 2 + 10, s - 20, s - 20);
  ctx.fillStyle = RED;
  ctx.textAlign = 'center';
  ctx.font = `800 40px ${MINCHO}`;
  ctx.fillText("K's", 0, -14);
  ctx.fillText('VOX', 0, 30);
  ctx.font = `800 17px ${MINCHO}`;
  ctx.fillText('公 認', 0, 58);
  ctx.restore();
}

// 金のメダル
function medal(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(-26, 20); ctx.lineTo(-44, 90); ctx.lineTo(-22, 78); ctx.lineTo(-8, 98); ctx.lineTo(4, 26); ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(26, 20); ctx.lineTo(44, 90); ctx.lineTo(22, 78); ctx.lineTo(8, 98); ctx.lineTo(-4, 26); ctx.closePath();
  ctx.fill();
  const g = ctx.createRadialGradient(-12, -14, 6, 0, 0, 52);
  g.addColorStop(0, '#FFF1B8');
  g.addColorStop(0.55, GOLD_L);
  g.addColorStop(1, GOLD);
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r = i % 2 ? 46 : 52;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8A6A2A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#6B4F17';
  ctx.font = "44px 'Noto Music', serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('𝄞', 0, 2);
  ctx.restore();
}

export async function drawCertificate(canvas, { name, date }) {
  try {
    await Promise.all([
      document.fonts.load(`700 40px 'Shippori Mincho'`),
      document.fonts.load(`800 40px 'Shippori Mincho'`),
      document.fonts.load(`40px 'Noto Music'`),
    ]);
  } catch {
    /* フォントが読めなくても描く */
  }
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 紙
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#FBF6E9');
  bg.addColorStop(1, '#F3EAD3');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 縁取り(太い金+細い金)
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 14;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(66, 66, W - 132, H - 132);
  ctx.strokeStyle = GOLD_L;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(78, 78, W - 156, H - 156);
  corner(ctx, 92, 92, 1, 1);
  corner(ctx, W - 92, 92, -1, 1);
  corner(ctx, 92, H - 92, 1, -1);
  corner(ctx, W - 92, H - 92, -1, -1);

  ctx.textBaseline = 'alphabetic';
  // 見出し
  center(ctx, "Vocal Dojo K's VOX", 170, 26, 700, GOLD, 4);
  center(ctx, '認 定 証', 290, 104, 800, INK, 10);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 330); ctx.lineTo(W - 300, 330);
  ctx.stroke();

  medal(ctx, W / 2, 420);

  // 名前
  const nm = (name || '').trim();
  let size = 64;
  ctx.font = `800 ${size}px ${MINCHO}`;
  while (ctx.measureText(`${nm} 殿`).width > W - 300 && size > 30) {
    size -= 2;
    ctx.font = `800 ${size}px ${MINCHO}`;
  }
  center(ctx, `${nm} 殿`, 620, size, 800, INK);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(220, 645); ctx.lineTo(W - 220, 645);
  ctx.stroke();

  // 本文
  const body = [
    'あなたは、ボーカルに必要な楽典を',
    '見事に修得されました。',
    'よってここに、K\'s VOX公認',
  ];
  body.forEach((t, i) => center(ctx, t, 730 + i * 64, 42, 700, INK, 2));
  center(ctx, '「楽典マスター」', 730 + 3 * 64 + 10, 54, 800, RED, 4);
  center(ctx, 'の称号を授与します。', 730 + 4 * 64 + 20, 42, 700, INK, 2);

  // 日付・発行者
  ctx.textAlign = 'left';
  ctx.font = `700 32px ${MINCHO}`;
  ctx.fillStyle = INK;
  ctx.fillText(date, 150, 1115);
  ctx.textAlign = 'right';
  ctx.font = `700 30px ${MINCHO}`;
  ctx.fillText("ボーカル道場K's VOX", W - 270, 1085);
  ctx.font = `800 36px ${MINCHO}`;
  ctx.fillText('主宰  NOBU', W - 270, 1140);
  seal(ctx, W - 185, 1095);

  center(ctx, '音楽自習室', H - 105, 22, 700, GOLD, 6);
  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
}
