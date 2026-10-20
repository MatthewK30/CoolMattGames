// ─────────────────────────────────────────────
// CoolMattGames FX — ambient shader, cursor, tilt, reveals.
// Pure presentation: app.js owns data + behavior and calls CMGFX hooks.
// ─────────────────────────────────────────────
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var tint = [1.0, 0.17, 0.27];
  var tintTarget = tint.slice();

  function isLight() { return root.getAttribute('data-theme') === 'light'; }
  function hexToRgb(hex) {
    var h = (hex || '#ff2b45').replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    return [parseInt(h.slice(0, 2), 16) / 255 || 0, parseInt(h.slice(2, 4), 16) / 255 || 0, parseInt(h.slice(4, 6), 16) / 255 || 0];
  }

  // ── AURORA — domain-warped noise shader behind everything ──
  (function () {
    var canvas = document.getElementById('aurora');
    if (!canvas || reduced) return;
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) return;

    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision mediump float;',
      'uniform vec2 r;uniform float t;uniform vec3 tint;uniform vec2 m;uniform float s;',
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
      ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
      'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
      'void main(){',
      ' vec2 uv=gl_FragCoord.xy/r;vec2 p=(gl_FragCoord.xy-.5*r)/r.y;',
      ' float T=t*.045;',
      ' p.y+=s*.35;',
      ' vec2 q=vec2(fbm(p*1.3+T),fbm(p*1.3-T+4.));',
      ' vec2 w=vec2(fbm(p*1.6+q*1.8+vec2(1.7,9.2)+T*1.3),fbm(p*1.6+q*1.8+vec2(8.3,2.8)-T));',
      ' float f=fbm(p*1.1+w*1.6);',
      ' vec3 base=vec3(.02,.024,.04);',
      ' vec3 violet=vec3(.32,.12,.75);',
      ' vec3 col=base;',
      ' col=mix(col,violet*.55,smoothstep(.35,.9,w.y)*.55);',
      ' col=mix(col,tint*.95,smoothstep(.45,1.05,f)*.85);',
      ' col+=tint*pow(smoothstep(.55,1.,f*w.x*1.4),3.)*.5;',
      ' float md=length(uv-m);col+=tint*.08*smoothstep(.45,0.,md);',
      ' float vg=smoothstep(1.25,.25,length(uv-vec2(.6,.85)));',
      ' col*=mix(.35,1.,vg);',
      ' col*=1.-s*.35;',
      ' gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');

    function sh(type, src) {
      var o = gl.createShader(type);
      gl.shaderSource(o, src); gl.compileShader(o);
      return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null;
    }
    var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't');
    var uTint = gl.getUniformLocation(prog, 'tint'), uM = gl.getUniformLocation(prog, 'm'), uS = gl.getUniformLocation(prog, 's');

    // The field is soft, so a low-res buffer upscaled by CSS looks identical and costs ~1/10th.
    var SCALE = 0.32;
    function resize() {
      canvas.width = Math.max(2, Math.round(window.innerWidth * SCALE));
      canvas.height = Math.max(2, Math.round(window.innerHeight * SCALE));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    var mouse = [0.7, 0.6], mouseT = [0.7, 0.6];
    window.addEventListener('pointermove', function (e) {
      mouseT[0] = e.clientX / window.innerWidth;
      mouseT[1] = 1 - e.clientY / window.innerHeight;
    }, { passive: true });

    var start = performance.now(), last = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden || isLight() || document.body.classList.contains('playing')) return;
      if (now - last < 33) return; // ~30fps is plenty for a slow field
      last = now;
      for (var i = 0; i < 3; i++) tint[i] += (tintTarget[i] - tint[i]) * 0.04;
      mouse[0] += (mouseT[0] - mouse[0]) * 0.05;
      mouse[1] += (mouseT[1] - mouse[1]) * 0.05;
      var scroll = Math.min(1, window.scrollY / (window.innerHeight * 1.5));
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uT, (now - start) / 1000);
      gl.uniform3f(uTint, tint[0], tint[1], tint[2]);
      gl.uniform2f(uM, mouse[0], mouse[1]);
      gl.uniform1f(uS, scroll);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!canvas.classList.contains('ready')) canvas.classList.add('ready');
    }
    requestAnimationFrame(frame);
  })();

  function setTint(hex) {
    tintTarget = hexToRgb(hex);
    root.style.setProperty('--tint', hex);
  }

  // ── CURSOR — soft glow + ring that swells over anything clickable ──
  (function () {
    if (!finePointer) return;
    var x = -999, y = -999, gx = -999, gy = -999;
    window.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      root.style.setProperty('--dx', x + 'px');
      root.style.setProperty('--dy', y + 'px');
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var hit = e.target.closest && e.target.closest('a, button, .chip, .spot-dot, input, textarea');
      document.body.classList.toggle('cursor-hover', !!hit);
    });
    (function loop() {
      gx += (x - gx) * 0.12; gy += (y - gy) * 0.12;
      root.style.setProperty('--cx', gx.toFixed(1) + 'px');
      root.style.setProperty('--cy', gy.toFixed(1) + 'px');
      requestAnimationFrame(loop);
    })();
  })();

  // ── TILT — 3D lean + light position for cards (event-delegated) ──
  function bindTilt(selector, maxDeg) {
    if (!finePointer || reduced) return;
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest(selector);
      if (!el) return;
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      var target = el.classList.contains('spotlight') ? el.querySelector('.spotlight-slide.active') : el;
      if (!target) return;
      el.classList.add('tilting');
      target.style.setProperty('--ry', ((px - 0.5) * maxDeg).toFixed(2) + 'deg');
      target.style.setProperty('--rx', ((0.5 - py) * maxDeg).toFixed(2) + 'deg');
      target.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      target.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      target.style.setProperty('--hx', (px * 100).toFixed(1) + '%');
      target.style.setProperty('--hy', (py * 100).toFixed(1) + '%');
      target.style.setProperty('--px', ((0.5 - px) * 14).toFixed(1) + 'px');
      target.style.setProperty('--py', ((0.5 - py) * 14).toFixed(1) + 'px');
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      var el = e.target.closest && e.target.closest(selector);
      if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return;
      el.classList.remove('tilting');
      var targets = el.classList.contains('spotlight') ? el.querySelectorAll('.spotlight-slide') : [el];
      Array.prototype.forEach.call(targets, function (t) {
        ['--rx', '--ry', '--px', '--py'].forEach(function (p) { t.style.removeProperty(p); });
      });
    });
  }

  // ── MAGNETIC buttons ──
  (function () {
    if (!finePointer || reduced) return;
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (dx * 0.22).toFixed(1) + 'px,' + (dy * 0.32).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  })();

  // ── SPLIT hero headline into characters ──
  (function () {
    document.querySelectorAll('[data-split]').forEach(function (line, l) {
      var text = line.textContent;
      line.textContent = '';
      line.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(text, function (c, i) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        s.style.setProperty('--i', i);
        s.style.setProperty('--l', l);
        line.appendChild(s);
      });
    });
  })();

  // ── STATEMENT — words light up as you scroll past ──
  (function () {
    var el = document.getElementById('statement');
    if (!el) return;
    var HL = { 'scratch:': 1, 'scratch': 1, 'multiplayer,': 1, 'engines,': 1, 'art.': 1 };
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = '';
    var spans = words.map(function (w) {
      var s = document.createElement('span');
      s.className = 'w' + (HL[w.toLowerCase()] ? ' hl' : '');
      s.textContent = w;
      el.appendChild(s);
      el.appendChild(document.createTextNode(' '));
      return s;
    });
    function update() {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      var lit = Math.round(Math.max(0, Math.min(1, p)) * spans.length);
      for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('lit', i < lit);
    }
    if (reduced) { spans.forEach(function (s) { s.classList.add('lit'); }); return; }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  // ── REVEAL on scroll ──
  var revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
  function observeReveal(scope) {
    (scope || document).querySelectorAll('[data-reveal]:not(.in)').forEach(function (el) {
      if (revealObserver) revealObserver.observe(el); else el.classList.add('in');
    });
  }

  // ── HEADER — hides on scroll down, returns on scroll up ──
  (function () {
    var header = document.getElementById('site-header');
    if (!header) return;
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      header.classList.toggle('scrolled', y > 20);
      header.classList.toggle('hide', y > 400 && y > lastY + 4);
      if (y < lastY - 4 || y < 400) header.classList.remove('hide');
      lastY = y;
    }, { passive: true });
  })();

  // ── COUNT-UP for stat numbers ──
  function countTo(el, value) {
    if (!el) return;
    var to = parseInt(value, 10);
    var from = parseInt(el.dataset.v || '0', 10);
    if (isNaN(to)) { el.textContent = value; return; }
    el.dataset.v = to;
    if (reduced || from === to) { el.textContent = to; return; }
    var t0 = performance.now(), dur = 900;
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      k = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * k);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  // ── INTRO — once per tab session ──
  function playIntro(done) {
    var intro = document.getElementById('intro');
    var seen = false;
    try { seen = sessionStorage.getItem('cmg-intro') === '1'; sessionStorage.setItem('cmg-intro', '1'); } catch (e) {}
    if (!intro || seen || reduced) { done(); return; }
    var count = document.getElementById('intro-count');
    var bar = intro.querySelector('.intro-bar');
    intro.classList.add('on');
    var t0 = performance.now(), dur = 1100;
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - k, 2);
      var pct = Math.round(e * 100);
      if (count) count.textContent = ('00' + pct).slice(-3);
      if (bar) bar.style.setProperty('--p', pct + '%');
      if (k < 1) return requestAnimationFrame(step);
      intro.classList.add('out');
      setTimeout(done, 280);
      setTimeout(function () { intro.classList.remove('on', 'out'); }, 1100);
    })(t0);
  }

  window.CMGFX = {
    setTint: setTint,
    countTo: countTo,
    observeReveal: observeReveal,
    reduced: reduced
  };

  bindTilt('.game-card', 10);
  bindTilt('.spotlight', 8);

  function start() {
    playIntro(function () {
      document.body.classList.add('ready');
      var title = document.querySelector('.hero-title');
      if (title) requestAnimationFrame(function () { title.classList.add('in'); });
      observeReveal();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
