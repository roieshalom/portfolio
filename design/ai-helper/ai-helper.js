/*
 * AI helper concept: a support-style chat widget that answers questions about Roie.
 * First iteration: local keyword responder over ai/data/knowledge.json.
 * A real LLM call plugs into getAnswer() later, keeping the same UI shell.
 */
(function () {
  "use strict";

  var KB = null;
  var BASE = "/design/ai-helper/";
  var ENDPOINT = BASE + "chat.php";
  var history = []; // {role, content} sent to the backend for context

  var STYLES = `
    .aih-launcher {
      position: fixed; right: 20px; bottom: 20px; z-index: 10000;
      display: flex; align-items: center; gap: 8px;
      padding: 12px 18px; border: none; border-radius: 999px;
      background: var(--color-link, #f21783); color: #fff;
      font-family: inherit; font-size: 15px; font-weight: 600;
      cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,0.18);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .aih-launcher:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(0,0,0,0.22); }
    .aih-launcher[hidden] { display: none; }

    .aih-panel {
      position: fixed; right: 20px; bottom: 20px; z-index: 10001;
      width: min(380px, calc(100vw - 32px));
      height: min(560px, calc(100vh - 40px));
      display: flex; flex-direction: column;
      background: var(--color-card, #fff); color: var(--color-text-main, #1a1a1a);
      border: 1px solid var(--color-border, #e6e6e6); border-radius: 16px;
      box-shadow: 0 18px 50px rgba(0,0,0,0.25); overflow: hidden;
      opacity: 0; transform: translateY(12px) scale(0.98);
      transition: opacity 0.18s ease, transform 0.18s ease;
    }
    .aih-panel.aih-open { opacity: 1; transform: translateY(0) scale(1); }
    .aih-panel[hidden] { display: none; }

    .aih-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid var(--color-border, #e6e6e6);
    }
    .aih-header-title { font-weight: 700; font-size: 15px; }
    .aih-header-sub { font-size: 12px; color: var(--color-text, #6b6b6b); margin-top: 2px; }
    .aih-close {
      background: none; border: none; font-size: 20px; line-height: 1;
      cursor: pointer; color: var(--color-text, #6b6b6b); padding: 4px;
    }

    .aih-log { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .aih-msg { max-width: 85%; padding: 10px 13px; border-radius: 14px; font-size: 14px; line-height: 1.45; }
    .aih-msg.bot { align-self: flex-start; background: rgba(0,0,0,0.05); border-bottom-left-radius: 4px; }
    .aih-msg.user { align-self: flex-end; background: var(--color-link, #f21783); color: #fff; border-bottom-right-radius: 4px; }
    html[data-theme="dark"] .aih-msg.bot { background: rgba(255,255,255,0.08); }

    .aih-typing { display: inline-flex; gap: 4px; align-items: center; }
    .aih-typing span {
      width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.5;
      animation: aih-bounce 1.2s infinite ease-in-out;
    }
    .aih-typing span:nth-child(2) { animation-delay: 0.15s; }
    .aih-typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes aih-bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }

    .aih-chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 12px; }
    .aih-chip {
      padding: 7px 12px; border: 1px solid var(--color-border, #e6e6e6);
      border-radius: 999px; background: transparent; color: var(--color-text-main, #1a1a1a);
      font-family: inherit; font-size: 13px; cursor: pointer;
    }
    .aih-chip:hover { border-color: var(--color-link, #f21783); color: var(--color-link, #f21783); }

    .aih-form { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--color-border, #e6e6e6); }
    .aih-input {
      flex: 1; padding: 10px 12px; border: 1px solid var(--color-border, #e6e6e6);
      border-radius: 10px; font-family: inherit; font-size: 14px;
      background: var(--color-bg, #fff); color: var(--color-text-main, #1a1a1a);
    }
    .aih-input:focus { outline: none; border-color: var(--color-link, #f21783); }
    .aih-send {
      border: none; border-radius: 10px; padding: 0 16px;
      background: var(--color-link, #f21783); color: #fff; font-weight: 600; cursor: pointer;
    }

    /* On mobile the round CV button sits bottom-right, so lift the launcher above it. */
    @media (max-width: 767px) {
      .aih-launcher { bottom: 96px; }
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

    var launcher = el("button", "aih-launcher");
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Ask about Roie");
    launcher.innerHTML = '<span aria-hidden="true">💬</span> Ask about Roie';

    var panel = el("div", "aih-panel");
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Ask about Roie");

    var header = el("div", "aih-header");
    var titleWrap = el("div");
    titleWrap.appendChild(el("div", "aih-header-title", "Ask about Roie"));
    titleWrap.appendChild(el("div", "aih-header-sub", "A quick way to learn about his work"));
    var close = el("button", "aih-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    header.appendChild(titleWrap);
    header.appendChild(close);

    var log = el("div", "aih-log");
    var chips = el("div", "aih-chips");

    var form = el("form", "aih-form");
    var input = el("input", "aih-input");
    input.type = "text";
    input.placeholder = "Ask me anything about Roie…";
    input.setAttribute("aria-label", "Your question");
    var send = el("button", "aih-send", "Send");
    send.type = "submit";
    form.appendChild(input);
    form.appendChild(send);

    panel.appendChild(header);
    panel.appendChild(log);
    panel.appendChild(chips);
    panel.appendChild(form);

    document.body.appendChild(launcher);
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

    function open() {
      panel.hidden = false;
      launcher.hidden = true;
      requestAnimationFrame(function () { panel.classList.add("aih-open"); });
      input.focus();
      if (!log.childElementCount) {
        addMsg("Hi, I'm a little helper for Roie's portfolio. Ask me about his experience, how he works, or what he's building. What would you like to know?", "bot");
        renderChips();
      }
    }

    function closePanel() {
      panel.classList.remove("aih-open");
      window.setTimeout(function () { panel.hidden = true; launcher.hidden = false; }, 180);
    }

    launcher.addEventListener("click", open);
    close.addEventListener("click", closePanel);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) return;
      input.value = "";
      ask(q);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) closePanel();
    });
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
