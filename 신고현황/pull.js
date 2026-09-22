// PLISM 조회 — 로그인된 창에서 신고현황을 받아 data/plism.json 으로 저장한다.
//
// 로그인은 사람이 직접 한다. 창이 뜨면 한 번 로그인해 두면 되고,
// 그 다음부터는 이 폴더에 세션이 남아 창만 잠깐 떴다 사라진다.

const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const DATA = path.join(HERE, 'data');
const PROFILE = path.join(HERE, '.크롬프로필');
const HOME = 'https://www.plism.com/uat/uia/plism3Sub.do?menu_no=11';
const 로그인대기_분 = 10;

// --login : 로그인만 해 두고 끝내는 모드. 조회는 하지 않는다.
//   로그인이 이 폴더(.크롬프로필)에 남으므로, 한 번 해 두면 실행.bat 이 알아서 돌아간다.
const LOGIN_ONLY = process.argv.includes('--login');

// playwright 를 찾는다. 설치 위치가 환경마다 달라서 후보를 차례로 본다.
function loadPlaywright() {
  const home = process.env.LOCALAPPDATA || '';
  const cands = [
    'playwright',
    path.join(HERE, 'node_modules', 'playwright'),
    ...fs.existsSync(path.join(home, 'npm-cache', '_npx'))
      ? fs.readdirSync(path.join(home, 'npm-cache', '_npx'))
          .map(d => path.join(home, 'npm-cache', '_npx', d, 'node_modules', 'playwright'))
      : [],
  ];
  for (const c of cands) {
    try { return require(c); } catch (_) { /* 다음 후보 */ }
  }
  console.error('\n  playwright 를 찾지 못했습니다.');
  console.error('  이 폴더에서 한 번만 실행해 주세요:  npm install playwright\n');
  process.exit(3);
}

