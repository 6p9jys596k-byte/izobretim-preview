/* ============================================================
   Пароль на сайт (простая защита «от чужих глаз»).
   Пароль по умолчанию: izobretim2026

   Как поменять пароль:
     1) открой терминал в папке проекта;
     2) выполни (подставь свой пароль вместо НОВЫЙ):
        node -e "console.log(require('crypto').createHash('sha256').update('НОВЫЙ').digest('hex'))"
     3) вставь получившуюся строку в PASSWORD_HASH ниже.
   ============================================================ */
(function () {
  const PASSWORD_HASH = "64eb57fc98dfcb6bb5eda07b211751fc49033d4d4e0588547e343f5a1d2edaaf";
  const KEY = "izobretim_gate_ok";
  const HIDE_ID = "gate-hide"; // <style>body{visibility:hidden}</style> из <head>

  function reveal() {
    const s = document.getElementById(HIDE_ID);
    if (s) s.remove();
    const ov = document.getElementById("gate-overlay");
    if (ov) ov.remove();
  }

  async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function buildOverlay() {
    const ov = document.createElement("div");
    ov.id = "gate-overlay";
    ov.setAttribute("style", [
      "visibility:visible", "position:fixed", "inset:0", "z-index:99999",
      "display:grid", "place-items:center",
      "background:radial-gradient(900px 500px at 70% -10%,#fff0d9,transparent 60%),#fff6f3",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif"
    ].join(";"));
    ov.innerHTML = `
      <form id="gate-form" style="visibility:visible;background:#fff;border:1px solid #e9ebef;border-radius:20px;
           box-shadow:0 20px 60px rgba(23,26,31,.15);padding:34px 30px;width:min(92vw,380px);text-align:center">
        <div style="width:52px;height:52px;border-radius:14px;margin:0 auto 16px;display:grid;place-items:center;
             background:linear-gradient(135deg,#ff5a3c,#ff8a3c);color:#fff;font-size:26px;font-weight:800">И</div>
        <h1 style="margin:0 0 6px;font-size:22px;color:#171a1f">Изобретим</h1>
        <p style="margin:0 0 20px;color:#5b636e;font-size:14px">Закрытый доступ. Введите пароль.</p>
        <input id="gate-input" type="password" autocomplete="current-password" placeholder="Пароль"
          style="visibility:visible;width:100%;padding:13px 14px;font-size:16px;border:1.5px solid #e9ebef;
                 border-radius:12px;outline:none;box-sizing:border-box" />
        <div id="gate-err" style="color:#e8431f;font-size:13px;height:18px;margin:8px 0 0"></div>
        <button type="submit" style="visibility:visible;width:100%;margin-top:8px;padding:13px;font-size:15px;
          font-weight:700;color:#fff;background:#ff5a3c;border:none;border-radius:999px;cursor:pointer">Войти</button>
      </form>`;
    return ov;
  }

  function mount() {
    if (sessionStorage.getItem(KEY) === "1" || localStorage.getItem(KEY) === "1") {
      reveal();
      return;
    }
    const ov = buildOverlay();
    document.body.appendChild(ov);
    const input = ov.querySelector("#gate-input");
    const err = ov.querySelector("#gate-err");
    input.focus();
    ov.querySelector("#gate-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const hash = await sha256(input.value);
      if (hash === PASSWORD_HASH) {
        sessionStorage.setItem(KEY, "1");
        localStorage.setItem(KEY, "1");
        reveal();
      } else {
        err.textContent = "Неверный пароль";
        input.value = "";
        input.focus();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
