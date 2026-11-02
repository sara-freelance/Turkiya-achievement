/* دخول المالكة (Supabase Auth) — مشترك بين الصفحة الرئيسية والملف */
(function () {
  var C = window.SITE_CONFIG || {};
  var ready = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && !/PASTE_/.test(C.SUPABASE_URL + C.SUPABASE_ANON_KEY) && window.supabase);
  var sb = ready ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
  var session = null, subs = [], recovering = false;

  window.Site = {
    sb: sb,
    ready: ready,
    isOwner: function () { return !!session; },
    onAuth: function (f) { subs.push(f); f(!!session); },
    openLogin: function () { openDlg("login"); }
  };

  var css = "\
.au-chip{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:13px;border-radius:999px;padding:5px 12px;border:1px solid var(--line);background:var(--sheet);color:var(--ink);cursor:pointer;white-space:nowrap;text-decoration:none}\
.au-chip.owner{background:var(--teal);border-color:var(--teal);color:var(--sheet)}\
.au-dot{width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.7}\
.au-dlg{position:fixed;inset:0;z-index:60;background:rgba(20,14,16,.55);display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}\
.au-card{background:var(--sheet);color:var(--ink);border-radius:16px;padding:26px 24px;width:min(400px,100%);display:flex;flex-direction:column;gap:6px;box-shadow:0 30px 80px rgba(0,0,0,.35)}\
.au-card h2{margin:0;font-family:var(--f-display);font-size:26px;font-weight:700}\
.au-card p.sub{margin:0 0 8px;color:var(--muted);font-size:14px}\
.au-card label{font-size:13px;color:var(--muted);margin-top:6px}\
.au-card input{font:inherit;font-size:16px;border:1px solid var(--line);background:var(--paper);color:var(--ink);border-radius:10px;padding:10px 12px;width:100%;direction:ltr;text-align:right}\
.au-card .err{color:var(--rose);font-size:13px;min-height:1.3em;margin:4px 0 0}\
.au-card .ok{color:var(--sage);font-size:13px;margin:4px 0 0}\
.au-row{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap}\
.au-main{font:inherit;font-size:15px;font-weight:600;background:var(--teal);color:var(--sheet);border:0;border-radius:999px;padding:9px 22px;cursor:pointer}\
.au-ghost{font:inherit;font-size:15px;background:none;color:var(--ink);border:1px solid var(--line);border-radius:999px;padding:9px 18px;cursor:pointer}\
.au-link{font:inherit;font-size:13px;background:none;border:0;color:var(--rose);cursor:pointer;padding:0;align-self:flex-start;margin-top:6px;text-decoration:underline;text-underline-offset:3px}\
[hidden]{display:none!important}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var dlg = document.createElement("div");
  dlg.className = "au-dlg"; dlg.hidden = true;
  dlg.setAttribute("role", "dialog"); dlg.setAttribute("aria-modal", "true"); dlg.setAttribute("aria-labelledby", "auTitle");
  dlg.innerHTML =
    '<form class="au-card" id="auForm" novalidate>' +
      '<h2 id="auTitle">دخول المالكة</h2>' +
      '<p class="sub" id="auSub">للمالكة فقط. الزوار يتصفحون بدون دخول.</p>' +
      '<label for="auEmail" id="auEmailL">البريد الإلكتروني</label>' +
      '<input id="auEmail" type="email" autocomplete="username" inputmode="email" required>' +
      '<label for="auPass" id="auPassL">كلمة المرور</label>' +
      '<input id="auPass" type="password" autocomplete="current-password" required>' +
      '<p class="err" id="auErr" role="alert"></p>' +
      '<div class="au-row"><button type="submit" class="au-main" id="auGo">دخول</button><button type="button" class="au-ghost" id="auCancel">إلغاء</button></div>' +
      '<button type="button" class="au-link" id="auForgot">نسيت كلمة المرور؟</button>' +
    '</form>';
  document.body.appendChild(dlg);
  var $ = function (id) { return document.getElementById(id); };
  var mode = "login", lastFocus = null;

  function openDlg(m) {
    mode = m; lastFocus = document.activeElement;
    var isNew = m === "newpass", isReset = m === "reset";
    $("auTitle").textContent = isNew ? "كلمة مرور جديدة" : isReset ? "استعادة كلمة المرور" : "دخول المالكة";
    $("auSub").textContent = isNew ? "اكتبي كلمة المرور الجديدة (8 أحرف على الأقل)." : isReset ? "نرسل لك رابطًا على بريدك لتعيين كلمة مرور جديدة." : "للمالكة فقط. الزوار يتصفحون بدون دخول.";
    $("auEmail").hidden = $("auEmailL").hidden = isNew;
    $("auPass").hidden = $("auPassL").hidden = isReset;
    $("auPass").autocomplete = isNew ? "new-password" : "current-password";
    $("auPassL").textContent = isNew ? "كلمة المرور الجديدة" : "كلمة المرور";
    $("auGo").textContent = isNew ? "حفظ" : isReset ? "إرسال الرابط" : "دخول";
    $("auForgot").hidden = m !== "login";
    $("auErr").textContent = ""; $("auErr").className = "err"; $("auPass").value = "";
    dlg.hidden = false;
    (isNew ? $("auPass") : $("auEmail")).focus();
  }
  function closeDlg() { dlg.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  $("auCancel").onclick = closeDlg;
  $("auForgot").onclick = function () { openDlg("reset"); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDlg(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !dlg.hidden) { e.stopPropagation(); closeDlg(); } }, true);

  $("auForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    var err = $("auErr"), go = $("auGo"), email = $("auEmail").value.trim(), pass = $("auPass").value;
    err.className = "err"; err.textContent = "";
    if (!sb) { err.textContent = "الموقع غير مربوط بقاعدة البيانات بعد."; return; }
    if (mode !== "newpass" && !/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "اكتبي بريدًا إلكترونيًا صحيحًا."; return; }
    if (mode !== "reset" && pass.length < (mode === "newpass" ? 8 : 1)) { err.textContent = mode === "newpass" ? "كلمة المرور 8 أحرف على الأقل." : "اكتبي كلمة المرور."; return; }
    go.disabled = true;
    try {
      var r;
      if (mode === "login") r = await sb.auth.signInWithPassword({ email: email, password: pass });
      else if (mode === "reset") r = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("#")[0] });
      else r = await sb.auth.updateUser({ password: pass });
      if (r.error) throw r.error;
      if (mode === "reset") { err.className = "ok"; err.textContent = "أرسلنا الرابط. افتحي بريدك واتبعي الرابط."; }
      else { recovering = false; closeDlg(); }
    } catch (x) {
      var msg = String((x && x.message) || "");
      err.textContent = /invalid login/i.test(msg) ? "البريد أو كلمة المرور غير صحيحة."
        : /rate|too many/i.test(msg) ? "محاولات كثيرة. انتظري دقيقة وحاولي مرة ثانية."
        : "صار خطأ. تأكدي من الاتصال وحاولي مرة ثانية.";
    } finally { go.disabled = false; }
  });

  function paint() {
    document.querySelectorAll("[data-auth-slot]").forEach(function (slot) {
      if (!ready) { slot.innerHTML = ""; return; }
      slot.innerHTML = session
        ? '<button type="button" class="au-chip owner" data-au="out" title="تسجيل الخروج"><span class="au-dot"></span>المالكة · خروج</button>'
        : '<button type="button" class="au-chip" data-au="in"><span class="au-dot"></span>زائر · دخول</button>';
    });
  }
  document.addEventListener("click", async function (e) {
    var b = e.target.closest && e.target.closest("[data-au]"); if (!b) return;
    if (b.dataset.au === "in") openDlg("login");
    else if (sb) await sb.auth.signOut();
  });
  function emit() { paint(); subs.forEach(function (f) { try { f(!!session); } catch (x) {} }); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint); else paint();
  if (sb) {
    sb.auth.getSession().then(function (r) { session = r.data.session; emit(); });
    sb.auth.onAuthStateChange(function (ev, s) {
      session = s;
      if (ev === "PASSWORD_RECOVERY") { recovering = true; openDlg("newpass"); }
      emit();
    });
  }
})();
