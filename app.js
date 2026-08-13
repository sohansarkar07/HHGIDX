/* ============================================================
   HH GOA 2026 – Builder ID Card Generator
   app.js  —  complete implementation
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */
const TITLES = [
  'Midnight Innovator','Sunset Shipper','Coconut Coder','Feni Hacker',
  'Wave Rider Builder','Coastal Architect','Blockchain Beachcomber',
  'Palm Tree Programmer','Goa Protocol Dev','Seabreeze Engineer',
  'Monsoon Maker','Lazy River Launcher','Tidal Force Dev',
  'Spice Trail Shipper','Arabian Sea Builder','Barefoot Founder',
  'Jungle Stack Dev','Lighthouse Coder','Zero-to-One Builder',
  'Palolem Hacker','Vagator Visionary',
];

/* Download canvas size — match template 910×1398 at 1.5× */
const DL_W = 1365, DL_H = 2427;

/* ─── Overlay positions as % of canvas (1365x2427px total) ───
   Cream card body starts ~38% from top.
   QR is on the RIGHT column (60–86%), text on LEFT (17–57%).
   At 2427px height: 70%=1699px, 75%=1820px, 80%=1942px, 85%=2063px,
                     88%=2136px, 91%=2209px, 96%=2330px
*/
const PCT = {
  photo:  { l: 27,   t: 43,   w: 50,   h: 25   },  // ends at 68%
  name:   { l: 17,   t: 76   },  // moved down to clear photo bottom
  team:   { l: 17,   t: 79   },
  titleL: { l: 17,   t: 82   },
  titleV: { l: 17,   t: 85   },
  teamL:  { l: 17,   t: 87.5 },
  teamV:  { l: 17,   t: 90   },
  serial: { l: 17,   t: 96   },
  qr:     { l: 57,   t: 69,   w: 27,   h: 17   },  // shifted slightly left
  scan:   { l: 57,   t: 88,   w: 27,   h: 4    }   // shifted slightly left to match QR
};

/* ══════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════ */
const S = {
  photoImg:  null,
  zoom:      1,
  rotate:    0,
  flipH:     false,
  flipV:     false,
  name:      '',
  team:      '',
  title:     TITLES[Math.floor(Math.random() * TITLES.length)],
  teamName:  'GOA BUILDERS',
  serial:    genSerial(),
  is3D:      false,
  isFlipped: false,
  templateImg: null,
  backTemplateImg: null,
  pfpMode:   'fill', // 'fill' or 'whole'
  pfpZoom:   1,
  pfpKraft:  false,
  pfpX:      0,
  pfpY:      0,
};

function genSerial() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return '#GOA-2026-' +
    Math.floor(Math.random() * 9000 + 1000) +
    letters[Math.floor(Math.random() * letters.length)];
}

/* ══════════════════════════════════════════════════════
   3D CARD SPIN
══════════════════════════════════════════════════════ */
let rotY = 12, rotX = 4;
let velY = 0.22, velX = 0;
let isDragging = false, lastMX, lastMY;
let animId = null;

function applyTransform() {
  const pivot = document.getElementById('cardPivot');
  if (!pivot) return;
  const flip = S.isFlipped ? 180 : 0;
  pivot.style.transform = `rotateY(${rotY + flip}deg) rotateX(${rotX}deg)`;
}

function spinTick() {
  if (!isDragging && S.is3D) {
    rotY += velY;
    rotX += velX;
    velX *= 0.97;
    // Keep gentle Y spin — always forward so front stays visible mostly
    if (Math.abs(velY) < 0.15) velY = 0.22;
    // Clamp X
    if (Math.abs(rotX) > 28) { rotX = 28 * Math.sign(rotX); velX *= -0.5; }
  }
  applyTransform();
  animId = requestAnimationFrame(spinTick);
}

function init3D() {
  const scene = document.getElementById('scene3d');
  const pivot = document.getElementById('cardPivot');
  if (!scene || !pivot) return;

  /* Mouse */
  scene.addEventListener('mousedown', (e) => {
    isDragging = true; lastMX = e.clientX; lastMY = e.clientY;
    velX = 0; velY = 0; pivot.style.transition = 'none';
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMX, dy = e.clientY - lastMY;
    rotY += dx * 0.45; rotX -= dy * 0.3;
    rotX = Math.max(-55, Math.min(55, rotX));
    velY = dx * 0.12; velX = -dy * 0.07;
    lastMX = e.clientX; lastMY = e.clientY;
    applyTransform();
  });
  window.addEventListener('mouseup', () => {
    if (isDragging) { isDragging = false; pivot.style.transition = 'transform .06s linear'; }
  });

  /* Touch */
  scene.addEventListener('touchstart', (e) => {
    isDragging = true; lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY;
    velX = 0; velY = 0; pivot.style.transition = 'none';
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - lastMX, dy = e.touches[0].clientY - lastMY;
    rotY += dx * 0.45; rotX -= dy * 0.3;
    rotX = Math.max(-55, Math.min(55, rotX));
    velY = dx * 0.12; velX = -dy * 0.07;
    lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY;
    applyTransform();
  }, { passive: true });
  window.addEventListener('touchend', () => { isDragging = false; });

  /* Flip button */
  document.getElementById('flipCardBtn').addEventListener('click', () => {
    S.isFlipped = !S.isFlipped;
    // Animate to flipped side
    velY = S.isFlipped ? -1.5 : 1.5;
  });

  /* 3D / 2D toggle buttons inside preview */
  const tog3D = document.getElementById('toggle3DBtn');
  const tog2D = document.getElementById('toggle2DBtn');
  if (tog3D) tog3D.addEventListener('click', () => {
    S.is3D = true;
    tog3D.classList.add('active');
    if (tog2D) tog2D.classList.remove('active');
    velX = 0; velY = 1.5;
  });
  if (tog2D) tog2D.addEventListener('click', () => {
    S.is3D = false;
    tog2D.classList.add('active');
    if (tog3D) tog3D.classList.remove('active');
    rotX = 0; rotY = 0; velX = 0; velY = 0;
    applyTransform();
  });

  spinTick();
}

