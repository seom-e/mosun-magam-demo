/* ─────────────────────────────────────────────────────────────────────────
   발표용 예시 자료

   이 파일은 **발표용에만** 들어간다. 실제로 쓰는 쪽에는 없다.
   진짜 모선·항차·날짜가 아니라 전부 지어낸 값이다.

   날짜는 박아두지 않고 **여는 날을 기준으로 계산한다.** 그래야 언제 열어도
   '이번 주' 로 보인다. 발표가 미뤄져도 손댈 것이 없다.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var KEY = 'skrLastDataV1';
  try {
    // 이미 무언가 들어있으면 건드리지 않는다.
    // 발표 중에 직접 엑셀을 올려보실 수도 있으니, 그걸 덮으면 안 된다.
    if (localStorage.getItem(KEY)) return;
  } catch (e) { return; }          // 저장을 막아둔 브라우저면 조용히 넘어간다

  // ── 날짜 도구 ───────────────────────────────────────────────────────────
  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);

  function at(dayOffset, hh, mm) {          // 오늘 기준 며칠 뒤 ○시○분
    var d = new Date(TODAY);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hh, mm, 0, 0);
    return d;
  }
  function raw(d) {                          // YYYYMMDDHHMM — 도구가 읽는 모양
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate())
         + p(d.getHours()) + p(d.getMinutes());
  }
  // 다큐마감 = 접안 하루 전(주말이면 더 앞당김). 도구 안의 규칙과 같다.
  function docCut(etb, back) {
    var c = new Date(etb.getFullYear(), etb.getMonth(), etb.getDate() - (back || 1));
    while (c.getDay() === 0 || c.getDay() === 6) c.setDate(c.getDate() - 1);
    c.setHours(17, 0, 0, 0);
    return c;
  }

  /* ── 예시 모선 ──────────────────────────────────────────────────────────
     서비스 코드는 실제 항로 코드를 그대로 뒀다. 발표 때 무슨 항로인지
     알아보셔야 뜻이 통하기 때문이다. **선명·항차·날짜는 전부 지어낸 것이다.**

     담당 나눔:  홍길동(=나) · 김철수 · 이영희
     ──────────────────────────────────────────────────────────────────── */
  var SHIPS = [
    // [서비스, 선명, 코드, 접안까지 며칠, 시, 분, 일부러 어긋냄]
    ['SIS2',  'BLUE HORIZON',   'BLHZ', -1, 14,  0, null],
    ['FEM',   'GREEN PIONEER',  'GRPN',  0,  8, 30, null],
    ['PCI',   'SILVER WAVE',    'SLWV',  0, 19,  0, 'doc'],   // 다큐마감이 어긋난 배
    ['KI1',   'GOLDEN BRIDGE',  'GLBR',  1,  6,  0, null],
    ['NSB',   'OCEAN SPIRIT',   'OCSP',  1, 22, 30, null],
    ['KXS1',  'PACIFIC DAWN',   'PCDW',  2, 11,  0, 'none'],  // 항차가 아직 없는 배
    ['PCI2',  'CORAL REEF',     'CRRF',  3,  9, 30, null],
    ['BNJ',   'AMBER SKY',      'AMSK',  4, 16,  0, null],
    ['KJS1',  'MORNING STAR',   'MRST',  0, 13,  0, null],
    ['KJS2',  'EASTERN LIGHT',  'ESLT',  2,  7, 30, null],
    ['KJS7',  'NORTHERN GATE',  'NRGT',  4, 20,  0, null],
    ['CKX1',  'SOUTHERN CROSS', 'STCR',  1, 10,  0, null],
    ['NTX',   'HARBOR QUEEN',   'HBQN',  3, 15, 30, 'doc'],   // 다큐마감이 어긋난 배
    ['KHS1',  'JADE RIVER',     'JDRV',  5, 12,  0, null],
    ['BTS',   'CRIMSON BAY',    'CRBY',  6, 18, 30, null]
  ];
  var SPECIAL = { SIS2: 1, BNJ: 1, NSB: 1, KI1: 1 };   // 입항 2영업일 전 마감

  var sd = SHIPS.map(function (s, i) {
    var svc = s[0], vessel = s[1], code = s[2], twist = s[6];
    var etb = at(s[3], s[4], s[5]);
    var etd = new Date(etb.getTime() + (10 + (i % 5)) * 3600000);

    // 다큐마감 — 규칙대로면 이 값이어야 한다
    var doc = docCut(etb, SPECIAL[svc] ? 2 : 1);
    // 일부러 어긋내는 배: 하루 늦게 적혀 있어 도구가 '고칠 것' 으로 잡아낸다
    if (twist === 'doc') doc = new Date(doc.getTime() + 24 * 3600000);

    var seq = String(i + 1).padStart(2, '0');
    var row = {
      service: svc,
      vessel: vessel,
      vessel_abbr: code,
      voyage: twist === 'none' ? '' : (2500 + i * 3) + (i % 2 ? 'S' : 'N'),
      liner: 'SKR',
      code: twist === 'none' ? '' : code,
      seq: twist === 'none' ? '00' : seq,
      tv: twist === 'none' ? '' : code + seq,
      terminal: i % 3 === 0 ? 'KIT' : 'GWCT',
      etb_raw: raw(etb),
      etd_raw: raw(etd),
      sched_raw: '',
      doc_raw: raw(doc),
      svc_cutoff_raw: ''
    };
    if (SPECIAL[svc]) {
      var c = docCut(etb, 2);
      row.svc_cutoff_raw = String(c.getFullYear())
        + String(c.getMonth() + 1).padStart(2, '0')
        + String(c.getDate()).padStart(2, '0');
    }
    return row;
  });

  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  put(KEY, JSON.stringify({
    sd: sd,
    sched: null,
    at: Date.now() - 2 * 3600000,          // 두 시간 전에 올린 자료인 것처럼
    fname: '(예시) 모선마감정보.xls',
    sname: '(예시) 모선스케줄 -전체.xls'
  }));

  // 담당자는 '홍길동' 으로 맞춰 둔다. 발표 때 이름을 바꿔 눌러 보이기 좋다.
  put('skr_me', '홍길동');
})();
