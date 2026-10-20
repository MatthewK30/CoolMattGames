// Session ID
var CMG_SID = (function () {
  var s = sessionStorage.getItem('cmg-sid');
  if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('cmg-sid', s); }
  return s;
})();

var FX = window.CMGFX || { setTint: function () {}, countTo: function (el, v) { if (el) el.textContent = v; }, observeReveal: function () {}, reduced: false };

function trackPlay(game) {
  fetch('/api/play', { method: 'POST', headers: { 'x-session-id': CMG_SID, 'x-game-id': game.id } }).catch(function () {});
}

// ─────────────────────────────────────────────
// ONLINE COUNTER
// ─────────────────────────────────────────────
(function () {
  var el = document.getElementById('player-count');
  var heroEl = document.getElementById('stat-online');
  function ping() {
    fetch('/api/ping', { method: 'POST', headers: { 'x-session-id': CMG_SID } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (el) el.textContent = d.players;
        FX.countTo(heroEl, d.players);
      })
      .catch(function () {});
  }
  ping();
  setInterval(ping, 20000);
})();

// ─────────────────────────────────────────────
// SPOTLIGHT DECK
// ─────────────────────────────────────────────
var spotlightTimer = null;
var SPOT_INTERVAL = 7000;
var STATIC_COVER_VERSION = '20261020-1';
function getGameColor(game) {
  return game.color || '#ff2b45';
}
function coverUrl(game) {
  if (game.coverImage) return game.coverImage;
  var url = 'images/' + game.id + '-cover.png';
  var version = game.coverVersion || STATIC_COVER_VERSION;
  if (version) url += '?v=' + encodeURIComponent(version);
  return url;
}
function arrowSvg(size) {
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
}
function pad2(n) { return (n < 10 ? '0' : '') + n; }