/* ══════════════════════════════════════════════════════
   PHOTO SLOT CANVAS (live preview)
══════════════════════════════════════════════════════ */
function getPhotoSlotSize() {
  const wrap = document.getElementById('cardWrap');
  if (!wrap) return { w: 115, h: 151 };
  const r = wrap.getBoundingClientRect();
  return {
    w: Math.round(r.width  * PCT.photo.w / 100),
    h: Math.round(r.height * PCT.photo.h / 100),
  };
}

function renderPhotoSlot() {
  const canvas = document.getElementById('photoSlot');
  const ph     = document.getElementById('photoPlaceholder');
  if (!canvas) return;

  const sz = getPhotoSlotSize();
  canvas.width  = sz.w * devicePixelRatio;
  canvas.height = sz.h * devicePixelRatio;
  canvas.style.width  = sz.w + 'px';
  canvas.style.height = sz.h + 'px';

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!S.photoImg) {
    if (ph) ph.style.display = 'flex';
    return;
  }
  if (ph) ph.style.display = 'none';

  const cw = canvas.width, ch = canvas.height;
  ctx.save();
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate(S.rotate * Math.PI / 180);
  ctx.scale(
    (S.flipH ? -1 : 1) * S.zoom,
    (S.flipV ? -1 : 1) * S.zoom
  );
  const iw = S.photoImg.naturalWidth, ih = S.photoImg.naturalHeight;
  const base = Math.max(cw / iw, ch / ih);
  ctx.drawImage(S.photoImg, -iw * base / 2, -ih * base / 2, iw * base, ih * base);
  ctx.restore();
}

/* ══════════════════════════════════════════════════════
   TEXT OVERLAYS (live preview)
══════════════════════════════════════════════════════ */
function updateOverlays() {
  const nameEl   = document.getElementById('ovName');
  const teamVal  = document.getElementById('ovTeamVal');
  const titleVal = document.getElementById('ovTitleVal');
  const serialEl = document.getElementById('ovSerial');

  if (nameEl)   nameEl.textContent  = (S.name  || 'YOUR NAME').toUpperCase();
  if (teamVal)  teamVal.textContent  = S.team  || 'Add your role / stack';
  if (titleVal) titleVal.textContent = S.title || 'Midnight Innovator';
  if (serialEl) serialEl.textContent = S.serial;

  const teamNameEl = document.getElementById('ovTeamNameVal');
  if (teamNameEl) teamNameEl.textContent = S.teamName || 'GOA BUILDERS';

  // Auto-shrink name font
  if (nameEl) {
    const len = (S.name || 'YOUR NAME').length;
    nameEl.style.fontSize = len > 16 ? '19px' : len > 12 ? '22px' : '26px';
  }

  updateSharePreview();
}

