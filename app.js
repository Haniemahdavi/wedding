(function () {
  var C = window.INVITE || {};
  var $ = function (s) { return document.querySelector(s); };

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function lines(v) { return (Array.isArray(v) ? v : [v]).map(esc).join("<br>"); }

  /* ---------- پر کردن متن‌ها از config.js ---------- */
  if (C.pageTitle) document.title = C.pageTitle;
  document.querySelectorAll("[data-bind]").forEach(function (el) {
    var v = C[el.getAttribute("data-bind")];
    if (v == null) return;
    if (el.tagName.toLowerCase() === "text") el.textContent = v;
    else el.innerHTML = lines(v);
  });

  /* ---------- اسم مهمان از لینک ----------
     ?to=...  (اسم رمزگذاری‌شده که صفحه‌ی links.html می‌سازد)
     ?n=سرکار خانم محمدی&n2=و خانواده  (حالت ساده‌ی دستی)          */
  function decode(s) {
    try {
      s = s.replace(/-/g, "+").replace(/_/g, "/");
      while (s.length % 4) s += "=";
      var bin = atob(s), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch (e) { return ""; }
  }
  var q = new URLSearchParams(location.search);
  var g = (C.defaultGuest || ["مهمان گرامی", ""]).slice();
  if (q.get("to")) {
    var parts = decode(q.get("to")).split("\n");
    if (parts[0]) g = [parts[0], parts[1] || ""];
  } else if (q.get("n")) {
    g = [q.get("n"), q.get("n2") || ""];
  }
  $("#guest1").textContent = g[0];
  $("#guest2").textContent = g[1];
  if (!g[1]) $("#guest2").style.display = "none";

  /* ---------- دکمه‌های نقشه ---------- */
  var mb = C.mapButtons || [];
  var mapIcon = '<svg viewBox="0 0 32 32"><use href="#icMap"/></svg>';
  $("#mapButtons").innerHTML = mb.map(function (b) {
    return '<a class="btn" target="_blank" rel="noopener" href="' + esc(b.url) + '">' + mapIcon + "<span>" + esc(b.label) + "</span></a>";
  }).join("");
  if (mb[0]) $("#mapCard").href = mb[0].url;

  /* ---------- آهنگ ---------- */
  var audio = $("#audio"), btn = $("#musicBtn");
  if (C.music) {
    audio.src = C.music;
    fetch(C.music, { method: "HEAD" }).then(function (r) { btn.hidden = !r.ok; }).catch(function () { btn.hidden = true; });
  }
  function play() {
    if (!C.music) return;
    if (btn.hidden) return;
    var p = audio.play();
    if (p && p.then) p.then(function () { btn.classList.add("playing"); }).catch(function () {});
    else btn.classList.add("playing");
  }
  btn.addEventListener("click", function () {
    if (audio.paused) play(); else { audio.pause(); btn.classList.remove("playing"); }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && !audio.paused) { audio.pause(); audio._wasPlaying = true; }
    else if (!document.hidden && audio._wasPlaying) { audio._wasPlaying = false; play(); }
  });

  /* ---------- باز کردن پاکت ---------- */
  var intro = $("#intro"), stage = $("#envStage"), opened = false;
  function openEnvelope() {
    if (opened) return;
    opened = true;
    play();
    intro.classList.add("opened");
    setTimeout(function () {
      intro.classList.add("gone");
      var first = document.querySelector(".page .reveal");
      if (first) first.classList.add("in");
    }, 2900);
  }
  stage.addEventListener("click", openEnvelope);
  intro.addEventListener("click", openEnvelope);
  stage.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnvelope(); }
  });

  /* ---------- ظاهر شدن تدریجی هر صفحه ---------- */
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      if (en.isIntersecting && opened) en.target.classList.add("in");
    });
  }, { root: $("#scroller"), threshold: 0.35 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- فلش‌ها: رفتن به صفحه‌ی بعد ---------- */
  document.querySelectorAll(".swipe").forEach(function (s) {
    s.style.pointerEvents = "auto";
    s.style.cursor = "pointer";
    s.addEventListener("click", function () {
      var next = s.closest(".page").nextElementSibling;
      if (next) next.scrollIntoView({ behavior: "smooth" });
    });
  });
})();
