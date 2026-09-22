/* ─────────────────────────────────────────────────────────────────────────
   발표용 표시

   보시는 분이 **실제 업무 화면으로 오해하지 않도록** 눈에 띄게 알린다.
   위쪽에 한 줄, 그리고 화면 구석에 늘 붙어있는 작은 딱지 하나.
   구석 딱지를 따로 두는 까닭은 위쪽 띠가 스크롤하면 사라지기 때문이다.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  if (window.__demoRibbon) return;
  window.__demoRibbon = true;

  var css = document.createElement('style');
  css.textContent =
    '#demo-top{background:#8a4b00;color:#fff;font-size:13px;line-height:1.5;' +
      'padding:8px 16px;text-align:center;font-weight:600;letter-spacing:-.2px;' +
      "font-family:'Noto Sans KR','Malgun Gothic',sans-serif;}" +
    '#demo-top span{opacity:.82;font-weight:400;margin-left:6px;}' +
    '#demo-tag{position:fixed;right:14px;bottom:14px;z-index:2147483647;' +
      'background:#8a4b00;color:#fff;font-size:11.5px;font-weight:700;' +
      'padding:6px 12px;border-radius:20px;pointer-events:none;' +
      'box-shadow:0 3px 12px rgba(0,0,0,.28);letter-spacing:.2px;' +
      "font-family:'Noto Sans KR','Malgun Gothic',sans-serif;}" +
    '@media print{#demo-top,#demo-tag{display:none;}}';
  (document.head || document.documentElement).appendChild(css);

  function draw() {
    if (!document.body) return;
    var top = document.createElement('div');
    top.id = 'demo-top';
    top.innerHTML = '발표용 예시 화면입니다'
      + '<span>모선 · 항차 · 날짜 · 연락처는 모두 지어낸 값이며, 실제 업무 자료가 아닙니다</span>';
    document.body.insertBefore(top, document.body.firstChild);

    var tag = document.createElement('div');
    tag.id = 'demo-tag';
    tag.textContent = '발표용 예시';
    document.body.appendChild(tag);

    if (document.title.indexOf('발표용') === -1) {
      document.title = '[발표용] ' + document.title;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', draw);
  } else {
    draw();
  }
})();