/* ══════════════════════════════════════════════════════
   BACK CARD CANVAS
══════════════════════════════════════════════════════ */
function drawBackCard() {
  const canvas = document.getElementById('backCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  if (S.backTemplateImg) {
    ctx.drawImage(S.backTemplateImg, 0, 0, W, H);
    return;
  }

  // Background fallback
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   '#052010');
  bg.addColorStop(0.5, '#0a3520');
  bg.addColorStop(1,   '#062515');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Subtle border
  ctx.strokeStyle = 'rgba(46,196,182,0.35)'; ctx.lineWidth = 2;
  roundRect(ctx, 6, 6, W - 12, H - 12, 14); ctx.stroke();

  // Large watermark
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.font = `bold ${W * 0.55}px Bebas Neue, Arial`;
  ctx.fillStyle = '#f5c800';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('HH', W / 2, H * 0.45);
  ctx.restore();

  // Sun circle
  const sg = ctx.createRadialGradient(W / 2, H * 0.22, 0, W / 2, H * 0.22, 55);
  sg.addColorStop(0, '#ffe033'); sg.addColorStop(1, '#c89800');
  ctx.beginPath(); ctx.arc(W / 2, H * 0.22, 55, 0, Math.PI * 2);
  ctx.fillStyle = sg; ctx.fill();

  // Main branding
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.font = `bold ${W * 0.09}px Bebas Neue, Arial`;
  ctx.fillStyle = '#f0e8ce';
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8;
  ctx.fillText('HACKER HOUSE', W / 2, H * 0.42);
  ctx.fillText('GOA 2026', W / 2, H * 0.52);
  ctx.restore();

  // गोवा
  ctx.font = `bold ${W * 0.12}px "Noto Sans Devanagari", "Segoe UI", Arial`;
  ctx.fillStyle = '#e8157a'; ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(232,21,122,0.4)'; ctx.shadowBlur = 14;
  ctx.fillText('गोवा', W / 2, H * 0.64);
  ctx.shadowBlur = 0;

  // Teal details
  ctx.font = `${W * 0.036}px Space Grotesk, Arial`;
  ctx.fillStyle = '#2ec4b6';
  ctx.fillText('28–31 OCT 2026  ·  GOA, INDIA', W / 2, H * 0.72);
  ctx.font = `${W * 0.032}px Space Grotesk, Arial`;
  ctx.fillStyle = 'rgba(240,232,208,0.5)';
  ctx.fillText('HHGOA.COM', W / 2, H * 0.77);

  // Serial
  ctx.font = `bold ${W * 0.036}px Courier Prime, monospace`;
  ctx.fillStyle = 'rgba(245,200,0,0.7)';
  ctx.fillText(S.serial, W / 2, H * 0.84);

  // Hashtag
  ctx.font = `bold ${W * 0.06}px Bebas Neue, Arial`;
  ctx.fillStyle = '#e8157a';
  ctx.fillText('#FrameInGoa', W / 2, H * 0.91);

  // 2:47 BUILDERS
  ctx.font = `bold ${W * 0.05}px Bebas Neue, Arial`;
  ctx.fillStyle = '#2ec4b6';
  ctx.fillText('2:47PM  BUILDERS', W / 2, H * 0.97);

  // Star
  drawStar(ctx, W / 2, H * 0.93, 5, '#e8157a', 0.8);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawStar(ctx, x, y, r, color, opacity) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = opacity;
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke();
  }
  ctx.restore();
}

/* ══════════════════════════════════════════════════════
   DOWNLOAD — HD canvas rendering
══════════════════════════════════════════════════════ */
function px(pct, dim) { return (pct / 100) * dim; }

async function buildFrontCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = DL_W; canvas.height = DL_H;
  const ctx = canvas.getContext('2d');

  // 1. Template image fills canvas
  if (S.templateImg) {
    ctx.drawImage(S.templateImg, 0, 0, DL_W, DL_H);
  } else {
    ctx.fillStyle = '#0a3520'; ctx.fillRect(0, 0, DL_W, DL_H);
  }

  // 2. User photo (no cover needed — template cream area is blank)
  if (S.photoImg) {
    const px_ = px(PCT.photo.l, DL_W), py = px(PCT.photo.t, DL_H);
    const pw  = px(PCT.photo.w, DL_W), ph = px(PCT.photo.h, DL_H);
    ctx.save();
    ctx.beginPath(); ctx.roundRect(px_, py, pw, ph, 12); ctx.clip();
    ctx.translate(px_ + pw / 2, py + ph / 2);
    ctx.rotate(S.rotate * Math.PI / 180);
    ctx.scale((S.flipH ? -1 : 1) * S.zoom, (S.flipV ? -1 : 1) * S.zoom);
    const iw = S.photoImg.naturalWidth, ih = S.photoImg.naturalHeight;
    const sc = Math.max(pw / iw, ph / ih);
    ctx.drawImage(S.photoImg, -iw * sc / 2, -ih * sc / 2, iw * sc, ih * sc);
    ctx.restore();
    
    // Draw clean photo border (no outer ring that bleeds outside)
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(px_, py, pw, ph, 12); ctx.stroke();
  }

  // The left text column must NEVER exceed 58% of width (QR starts at 60%)
  // Canvas fillText 4th arg = maxWidth forces scaling — use it on EVERY left-col text
  const COL_MAX = px(40, DL_W); // max pixel width of left text column
  const textX   = px(PCT.name.l, DL_W);

  // 3. Name
  const nameText = (S.name || 'YOUR NAME').toUpperCase();
  const nameLen = nameText.length;
  const nameSz = nameLen > 18 ? 80 : nameLen > 13 ? 96 : 108;
  ctx.font = `bold ${nameSz}px Bebas Neue, Arial`;
  ctx.fillStyle = '#2a2a2a';
  ctx.fillText(nameText, textX, px(PCT.name.t, DL_H), COL_MAX);

  // 4. Role
  const teamY = px(PCT.team.t, DL_H);
  ctx.font = 'bold 38px Courier Prime, monospace';
  ctx.fillStyle = '#2a2a2a';
  ctx.fillText('ROLE:', textX, teamY, COL_MAX);
  ctx.font = '38px Courier Prime, monospace';
  ctx.fillText(S.team || 'Add your role/stack', textX + 120, teamY, COL_MAX - 120);

  // 5. Builder Title
  ctx.font = 'bold 36px Courier Prime, monospace';
  ctx.fillStyle = '#2a2a2a';
  ctx.fillText('BUILDER TITLE:', textX, px(PCT.titleL.t, DL_H), COL_MAX);
  ctx.font = '46px Courier Prime, monospace';
  ctx.fillText(S.title || 'Midnight Innovator', textX, px(PCT.titleV.t, DL_H), COL_MAX);

  // 6. Team Name
  ctx.font = 'bold 40px Bebas Neue, Arial';
  ctx.fillStyle = '#2a2a2a';
  ctx.fillText('TEAM NAME:', textX, px(PCT.teamL.t, DL_H), COL_MAX);
  ctx.font = 'bold 42px Courier Prime, monospace';
  ctx.fillStyle = '#e62b4a';
  ctx.fillText(S.teamName || 'GOA BUILDERS', textX, px(PCT.teamV.t, DL_H), COL_MAX);

  // 7. Serial
  ctx.font = '32px Courier Prime, monospace';
  ctx.fillStyle = '#2a2a2a';
  ctx.fillText(S.serial, textX, px(PCT.serial.t, DL_H), COL_MAX);

  // QR Code
  const qrImg = document.getElementById('qrImg');
  if (qrImg && qrImg.complete && qrImg.naturalWidth !== 0) {
    const qrX = px(PCT.qr.l, DL_W), qrY = px(PCT.qr.t, DL_H);
    const qrW = px(PCT.qr.w, DL_W), qrH = px(PCT.qr.h, DL_H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX, qrY, qrW, qrH);
    ctx.drawImage(qrImg, qrX + 10, qrY + 10, qrW - 20, qrH - 20);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#2a2a2a';
    ctx.strokeRect(qrX, qrY, qrW, qrH);
  }

  // Scan Badge
  const badgeX = px(PCT.scan.l, DL_W);
  const badgeY = px(PCT.scan.t, DL_H);
  const badgeW = px(PCT.scan.w, DL_W);
  const badgeH = px(PCT.scan.h, DL_H);
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20);
  } else {
    ctx.rect(badgeX, badgeY, badgeW, badgeH);
  }
  ctx.fill();

  ctx.font = '42px Bebas Neue, Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SCAN TO VERIFY', badgeX + badgeW/2, badgeY + badgeH/2 + 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  return canvas;
}

function buildBackCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = DL_W; canvas.height = DL_H;
  const ctx = canvas.getContext('2d');
  const W = DL_W, H = DL_H;

  if (S.backTemplateImg) {
    ctx.drawImage(S.backTemplateImg, 0, 0, DL_W, DL_H);
    return canvas;
  }

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#052010'); bg.addColorStop(0.5, '#0a3520'); bg.addColorStop(1, '#062515');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = 'rgba(46,196,182,0.35)'; ctx.lineWidth = 5;
  roundRect(ctx, 14, 14, W - 28, H - 28, 40); ctx.stroke();

  // Sun
  const sg = ctx.createRadialGradient(W/2, H*0.22, 0, W/2, H*0.22, 160);
  sg.addColorStop(0,'#ffe033'); sg.addColorStop(1,'#c89800');
  ctx.beginPath(); ctx.arc(W/2, H*0.22, 160, 0, Math.PI*2);
  ctx.fillStyle = sg; ctx.fill();

  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';

  // Branding
  ctx.font = `bold ${W*0.09}px Bebas Neue, Arial`;
  ctx.fillStyle = '#f0e8ce'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12;
  ctx.fillText('HACKER HOUSE', W/2, H*0.42);
  ctx.fillText('GOA 2026', W/2, H*0.52);
  ctx.shadowBlur = 0;

  ctx.font = `bold ${W*0.12}px "Noto Sans Devanagari","Segoe UI",Arial`;
  ctx.fillStyle = '#e8157a';
  ctx.shadowColor = 'rgba(232,21,122,0.4)'; ctx.shadowBlur = 20;
  ctx.fillText('गोवा', W/2, H*0.64);
  ctx.shadowBlur = 0;

  ctx.font = `${W*0.036}px Space Grotesk, Arial`;
  ctx.fillStyle = '#2ec4b6';
  ctx.fillText('28–31 OCT 2026  ·  GOA, INDIA', W/2, H*0.72);
  ctx.font = `${W*0.03}px Space Grotesk, Arial`;
  ctx.fillStyle = 'rgba(240,232,208,0.5)';
  ctx.fillText('HHGOA.COM', W/2, H*0.77);

  ctx.font = `bold ${W*0.036}px Courier Prime, monospace`;
  ctx.fillStyle = 'rgba(245,200,0,0.7)';
  ctx.fillText(S.serial, W/2, H*0.84);

  ctx.font = `bold ${W*0.058}px Bebas Neue, Arial`;
  ctx.fillStyle = '#e8157a';
  ctx.fillText('#FrameInGoa', W/2, H*0.91);

  ctx.font = `bold ${W*0.048}px Bebas Neue, Arial`;
  ctx.fillStyle = '#2ec4b6';
  ctx.fillText('2:47PM  BUILDERS', W/2, H*0.97);

  return canvas;
}

function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }, 'image/png');
}