// 페이지 안에서 도는 조회. 같은 사이트 안이라 로그인 상태가 그대로 쓰인다.
async function collect(page, keys) {
  return page.evaluate(async ({ dateFr, dateTo, signs, klnet }) => {
    const post = async (url, body) => {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset="UTF-8"', 'Accept': 'application/json' },
        body: JSON.stringify(body), credentials: 'include',
      });
      if (!r.ok) throw new Error(`${url} → ${r.status}`);
      return r.json();
    };

    const wide = (d, days) => {           // 앞뒤로 며칠 넉넉히 본다
      const t = new Date(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}T00:00:00`);
      t.setDate(t.getDate() + days);
      return t.toISOString().slice(0, 10).replace(/-/g, '');
    };
    const fr = wide(dateFr, -3), to = wide(dateTo, 3);

    const imp = await post('/plism3/iks/cms/mng/selectKmcsImpMrnList.do', { reqMap: {
      mrn: '', customs_line_code: '', arv_date_fr: fr, arv_date_to: to,
      pod: '', status_mng: '', pageIndex: 1, pageRowCount: 300,
      sKlnetId: klnet, customs_code: '062', vessel_name: '', chkSV: '',
      customs_send_yn: '', mrn_co_yn: '', pol: '' } });

    const exp = await post('/plism3/oks/cms/mng/selectKmcsExpMrnList.do', { reqMap: {
      mrn: '', customs_line_code: '', etd_date_fr: fr, etd_date_to: to,
      pol: '', pageIndex: 1, pageRowCount: 300,
      sKlnetId: klnet, customs_code: '062', vessel_name: '', chkSV: '',
      customs_send_yn: '', mrn_co_yn: '', pod: '' } });

    // 위험물 — 622 여수청, 호출부호 기준. 수입(1)·수출(2) 을 따로 본다.
    //
    // 체크리스트 호출부호표에 없는 배가 있다(오늘은 PACIFIC BEIJING). 그대로 두면 그 배는
    // 위험물을 영영 확인하지 못한다. 적하목록 조회 결과에 호출부호가 같이 오므로 그걸로 메운다.
    const found = [...new Set([...(imp.result || []), ...(exp.result || [])]
      .map(r => r.call_sign).filter(Boolean))];
    const all = [...new Set([...signs, ...found])];

    const year = String(new Date().getFullYear());
    const dg = [];
    for (const cs of all) {
      for (const inflag of [1, 2]) {
        const list = await post('/plism3/dgs/lim/DgLineMngList.do', { mngKey: {
          sch_gubun: '', sch_harbor_code: '', sch_in_flag: String(inflag),
          sch_arv_year: year, sch_arv_ser_no: '',
          sch_presenting_date1: wide(dateFr, -45), sch_presenting_date2: wide(dateTo, 3),
          pageRowCount: 50, pageIndex: 1,
          sch_prt_at_code: '622', sch_prt_at_code_name: '여수청',
          sch_call_sign: cs, sch_person_in_charge: '', sch_vessel_name: '' } });

        for (const row of (list.resultList || [])) {
          const res = await post('/plism3/dgs/lim/DgCombineResList.do', { reqKey: {
            prt_at_code: '622', call_sign: row.call_sign, arv_year: row.arv_year,
            arv_ser_no: row.arv_ser_no, in_flag: row.in_flag } });
          dg.push({
            cs, inflag, vsl: row.vessel_name, ser: row.arv_ser_no,
            st: row.status_name, send: row.send_status, cntr: row.cntr_num,
            wEq: row.weight_equal_yn, cEq: row.cntr_equal_yn, remark: row.remark,
            res: (res.resultList || []).map(x => ({
              doc: x.docnm, stat: x.freetxt2, code: x.errmsg, at: x.genrestm })),
          });
        }
      }
    }

    const pick = r => ({ mrn: r.mrn, vsl: r.vessel_name, vyg: r.voyage_no, cs: r.call_sign,
      st: r.status_cus, err: r.err_bl_cnt, bl: r.bl_cls_yn, line: r.customs_line_code });

    return {
      range: [fr, to],
      imp: (imp.result || []).map(r => ({ ...pick(r), arv: r.arv_date,
        agd: r.status_cusagd, a: r.tot_cusagd_mbl, b: r.tot_cms_imp_mbl })),
      exp: (exp.result || []).map(r => ({ ...pick(r), dpt: r.dpt_date })),
      dg,
    };
  }, keys);
}

(async () => {
  // 로그인만 할 때는 조회를 안 하므로 keys.json 이 없어도 된다.
  const keysPath = path.join(DATA, 'keys.json');
  if (!LOGIN_ONLY && !fs.existsSync(keysPath)) {
    console.error('  data/keys.json 이 없습니다. 실행.bat 으로 돌려 주세요.');
    process.exit(2);
  }
  const keys = fs.existsSync(keysPath)
    ? JSON.parse(fs.readFileSync(keysPath, 'utf8')) : null;
  const { chromium } = loadPlaywright();

  const ctx = await chromium.launchPersistentContext(PROFILE, {
    channel: 'chrome', headless: false, viewport: null,
    args: ['--start-maximized'],
  });
  const page = ctx.pages()[0] || await ctx.newPage();

  try {
    await page.goto(HOME, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 로그인 확인 — 화면 어딘가에 `○○○님 [SNKOC010_장금상선]` 이 보이면 된 것이다.
    const who = async () => {
      for (const f of page.frames()) {
        try {
          const t = await f.evaluate(() => document.body ? document.body.innerText : '');
          const m = t.match(/([가-힣]{2,4})님\s*\[([A-Z0-9]+)_/);
          if (m) return { name: m[1], klnet: m[2] };
        } catch (_) { /* 프레임이 아직 안 뜬 것 */ }
      }
      return null;
    };

    let me = await who();
    const 이미로그인 = !!me;
    if (!me) {
      console.log('\n  PLISM 에 로그인해 주세요. 창을 띄워 두었습니다.');
      console.log(`  (로그인하면 자동으로 이어집니다 · 최대 ${로그인대기_분}분 기다립니다)\n`);
      const until = Date.now() + 로그인대기_분 * 60000;
      while (!me && Date.now() < until) {
        await page.waitForTimeout(3000);
        me = await who();
      }
    }
    if (!me) {
      console.error('  로그인을 확인하지 못했습니다. 다시 실행해 주세요.');
      process.exit(4);
    }
    console.log(`  로그인 확인: ${me.name}님 [${me.klnet}]`);

    if (LOGIN_ONLY) {
      console.log(이미로그인
        ? '\n  이미 로그인되어 있었습니다. 그대로 쓰시면 됩니다.'
        : '\n  로그인이 이 폴더에 저장되었습니다.');
      console.log('  이제 실행.bat 을 돌리면 창이 잠깐 떴다 사라지며 조회까지 끝납니다.\n');
      return;                         // 조회는 하지 않는다
    }

    const got = await collect(page, {
      dateFr: keys.date_fr, dateTo: keys.date_to,
      signs: keys.signs, klnet: me.klnet,
    });

    got.pulled_at = new Date().toISOString().slice(0, 19);
    got.klnet = me.klnet;
    got.who = me.name;          // 각자 로그인하므로, 누가 조회한 자료인지 남겨 둔다
    fs.writeFileSync(path.join(DATA, 'plism.json'), JSON.stringify(got, null, 1), 'utf8');
    console.log(`  조회 완료 — 수입 ${got.imp.length}건 · 수출 ${got.exp.length}건 · 위험물 ${got.dg.length}건`);
  } catch (e) {
    console.error(`  조회 중 문제가 생겼습니다: ${e.message}`);
    process.exit(1);
  } finally {
    await ctx.close();
  }
})();