function initSpotlight(games) {
  var spot = document.getElementById('spotlight');
  var dotsHost = document.getElementById('spot-dots');
  var indexEl = document.getElementById('spot-index');
  var progress = spot && spot.querySelector('.spot-progress');
  if (!spot) return;
  if (spotlightTimer) clearTimeout(spotlightTimer);
  if (dotsHost) dotsHost.innerHTML = '';
  spot.querySelectorAll('.spotlight-slide').forEach(function (s) { s.remove(); });

  // Featured first, then the rest
  var ordered = games.slice().sort(function (a, b) {
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  }).slice(0, 4);

  ordered.forEach(function (game, i) {
    var slide = document.createElement('div');
    slide.className = 'spotlight-slide';
    slide.dataset.idx = i;
    slide.style.setProperty('--c', getGameColor(game));

    var img = document.createElement('div');
    img.className = 'spotlight-img';
    img.style.backgroundImage = "url('" + coverUrl(game) + "'), linear-gradient(135deg, " + getGameColor(game) + "44, #07090d)";
    // probe in case the image 404s — fall back to a painted canvas
    (function (slideEl, g) {
      var probe = new Image();
      probe.onerror = function () {
        var canvas = document.createElement('canvas');
        canvas.width = 600; canvas.height = 700;
        drawPlaceholder(canvas, getGameColor(g), g.name);
        slideEl.insertBefore(canvas, slideEl.firstChild);
        slideEl.querySelector('.spotlight-img').style.display = 'none';
      };
      probe.src = coverUrl(g);
    })(slide, game);

    var body = document.createElement('div');
    body.className = 'spot-body';

    var tags = document.createElement('div');
    tags.className = 'spot-tags';
    var hot = document.createElement('span');
    hot.className = 'spot-tag hot';
    hot.textContent = i === 0 ? 'NOW PLAYING' : 'FEATURED';
    tags.appendChild(hot);
    (game.tags || []).slice(0, 2).forEach(function (t) {
      var s = document.createElement('span');
      s.className = 'spot-tag';
      s.textContent = t;
      tags.appendChild(s);
    });

    var name = document.createElement('div');
    name.className = 'spot-name';
    name.textContent = game.name;

    var desc = document.createElement('div');
    desc.className = 'spot-desc';
    desc.textContent = game.description;

    var meta = document.createElement('div');
    meta.className = 'spot-meta';
    var by = document.createElement('span');
    by.textContent = 'BY ' + game.creator;
    var live = document.createElement('span');
    live.dataset.gameBadgeSpot = game.id;
    live.textContent = '-- LIVE';
    var cta = document.createElement('span');
    cta.className = 'play-cta';
    cta.innerHTML = 'PLAY ' + arrowSvg(14);
    meta.append(by, document.createTextNode('·'), live, cta);

    body.append(tags, name, desc, meta);
    slide.append(img, body);
    spot.appendChild(slide);

    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'spot-dot';
    dot.setAttribute('aria-label', 'Show ' + game.name);
    dot.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      go(i);
    });
    if (dotsHost) dotsHost.appendChild(dot);
  });

  var current = -1;
  var slides = spot.querySelectorAll('.spotlight-slide');
  var dots = dotsHost ? dotsHost.querySelectorAll('.spot-dot') : [];
  var hovering = false;

  function schedule() {
    if (spotlightTimer) clearTimeout(spotlightTimer);
    if (slides.length < 2) return;
    spotlightTimer = setTimeout(function () {
      if (hovering) return schedule();
      go(current + 1);
    }, SPOT_INTERVAL);
  }
  function go(i) {
    if (!slides.length) return;
    var prev = current;
    current = (i + slides.length) % slides.length;
    slides.forEach(function (s, j) {
      var rel = (j - current + slides.length) % slides.length;
      s.classList.remove('active', 'next', 'next2', 'leaving');
      if (rel === 0) s.classList.add('active');
      else if (rel === 1) s.classList.add('next');
      else if (rel === 2) s.classList.add('next2');
      if (j === prev && prev !== current) {
        s.classList.add('leaving');
        setTimeout(function () { s.classList.remove('leaving'); }, 800);
      }
    });
    dots.forEach(function (d, j) { d.classList.toggle('active', j === current); });
    if (indexEl) indexEl.textContent = pad2(current + 1) + ' / ' + pad2(slides.length);
    FX.setTint(getGameColor(ordered[current]));
    if (progress && slides.length > 1) {
      progress.classList.remove('run');
      void progress.offsetWidth;
      progress.style.setProperty('--dur', SPOT_INTERVAL + 'ms');
      progress.classList.add('run');
    }
    schedule();
  }
  go(0);

  spot.onmouseenter = function () { hovering = true; };
  spot.onmouseleave = function () { hovering = false; };
  spot.onclick = function (e) {
    var g = ordered[current];
    if (!g) return;
    e.preventDefault();
    trackPlay(g);
    openGameOverlay(g.url, g, e);
  };
}

// ─────────────────────────────────────────────
// TICKER
// ─────────────────────────────────────────────
function initTicker(games) {
  var track = document.getElementById('ticker-track');
  if (!track) return;
  var msgs = [];
  games.forEach(function (g) {
    msgs.push(g.name);
  });
  msgs.push('FREE TO PLAY');
  msgs.push('NO ADS · NO PAY-TO-WIN');
  msgs.push('BUILT FROM SCRATCH');

  var html = '';
  for (var i = 0; i < 2; i++) {
    msgs.forEach(function (m) {
      var safe = m.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
      html += '<span>' + safe + '</span><span class="star">✦</span>';
    });
  }
  track.innerHTML = html;
}