/* Both sides: stitch front and back side by side */
async function downloadBoth() {
  const front = await buildFrontCanvas();
  const back  = buildBackCanvas();
  const combo = document.createElement('canvas');
  combo.width = DL_W * 2 + 40; combo.height = DL_H;
  const ctx = combo.getContext('2d');
  ctx.fillStyle = '#0a2818'; ctx.fillRect(0, 0, combo.width, combo.height);
  ctx.drawImage(front, 0, 0);
  ctx.drawImage(back, DL_W + 40, 0);
  downloadCanvas(combo, 'hh-goa-2026-builder-id-both.png');
}

/* ══════════════════════════════════════════════════════
   UPLOAD
══════════════════════════════════════════════════════ */
function initUpload() {
  const zone    = document.getElementById('uploadZone');
  const input   = document.getElementById('photoInput');
  const empty   = document.getElementById('uploadEmpty');
  const filled  = document.getElementById('uploadFilled');
  const thumb   = document.getElementById('thumbImg');
  const adjPanel= document.getElementById('photoAdj');
  const changeBtn= document.getElementById('changePhotoBtn');

  function triggerPick() { input.click(); }

  zone.addEventListener('click', (e) => {
    if (e.target === changeBtn) return;
    triggerPick();
  });
  changeBtn && changeBtn.addEventListener('click', (e) => { e.stopPropagation(); triggerPick(); });
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault(); zone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', () => { if (input.files[0]) handleFile(input.files[0]); });

  function handleFile(file) {
    if (!file.type.startsWith('image/') && !file.name.match(/\.(heic|heif)$/i)) {
      alert('Please upload an image file (JPG, PNG, WEBP, HEIC).');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      S.photoImg = img;
      // reset pan/zoom
      S.zoom = 1; S.rotate = 0; S.flipH = false; S.flipV = false;
      S.pfpZoom = 1; S.pfpX = 0; S.pfpY = 0;

      empty.style.display = 'none';
      filled.style.display = 'block';
      if (thumb) { thumb.src = url; thumb.style.display = 'block'; }
      adjPanel.classList.add('visible');
      renderPhotoSlot();

      const pfpCropImg = document.getElementById('pfpCropImg');
      if (pfpCropImg) {
        pfpCropImg.src = url;
        pfpCropImg.style.display = 'block';
        updatePfpCropPreview();
      }
      buildPFP();
    };
    img.onerror = () => alert('Could not load image. Try a JPG or PNG.');
    img.src = url;
  }
}

/* ══════════════════════════════════════════════════════
   PHOTO CONTROLS (zoom, rotate, flip)
══════════════════════════════════════════════════════ */
function initPhotoControls() {
  const zoomSlider = document.getElementById('zoomSlider');
  const rotSlider  = document.getElementById('rotSlider');
  const zoomVal    = document.getElementById('zoomVal');
  const rotVal     = document.getElementById('rotVal');

  zoomSlider && zoomSlider.addEventListener('input', () => {
    S.zoom = parseFloat(zoomSlider.value);
    zoomVal.textContent = S.zoom.toFixed(1) + 'x';
    renderPhotoSlot();
  });
  rotSlider && rotSlider.addEventListener('input', () => {
    S.rotate = parseInt(rotSlider.value, 10);
    rotVal.textContent = S.rotate + '°';
    renderPhotoSlot();
  });

  document.getElementById('flipHBtn') && document.getElementById('flipHBtn').addEventListener('click', () => {
    S.flipH = !S.flipH; renderPhotoSlot();
  });
  document.getElementById('flipVBtn') && document.getElementById('flipVBtn').addEventListener('click', () => {
    S.flipV = !S.flipV; renderPhotoSlot();
  });
  document.getElementById('resetPhotoBtn') && document.getElementById('resetPhotoBtn').addEventListener('click', () => {
    S.zoom = 1; S.rotate = 0; S.flipH = false; S.flipV = false;
    zoomSlider.value = '1'; rotSlider.value = '0';
    zoomVal.textContent = '1.0x'; rotVal.textContent = '0°';
    renderPhotoSlot();
  });
}

