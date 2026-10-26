(() => {
  'use strict';
  let order = [];
  let traderDiscount = false;
  const totalNode = document.getElementById('total');
  const breakdownNode = document.getElementById('items-breakdown');
  const discountButton = document.getElementById('trader-discount');
  const totalButton = document.getElementById('open-total');
  const celebration = document.getElementById('celebration');
  const celebrationTotal = document.getElementById('celebration-total');
  const mainScreen = document.getElementById('main-screen');
  const pounds = pence => `£${(pence / 100).toFixed(2)}`;
  const sum = () => order.reduce((total, item) => total + item.pence, 0);
  const discount = () => traderDiscount ? Math.round(sum() / 2) : 0;
  const grandTotal = () => sum() - discount();
  function render() {
    const value = pounds(grandTotal());
    totalNode.textContent = value;
    totalButton.setAttribute('aria-label', `Order total ${value}; ${order.length} ${order.length === 1 ? 'item' : 'items'}${traderDiscount ? '; trader discount applied' : ''}`);
    celebrationTotal.textContent = value;
    discountButton.setAttribute('aria-pressed', String(traderDiscount));
    const grouped = new Map();
    order.forEach(item => {
      const current = grouped.get(item.name) || { count: 0, pence: 0 };
      current.count += 1;
      current.pence += item.pence;
      grouped.set(item.name, current);
    });
    breakdownNode.replaceChildren();
    if (grouped.size === 0) {
      const empty = document.createElement('span');
      empty.className = 'breakdown-empty';
      empty.textContent = 'No items yet';
      breakdownNode.appendChild(empty);
    } else {
      grouped.forEach((group, name) => {
        const line = document.createElement('span');
        line.className = 'breakdown-line';
        const label = document.createElement('span');
        label.className = 'breakdown-name';
        label.textContent = `${group.count} × ${name}`;
        label.title = label.textContent;
        const subtotal = document.createElement('span');
        subtotal.className = 'breakdown-price';
        subtotal.textContent = pounds(group.pence);
        line.append(label, subtotal);
        breakdownNode.appendChild(line);
      });
      if (traderDiscount) {
        const line = document.createElement('span');
        line.className = 'breakdown-line discount-line';
        const label = document.createElement('span');
        label.className = 'breakdown-name';
        label.textContent = 'Trader 50% off';
        const amount = document.createElement('span');
        amount.className = 'breakdown-price';
        amount.textContent = `−${pounds(discount())}`;
        line.append(label, amount);
        breakdownNode.appendChild(line);
      }
    }
  }
  document.querySelectorAll('.product[data-pence]').forEach(button => {
    button.addEventListener('click', () => {
      order.push({
        pence: Number(button.dataset.pence),
        name: button.dataset.breakdown || button.querySelector('.product-name').textContent.trim()
      });
      render();
    });
  });
  document.getElementById('undo').addEventListener('click', () => { order.pop(); render(); });
  discountButton.addEventListener('click', () => { traderDiscount = !traderDiscount; render(); });
  function clearOrder() {
    order = [];
    traderDiscount = false;
    render();
    celebration.hidden = true;
    stopFireworks();
    stopChaChing();
    mainScreen.inert = false;
    mainScreen.removeAttribute('aria-hidden');
  }
  document.getElementById('clear').addEventListener('click', clearOrder);
  document.getElementById('celebration-clear').addEventListener('click', clearOrder);
  // Celebration: the total flashes up with fireworks and a till "cha-ching".
  let fxCanvas = null, fxFrame = 0, fxTimer = 0, fxSound = null;
  function playChaChing() {
    // Synthesized till: drawer thunk + two bright bell strikes ("cha" "ching").
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      const context = new AudioContext();
      fxSound = context;
      const now = context.currentTime;
      const master = context.createGain();
      master.gain.value = .9;
      master.connect(context.destination);
      // "Cha": short filtered noise burst, like the drawer sliding open.
      const len = Math.floor(context.sampleRate * .14);
      const buffer = context.createBuffer(1, len, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const noise = context.createBufferSource();
      noise.buffer = buffer;
      const band = context.createBiquadFilter();
      band.type = 'bandpass'; band.frequency.value = 2600; band.Q.value = .8;
      const noiseGain = context.createGain();
      noiseGain.gain.value = .5;
      noise.connect(band).connect(noiseGain).connect(master);
      noise.start(now);
      const thunk = context.createOscillator();
      const thunkGain = context.createGain();
      thunk.type = 'sine';
      thunk.frequency.setValueAtTime(190, now);
      thunk.frequency.exponentialRampToValueAtTime(70, now + .12);
      thunkGain.gain.setValueAtTime(.5, now);
      thunkGain.gain.exponentialRampToValueAtTime(.0001, now + .14);
      thunk.connect(thunkGain).connect(master);
      thunk.start(now); thunk.stop(now + .16);
      // "Ching": two struck-bell notes with inharmonic partials and a long ring.
      [[2093, .13, 1.5], [2637, .19, 1.9]].forEach(([frequency, offset, ring]) => {
        const start = now + offset;
        [[1, .22], [2.76, .09], [5.4, .04], [8.93, .018]].forEach(([ratio, volume]) => {
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = 'sine';
          osc.frequency.value = frequency * ratio;
          gain.gain.setValueAtTime(.0001, start);
          gain.gain.exponentialRampToValueAtTime(volume, start + .004);
          gain.gain.exponentialRampToValueAtTime(.0001, start + ring / ratio ** .35);
          osc.connect(gain).connect(master);
          osc.start(start);
          osc.stop(start + ring + .05);
        });
      });
      window.setTimeout(() => { try { context.close(); } catch (_) {} if (fxSound === context) fxSound = null; }, 3000);
    } catch (_) { /* Sound is a bonus; the celebration still opens if audio is unavailable. */ }
  }
  function stopChaChing() {
    if (!fxSound) return;
    try { fxSound.close(); } catch (_) { /* ignore */ }
    fxSound = null;
  }
  const FX_COLORS = ['#ffd45a', '#ff5d5d', '#7ee08a', '#6cc3ff', '#fff4d4', '#ff9bd2', '#ffb347'];
  function startFireworks() {
    stopFireworks();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!fxCanvas) {
      fxCanvas = document.createElement('canvas');
      fxCanvas.setAttribute('aria-hidden', 'true');
      fxCanvas.className = 'fireworks-canvas';
      celebration.insertBefore(fxCanvas, celebration.firstChild);
    }
    const canvas = fxCanvas;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    let sparks = [];
    let last = performance.now();
    const started = last;
    function burst(x, y) {
      const color = FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)];
      const alt = FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)];
      const count = 46 + Math.floor(Math.random() * 24);
      const power = Math.min(width, height) * (.30 + Math.random() * .22);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * .12;
        const speed = power * (.45 + Math.random() * .55);
        sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0, max: 1.1 + Math.random() * .7, color: i % 3 === 0 ? alt : color });
      }
    }
    function launch() {
      burst(width * (.12 + Math.random() * .76), height * (.12 + Math.random() * .5));
    }
    // Opening salvo, then steady bursts for as long as the total is on screen.
    burst(width * .5, height * .3);
    [220, 420, 640].forEach(delay => window.setTimeout(launch, delay));
    fxTimer = window.setInterval(launch, 700);
    function frame(time) {
      const dt = Math.min((time - last) / 1000, .05);
      last = time;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      sparks = sparks.filter(s => s.life < s.max);
      sparks.forEach(s => {
        s.life += dt;
        s.vx *= 1 - 1.6 * dt;
        s.vy = s.vy * (1 - 1.6 * dt) + 150 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const fade = Math.max(0, 1 - s.life / s.max);
        ctx.globalAlpha = fade;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.2 + 2.2 * fade, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      fxFrame = window.requestAnimationFrame(frame);
    }
    fxFrame = window.requestAnimationFrame(frame);
  }
  function stopFireworks() {
    if (fxFrame) window.cancelAnimationFrame(fxFrame);
    if (fxTimer) window.clearInterval(fxTimer);
    fxFrame = 0; fxTimer = 0;
    if (fxCanvas) {
      const ctx = fxCanvas.getContext('2d');
      if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height); }
    }
  }
  totalButton.addEventListener('click', () => {
    if (grandTotal() === 0) return;
    render();
    celebration.hidden = false;
    mainScreen.inert = true;
    mainScreen.setAttribute('aria-hidden', 'true');
    playChaChing();
    startFireworks();
  });
  const stars = document.querySelector('.star-field');
  for (let i = 0; i < 34; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.textContent = i % 5 === 0 ? '✦' : '★';
    star.style.setProperty('--x', `${(i * 37 + 11) % 97}%`);
    star.style.setProperty('--y', `${(i * 61 + 7) % 92}%`);
    star.style.setProperty('--size', `${10 + (i * 7) % 18}px`);
    star.style.setProperty('--delay', `${(i % 9) * -0.31}s`);
    star.style.setProperty('--duration', `${1.4 + (i % 5) * 0.4}s`);
    stars.appendChild(star);
  }
  // Each document load deliberately starts with an empty order; nothing is persisted.
  render();
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
})();
