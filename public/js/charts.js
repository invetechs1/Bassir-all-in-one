// Shared chart helpers (SVG bar chart + tooltip), used by the Analytics and
// Business Data pages.
window.Viz = (() => {
  let tooltip;

  function ensureTooltip() {
    if (!tooltip) {
      tooltip = document.getElementById('tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'viz-tooltip';
        document.body.appendChild(tooltip);
      }
    }
    return tooltip;
  }

  function showTooltip(evt, title, value) {
    const el = ensureTooltip();
    el.innerHTML = '';
    const t = document.createElement('div');
    t.className = 't-title';
    t.textContent = title;
    const v = document.createElement('div');
    v.className = 't-value';
    v.textContent = value;
    el.append(t, v);
    el.style.display = 'block';
    const pad = 14;
    let x = evt.clientX + pad;
    let y = evt.clientY + pad;
    const r = el.getBoundingClientRect();
    if (x + r.width > innerWidth - 8) x = evt.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = evt.clientY - r.height - pad;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = 'none';
  }

  // data: [{ label, title, value, tooltipValue }] — one vertical bar per item.
  function barChart(container, data, { ariaLabel = 'Bar chart', height = 240 } = {}) {
    container.innerHTML = '';
    if (!data.length) return;
    const W = 940;
    const H = height;
    const M = { top: 14, right: 8, bottom: 26, left: 40 };
    const iw = W - M.left - M.right;
    const ih = H - M.top - M.bottom;
    const dataMax = Math.max(1, ...data.map((p) => p.value));
    const ticks = Math.min(4, dataMax);
    const tickStep = Math.ceil(dataMax / ticks);
    const max = tickStep * ticks;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', ariaLabel);

    const css = getComputedStyle(document.documentElement);
    const seriesColor = css.getPropertyValue('--series-1').trim();
    const gridColor = css.getPropertyValue('--gridline').trim();
    const baseColor = css.getPropertyValue('--baseline').trim();
    const mutedColor = css.getPropertyValue('--text-muted').trim();

    for (let i = 0; i <= ticks; i++) {
      const value = tickStep * i;
      const y = M.top + ih - (value / max) * ih;
      if (i > 0) {
        const line = document.createElementNS(svg.namespaceURI, 'line');
        line.setAttribute('x1', M.left);
        line.setAttribute('x2', W - M.right);
        line.setAttribute('y1', y);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', gridColor);
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
      }
      const label = document.createElementNS(svg.namespaceURI, 'text');
      label.setAttribute('x', M.left - 8);
      label.setAttribute('y', y + 4);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '11');
      label.setAttribute('fill', mutedColor);
      label.textContent = value;
      svg.appendChild(label);
    }

    const base = document.createElementNS(svg.namespaceURI, 'line');
    base.setAttribute('x1', M.left);
    base.setAttribute('x2', W - M.right);
    base.setAttribute('y1', M.top + ih);
    base.setAttribute('y2', M.top + ih);
    base.setAttribute('stroke', baseColor);
    base.setAttribute('stroke-width', '1');
    svg.appendChild(base);

    const step = iw / data.length;
    const barW = Math.min(28, Math.max(6, step * 0.55));
    const labelEvery = Math.ceil(data.length / 10);

    data.forEach((p, i) => {
      const cx = M.left + step * i + step / 2;
      const h = (p.value / max) * ih;
      const y = M.top + ih - h;

      if (p.value > 0) {
        const bar = document.createElementNS(svg.namespaceURI, 'path');
        const x0 = cx - barW / 2;
        const r = Math.min(4, h);
        // rounded top corners, square base anchored to the baseline
        bar.setAttribute('d',
          `M${x0},${M.top + ih} V${y + r} Q${x0},${y} ${x0 + r},${y} H${x0 + barW - r} ` +
          `Q${x0 + barW},${y} ${x0 + barW},${y + r} V${M.top + ih} Z`);
        bar.setAttribute('fill', seriesColor);
        svg.appendChild(bar);
      }

      const hit = document.createElementNS(svg.namespaceURI, 'rect');
      hit.setAttribute('x', M.left + step * i);
      hit.setAttribute('y', M.top);
      hit.setAttribute('width', step);
      hit.setAttribute('height', ih);
      hit.setAttribute('fill', 'transparent');
      hit.addEventListener('mousemove', (evt) => showTooltip(evt, p.title, p.tooltipValue));
      hit.addEventListener('mouseleave', hideTooltip);
      svg.appendChild(hit);

      if (i % labelEvery === 0) {
        const label = document.createElementNS(svg.namespaceURI, 'text');
        label.setAttribute('x', cx);
        label.setAttribute('y', H - 8);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '11');
        label.setAttribute('fill', mutedColor);
        label.textContent = p.label;
        svg.appendChild(label);
      }
    });

    container.appendChild(svg);
  }

  return { showTooltip, hideTooltip, barChart };
})();
