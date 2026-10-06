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
    mainScreen.inert = false;
    mainScreen.removeAttribute('aria-hidden');
  }
  document.getElementById('clear').addEventListener('click', clearOrder);
  document.getElementById('celebration-clear').addEventListener('click', clearOrder);
  function playBells() {
    // Bright, overlapping bell partials for a short, original jingle-bells-style fanfare.
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      const context = new AudioContext();
      const now = context.currentTime;
      const melody = [
        [659.25, 0], [659.25, .15], [659.25, .30], [659.25, .52],
        [659.25, .68], [659.25, .84], [659.25, 1.08], [783.99, 1.31],
        [523.25, 1.55], [587.33, 1.78], [659.25, 2.02], [698.46, 2.37],
        [698.46, 2.54], [698.46, 2.72], [698.46, 2.9], [659.25, 3.08],
        [659.25, 3.26], [659.25, 3.44], [783.99, 3.62], [783.99, 3.8],
        [698.46, 3.98], [587.33, 4.16], [523.25, 4.34], [587.33, 4.52],
        [783.99, 4.70]
      ];
      melody.forEach(([frequency, offset], index) => {
        const start = now + offset;
        // Inharmonic upper partials give each sine wave a bright, struck-bell timbre.
        [[1, .14], [2.76, .043], [5.4, .016]].forEach(([ratio, volume]) => {
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = 'sine';
          osc.frequency.value = frequency * ratio;
          gain.gain.setValueAtTime(.0001, start);
          gain.gain.exponentialRampToValueAtTime(volume, start + .008);
          gain.gain.exponentialRampToValueAtTime(.0001, start + (index % 3 === 0 ? .68 : .52));
          osc.connect(gain).connect(context.destination);
          osc.start(start);
          osc.stop(start + .7);
        });
      });
      window.setTimeout(() => context.close(), 5600);
    } catch (_) { /* Sound is a bonus; the celebration still opens if audio is unavailable. */ }
  }
  totalButton.addEventListener('click', () => {
    if (grandTotal() === 0) return;
    render();
    celebration.hidden = false;
    mainScreen.inert = true;
    mainScreen.setAttribute('aria-hidden', 'true');
    playBells();
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
