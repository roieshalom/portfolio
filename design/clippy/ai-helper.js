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

  // The paperclip himself.
  var CLIPPY_SVG = `
    <svg viewBox="0 0 70 92" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="aihMetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e9edf1"/>
          <stop offset="0.5" stop-color="#9aa1aa"/>
          <stop offset="1" stop-color="#6a7079"/>
        </linearGradient>
      </defs>
      <!-- paperclip body: two nested stroked pills -->
      <g fill="none" stroke-linecap="round">
        <rect x="17" y="27" width="36" height="58" rx="18" stroke="url(#aihMetal)" stroke-width="7"/>
        <rect x="27" y="16" width="16" height="52" rx="8" stroke="url(#aihMetal)" stroke-width="7"/>
        <rect x="16" y="26" width="36" height="58" rx="18" stroke="#ffffff" stroke-width="1.6" opacity="0.55"/>
      </g>
      <!-- eyebrows -->
      <g fill="none" stroke="#5b616b" stroke-width="3" stroke-linecap="round">
        <path d="M22,31 Q29,25 35,30"/>
        <path d="M36,30 Q42,25 48,31"/>
      </g>
      <!-- eyes -->
      <g>
        <ellipse cx="29" cy="41" rx="7" ry="8" fill="#fff" stroke="#2b2b2b" stroke-width="1.6"/>
        <ellipse cx="41" cy="41" rx="7" ry="8" fill="#fff" stroke="#2b2b2b" stroke-width="1.6"/>
        <circle cx="30.5" cy="43.5" r="3.1" fill="#141414"/>
        <circle cx="40" cy="43.5" r="3.1" fill="#141414"/>
        <circle cx="31.6" cy="42.4" r="1" fill="#fff"/>
        <circle cx="41.1" cy="42.4" r="1" fill="#fff"/>
      </g>
    </svg>
  `;

  var STYLES = `
    .aih-clippy {
      position: fixed; right: 22px; bottom: 18px; z-index: 10000;
      width: 66px; height: 86px; padding: 0; border: none; background: none;
      cursor: pointer; filter: drop-shadow(2px 3px 2px rgba(0,0,0,0.28));
      transition: transform 0.15s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .aih-clippy:hover { transform: translateY(-2px) rotate(-3deg); }
    .aih-clippy:active { transform: translateY(0) rotate(0); }
    .aih-clippy:focus-visible { outline: 2px dotted #000; outline-offset: 3px; }

    /* little "psst" invite that pops from Clippy until first opened */
    .aih-tip {
      position: fixed; right: 92px; bottom: 60px; z-index: 10000;
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
      position: fixed; right: 18px; bottom: 112px; z-index: 10001;
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
      .aih-clippy { bottom: 92px; }
      .aih-tip { bottom: 134px; }
      .aih-panel { bottom: 186px; }
    }
  `;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
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
    clippy.innerHTML = CLIPPY_SVG;

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
