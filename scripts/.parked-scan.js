/**
 * officialUrl の「パーキング／売却ページ」実測スキャン。
 *
 * 目的は1つ: **既存の `check-official-urls.js` の PARKED_PATTERNS が
 * GoDaddy/Afternic 型の売却ページを素通りしていないか**を、既存188件で確かめる。
 *
 * **UA は ClaudeBot のまま**（既存スクリプトは Chrome UA を名乗るが、こちらは偽装しない）。
 * そのぶん 403 が増えるが、403 は FORBIDDEN として別に数える。
 *
 *   node scripts/.parked-scan.js
 */
const fs = require('fs');
const path = require('path');

const UA = 'ClaudeBot';
const SPACING_MS = 1100;
const TIMEOUT_MS = 12000;

/** 既存 check-official-urls.js の判定（そのままコピー。**書き換えずに比較する**） */
const PARKED_EXISTING = [
  'ConnectYourDomain', 'このドメインは', 'このドメインをお探しですか', 'お名前.com',
  'ドメインの有効期限', 'Sorry, this shop is currently unavailable',
  'This domain is for sale', 'Domain for sale', 'Buy this domain',
  'さくらのレンタルサーバ', 'このサイトは現在準備中です', 'Account Suspended',
  'サービス提供を終了',
];

/**
 * 提案する判定。**単語の一致ではなく「売り物になっている兆候の同時出現」で見る。**
 * 峰山（forestpartymineyama.com）が既存パターンに1件も当たらなかったのは、
 * 実際の文面が `For sale` `Buy-it-now` `Premium domain` `Afternic` で、
 * `This domain is for sale` のような**完全な文**ではなかったため。
 */
const PARK_MARKETPLACE = /(afternic|sedo|dan\.com|godaddy|hugedomains|bodis|namecheap\s+market|porkbun|value-?domain|onamae|お名前\.com|エックスサーバー|さくらのレンタルサーバ)/i;
const PARK_SELL = /(buy[- ]it[- ]now|buy this domain|domain (?:is )?for sale|premium domain|make an offer|このドメインは.{0,12}(?:売|販売|取得)|ドメインの有効期限|domain (?:name )?(?:is )?available)/i;
const PARK_PRICE = /(\$\s?[\d,]+(?:\.\d+)?\s*(?:USD)?|[\d,]+\s*円)/i;
const PARK_SUSPEND = /(account suspended|このサイトは現在準備中|サービス提供を終了|connectyourdomain|サーバーが見つかりません)/i;

function classifyParked(text, htmlLen) {
  if (PARK_SUSPEND.test(text)) return { parked: true, why: 'suspend/準備中' };
  const mk = PARK_MARKETPLACE.test(text);
  const sell = PARK_SELL.test(text);
  // **売却の言い回し＋マーケットプレイス名の同時出現**を主判定にする。
  // どちらか片方だけだと、キャンプ場が「ドメイン」の語を含む記事を書いた場合に誤爆する
  if (mk && sell) return { parked: true, why: 'marketplace+sell' };
  // 本文が極端に短くて売却語だけがある型
  if (sell && htmlLen < 20000) return { parked: true, why: 'sell/本文が薄い' };
  return { parked: false, why: '' };
}

const strip = h => h
  .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'campgrounds.json'), 'utf8'));
  const recs = Array.isArray(raw) ? raw : (raw.campgrounds || Object.values(raw)[0]);
  const targets = recs.filter(r => r.officialUrl && /^https?:/i.test(r.officialUrl));
  console.log(`officialUrl を持つ ${targets.length} 件を見る（UA=${UA}・${SPACING_MS}ms 間隔・偽装なし）\n`);

  const out = [];
  for (const r of targets) {
    let status = 0, note = '', text = '', len = 0;
    try {
      const res = await fetch(r.officialUrl, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'ja,en;q=0.8' },
        redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      status = res.status;
      const buf = await res.arrayBuffer();
      len = buf.byteLength;
      const ct = res.headers.get('content-type') || '';
      const cm = ct.match(/charset=([\w-]+)/i);
      let body;
      try { body = new TextDecoder(cm ? cm[1] : 'utf-8').decode(buf); }
      catch { body = Buffer.from(buf).toString('utf8'); }
      text = strip(body);
      if (!res.ok) note = status === 403 ? 'FORBIDDEN' : status === 429 ? 'RATE_LIMITED' : 'HTTP_' + status;
    } catch (e) {
      note = 'UNREACHABLE: ' + (e.cause?.code || e.message).slice(0, 40);
    }

    const existingHit = PARKED_EXISTING.filter(p => text.includes(p));
    const proposed = note || !text ? { parked: false, why: '' } : classifyParked(text, len);
    const row = {
      id: r.id, name: r.name, status: r.status, url: r.officialUrl,
      http: status, note, len,
      existingParked: existingHit.length > 0, existingHit,
      proposedParked: proposed.parked, proposedWhy: proposed.why,
    };
    out.push(row);

    const flag = proposed.parked ? (existingHit.length ? '両方PARKED' : '★提案のみPARKED')
      : (existingHit.length ? '★既存のみPARKED' : '');
    if (flag || note) {
      console.log(`${(r.id || '').padEnd(28)} HTTP ${String(status).padEnd(4)} ${note.padEnd(24)} ${flag}`);
    }
    await sleep(SPACING_MS);
  }

  fs.writeFileSync(path.join(__dirname, '.parked-scan.json'), JSON.stringify(out, null, 1));

  const n = f => out.filter(f).length;
  console.log('\n===== 集計 =====');
  console.log('取得できた(2xx)         :', n(r => r.http >= 200 && r.http < 300));
  console.log('FORBIDDEN (403)        :', n(r => r.note === 'FORBIDDEN'));
  console.log('RATE_LIMITED (429)     :', n(r => r.note === 'RATE_LIMITED'));
  console.log('その他 HTTP エラー      :', n(r => /^HTTP_/.test(r.note)));
  console.log('UNREACHABLE            :', n(r => /^UNREACHABLE/.test(r.note)));
  console.log('既存判定で PARKED       :', n(r => r.existingParked));
  console.log('提案判定で PARKED       :', n(r => r.proposedParked));
  console.log('**提案だけが拾った**     :', n(r => r.proposedParked && !r.existingParked));
  console.log('**既存だけが拾った**     :', n(r => !r.proposedParked && r.existingParked));
  for (const r of out.filter(x => x.proposedParked || x.existingParked)) {
    console.log(`  - ${r.id} / ${r.name} / ${r.url}`);
    console.log(`      既存=${r.existingParked ? r.existingHit.join(',') : 'なし'} 提案=${r.proposedParked ? r.proposedWhy : 'なし'}`);
  }
})();