// ─────────────────────────────────────────────
// CARD GENERATION
// ─────────────────────────────────────────────
function buildCard(game, index, totalIndex) {
  const card = document.createElement('a');
  card.className = 'game-card' + (game.featured ? ' wide' : '');
  card.href = game.url;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.dataset.index = totalIndex;
  card.dataset.gameId = game.id;
  card.dataset.tags = (game.tags || []).join('|').toLowerCase();
  card.style.setProperty('--c', getGameColor(game));
  if (game.custom) card.dataset.custom = 'true';

  // Thumb wrapper
  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'card-thumb-wrap';

  const img = document.createElement('img');
  img.className = 'card-thumb-img';
  img.alt = game.name;
  img.loading = 'lazy';

  // Fallback if image missing — paint a colorful placeholder
  img.addEventListener('error', function () {
    var canvas = document.createElement('canvas');
    canvas.className = 'card-thumb-img';
    canvas.width = 640; canvas.height = 400;
    thumbWrap.replaceChild(canvas, img);
    drawPlaceholder(canvas, getGameColor(game), game.name);
  });
  img.src = coverUrl(game);

  // Badges
  const badges = document.createElement('div');
  badges.className = 'card-badges';
  if (game.featured) {
    const b = document.createElement('span');
    b.className = 'card-badge hot';
    b.textContent = 'HOT';
    badges.appendChild(b);
  }
  if (game.custom) {
    const b = document.createElement('span');
    b.className = 'card-badge new';
    b.textContent = 'NEW';
    badges.appendChild(b);
  }

  // Player strip
  const playerStrip = document.createElement('span');
  playerStrip.className = 'card-player-strip';
  playerStrip.dataset.gameBadge = game.id;
  playerStrip.innerHTML = '<span class="dot"></span><span>-- LIVE</span>';

  // Hover overlay
  const overlay = document.createElement('div');
  overlay.className = 'card-thumb-overlay';
  const playPill = document.createElement('span');
  playPill.className = 'card-play-pill';
  playPill.innerHTML = 'PLAY NOW ' + arrowSvg(14);
  overlay.appendChild(playPill);

  thumbWrap.append(img, badges, playerStrip, overlay);

  // Body
  const body = document.createElement('div');
  body.className = 'card-body';
  const top = document.createElement('div');
  top.className = 'card-top';
  const name = document.createElement('div');
  name.className = 'card-name';
  name.textContent = game.name;
  const badge = document.createElement('div');
  badge.className = 'creator-badge';
  badge.textContent = 'BY ' + game.creator;
  top.append(name, badge);

  const desc = document.createElement('div');
  desc.className = 'card-desc';
  desc.textContent = game.description;

  const tags = document.createElement('div');
  tags.className = 'card-tags';
  (game.tags || []).forEach(function (t) {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = t;
    tags.appendChild(span);
  });

  body.append(top, desc, tags);

  const glow = document.createElement('div');
  glow.className = 'card-glow';

  card.append(thumbWrap, body, glow);

  card.addEventListener('click', function (e) {
    e.preventDefault();
    trackPlay(game);
    openGameOverlay(game.url, game, e);
  });

  return card;
}

function buildComingSoon(index) {
  const card = document.createElement('div');
  card.className = 'coming-soon-card';
  card.dataset.index = index;

  const thumb = document.createElement('div');
  thumb.className = 'cs-thumb';
  thumb.innerHTML = '<span class="cs-label">COMING SOON</span><small class="cs-sub">IN THE LAB</small>';

  const body = document.createElement('div');
  body.className = 'cs-body';
  body.innerHTML = '<div class="cs-name">??????????</div><div class="cs-desc">Something new is brewing...</div>';

  card.append(thumb, body);
  return card;
}