/* ══════════════════════════════════════════════════════
   INPUT FIELDS & CHIPS
══════════════════════════════════════════════════════ */
function initInputs() {
  const nameIn     = document.getElementById('inputName');
  const teamIn     = document.getElementById('inputTeam');
  const titleIn    = document.getElementById('inputTitle');
  const teamNameIn = document.getElementById('inputTeamName');
  const reroll     = document.getElementById('rerollBtn');
  const serial     = document.getElementById('serialDisplay');

  titleIn.value = S.title;
  if (serial) serial.textContent = S.serial;
  if (teamNameIn) teamNameIn.value = S.teamName;

  let debounce;
  let qrDebounce;

  function updateQR() {
    clearTimeout(qrDebounce);
    qrDebounce = setTimeout(() => {
      const qrData = `HH GOA 2026\nName: ${S.name || 'YOUR NAME'}\nRole: ${S.team || 'Add your role / stack'}\nTitle: ${S.title || 'Midnight Innovator'}\nTeam: ${S.teamName || 'GOA BUILDERS'}\nSerial: ${S.serial}`;
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
      
      const qrImg = document.getElementById('qrImg');
      const ovQrImg = document.getElementById('ovQrImg');
      
      if (qrImg) qrImg.src = url;
      if (ovQrImg) ovQrImg.src = url;
    }, 600);
  }

  function update() {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      S.name     = nameIn.value.trim();
      S.team     = teamIn.value.trim();
      S.title    = titleIn.value.trim() || S.title;
      S.teamName = teamNameIn ? (teamNameIn.value.trim() || 'GOA BUILDERS') : 'GOA BUILDERS';
      updateOverlays();
      updateQR(); // trigger QR regeneration
    }, 50);
  }

  nameIn     && nameIn.addEventListener('input', update);
  teamIn     && teamIn.addEventListener('input', update);
  titleIn    && titleIn.addEventListener('input', update);
  teamNameIn && teamNameIn.addEventListener('input', update);

  reroll && reroll.addEventListener('click', () => {
    let t;
    do { t = TITLES[Math.floor(Math.random() * TITLES.length)]; }
    while (t === S.title && TITLES.length > 1);
    S.title = t; titleIn.value = t; updateOverlays();
  });

  // Role chips
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.val;
      // Toggle chip active state
      chip.classList.toggle('active');
      // Build combined team string from active chips
      const active = [...document.querySelectorAll('.chip.active')]
        .map((c) => c.dataset.val);
      if (active.length) {
        teamIn.value = active.join(' · ');
        S.team = teamIn.value;
      } else {
        S.team = teamIn.value;
      }
      updateOverlays();
    });
  });
}

/* ══════════════════════════════════════════════════════
   SHARE
══════════════════════════════════════════════════════ */
function updateSharePreview() {
  const el = document.getElementById('sharePreview');
  if (!el) return;
  const name = S.name || 'A builder';
  el.textContent = `"${name} is heading to Hacker House Goa 2026 🌴🇮🇳 #FrameInGoa #HackerHouseGoa"`;
}

function initShare() {
  document.getElementById('dlShare') && document.getElementById('dlShare').addEventListener('click', () => {
    const name = S.name || 'A builder';
    const text = encodeURIComponent(
      `${name} is heading to Hacker House Goa 2026 🌴🇮🇳\n\nGet your Builder ID → https://hhgoa.com/id\n\n#FrameInGoa #HackerHouseGoa #HHGoa2026`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer,width=600,height=520');
  });
}

/* ══════════════════════════════════════════════════════
   DOWNLOAD BUTTONS
══════════════════════════════════════════════════════ */
function initDownload() {
  document.getElementById('dlFront') && document.getElementById('dlFront').addEventListener('click', async () => {
    const c = await buildFrontCanvas();
    downloadCanvas(c, 'hh-goa-2026-builder-id-front.png');
  });
  document.getElementById('dlBack') && document.getElementById('dlBack').addEventListener('click', () => {
    const c = buildBackCanvas();
    downloadCanvas(c, 'hh-goa-2026-builder-id-back.png');
  });
  document.getElementById('dlBoth') && document.getElementById('dlBoth').addEventListener('click', downloadBoth);
}

/* ══════════════════════════════════════════════════════
   SMOOTH SCROLL
══════════════════════════════════════════════════════ */
function initScroll() {
  document.getElementById('ctaScroll') && document.getElementById('ctaScroll').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ══════════════════════════════════════════════════════
   LOAD TEMPLATE IMAGE
══════════════════════════════════════════════════════ */
function loadTemplate() {
  const p1 = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { S.templateImg = img; resolve(img); };
    img.onerror = () => { console.warn('Front template image failed to load.'); resolve(null); };
    img.src = 'id%20card%20%20theme/image.png';
  });

  const p2 = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { S.backTemplateImg = img; resolve(img); };
    img.onerror = () => { console.warn('Back template image failed to load.'); resolve(null); };
    img.src = 'BACKSIDE%20CARD/image.png';
  });

  return Promise.all([p1, p2]);
}

/* ══════════════════════════════════════════════════════
   CALIBRATE CREAM COVER
   Sample the actual cream colour from the template image
   and apply it to the HTML overlay cover div.
══════════════════════════════════════════════════════ */
function calibrateCoverColor() {
  if (!S.templateImg) return;
  try {
    const tmp = document.createElement('canvas');
    tmp.width = 200; tmp.height = 280;
    const ctx = tmp.getContext('2d');
    ctx.drawImage(S.templateImg, 0, 0, 200, 280);
    // Sample from card body text area (approx 14% left, 68% top of card)
    const sx = Math.round(0.20 * 200);
    const sy = Math.round(0.68 * 280);
    const px = ctx.getImageData(sx, sy, 1, 1).data;
    const sampled = `rgb(${px[0]}, ${px[1]}, ${px[2]})`;
    const cover = document.getElementById('ovCover');
    if (cover) cover.style.background = sampled;
  } catch (e) {
    /* CORS or other error — fallback colour stays */
  }
}

