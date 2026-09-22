/* ─────────────────────────────────────────────────────────────────────────
   발표용 예시 — 신고현황

   이 파일은 **발표용에만** 들어간다. 실제로 쓰는 쪽에는 없다.
   선명 · 항차 · 호출부호 · 해수청번호는 전부 지어낸 값이다.

   날짜는 박아두지 않고 **여는 날을 기준으로 계산한다.** 그래야 언제 열어도
   '이번 주' 로 보인다. 발표가 미뤄져도 손댈 것이 없다.

   판정 다섯 가지가 화면에 다 나오도록 일부러 섞어 두었다.
     승인 · 진행중 · 오류 · 미신고 · 타서비스
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);

  function at(dayOffset, hh, mm) {           // 오늘 기준 며칠 뒤 ○시○분
    var d = new Date(TODAY);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hh, mm, 0, 0);
    return d;
  }
  function iso(d) {                          // 2026-09-24T11:00:00 — 화면이 읽는 모양
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
           'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':00';
  }
  function stamp(d) {
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
           ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function j(s, d) { return { s: s, d: d || '' }; }

  /* [서비스, 선명, 코드, 호출부호, 해수청, 입항까지 며칠, 시, 분,
      수입신고, 수출신고, 수입위험물, 수출위험물] — 선명·호출부호는 지어낸 것 */
  var ROWS = [
    ['SIS2', 'BLUE HORIZON',  'BLHZ', 'D9QA2', '041', -1, 14,  0,
      j('승인', '승인'), j('승인', '승인'),
      j('승인', '정상처리 2종'), j('승인', '정상처리 2종')],

    ['FEM',  'GREEN PIONEER', 'GRPN', 'H7TB5', '027',  0,  8, 30,
      j('승인', '승인'), j('진행중', '2차 접수'),
      j('승인', '정상처리 3종'), j('진행중', '전송됨 · 응답 대기')],

    ['PCI',  'SILVER WAVE',   'SLWV', 'V4MC8', '033',  0, 19,  0,
      j('승인', '승인'), j('진행중', '선별마감'),
      j('오류', '위험물반입신고서 E301'), j('승인', '정상처리 2종')],

    ['KI1',  'GOLDEN BRIDGE', 'GLBR', 'B2NK6', '015',  1,  6,  0,
      j('진행중', '1차 접수'), j('진행중', '1차 접수'),
      j('승인', '정상처리 2종'), j('미신고', '신고 없음')],

    ['NSB',  'OCEAN SPIRIT',  'OCSP', 'S8RD3', '008',  1, 22, 30,
      j('타서비스', 'BSS1 IN'), j('진행중', '선별마감'),
      j('미신고', '신고 없음'), j('진행중', '정상처리 (중량·컨 수량 불일치)')],

    ['KXS1', 'PACIFIC DAWN',  'PCDW', 'M5WE9', '022',  2, 11,  0,
      j('미신고', 'PLISM 에 없음'), j('미신고', 'PLISM 에 없음'),
      j('미신고', '신고 없음'), j('미신고', '신고 없음')],

    ['PCI2', 'CORAL REEF',    'CRRF', 'K3JF1', '019',  3,  9, 30,
      j('미신고', 'PLISM 에 없음'), j('미신고', 'PLISM 에 없음'),
      j('미신고', '신고 없음'), j('미신고', '신고 없음')],

    ['BNJ',  'AMBER SKY',     'AMSK', 'T6GH4', '036',  4, 16,  0,
      j('미신고', 'PLISM 에 없음'), j('미신고', 'PLISM 에 없음'),
      j('미신고', '신고 없음'), j('미신고', '신고 없음')]
  ];

  var rows = ROWS.map(function (r, i) {
    var etb = at(r[5], r[6], r[7]);
    var etd = new Date(etb.getTime() + (9 + (i % 4) * 2) * 3600000);
    var base = 2600 + i * 2;                        // 지어낸 항차 번호
    return {
      name: r[1], vsl: r[2],
      svc_in: r[0], svc_out: r[0], opr: 'SKR',
      sign: r[3], seq: r[4],
      vyg_in: base + 'E', vyg_out: (base + 1) + 'W',
      etb: iso(etb), etd: iso(etd),
      imp_mf: r[8], exp_mf: r[9], imp_dg: r[10], exp_dg: r[11]
    };
  });

  window.BOARD = {
    made_at: stamp(new Date()),
    pulled_at: stamp(new Date()),
    klnet: 'DEMO0001',
    who: '홍길동',
    rows: rows
  };
})();