function drawPlaceholder(canvas, color, name) {
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var hex = (color || '#ff2b45').replace('#', '');
  var r = parseInt(hex.slice(0,2),16)||255, g = parseInt(hex.slice(2,4),16)||43, b = parseInt(hex.slice(4,6),16)||69;
  var rgb = r + ',' + g + ',' + b;

  ctx.fillStyle = '#07080d'; ctx.fillRect(0, 0, W, H);
  // perspective floor grid
  ctx.strokeStyle = 'rgba(' + rgb + ',0.22)';
  ctx.lineWidth = 1;
  var horizon = H * 0.58;
  for (var i = -12; i <= 12; i++) {
    ctx.beginPath(); ctx.moveTo(W / 2 + i * 8, horizon); ctx.lineTo(W / 2 + i * W * 0.18, H); ctx.stroke();
  }
  for (var k = 1; k < 10; k++) {
    var y = horizon + (H - horizon) * Math.pow(k / 10, 1.8);
    ctx.globalAlpha = k / 10; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // sun
  var sun = ctx.createRadialGradient(W/2, horizon, 0, W/2, horizon, H * 0.7);
  sun.addColorStop(0, 'rgba(' + rgb + ',0.55)');
  sun.addColorStop(0.35, 'rgba(' + rgb + ',0.12)');
  sun.addColorStop(1, 'transparent');
  ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
  // text
  var fs = Math.max(18, Math.round(Math.min(W, H) * 0.13));
  ctx.font = '900 ' + fs + 'px "Unbounded", sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(' + rgb + ',0.9)'; ctx.shadowBlur = 30;
  var words = name.split(' ');
  var cy = H * 0.42;
  if (words.length <= 2) {
    ctx.fillText(name, W/2, cy);
  } else {
    var mid = Math.ceil(words.length / 2);
    ctx.fillText(words.slice(0, mid).join(' '), W/2, cy - fs * 0.6);
    ctx.fillText(words.slice(mid).join(' '), W/2, cy + fs * 0.6);
  }
  ctx.shadowBlur = 0;
}

// ─────────────────────────────────────────────
// FILTER CHIPS
// ─────────────────────────────────────────────
var currentFilter = 'all';
function moveChipIndicator() {
  var host = document.getElementById('filters');
  var ind = host && host.querySelector('.chip-ind');
  var active = host && host.querySelector('.chip.active');
  if (!ind || !active) return;
  ind.style.width = active.offsetWidth + 'px';
  ind.style.transform = 'translateX(' + active.offsetLeft + 'px)';
}
window.addEventListener('resize', moveChipIndicator);

function buildFilters(games) {
  var host = document.getElementById('filters');
  var counts = { all: games.length };
  games.forEach(function (g) {
    (g.tags || []).forEach(function (t) {
      var k = t.toLowerCase();
      counts[k] = (counts[k] || 0) + 1;
    });
  });
  var entries = Object.keys(counts).filter(function (k) { return k !== 'all'; });
  entries.sort(function (a, b) { return counts[b] - counts[a]; });
  var chips = [{ key: 'all', label: 'ALL' }].concat(entries.map(function (k) {
    return { key: k, label: k.toUpperCase() };
  }));

  host.innerHTML = '<span class="chip-ind" aria-hidden="true"></span>';
  chips.forEach(function (c) {
    var btn = document.createElement('button');
    btn.className = 'chip' + (c.key === 'all' ? ' active' : '');
    btn.dataset.filter = c.key;
    btn.textContent = c.label;
    var count = document.createElement('span');
    count.className = 'count';
    count.textContent = counts[c.key];
    btn.appendChild(count);
    btn.addEventListener('click', function () {
      currentFilter = c.key;
      host.querySelectorAll('.chip').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      moveChipIndicator();
      applyFilter();
    });
    host.appendChild(btn);
  });
  requestAnimationFrame(moveChipIndicator);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveChipIndicator);
}

function applyFilter() {
  var cards = document.querySelectorAll('.game-card');
  var visible = 0;
  cards.forEach(function (c) {
    var tags = (c.dataset.tags || '').split('|');
    var show = currentFilter === 'all' || tags.indexOf(currentFilter) !== -1;
    c.style.display = show ? '' : 'none';
    if (show) {
      visible++;
      c.classList.remove('filter-in');
      void c.offsetWidth;
      c.style.animationDelay = (visible * 45) + 'ms';
      c.classList.add('filter-in', 'animate-in');
    }
  });
  // Hide coming-soon when filtering
  document.querySelectorAll('.coming-soon-card').forEach(function (c) {
    c.style.display = currentFilter === 'all' ? '' : 'none';
  });
}

