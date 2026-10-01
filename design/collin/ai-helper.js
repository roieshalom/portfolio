/*
 * Collin, the chat agent on roiesh.com.
 * A small floating chat button opens a panel that answers questions about Roie.
 * Chat logic: it asks chat.php (real LLM) and falls back to local keyword
 * matching over knowledge.json when the backend is unreachable.
 */
(function () {
  "use strict";

  var KB = null;
  var BASE = "/design/collin/";
  var ENDPOINT = BASE + "chat.php";
  var history = []; // {role, content} sent to the backend for context

  // Fire a Microsoft Clarity custom event (no-op if Clarity isn't loaded, e.g. localhost).
  function track(name) { try { if (window.clarity) window.clarity("event", name); } catch (e) {} }

  // The chat bubble icon that sits inside the launcher button.
  var BUBBLE_SVG = `
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d="M21 11.3a8.2 8.2 0 0 1-8.3 8.2 8.4 8.4 0 0 1-3.7-.85L3 20.5l1.85-5.6A8.2 8.2 0 0 1 4 11.3 8.3 8.3 0 0 1 12.3 3h.4A8.2 8.2 0 0 1 21 11.1z" fill="#fff"/>
      <circle cx="9" cy="12" r="1.15" fill="var(--color-link, #f21783)"/>
      <circle cx="12.5" cy="12" r="1.15" fill="var(--color-link, #f21783)"/>
      <circle cx="16" cy="12" r="1.15" fill="var(--color-link, #f21783)"/>
    </svg>
  `;

  var STYLES = `
    .aih-launcher {
      position: fixed; right: 18px; bottom: 18px; z-index: 10000;
      width: 56px; height: 56px; padding: 0; border: none; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-link, #f21783); color: #fff; cursor: pointer;
      box-shadow: 0 6px 18px rgba(20, 30, 60, 0.28);
      transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.3s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .aih-launcher:hover { transform: translateY(-2px); box-shadow: 0 9px 22px rgba(20, 30, 60, 0.34); }
    .aih-launcher:active { transform: translateY(0); }
    .aih-launcher:focus-visible { outline: 2px solid var(--color-link, #f21783); outline-offset: 3px; }
    .aih-launcher svg { display: block; }

    /* Entrance: fade and rise in once, unless reduced motion is requested. */
    .aih-launcher.aih-enter { animation: aih-rise 0.45s ease both; }
    @keyframes aih-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    .aih-launcher.aih-exit { opacity: 0; transform: translateY(14px); pointer-events: none; }

    /* The site has a global button:hover that paints buttons pink. Neutralize it
       for the widget's secondary buttons so nothing changes unexpectedly. */
    .aih-chip:hover, .aih-chip:focus,
    .aih-tip-x:hover, .aih-tip-x:focus,
    .aih-dismiss:hover, .aih-dismiss:focus { box-shadow: none; filter: none; }

    /* Small X to hide Collin for the session; appears on launcher hover. */
    .aih-dismiss {
      position: fixed; z-index: 10002; right: 14px; bottom: 64px;
      width: 20px; height: 20px; padding: 0; line-height: 1;
      border: 1px solid var(--color-border, #d9d9d9); border-radius: 50%;
      background: var(--color-card, #fff); color: var(--color-text-main, #222);
      font: 700 11px/1 'Albert Sans', system-ui, sans-serif; cursor: pointer;
      box-shadow: 0 2px 6px rgba(20, 30, 60, 0.2);
    }
    .aih-dismiss[hidden] { display: none; }
    @media (max-width: 767px) { .aih-dismiss { bottom: 130px; } }

    /* The "psst" invite that pops once until the panel is first opened. */
    .aih-tip {
      position: fixed; right: 84px; bottom: 26px; z-index: 10000;
      max-width: 210px; padding: 10px 28px 10px 12px;
      font-family: 'Albert Sans', system-ui, sans-serif; font-size: 13px; line-height: 1.4;
      color: var(--color-text-main, #222); background: var(--color-card, #fff);
      border: 1px solid var(--color-border, #e3e3e3); border-radius: 12px;
      box-shadow: 0 6px 18px rgba(20, 30, 60, 0.18);
    }
    .aih-tip-x {
      position: absolute; top: 6px; right: 8px; width: 16px; height: 16px; padding: 0;
      border: none; background: none; cursor: pointer; font-family: inherit; font-size: 13px;
      line-height: 1; color: var(--color-text, #888); opacity: 0.7;
    }
    .aih-tip-x:hover { opacity: 1; }
    .aih-tip[hidden] { display: none; }
    .aih-tip::after {
      content: ""; position: absolute; right: -6px; bottom: 16px; width: 11px; height: 11px;
      background: var(--color-card, #fff);
      border-right: 1px solid var(--color-border, #e3e3e3); border-top: 1px solid var(--color-border, #e3e3e3);
      transform: rotate(45deg);
    }

    .aih-panel {
      position: fixed; right: 18px; bottom: 86px; z-index: 10001;
      width: min(360px, calc(100vw - 32px));
      max-height: min(72vh, 560px);
      display: flex; flex-direction: column;
      font-family: 'Albert Sans', system-ui, sans-serif;
      color: var(--color-text-main, #222); background: var(--color-card, #fff);
      border: 1px solid var(--color-border, #e3e3e3); border-radius: 16px;
      box-shadow: 0 14px 40px rgba(20, 30, 60, 0.28);
      overflow: hidden;
      transform-origin: bottom right;
      opacity: 0; transform: translateY(8px) scale(0.97);
      transition: opacity 0.14s ease, transform 0.14s ease;
    }
    .aih-panel.aih-open { opacity: 1; transform: translateY(0) scale(1); }
    .aih-panel[hidden] { display: none; }

    .aih-header {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 12px 12px 15px;
      background: var(--color-link, #f21783); color: #fff;
    }
    .aih-header-text { flex: 1; min-width: 0; }
    .aih-header-title { font-weight: 700; font-size: 14px; line-height: 1.1; }
    .aih-header-sub { font-size: 11px; opacity: 0.88; margin-top: 2px; }
    .aih-close {
      width: 26px; height: 26px; padding: 0; border: none; border-radius: 50%;
      font-family: inherit; font-size: 15px; font-weight: 700; line-height: 1;
      color: #fff; background: rgba(255, 255, 255, 0.18); cursor: pointer;
    }
    .aih-close:hover { background: rgba(255, 255, 255, 0.3); }

    .aih-log { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .aih-msg { max-width: 88%; font-size: 13.5px; line-height: 1.5; }
    .aih-msg.bot { align-self: flex-start; color: var(--color-text-main, #222); }
    .aih-msg.user {
      align-self: flex-end; background: var(--color-link, #f21783); color: #fff;
      padding: 7px 11px; border-radius: 14px 14px 3px 14px;
    }

    .aih-typing { display: inline-flex; gap: 4px; align-items: center; padding: 4px 0; }
    .aih-typing span {
      width: 6px; height: 6px; border-radius: 50%; background: var(--color-text-main, #222); opacity: 0.4;
      animation: aih-bounce 1.2s infinite ease-in-out;
    }
    .aih-typing span:nth-child(2) { animation-delay: 0.15s; }
    .aih-typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes aih-bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }

    .aih-chips { display: flex; flex-wrap: wrap; gap: 7px; padding: 0 14px 12px; }
    .aih-chip {
      flex: 0 1 auto; padding: 6px 11px; cursor: pointer;
      font-family: inherit; font-size: 12.5px; color: var(--color-link, #f21783);
      background: transparent; border: 1px solid var(--color-border, #e3e3e3); border-radius: 999px;
    }
    .aih-chip:hover { border-color: var(--color-link, #f21783); }

    .aih-form { display: flex; gap: 8px; padding: 10px 12px 4px; border-top: 1px solid var(--color-border, #eee); }
    .aih-disclaim {
      padding: 6px 12px 10px;
      font-family: inherit; font-size: 10.5px; line-height: 1.3; color: var(--color-text, #999); text-align: center;
    }
    .aih-input {
      flex: 1; padding: 8px 11px; font-family: inherit; font-size: 13.5px;
      color: var(--color-text-main, #222); background: var(--color-bg, #fff);
      border: 1px solid var(--color-border, #d9d9d9); border-radius: 10px;
    }
    .aih-input:focus { outline: none; border-color: var(--color-link, #f21783); }
    .aih-send {
      padding: 8px 16px; border: none; border-radius: 10px;
      font-family: inherit; font-size: 13px; font-weight: 700; color: #fff; cursor: pointer;
      background: var(--color-link, #f21783);
    }
    .aih-send:hover { filter: brightness(0.96); }
    .aih-send:disabled { opacity: 0.5; cursor: default; }

    /* On mobile the round CV button sits bottom-right, so lift Collin above it. */
    @media (max-width: 767px) {
      .aih-launcher { bottom: 84px; }
      .aih-tip { bottom: 92px; }
      .aih-panel { bottom: 152px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .aih-launcher.aih-enter { animation: none; }
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
        console.warn("Collin backend unavailable, using local fallback:", err);
        return localAnswer(question);
      });
  }

  function build() {
    // If the visitor hid Collin earlier this session, stay gone until a new session.
    try { if (sessionStorage.getItem("aih_dismissed")) return; } catch (e) {}

    var style = el("style");
    style.textContent = STYLES;
    document.head.appendChild(style);

    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var launcher = el("button", "aih-launcher");
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Chat with Collin about Roie");
    launcher.innerHTML = BUBBLE_SVG;

    var tip = el("div", "aih-tip");
    tip.appendChild(el("span", "aih-tip-text", "Hi, I'm Collin. Ask me anything about Roie."));
    var tipX = el("button", "aih-tip-x", "✕");
    tipX.type = "button";
    tipX.setAttribute("aria-label", "Dismiss");
    tip.appendChild(tipX);
    tip.hidden = true; // revealed after Collin arrives

    var panel = el("div", "aih-panel");
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Chat with Collin about Roie");

    var header = el("div", "aih-header");
    var headerText = el("div", "aih-header-text");
    headerText.appendChild(el("div", "aih-header-title", "Collin"));
    headerText.appendChild(el("div", "aih-header-sub", "Roie's AI assistant"));
    header.appendChild(headerText);
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

    var disclaim = el("div", "aih-disclaim", "Collin is an AI agent and can get things wrong.");

    panel.appendChild(header);
    panel.appendChild(log);
    panel.appendChild(chips);
    panel.appendChild(form);
    panel.appendChild(disclaim);

    // Small X that appears when hovering the launcher; hides Collin for the session.
    var dismiss = el("button", "aih-dismiss", "✕");
    dismiss.type = "button";
    dismiss.setAttribute("aria-label", "Hide Collin");
    dismiss.hidden = true;

    document.body.appendChild(tip);
    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    document.body.appendChild(dismiss);

    var dismissTimer = null;
    function showDismiss() { if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null; } dismiss.hidden = false; }
    function hideDismissSoon() { dismissTimer = setTimeout(function () { dismiss.hidden = true; }, 250); }
    launcher.addEventListener("mouseenter", showDismiss);
    launcher.addEventListener("mouseleave", hideDismissSoon);
    dismiss.addEventListener("mouseenter", showDismiss);
    dismiss.addEventListener("mouseleave", hideDismissSoon);
    dismiss.addEventListener("click", function (e) {
      e.stopPropagation();
      track("collin_dismissed");
      try { sessionStorage.setItem("aih_dismissed", "1"); } catch (err) {}
      dismiss.remove(); tip.remove(); panel.remove(); launcher.remove();
    });

    // First visit this tab vs a return (e.g. coming back from a project page).
    var firstVisit = true;
    try { firstVisit = !sessionStorage.getItem("aih_seen"); sessionStorage.setItem("aih_seen", "1"); } catch (e) {}

    // Leaving to a project page: fade the launcher out. It fades back in on the
    // next load. Capture phase so it runs even though the tile has its own handler.
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".gallery-tile")) {
        launcher.classList.remove("aih-enter");
        launcher.classList.add("aih-exit");
      }
    }, true);

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
      track("collin_question");
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
      KB.topics.slice(0, 3).forEach(function (t) {
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
      track("collin_opened");
      tip.hidden = true;
      panel.hidden = false;
      requestAnimationFrame(function () { panel.classList.add("aih-open"); });
      input.focus();
      if (!log.childElementCount) {
        addMsg("Hi, I'm Collin. I work with Roie and I can talk about his work, how he thinks, or what he's building. What brings you here?", "bot");
        renderChips();
      }
    }

    function closePanel() {
      isOpen = false;
      panel.classList.remove("aih-open");
      window.setTimeout(function () { panel.hidden = true; }, 160);
    }

    launcher.addEventListener("click", function () { isOpen ? closePanel() : open(); });
    tip.addEventListener("click", open);
    tipX.addEventListener("click", function (e) { e.stopPropagation(); tip.hidden = true; });
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

    // Reveal the invite once Collin has arrived, then auto-hide it if ignored.
    function revealTip() {
      if (isOpen) return;
      tip.hidden = false;
      window.setTimeout(function () { if (!isOpen) tip.hidden = true; }, 12000);
    }

    // Entrance: fade and rise in shortly after load, then greet on first visit.
    function finishEntrance() { track("collin_shown"); if (firstVisit) revealTip(); }
    if (prefersReduced) {
      finishEntrance();
    } else {
      window.setTimeout(function () {
        launcher.classList.add("aih-enter");
        var done = false;
        function onEnd() {
          if (done) return; done = true;
          launcher.classList.remove("aih-enter");
          finishEntrance();
        }
        launcher.addEventListener("animationend", onEnd, { once: true });
        window.setTimeout(onEnd, 700); // fallback if animationend doesn't fire
      }, 800);
    }
  }

  function init() {
    fetch(BASE + "knowledge.json")
      .then(function (r) { return r.json(); })
      .then(function (data) { KB = data; })
      .catch(function (err) { console.error("Collin knowledge load failed", err); });
    build();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
