/* ─────────────────────────────────────────────────────────────────────────
   발표용 예시 — 마감리스트 발송 확인

   이 파일은 **발표용에만** 들어간다. 실제로 쓰는 쪽에는 없다.
   선명 · 항차 · 날짜는 전부 지어낸 값이고, 여는 날을 기준으로 계산한다.

   세 가지가 화면에 다 나오도록 섞어 두었다.
     보냄 · 아직 · 해당없음(양하만이라 보낼 일이 없는 것)
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);

  function at(dayOffset, hh, mm) {
    var d = new Date(TODAY);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hh, mm, 0, 0);
    return d;
  }
  function iso(d) {
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
           'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':00';
  }
  function md(d) {                            // 09-24 16:39
    var p = function (n) { return String(n).padStart(2, '0'); };
    return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function ymd(d) {
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function stamp(d) { return ymd(d) + ' ' + md(d).slice(6); }

  /* [선명, 입항까지 며칠, 시, 분, 수입리스트, 수출리스트]
      'Y' 보냄 · 'N' 아직 · '-' 해당없음(양하만) */
  var ROWS = [
    ['BLUE HORIZON',  -1, 14,  0, 'Y', 'Y'],
    ['GREEN PIONEER',  0,  8, 30, 'Y', 'Y'],
    ['SILVER WAVE',    0, 19,  0, 'Y', 'N'],
    ['GOLDEN BRIDGE',  1,  6,  0, 'Y', '-'],     // 양하만 — 나가는 게 없다
    ['OCEAN SPIRIT',   1, 22, 30, 'N', 'N'],
    ['PACIFIC DAWN',   2, 11,  0, 'N', 'N'],
    ['CORAL REEF',     3,  9, 30, 'N', 'N'],
    ['AMBER SKY',      4, 16,  0, 'N', 'N']
  ];
  var CODE = { 'BLUE HORIZON':'BLHZ', 'GREEN PIONEER':'GRPN', 'SILVER WAVE':'SLWV',
               'GOLDEN BRIDGE':'GLBR', 'OCEAN SPIRIT':'OCSP', 'PACIFIC DAWN':'PCDW',
               'CORAL REEF':'CRRF', 'AMBER SKY':'AMSK' };

  var rows = ROWS.map(function (r, i) {
    var etb = at(r[1], r[2], r[3]);
    var base = 2600 + i * 2;
    function cell(flag, back) {
      if (flag === '-') return ['해당없음', '양하만'];
      if (flag === 'N') return ['아직', ''];
      return ['보냄', md(at(r[1] - back, 17 + (i % 2), 6 + i * 7))];
    }
    return {
      vsl: CODE[r[0]], name: r[0],
      vyg_in: base + 'E',
      vyg_out: r[5] === '-' ? '양하만' : (base + 1) + 'W',
      etb: iso(etb),
      '수입리스트': cell(r[4], 2),
      '수출리스트': cell(r[5], 1)
    };
  });

  var weekStart = at(0, 0, 0);
  var weekEnd = at(7, 0, 0);

  window.MAIL = {
    checked_at: stamp(new Date()),
    week: [ymd(weekStart), ymd(weekEnd)],
    rows: rows,
    weekly: [
      { label: 'MRN 송부', state: '보냄', due: '금요일 오후 ~ 월요일 오전',
        at: md(at(-1, 15, 52)), subject: '' },
      { label: '기선적/기반출 LIST', state: '아직', due: '화요일',
        at: md(at(-7, 10, 34)),
        subject: '지난주: 광양사무소 기선적 기반출 LIST' }
    ]
  };
})();