// ─────────────────────────────────────────────
// CREATOR CARDS
// ─────────────────────────────────────────────
function buildCreators(games) {
  var host = document.getElementById('creator-cards');
  if (!host) return;
  var creators = {};
  games.forEach(function (g) {
    var c = g.creator || 'UNKNOWN';
    if (!creators[c]) creators[c] = { name: c, games: [], };
    creators[c].games.push(g);
  });
  var arr = Object.values(creators).sort(function (a, b) { return b.games.length - a.games.length; });
  var ghMap = { 'MATTHEW': 'MatthewK30', 'AARUSH': 'doubleA-Digital', 'MATTEEN': 'matteensekander' };
  var colorMap = { 'MATTHEW': '', 'AARUSH': 'cyan', 'MATTEEN': 'violet' };
  host.innerHTML = '';
  arr.forEach(function (c, i) {
    var row = document.createElement('div');
    row.className = 'creator-row ' + (colorMap[c.name] || '');
    row.setAttribute('data-reveal', '');
    row.style.transitionDelay = (i * 90) + 'ms';
    var gh = ghMap[c.name];

    var avatar = document.createElement('div');
    avatar.className = 'creator-avatar';
    avatar.textContent = c.name.charAt(0);
    var info = document.createElement('div');
    var nameEl = document.createElement('div');
    nameEl.className = 'creator-name';
    nameEl.textContent = c.name;
    var stats = document.createElement('div');
    stats.className = 'creator-stats';
    stats.textContent = c.games.length + ' GAME' + (c.games.length === 1 ? '' : 'S') + ' SHIPPED';
    info.append(nameEl, stats);
    row.append(avatar, info);

    if (gh) {
      var link = document.createElement('a');
      link.href = 'https://github.com/' + gh;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'gh-link';
      link.setAttribute('aria-label', 'GitHub of ' + c.name);
      link.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>';
      row.appendChild(link);
    }
    host.appendChild(row);
  });
  FX.observeReveal(host);
}

// ─────────────────────────────────────────────
// CUSTOM GAME STORAGE
// ─────────────────────────────────────────────
var ADMIN_SESSION_KEY = 'cmg-admin-session';
var storedGames = [];
var activeGames = [];
function renderAdminGameList() {}

async function fetchCustomGames() {
  try {
    var data = await (await fetch('/api/custom-games')).json();
    return Array.isArray(data) ? data : [];
  }
  catch (e) { return []; }
}

function mergeLibrary(gistGames) {
  var localIds = {};
  var map = {};
  var order = [];
  GAMES.forEach(function (game) {
    localIds[game.id] = true;
    map[game.id] = Object.assign({}, game);
    order.push(game.id);
  });
  (gistGames || []).forEach(function (game) {
    if (!game || !game.id) return;
    if (game.removed) {
      delete map[game.id];
      if (order.indexOf(game.id) === -1) order.push(game.id);
      return;
    }
    var merged = Object.assign({}, map[game.id] || {}, game);
    merged.custom = !localIds[game.id] || !!game.custom;
    if (order.indexOf(game.id) === -1) order.push(game.id);
    map[game.id] = merged;
  });
  return order.filter(function (id) { return !!map[id]; }).map(function (id) { return map[id]; });
}

function updateLibraryCount(total) {
  var countEl = document.getElementById('games-count');
  if (countEl) countEl.textContent = '— ' + total + ' game' + (total === 1 ? '' : 's') + ' in the library';
  FX.countTo(document.getElementById('stat-games'), total);
  var kicker = document.getElementById('kicker-games');
  if (kicker) kicker.textContent = total;
}

// Cards rise in as they scroll into view, staggered per batch
var cardObserver = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
  var batch = entries.filter(function (en) { return en.isIntersecting; });
  batch.forEach(function (en, i) {
    setTimeout(function () { en.target.classList.add('animate-in'); }, i * 90);
    cardObserver.unobserve(en.target);
  });
}, { threshold: 0.08 }) : null;

function animateCards() {
  document.querySelectorAll('.game-card, .coming-soon-card').forEach(function (card) {
    if (cardObserver) cardObserver.observe(card);
    else card.classList.add('animate-in');
  });
}

function renderGrid(games) {
  var grid = document.getElementById('games-grid');
  if (!grid) return;
  grid.innerHTML = '';
  // Featured games take the wide slots up top so the bento rows fill cleanly
  var featured = games.filter(function (g) { return g.featured; });
  var rest = games.filter(function (g) { return !g.featured; });
  featured.concat(rest).forEach(function (game, i) {
    grid.appendChild(buildCard(game, i, i));
  });
  grid.appendChild(buildComingSoon(games.length));
  grid.appendChild(buildComingSoon(games.length + 1));
  animateCards();
}

async function refreshLibrary() {
  storedGames = await fetchCustomGames();
  activeGames = mergeLibrary(storedGames);
  currentFilter = 'all';
  renderGrid(activeGames);
  initSpotlight(activeGames);
  initTicker(activeGames);
  buildFilters(activeGames);
  buildCreators(activeGames);
  updateLibraryCount(activeGames.length);
  renderAdminGameList();
  fetchStats();
}