/* ══════════════════════════════════════════════════════
   PFP LOGIC & RENDERING
══════════════════════════════════════════════════════ */
function initPfpUI() {
  const tab3D = document.getElementById('tab3D');
  const tab2D = document.getElementById('tab2D');
  const tabPFP  = document.getElementById('tabPFP');
  const cardLayout = document.getElementById('cardLayout');
  const pfpLayout  = document.getElementById('pfpLayout');

  function switchTab(mode) {
    if (tab3D) tab3D.classList.remove('active');
    if (tab2D) tab2D.classList.remove('active');
    if (tabPFP)  tabPFP.classList.remove('active');
    
    if (mode === 'card3d') {
      S.is3D = true;
      if (tab3D) tab3D.classList.add('active');
      if (cardLayout) cardLayout.style.display = 'grid';
      if (pfpLayout)  pfpLayout.style.display = 'none';
    } else if (mode === 'card2d') {
      S.is3D = false;
      rotX = 0; rotY = 0; applyTransform();
      if (tab2D) tab2D.classList.add('active');
      if (cardLayout) cardLayout.style.display = 'grid';
      if (pfpLayout)  pfpLayout.style.display = 'none';
    } else if (mode === 'pfp') {
      if (tabPFP)  tabPFP.classList.add('active');
      if (cardLayout) cardLayout.style.display = 'none';
      if (pfpLayout) {
        pfpLayout.style.display = 'grid';
        buildPFP();
      }
    }
  }

  if (tab3D) tab3D.addEventListener('click', () => switchTab('card3d'));
  if (tab2D) tab2D.addEventListener('click', () => switchTab('card2d'));
  if (tabPFP)  tabPFP.addEventListener('click', () => switchTab('pfp'));

  // Default: open 2D view on load
  switchTab('card2d');

  // PFP controls
  const kraftToggle = document.getElementById('kraftToggle');
  const modeWhole = document.getElementById('pfpModeWhole');
  const modeFill  = document.getElementById('pfpModeFill');
  const zoomSlider = document.getElementById('pfpZoomSlider');
  const resetBtn  = document.getElementById('pfpResetBtn');
  const changeBtn = document.getElementById('pfpChangePhotoBtn');
  const dlBtn     = document.getElementById('dlPfpBtn');
  const shareBtn  = document.getElementById('sharePfpBtn');

  if (shareBtn) shareBtn.addEventListener('click', () => {
    const text = encodeURIComponent("Just got my official Hacker House Goa 2026 PFP! 🌴💻 #FrameInGoa #HHGoa2026 @hackerhousegoa");
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank');
  });

  if (kraftToggle) kraftToggle.addEventListener('change', (e) => {
    S.pfpKraft = e.target.checked;
    buildPFP();
  });

  if (modeWhole) modeWhole.addEventListener('click', () => {
    S.pfpMode = 'whole';
    modeWhole.classList.add('active');
    if (modeFill) modeFill.classList.remove('active');
    buildPFP();
  });
  if (modeFill) modeFill.addEventListener('click', () => {
    S.pfpMode = 'fill';
    modeFill.classList.add('active');
    if (modeWhole) modeWhole.classList.remove('active');
    buildPFP();
  });

  if (zoomSlider) zoomSlider.addEventListener('input', (e) => {
    S.pfpZoom = parseFloat(e.target.value);
    buildPFP();
  });

  if (resetBtn) resetBtn.addEventListener('click', () => {
    S.pfpZoom = 1;
    if (zoomSlider) zoomSlider.value = 1;
    buildPFP();
  });

  if (changeBtn) changeBtn.addEventListener('click', () => {
    const fileIn = document.getElementById('photoInput');
    if (fileIn) fileIn.click();
  });

  if (dlBtn) dlBtn.addEventListener('click', () => {
    const cvs = document.getElementById('pfpCanvas');
    if (!cvs) return;
    cvs.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hh-goa-pfp.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // PFP Pan logic
  const pfpCropCircle = document.getElementById('pfpCropCircle');
  let isPfpDragging = false;
  let pfpStartX, pfpStartY;

  if (pfpCropCircle) {
    pfpCropCircle.addEventListener('mousedown', (e) => {
      isPfpDragging = true;
      pfpStartX = e.clientX - S.pfpX;
      pfpStartY = e.clientY - S.pfpY;
    });
    window.addEventListener('mousemove', (e) => {
      if (!isPfpDragging) return;
      S.pfpX = e.clientX - pfpStartX;
      S.pfpY = e.clientY - pfpStartY;
      updatePfpCropPreview();
      buildPFP();
    });
    window.addEventListener('mouseup', () => { isPfpDragging = false; });
  }
}

function updatePfpCropPreview() {
  const img = document.getElementById('pfpCropImg');
  if (!img || !S.photoImg) return;
  const aspect = S.photoImg.width / S.photoImg.height;
  
  let targetSize = 250 * S.pfpZoom;
  if (S.pfpMode === 'fill') {
    if (aspect > 1) { img.style.height = targetSize + 'px'; img.style.width = 'auto'; }
    else            { img.style.width = targetSize + 'px'; img.style.height = 'auto'; }
  } else {
    if (aspect > 1) { img.style.width = targetSize + 'px'; img.style.height = 'auto'; }
    else            { img.style.height = targetSize + 'px'; img.style.width = 'auto'; }
  }
  img.style.transform = `translate(calc(-50% + ${S.pfpX}px), calc(-50% + ${S.pfpY}px))`;
}

function drawTextAlongArc(ctx, str, cx, cy, radius, isBottom) {
  ctx.save();
  ctx.translate(cx, cy);
  // Add letter spacing (radians) based on position
  const tracking = isBottom ? 0.02 : 0.05; 
  
  let totalAngle = 0;
  const angles = [];
  for (let i = 0; i < str.length; i++) {
    const w = ctx.measureText(str[i]).width;
    const a = (w / radius) + tracking;
    angles.push(a);
    totalAngle += a;
  }
  
  let currentAngle = -totalAngle / 2;
  
  for (let i = 0; i < str.length; i++) {
    ctx.save();
    const theta = currentAngle + (angles[i] / 2);
    
    if (isBottom) {
      // Negate theta to progress left-to-right, and remove the 180 rotation 
      // so the tops of the letters face inward toward the center.
      ctx.rotate(-theta);
      ctx.translate(0, radius);
    } else {
      ctx.rotate(theta);
      ctx.translate(0, -radius);
    }
    ctx.fillText(str[i], 0, 0);
    ctx.restore();
    
    currentAngle += angles[i];
  }
  ctx.restore();
}

function buildPFP() {
  const cvs = document.getElementById('pfpCanvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const W = cvs.width, H = cvs.height; // 1080x1080
  const CX = W/2, CY = H/2;
  
  // 1. BG Green
  ctx.fillStyle = '#0b4d32';
  ctx.fillRect(0, 0, W, H);
  
  // 2. Rings
  const outR = 480, pinkR = 390, photoR = 380;
  
  // Outer Yellow Ring
  ctx.strokeStyle = '#f5c800';
  ctx.lineWidth = 12;
  ctx.beginPath(); ctx.arc(CX, CY, outR, 0, Math.PI*2); ctx.stroke();
  
  // Inner Pink Ring
  ctx.strokeStyle = '#e62b4a';
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(CX, CY, pinkR, 0, Math.PI*2); ctx.stroke();

  // Innermost Thin Yellow Ring (right around photo)
  ctx.strokeStyle = '#f5c800';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(CX, CY, photoR, 0, Math.PI*2); ctx.stroke();

  // 3. Text
  const textRadius = 435; // centered perfectly between outer (480) and pink (390) rings
  ctx.font = 'bold 50px "Courier Prime", monospace';
  ctx.fillStyle = '#f5c800';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Top text
  drawTextAlongArc(ctx, "HACKER HOUSE GOA", CX, CY, textRadius, false);
  
  // Bottom text - with large gap in middle for Hindi text
  ctx.font = 'bold 28px "Courier Prime", monospace';
  drawTextAlongArc(ctx, "28-31 OCT 2026              GOA, INDIA", CX, CY, textRadius, true);

  // 4. Diamonds (center horizontally, push to edges)
  ctx.fillStyle = '#e62b4a';
  const drawDiamond = (x, y) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 15); ctx.lineTo(x + 10, y);
    ctx.lineTo(x, y + 15); ctx.lineTo(x - 10, y);
    ctx.fill();
  };
  drawDiamond(CX - outR - 20, CY);
  drawDiamond(CX + outR + 20, CY);

  // 5. Photo Clipping
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, photoR - 5, 0, Math.PI*2);
  ctx.clip();
  
  if (S.pfpKraft) {
    ctx.fillStyle = '#e6dbcd'; // Cream
    ctx.fill();
  }

  if (S.photoImg) {
    const img = S.photoImg;
    let sW, sH, dW, dH;
    const aspect = img.width / img.height;
    
    // Calculate draw dimensions based on mode
    let targetSize = (photoR - 5) * 2 * S.pfpZoom;
    
    if (S.pfpMode === 'fill') {
      if (aspect > 1) { // wide
        dH = targetSize; dW = dH * aspect;
      } else { // tall
        dW = targetSize; dH = dW / aspect;
      }
    } else { // whole
      if (aspect > 1) {
        dW = targetSize; dH = dW / aspect;
      } else {
        dH = targetSize; dW = dH * aspect;
      }
    }
    
    // map the DOM crop translation to canvas translation
    // DOM size is 250px, canvas clip is (photoR - 5)*2 = 750px.
    // scale factor = 750 / 250 = 3
    const scale = ((photoR - 5) * 2) / 250;
    
    ctx.drawImage(img, CX - dW/2 + (S.pfpX * scale), CY - dH/2 + (S.pfpY * scale), dW, dH);
  }
  ctx.restore();

  // 6. Hindi GOA text
  ctx.save();
  ctx.font = 'bold 64px sans-serif'; // size properly to fit gap
  ctx.fillStyle = '#e62b4a';
  ctx.strokeStyle = '#f5c800';
  ctx.lineWidth = 6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(CX, CY + textRadius); // position exactly on the text radius curve
  ctx.strokeText("गोवा", 0, 0);
  ctx.fillText("गोवा", 0, 0);
  ctx.restore();
}

/* ══════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  initScroll();
  init3D();
  initUpload();
  initPhotoControls();
  initInputs();
  initPfpUI();
  initDownload();
  initShare();

  await loadTemplate();
  calibrateCoverColor();
  drawBackCard();
  updateOverlays();
  renderPhotoSlot();
});
