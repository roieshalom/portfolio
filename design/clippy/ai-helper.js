/*
 * AI helper concept, Clippy edition.
 * A Windows 9x style paperclip assistant that answers questions about Roie.
 * Chat logic is unchanged: it asks chat.php (real LLM) and falls back to
 * local keyword matching over knowledge.json when the backend is unreachable.
 */
(function () {
  "use strict";

  var KB = null;
  var BASE = "/design/clippy/";
  var ENDPOINT = BASE + "chat.php";
  var history = []; // {role, content} sent to the backend for context

  // The paperclip himself: Clippy 4.0.
  // Shape: a closed outer pill + an open-bottom inner loop, matching a real
  // Gem clip. Body is filled with a holographic chrome gradient that slowly
  // rotates (the "moving/floating" sheen). Eye parts carry classes so the JS
  // can blink them and track the cursor.
  var CLIPPY_SVG = `
    <svg viewBox="0 0 100 220" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="aihChrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f2f8ff"/>
          <stop offset="0.26" stop-color="#8fd0ff"/>
          <stop offset="0.5" stop-color="#3f7fc4"/>
          <stop offset="0.74" stop-color="#a7ecff"/>
          <stop offset="1" stop-color="#173a63"/>
          <animateTransform attributeName="gradientTransform" type="rotate"
            from="0 0.5 0.5" to="360 0.5 0.5" dur="9s" repeatCount="indefinite"/>
        </linearGradient>
        <radialGradient id="aihEye" cx="0.4" cy="0.34" r="0.8">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="1" stop-color="#d6e6f2"/>
        </radialGradient>
        <filter id="aihGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g fill="none" stroke-linecap="round">
        <!-- soft cyan LED halo behind -->
        <rect x="22" y="16" width="56" height="188" rx="28" stroke="#35e8ff" stroke-width="13" opacity="0.30" filter="url(#aihGlow)"/>
        <path d="M34 152 V90 a16 16 0 0 1 32 0 V152" stroke="#35e8ff" stroke-width="13" opacity="0.30" filter="url(#aihGlow)"/>
        <!-- chrome body: outer closed pill + inner open loop -->
        <rect x="22" y="16" width="56" height="188" rx="28" stroke="url(#aihChrome)" stroke-width="13"/>
        <path d="M34 152 V90 a16 16 0 0 1 32 0 V152" stroke="url(#aihChrome)" stroke-width="13"/>
        <!-- specular sheen line down the tube -->
        <rect x="22" y="16" width="56" height="188" rx="28" stroke="#ffffff" stroke-width="2.6" opacity="0.45"/>
        <path d="M34 152 V90 a16 16 0 0 1 32 0 V152" stroke="#ffffff" stroke-width="2.6" opacity="0.45"/>
      </g>
      <!-- eyebrows (dark) -->
      <g fill="none" stroke="#0c1622" stroke-width="3.8" stroke-linecap="round">
        <path d="M34,96 Q42,88 50,95"/>
        <path d="M50,95 Q58,88 66,96"/>
      </g>
      <!-- eyes (blink + cursor tracking hooks) -->
      <g class="aih-eyes">
        <ellipse class="aih-eyeball aih-eyeball-l" cx="42" cy="107" rx="8" ry="9" fill="url(#aihEye)" stroke="#20364a" stroke-width="1.5"/>
        <ellipse class="aih-eyeball aih-eyeball-r" cx="58" cy="107" rx="8" ry="9" fill="url(#aihEye)" stroke="#20364a" stroke-width="1.5"/>
        <g class="aih-pupil aih-pupil-l">
          <circle cx="42" cy="108" r="4.2" fill="#0c1f30"/>
          <circle cx="43.6" cy="106.3" r="1.4" fill="#7ff0ff"/>
          <circle cx="40.7" cy="109.4" r="0.8" fill="#ffffff" opacity="0.85"/>
        </g>
        <g class="aih-pupil aih-pupil-r">
          <circle cx="58" cy="108" r="4.2" fill="#0c1f30"/>
          <circle cx="59.6" cy="106.3" r="1.4" fill="#7ff0ff"/>
          <circle cx="56.7" cy="109.4" r="0.8" fill="#ffffff" opacity="0.85"/>
        </g>
      </g>
    </svg>
  `;

  var STYLES = `
    .aih-clippy {
      position: fixed; right: 18px; bottom: 12px; z-index: 10000;
      width: 96px; height: 138px; padding: 0; border: none; background: none;
      cursor: pointer; filter: drop-shadow(2px 5px 5px rgba(20,50,90,0.32));
      transition: transform 0.15s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .aih-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    .aih-clippy:hover { transform: translateY(-2px) rotate(-3deg); }
    .aih-clippy:active { transform: translateY(0) rotate(0); }
    .aih-clippy:focus-visible { outline: 2px dotted #1084d0; outline-offset: 3px; }

    /* The site has a global button:hover that paints buttons pink. Neutralize
       it for all of the widget's buttons so nothing turns pink on hover. */
    .aih-clippy, .aih-clippy:hover, .aih-clippy:focus {
      background: none; box-shadow: none;
      filter: drop-shadow(2px 5px 5px rgba(20,50,90,0.32));
    }
    .aih-chip:hover, .aih-chip:focus { background: none; box-shadow: none; filter: none; }
    .aih-close:hover, .aih-close:focus,
    .aih-send:hover, .aih-send:focus { background: #c0c0c0; box-shadow: none; filter: brightness(0.96); }

    /* gentle idle bob; the "gentle-pulse" nod to the 4.0 motion language */
    .aih-clippy svg { animation: aih-float 4.6s ease-in-out infinite; transform-origin: 50% 70%; }
    @keyframes aih-float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-3px) rotate(-1.6deg); }
    }
    /* blink: squash the eyes vertically about their own center */
    .aih-eyes { transform-box: view-box; transform-origin: 50px 107px; transition: transform 0.09s ease; }
    .aih-eyes.aih-blink { transform: scaleY(0.08); }
    /* pupils ease toward the cursor */
    .aih-pupil { transition: transform 0.12s ease-out; }

    @media (prefers-reduced-motion: reduce) {
      .aih-clippy svg { animation: none; }
    }

    /* little "psst" invite that pops from Clippy until first opened */
    .aih-tip {
      position: fixed; right: 118px; bottom: 118px; z-index: 10000;
      max-width: 190px; padding: 8px 11px;
      font-family: Tahoma, 'MS Sans Serif', Geneva, sans-serif; font-size: 12px; line-height: 1.35;
      color: #000; background: #ffffe1; border: 1px solid #000;
      box-shadow: 2px 2px 0 rgba(0,0,0,0.25);
    }
    .aih-tip[hidden] { display: none; }
    .aih-tip::after {
      content: ""; position: absolute; right: -7px; bottom: 12px; width: 12px; height: 12px;
      background: #ffffe1; border-right: 1px solid #000; border-top: 1px solid #000;
      transform: rotate(45deg);
    }

    .aih-panel {
      position: fixed; right: 18px; bottom: 162px; z-index: 10001;
      width: min(330px, calc(100vw - 32px));
      max-height: min(70vh, 520px);
      display: flex; flex-direction: column;
      font-family: Tahoma, 'MS Sans Serif', Geneva, sans-serif;
      color: #000; background: #ffffe1;
      border: 1px solid #000; border-radius: 12px;
      box-shadow: 3px 4px 0 rgba(0,0,0,0.28);
      overflow: hidden;
      transform-origin: bottom right;
      opacity: 0; transform: translateY(8px) scale(0.96);
      transition: opacity 0.14s ease, transform 0.14s ease;
    }
    .aih-panel.aih-open { opacity: 1; transform: translateY(0) scale(1); }
    .aih-panel[hidden] { display: none; }
    /* balloon tail pointing down toward Clippy */
    .aih-panel::after {
      content: ""; position: absolute; right: 40px; bottom: -9px; width: 16px; height: 16px;
      background: #ffffe1; border-right: 1px solid #000; border-bottom: 1px solid #000;
      transform: rotate(45deg);
    }

    .aih-header {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 6px 5px 9px;
      background: linear-gradient(90deg, #000080, #1084d0); color: #fff;
    }
    .aih-header-title { font-weight: 700; font-size: 12px; letter-spacing: 0.02em; flex: 1; }
    .aih-close {
      width: 18px; height: 18px; padding: 0; line-height: 14px;
      font-family: inherit; font-size: 13px; font-weight: 700; color: #000; cursor: pointer;
      background: #c0c0c0;
      border: 1px solid; border-color: #ffffff #808080 #808080 #ffffff;
    }
    .aih-close:active { border-color: #808080 #ffffff #ffffff #808080; }

    .aih-log { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
    .aih-msg { max-width: 88%; font-size: 12.5px; line-height: 1.5; }
    .aih-msg.bot { align-self: flex-start; color: #000; }
    .aih-msg.user {
      align-self: flex-end; background: #fff; color: #000;
      padding: 6px 9px; border: 1px solid #000; border-radius: 2px;
      box-shadow: 1px 1px 0 rgba(0,0,0,0.2);
    }

    .aih-typing { display: inline-flex; gap: 4px; align-items: center; }
    .aih-typing span {
      width: 6px; height: 6px; border-radius: 50%; background: #000; opacity: 0.45;
      animation: aih-bounce 1.2s infinite ease-in-out;
    }
    .aih-typing span:nth-child(2) { animation-delay: 0.15s; }
    .aih-typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes aih-bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }

    .aih-chips { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 0 12px 10px; }
    .aih-chip {
      padding: 1px 0; border: none; background: none;
      font-family: inherit; font-size: 12.5px; color: #0000c0; text-align: left; cursor: pointer;
      text-decoration: underline;
    }
    .aih-chip::before { content: "\\25B8  "; color: #000; text-decoration: none; }
    .aih-chip:hover { color: #d21484; }

    .aih-form { display: flex; gap: 6px; padding: 8px; border-top: 1px solid #d6d6ae; background: #fffff4; }
    .aih-input {
      flex: 1; padding: 5px 7px; font-family: inherit; font-size: 12.5px; color: #000; background: #fff;
      border: 2px solid; border-color: #808080 #ffffff #ffffff #808080;
    }
    .aih-input:focus { outline: 1px dotted #000; }
    .aih-send {
      padding: 4px 12px; font-family: inherit; font-size: 12px; font-weight: 700; color: #000; cursor: pointer;
      background: #c0c0c0; border: 2px solid; border-color: #ffffff #808080 #808080 #ffffff;
    }
    .aih-send:active { border-color: #808080 #ffffff #ffffff #808080; }
    .aih-send:disabled { color: #808080; cursor: default; }

    /* On mobile the round CV button sits bottom-right, so lift Clippy above it. */
    @media (max-width: 767px) {
      .aih-clippy { bottom: 84px; }
      .aih-tip { bottom: 210px; }
      .aih-panel { bottom: 236px; }
    }
  `;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  var THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

  // Build a real 3D Clippy with Three.js. Resolves to a controller, or null if
  // WebGL / the library is unavailable (caller then keeps the SVG fallback).
  function init3DClippy(canvas) {
    return import(THREE_URL).then(function (THREE) {
      var renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      } catch (e) { return null; }
      if (!renderer || !renderer.getContext()) return null;

      var W = canvas.clientWidth || 96, H = canvas.clientHeight || 138;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
      // Framed with headroom so raised eyebrows are never clipped at the top.
      camera.position.set(0, 0.3, 8.2);
      camera.lookAt(0, 0.3, 0);

      // Studio environment (generated) for metallic reflections.
      var envc = document.createElement("canvas");
      envc.width = 64; envc.height = 128;
      var g = envc.getContext("2d");
      var grd = g.createLinearGradient(0, 0, 0, 128);
      grd.addColorStop(0, "#ffffff");
      grd.addColorStop(0.42, "#c3ddff");
      grd.addColorStop(0.72, "#43557d");
      grd.addColorStop(1, "#0a1020");
      g.fillStyle = grd; g.fillRect(0, 0, 64, 128);
      var spot = g.createRadialGradient(18, 22, 2, 18, 22, 46);
      spot.addColorStop(0, "#ffffff"); spot.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = spot; g.fillRect(0, 0, 64, 128);
      var envTex = new THREE.CanvasTexture(envc);
      envTex.mapping = THREE.EquirectangularReflectionMapping;
      envTex.colorSpace = THREE.SRGBColorSpace;
      var pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromEquirectangular(envTex).texture;
      envTex.dispose();

      // Lights: white key + colored rims for the holographic pop.
      scene.add(new THREE.AmbientLight(0x8899bb, 0.35));
      var key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(2, 4, 3); scene.add(key);
      var fill = new THREE.DirectionalLight(0x4aa0ff, 1.3); fill.position.set(-4, -1, 2); scene.add(fill);
      var rim = new THREE.DirectionalLight(0xb060ff, 1.1); rim.position.set(2, -3, -4); scene.add(rim);

      var clippy = new THREE.Group();
      scene.add(clippy);

      var bodyMat = new THREE.MeshPhysicalMaterial({
        color: 0x9fb8dd, metalness: 1.0, roughness: 0.16,
        iridescence: 1.0, iridescenceIOR: 1.8, iridescenceThicknessRange: [120, 560],
        clearcoat: 1.0, clearcoatRoughness: 0.18, envMapIntensity: 1.35
      });

      // Wire paths (XY plane). Outer stadium + central U, like a real Gem clip.
      function arc(cx, cy, r, a0, a1, n, out) {
        for (var i = 0; i <= n; i++) {
          var a = a0 + (a1 - a0) * (i / n);
          out.push(new THREE.Vector3(cx + r * Math.cos(a), cy + r * Math.sin(a), 0));
        }
      }
      function tube(points, closed, radius) {
        var curve = new THREE.CatmullRomCurve3(points, closed, "centripetal");
        var geo = new THREE.TubeGeometry(curve, closed ? 260 : 160, radius, 18, closed);
        return new THREE.Mesh(geo, bodyMat);
      }

      // Outer stadium centerline (w 1.5, h 3.2, r 0.75)
      var outer = [];
      var ox = 0.75, oyt = 0.85, oyb = -0.85, orr = 0.75;
      arc(0, oyt, orr, 0, Math.PI, 40, outer);          // top semicircle L<-R over top
      outer.push(new THREE.Vector3(-ox, oyt, 0));
      outer.push(new THREE.Vector3(-ox, oyb, 0));
      arc(0, oyb, orr, Math.PI, Math.PI * 2, 40, outer); // bottom semicircle
      outer.push(new THREE.Vector3(ox, oyb, 0));
      outer.push(new THREE.Vector3(ox, oyt, 0));
      clippy.add(tube(outer, true, 0.115));

      // Central U (rounded bottom, legs up)
      var inner = [];
      inner.push(new THREE.Vector3(-0.34, 0.95, 0));
      inner.push(new THREE.Vector3(-0.34, -0.05, 0));
      arc(0, -0.05, 0.34, Math.PI, Math.PI * 2, 26, inner);
      inner.push(new THREE.Vector3(0.34, -0.05, 0));
      inner.push(new THREE.Vector3(0.34, 0.95, 0));
      clippy.add(tube(inner, false, 0.115));

      // Eyes
      var eyeMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f7ff, metalness: 0, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.6 });
      var pupilMat = new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.35, metalness: 0.0 });
      var eyesGroup = new THREE.Group();
      eyesGroup.position.set(0, 1.08, 0);
      clippy.add(eyesGroup);
      function makeEye(sx) {
        var eye = new THREE.Group();
        eye.position.set(sx, 0, 0.26);
        var ball = new THREE.Mesh(new THREE.SphereGeometry(0.44, 32, 32), eyeMat);
        ball.scale.set(1, 1.06, 0.9);
        eye.add(ball);
        var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), pupilMat);
        pupil.position.set(0, -0.02, 0.3);
        pupil.scale.set(1, 1, 0.6);
        eye.add(pupil);
        var glint = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        glint.position.set(0.08, 0.08, 0.44);
        eye.add(glint);
        eye.userData.glint = glint;
        eyesGroup.add(eye);
        return eye;
      }
      var eyeL = makeEye(-0.52), eyeR = makeEye(0.52);

      // Eyelids: chrome caps concentric with each eyeball that sweep from the
      // top and bottom, meeting as a thin line when fully closed. They live on
      // eyesGroup (not the gazing eye) so they stay put while the pupils move.
      var LID_OPEN = 1.95; // radians the lids tuck away when the eye is open
      function makeLids(sx) {
        var up = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), bodyMat);
        var lo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 18, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), bodyMat);
        up.position.set(sx, 0, 0.26); lo.position.set(sx, 0, 0.26);
        up.scale.set(1.0, 1.08, 1.0); lo.scale.set(1.0, 1.08, 1.0);
        up.rotation.x = -LID_OPEN; lo.rotation.x = LID_OPEN;
        eyesGroup.add(up); eyesGroup.add(lo);
        return { up: up, lo: lo };
      }
      var lidsL = makeLids(-0.52), lidsR = makeLids(0.52);

      // Eyebrows (dark)
      var browMat = new THREE.MeshStandardMaterial({ color: 0x0b1420, roughness: 0.5, metalness: 0.25 });
      var browBaseY = 1.72;
      function makeBrow(sx, tilt) {
        var b = [];
        arc(0, 0, 0.3, Math.PI * 0.15, Math.PI * 0.85, 20, b);
        var curve = new THREE.CatmullRomCurve3(b, false, "centripetal");
        var m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.06, 10), browMat);
        m.position.set(sx, browBaseY, 0.32);
        m.rotation.z = tilt;
        m.scale.set(1, 0.7, 1);
        clippy.add(m);
        return m;
      }
      var browL = makeBrow(-0.52, -0.15);
      var browR = makeBrow(0.52, 0.15);

      // Tongue (hidden until the cross-eyed gag)
      var tongueMat = new THREE.MeshPhysicalMaterial({ color: 0xff6b88, roughness: 0.4, clearcoat: 0.5, sheen: 0.6, sheenColor: new THREE.Color(0xff9db0) });
      var tongue = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), tongueMat);
      var tSX = 0.95, tSY = 1.55, tSZ = 0.55, tongueBaseY = 0.3;
      tongue.position.set(0, tongueBaseY, 0.34);
      tongue.rotation.x = 0.35;
      tongue.visible = false;
      clippy.add(tongue);

      clippy.rotation.x = -0.08;

      // Interaction state
      var targetYaw = 0, targetPitch = 0, curYaw = 0, curPitch = 0;
      var eyeYaw = 0, eyePitch = 0, curEyeYaw = 0, curEyePitch = 0;
      var crossTarget = 0, crossCur = 0, browTarget = 0, browCur = 0, tongueCur = 0;
      var privacy = 0, privacyCur = 0;
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Gaze is measured from Clippy's own on-screen position, not the whole
      // screen, so a cursor at screen-center (which is up-left of a bottom-right
      // Clippy) makes him look up-left, not straight ahead.
      var eyeOX = 0, eyeOY = 0, rectW = 96;
      function updateOrigin() {
        var r = canvas.getBoundingClientRect();
        eyeOX = r.left + r.width / 2;
        eyeOY = r.top + r.height * 0.32; // eyes sit in the upper third
        rectW = r.width || 96;
      }
      updateOrigin();

      function onMove(e) {
        var dx = e.clientX - eyeOX, dy = e.clientY - eyeOY;
        var d = Math.hypot(dx, dy) || 1;
        var ease = Math.min(1, d / 70); // settle to center only when nearly on him
        var nx = dx / d, ny = dy / d;
        // eyes point toward the cursor's actual direction
        eyeYaw = nx * 0.5 * ease; eyePitch = ny * 0.38 * ease;
        // body leans the same way, subtly
        targetYaw = nx * 0.16 * ease; targetPitch = ny * 0.10 * ease;
        // cursor parked right between the eyes -> cross-eyed + tongue gag
        crossTarget = d < rectW * 0.26 ? 1 : 0;
      }
      window.addEventListener("mousemove", onMove);
      // Raised eyebrows while hovering him.
      canvas.addEventListener("mouseenter", function () { browTarget = 1; });
      canvas.addEventListener("mouseleave", function () { browTarget = 0; crossTarget = 0; });

      // Raised eyebrows while hovering the gray password card too.
      var pinCard = document.getElementById("pin-unlock-card");
      if (pinCard) {
        pinCard.addEventListener("mouseenter", function () { browTarget = 1; });
        pinCard.addEventListener("mouseleave", function () { browTarget = 0; });
      }

      // Privacy mode: while a password digit is focused, Clippy looks away to
      // the outside of the screen and shuts his eyes (not peeking at the code).
      function anyPinFocused() {
        var a = document.activeElement;
        return !!(a && a.classList && a.classList.contains("pin-digit"));
      }
      document.addEventListener("focusin", function (e) {
        if (e.target.classList && e.target.classList.contains("pin-digit")) privacy = 1;
      });
      document.addEventListener("focusout", function () {
        window.setTimeout(function () { if (!anyPinFocused()) privacy = 0; }, 0);
      });

      // Blink scheduling
      var now = performance.now(), nextBlink = now + 2600 + Math.random() * 2600, blinkStart = -1;

      var raf = 0, disposed = false;
      function frame(t) {
        if (disposed) return;
        raf = requestAnimationFrame(frame);
        var tt = t * 0.001;
        // idle float + gentle rotation
        var idleYaw = reduce ? 0 : Math.sin(tt * 0.45) * 0.03;
        var idlePitch = reduce ? 0 : Math.sin(tt * 0.33) * 0.02;
        curYaw += (targetYaw + idleYaw - curYaw) * 0.06;
        curPitch += (targetPitch + idlePitch - curPitch) * 0.06;
        // privacy mode blends the pose to "turned away to the outside"
        privacyCur += (privacy - privacyCur) * 0.1;
        var AWAY_YAW = 0.7, AWAY_PITCH = -0.05; // turn toward the right/outer edge, chin up a touch
        clippy.rotation.y = curYaw + (AWAY_YAW - curYaw) * privacyCur;
        clippy.rotation.x = -0.06 + curPitch + (AWAY_PITCH - curPitch) * privacyCur;
        clippy.position.y = reduce ? 0 : Math.sin(tt * 0.8) * 0.04;
        // eyes follow, converging inward when cross-eyed
        curEyeYaw += (eyeYaw - curEyeYaw) * 0.15;
        curEyePitch += (eyePitch - curEyePitch) * 0.15;
        // while looking away his eyes are shut, so he can't react to the cursor
        var awake = 1 - Math.min(1, privacyCur * 1.4);
        crossCur += (crossTarget * awake - crossCur) * 0.2;
        var conv = crossCur * 0.5;
        var cpitch = curEyePitch + crossCur * 0.08;
        eyeL.rotation.set(cpitch, curEyeYaw + conv, 0);
        eyeR.rotation.set(cpitch, curEyeYaw - conv, 0);
        // eyebrows: raise on hover (only while awake), drop below normal when looking away
        browCur += (browTarget - browCur) * 0.18;
        var browY = browBaseY + browCur * 0.2 * awake - privacyCur * 0.3;
        browL.position.y = browY;
        browR.position.y = browY;
        // tongue pops out with the cross-eyed gag (suppressed while looking away)
        tongueCur += (crossTarget * awake - tongueCur) * 0.18;
        tongue.visible = tongueCur > 0.01;
        var tg = 0.0001 + tongueCur;
        tongue.scale.set(tSX * tg, tSY * tg, tSZ * tg);
        tongue.position.y = tongueBaseY - tongueCur * 0.12;
        // blink -> a quick lid-closure pulse
        if (!reduce && t > nextBlink && blinkStart < 0) blinkStart = t;
        var blinkClose = 0;
        if (blinkStart >= 0) {
          var p = (t - blinkStart) / 360; // slower, natural blink
          if (p >= 1) { blinkStart = -1; nextBlink = t + 2600 + Math.random() * 3200; }
          // close a touch faster than the reopen, with smooth easing
          else if (p < 0.4) { var a = p / 0.4; blinkClose = a * a * (3 - 2 * a); }
          else { var b = 1 - (p - 0.4) / 0.6; blinkClose = b * b * (3 - 2 * b); }
        }
        // lids close for a blink or (held) while looking away in privacy mode
        var lidClose = Math.max(blinkClose, privacyCur);
        var ua = -LID_OPEN * (1 - lidClose), la = LID_OPEN * (1 - lidClose);
        lidsL.up.rotation.x = ua; lidsR.up.rotation.x = ua;
        lidsL.lo.rotation.x = la; lidsR.lo.rotation.x = la;
        eyesGroup.scale.y = 1; // eyeballs stay oval, never squashed flat
        // hide the eye glints once the lids start covering the eye
        var glintOn = lidClose < 0.3;
        eyeL.userData.glint.visible = glintOn;
        eyeR.userData.glint.visible = glintOn;
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(frame);

      function resize() {
        var w = canvas.clientWidth || W, h = canvas.clientHeight || H;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        updateOrigin();
      }
      window.addEventListener("resize", resize);
      window.addEventListener("scroll", updateOrigin, { passive: true });

      return {
        blink: function () { if (blinkStart < 0) blinkStart = performance.now(); },
        destroy: function () {
          disposed = true; cancelAnimationFrame(raf);
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("resize", resize);
          window.removeEventListener("scroll", updateOrigin);
          renderer.dispose();
        }
      };
    }).catch(function (err) {
      console.warn("Clippy 3D unavailable, using SVG fallback:", err);
      return null;
    });
  }

  // Blinking, cursor-tracking eyes, and idle glances for the paperclip.
  function setupLifeSigns(clippy) {
    var eyes = clippy.querySelector(".aih-eyes");
    var eyeL = clippy.querySelector(".aih-eyeball-l");
    var eyeR = clippy.querySelector(".aih-eyeball-r");
    var pupL = clippy.querySelector(".aih-pupil-l");
    var pupR = clippy.querySelector(".aih-pupil-r");
    if (!eyes || !eyeL || !eyeR || !pupL || !pupR) return;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canHover = window.matchMedia("(hover: hover)").matches;
    var MAX_OFFSET = 3.4; // svg user units the pupils can travel

    // Blink on a relaxed, slightly random cadence (with the odd double blink).
    function blinkOnce(cb) {
      eyes.classList.add("aih-blink");
      window.setTimeout(function () {
        eyes.classList.remove("aih-blink");
        if (cb) window.setTimeout(cb, 140);
      }, 120);
    }
    function scheduleBlink() {
      var wait = 2600 + Math.random() * 3400;
      window.setTimeout(function () {
        blinkOnce(Math.random() < 0.25 ? blinkOnce : null);
        scheduleBlink();
      }, wait);
    }
    if (!reduce) scheduleBlink();

    // Look toward a screen point.
    function lookAt(px, py) {
      [[eyeL, pupL], [eyeR, pupR]].forEach(function (pair) {
        var r = pair[0].getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = px - cx, dy = py - cy;
        var d = Math.hypot(dx, dy) || 1;
        var ease = Math.min(1, d / 90); // settle to center when the cursor is right on him
        var ox = (dx / d) * MAX_OFFSET * ease;
        var oy = (dy / d) * MAX_OFFSET * ease;
        pair[1].style.transform = "translate(" + ox.toFixed(2) + "px," + oy.toFixed(2) + "px)";
      });
    }

    if (canHover) {
      var raf = null, lx = 0, ly = 0;
      document.addEventListener("mousemove", function (e) {
        lx = e.clientX; ly = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = null; lookAt(lx, ly); });
      });
    } else if (!reduce) {
      // Touch devices: no cursor, so glance around now and then.
      window.setInterval(function () {
        var a = Math.random() * Math.PI * 2, m = Math.random();
        var ox = Math.cos(a) * MAX_OFFSET * m, oy = Math.sin(a) * MAX_OFFSET * m;
        [pupL, pupR].forEach(function (p) {
          p.style.transform = "translate(" + ox.toFixed(2) + "px," + oy.toFixed(2) + "px)";
        });
      }, 2600);
    }
  }

  // Offline fallback: score each topic by tag overlap with the question.
  function localAnswer(question) {
    if (!KB) return "Sorry, I'm having trouble answering right now. The contact page reaches Roie directly.";
    var q = question.toLowerCase();
    var best = null, bestScore = 0;
    KB.topics.forEach(function (t) {
      var score = 0;
      t.tags.forEach(function (tag) { if (q.indexOf(tag) !== -1) score += 1; });
      if (score > bestScore) { bestScore = score; best = t; }
    });
    return best ? best.a : KB.fallback;
  }

  // Primary responder: ask the backend (real LLM), fall back to local matching.
  function fetchAnswer(question) {
    history.push({ role: "user", content: question });
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history })
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || !data.answer) throw new Error(data.error || "Bad response");
          return data.answer;
        });
      })
      .then(function (answer) {
        history.push({ role: "assistant", content: answer });
        return answer;
      })
      .catch(function (err) {
        console.warn("AI helper backend unavailable, using local fallback:", err);
        return localAnswer(question);
      });
  }

  function build() {
    var style = el("style");
    style.textContent = STYLES;
    document.head.appendChild(style);

    var clippy = el("button", "aih-clippy");
    clippy.type = "button";
    clippy.setAttribute("aria-label", "Ask Clippy about Roie");
    // Canvas for the 3D render; the SVG stays as a fallback behind it.
    clippy.innerHTML = '<canvas class="aih-canvas"></canvas>' + CLIPPY_SVG;

    var tip = el("div", "aih-tip", "It looks like you're browsing a portfolio. Want to ask me about Roie?");

    var panel = el("div", "aih-panel");
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Ask Clippy about Roie");

    var header = el("div", "aih-header");
    header.appendChild(el("div", "aih-header-title", "Roie Assistant"));
    var close = el("button", "aih-close", "✕");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    header.appendChild(close);

    var log = el("div", "aih-log");
    var chips = el("div", "aih-chips");

    var form = el("form", "aih-form");
    var input = el("input", "aih-input");
    input.type = "text";
    input.placeholder = "Type your question...";
    input.setAttribute("aria-label", "Your question");
    var send = el("button", "aih-send", "Ask");
    send.type = "submit";
    form.appendChild(input);
    form.appendChild(send);

    panel.appendChild(header);
    panel.appendChild(log);
    panel.appendChild(chips);
    panel.appendChild(form);

    document.body.appendChild(tip);
    document.body.appendChild(clippy);
    document.body.appendChild(panel);

    // Prefer the 3D render; fall back to the animated SVG if WebGL is missing.
    // Hide the SVG up front so the flat fallback never flashes before 3D loads;
    // only reveal it if 3D actually fails.
    var svg = clippy.querySelector("svg");
    var canvas = clippy.querySelector(".aih-canvas");
    if (svg) svg.style.display = "none";
    init3DClippy(canvas).then(function (ctrl) {
      if (!ctrl) {
        if (canvas) canvas.style.display = "none";
        if (svg) svg.style.display = "";
        setupLifeSigns(clippy);
      }
    });

    function addMsg(text, who) {
      var m = el("div", "aih-msg " + who, text);
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
      return m;
    }

    function showTyping() {
      var m = el("div", "aih-msg bot");
      var t = el("div", "aih-typing");
      t.appendChild(el("span"));
      t.appendChild(el("span"));
      t.appendChild(el("span"));
      m.appendChild(t);
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
      return m;
    }

    function ask(question) {
      addMsg(question, "user");
      input.disabled = true;
      send.disabled = true;
      var typing = showTyping();
      fetchAnswer(question).then(function (answer) {
        typing.remove();
        addMsg(answer, "bot");
        input.disabled = false;
        send.disabled = false;
        input.focus();
      });
    }

    function renderChips() {
      chips.innerHTML = "";
      if (!KB) return;
      KB.topics.slice(0, 4).forEach(function (t) {
        var c = el("button", "aih-chip", t.q);
        c.type = "button";
        c.addEventListener("click", function () { ask(t.q); });
        chips.appendChild(c);
      });
    }

    var isOpen = false;

    function open() {
      if (isOpen) return;
      isOpen = true;
      tip.hidden = true;
      panel.hidden = false;
      requestAnimationFrame(function () { panel.classList.add("aih-open"); });
      input.focus();
      if (!log.childElementCount) {
        addMsg("Hi, I'm Clippy! It looks like you're checking out Roie's portfolio. Ask me about his experience, how he works, or what he's building.", "bot");
        renderChips();
      }
    }

    function closePanel() {
      isOpen = false;
      panel.classList.remove("aih-open");
      window.setTimeout(function () { panel.hidden = true; }, 160);
    }

    clippy.addEventListener("click", function () { isOpen ? closePanel() : open(); });
    tip.addEventListener("click", open);
    close.addEventListener("click", closePanel);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) return;
      input.value = "";
      ask(q);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) closePanel();
    });

    // auto-hide the invite after a while if ignored
    window.setTimeout(function () { if (!isOpen) tip.hidden = true; }, 12000);
  }

  function init() {
    fetch(BASE + "knowledge.json")
      .then(function (r) { return r.json(); })
      .then(function (data) { KB = data; })
      .catch(function (err) { console.error("AI helper knowledge load failed", err); });
    build();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