// ─────────────────────────────────────────────
// PER-GAME PLAYER COUNTS
// ─────────────────────────────────────────────
function fetchStats() {
  fetch('/api/stats')
    .then(function (r) { return r.json(); })
    .then(function (stats) {
      for (var id in stats) {
        var span = document.querySelector('[data-game-badge="' + id + '"] span:last-child');
        if (span) span.textContent = stats[id] + ' LIVE';
        var spot = document.querySelector('[data-game-badge-spot="' + id + '"]');
        if (spot) spot.textContent = stats[id] + ' LIVE';
      }
    })
    .catch(function () {});
}
setInterval(fetchStats, 30000);

// ─────────────────────────────────────────────
// BUILD GRID
// ─────────────────────────────────────────────
(async function () {
  await refreshLibrary();
})();

// ─────────────────────────────────────────────
// ADMIN PORTAL
// ─────────────────────────────────────────────
(function () {
  var portalBtn = document.getElementById('admin-portal-btn');
  var loginOverlay = document.getElementById('admin-login-overlay');
  var dashboardOverlay = document.getElementById('admin-dashboard-overlay');
  var loginForm = document.getElementById('admin-login-form');
  var passwordInput = document.getElementById('admin-password');
  var loginError = document.getElementById('admin-login-error');
  var gameForm = document.getElementById('admin-game-form');
  var gameIdInput = document.getElementById('admin-game-id');
  var nameInput = document.getElementById('admin-name');
  var descInput = document.getElementById('admin-desc');
  var urlInput = document.getElementById('admin-url');
  var creatorInput = document.getElementById('admin-creator');
  var tagsInput = document.getElementById('admin-tags');
  var formState = document.getElementById('admin-form-state');
  var submitBtn = document.getElementById('admin-submit');
  var precomputeBtn = document.getElementById('admin-precompute-covers');
  var saveError = document.getElementById('admin-save-error');

  function getAdminToken() { return localStorage.getItem(ADMIN_SESSION_KEY); }
  function setAdminToken(token) { localStorage.setItem(ADMIN_SESSION_KEY, token); }
  function clearAdminToken() { localStorage.removeItem(ADMIN_SESSION_KEY); }

  function openModal(overlay) {
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('open'); });
  }

  function closeModal(overlay) {
    overlay.classList.remove('open');
    setTimeout(function () { if (!overlay.classList.contains('open')) overlay.hidden = true; }, 220);
  }

  function openLogin() {
    loginError.hidden = true;
    passwordInput.value = '';
    openModal(loginOverlay);
    setTimeout(function () { passwordInput.focus(); }, 100);
  }

  function closeLogin() { closeModal(loginOverlay); }

  async function hasValidAdminSession() {
    if (!getAdminToken()) return false;
    try {
      var r = await fetch('/api/admin/session', { headers: { 'x-admin-session': getAdminToken() } });
      if (r.ok) return true;
    } catch (e) {}
    clearAdminToken();
    return false;
  }

  async function openDashboard() {
    if (!(await hasValidAdminSession())) return openLogin();
    renderAdminGameList();
    openModal(dashboardOverlay);
  }

  function closeDashboard() { closeModal(dashboardOverlay); }

  async function adminRequest(url, options) {
    options = options || {};
    options.headers = Object.assign({}, options.headers || {}, { 'x-admin-session': getAdminToken() || '' });
    var r = await fetch(url, options);
    if (r.status === 401) {
      clearAdminToken();
      closeDashboard();
      openLogin();
      throw new Error('Unauthorized');
    }
    if (!r.ok) throw new Error('Request failed');
    return r.json();
  }

  function findGame(id) {
    return activeGames.find(function (game) { return game.id === id; });
  }

  function slugify(name) {
    return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'custom-game';
  }

  function newGameId(name) {
    var base = slugify(name);
    var ids = {};
    activeGames.concat(storedGames).forEach(function (game) { if (game && game.id) ids[game.id] = true; });
    return ids[base] ? base + '-' + Date.now() : base;
  }

  function parseTags(value) {
    return (value || '').split(',').map(function (tag) {
      return tag.trim().toUpperCase();
    }).filter(Boolean);
  }

  function resetGameForm() {
    gameForm.reset();
    gameIdInput.value = '';
    formState.textContent = 'ADDING NEW GAME';
    submitBtn.textContent = 'ADD GAME';
    saveError.hidden = true;
  }

  function editGame(game) {
    gameIdInput.value = game.id;
    nameInput.value = game.name || '';
    descInput.value = game.description || '';
    urlInput.value = game.url || '';
    creatorInput.value = game.creator || '';
    tagsInput.value = (game.tags || []).join(', ');
    formState.textContent = 'EDITING ' + (game.name || game.id);
    submitBtn.textContent = 'SAVE GAME';
    saveError.hidden = true;
    nameInput.focus();
  }

  function buildGameFromForm(existing) {
    var url = urlInput.value.trim();
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
    return {
      id: existing ? existing.id : newGameId(nameInput.value),
      name: nameInput.value.trim().toUpperCase(),
      description: descInput.value.trim(),
      url: url,
      creator: creatorInput.value.trim().toUpperCase(),
      tags: parseTags(tagsInput.value),
      featured: existing ? !!existing.featured : false,
      custom: existing ? !!existing.custom : true
    };
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    loginError.hidden = true;
    var r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput.value })
    });
    if (!r.ok) {
      loginError.hidden = false;
      return;
    }
    var data = await r.json();
    setAdminToken(data.token);
    closeLogin();
    await openDashboard();
  });

  gameForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    saveError.hidden = true;
    var existing = gameIdInput.value ? findGame(gameIdInput.value) : null;
    var game = buildGameFromForm(existing);
    try {
      if (existing) {
        await adminRequest('/api/custom-games/' + encodeURIComponent(existing.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(game)
        });
      } else {
        await adminRequest('/api/custom-games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(game)
        });
      }
      resetGameForm();
      await refreshLibrary();
    } catch (err) {
      saveError.hidden = false;
    }
  });

  document.getElementById('admin-reset-form').addEventListener('click', resetGameForm);
  precomputeBtn.addEventListener('click', async function () {
    saveError.hidden = true;
    precomputeBtn.disabled = true;
    precomputeBtn.textContent = 'PRECOMPUTING...';
    try {
      var seen = {};
      var ids = [];
      storedGames.forEach(function (game) {
        if (!game || game.removed || !game.id || !game.url || game.coverImage || seen[game.id]) return;
        seen[game.id] = true;
        ids.push(game.id);
      });
      var updated = 0;
      var failed = 0;
      for (var i = 0; i < ids.length; i++) {
        precomputeBtn.textContent = 'PRECOMPUTING ' + (i + 1) + '/' + ids.length;
        var result = await adminRequest('/api/custom-games/precompute-covers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ids[i] })
        });
        updated += result.updated || 0;
        failed += result.failed || 0;
      }
      precomputeBtn.textContent = failed ? 'UPDATED ' + updated + ' / FAILED ' + failed : 'UPDATED ' + updated;
      await refreshLibrary();
      setTimeout(function () { precomputeBtn.textContent = 'PRECOMPUTE COVERS'; }, 1600);
    } catch (err) {
      saveError.hidden = false;
      precomputeBtn.textContent = 'PRECOMPUTE COVERS';
    } finally {
      precomputeBtn.disabled = false;
    }
  });
  document.getElementById('admin-login-cancel').addEventListener('click', closeLogin);
  document.getElementById('admin-logout').addEventListener('click', function () {
    clearAdminToken();
    resetGameForm();
    closeDashboard();
  });
  portalBtn.addEventListener('click', async function () { getAdminToken() ? await openDashboard() : openLogin(); });
  loginOverlay.addEventListener('click', function (e) { if (e.target === loginOverlay) closeLogin(); });
  dashboardOverlay.addEventListener('click', function (e) { if (e.target === dashboardOverlay) closeDashboard(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (loginOverlay.classList.contains('open')) closeLogin();
    if (dashboardOverlay.classList.contains('open')) closeDashboard();
  });

  renderAdminGameList = function () {
    var list = document.getElementById('admin-game-list');
    if (!list || !getAdminToken()) return;
    list.innerHTML = '';
    activeGames.forEach(function (game) {
      var row = document.createElement('div');
      row.className = 'admin-game-row';
      var info = document.createElement('div');
      info.className = 'admin-game-info';
      var name = document.createElement('div');
      name.className = 'admin-game-name';
      name.textContent = game.name;
      var meta = document.createElement('div');
      meta.className = 'admin-game-meta';
      meta.textContent = 'BY ' + game.creator + ' · ' + (game.tags || []).join(', ');
      info.append(name, meta);
      var actions = document.createElement('div');
      actions.className = 'admin-game-actions';
      var edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'admin-row-btn';
      edit.textContent = 'EDIT';
      edit.addEventListener('click', function () { editGame(game); });
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'admin-row-btn danger';
      remove.textContent = 'REMOVE';
      remove.addEventListener('click', async function () {
        if (!confirm('Remove ' + game.name + '?')) return;
        try {
          await adminRequest('/api/custom-games/' + encodeURIComponent(game.id), { method: 'DELETE' });
          resetGameForm();
          await refreshLibrary();
        } catch (err) {
          saveError.hidden = false;
        }
      });
      actions.append(edit, remove);
      row.append(info, actions);
      list.appendChild(row);
    });
  };
})();

// ─────────────────────────────────────────────
// THEME TOGGLE
// ─────────────────────────────────────────────
(function () {
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  var html = document.documentElement;
  var transitionTimer;
  btn.addEventListener('click', function () {
    // Trigger smooth crossfade for ~450ms
    html.classList.add('theme-transitioning');
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(function () {
      html.classList.remove('theme-transitioning');
    }, 480);

    var isLight = html.getAttribute('data-theme') === 'light';
    if (isLight) {
      html.removeAttribute('data-theme');
      localStorage.setItem('cmg-theme', 'dark');
    } else {
      html.setAttribute('data-theme', 'light');
      localStorage.setItem('cmg-theme', 'light');
    }
  });
})();

// ─────────────────────────────────────────────
// GAME OVERLAY — circle-wipes open from wherever you clicked
// ─────────────────────────────────────────────
(function () {
  var overlay = document.getElementById('game-overlay');
  var frame   = document.getElementById('game-frame');
  var closeBtn = document.getElementById('game-overlay-close');
  var loadingName = document.getElementById('game-loading-name');
  var lastFocus = null;
  var loadTimer = null;

  frame.addEventListener('load', function () {
    if (frame.getAttribute('src')) overlay.classList.add('loaded');
  });

  function openGameOverlay(url, game, evt) {
    lastFocus = document.activeElement;
    var x = evt && evt.clientX ? evt.clientX : window.innerWidth / 2;
    var y = evt && evt.clientY ? evt.clientY : window.innerHeight / 2;
    overlay.style.setProperty('--ox', x + 'px');
    overlay.style.setProperty('--oy', y + 'px');
    overlay.style.setProperty('--c', game ? getGameColor(game) : 'var(--accent)');
    if (loadingName) loadingName.textContent = game ? game.name : '';
    overlay.classList.remove('loaded');
    frame.src = url;
    overlay.classList.add('open');
    document.body.classList.add('playing');
    document.body.style.overflow = 'hidden';
    // Some hosts never fire load for cross-origin frames in time; don't trap people on the loader
    clearTimeout(loadTimer);
    loadTimer = setTimeout(function () { overlay.classList.add('loaded'); }, 8000);
    setTimeout(function () { closeBtn.focus({ preventScroll: true }); }, 400);
  }
  function closeGameOverlay() {
    clearTimeout(loadTimer);
    overlay.classList.remove('open');
    document.body.classList.remove('playing');
    document.body.style.overflow = '';
    setTimeout(function () {
      if (!overlay.classList.contains('open')) { frame.src = ''; overlay.classList.remove('loaded'); }
    }, 850);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  window.openGameOverlay = openGameOverlay;
  closeBtn.addEventListener('click', closeGameOverlay);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeGameOverlay();
  });
})();
