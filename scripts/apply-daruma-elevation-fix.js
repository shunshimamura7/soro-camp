/**
 * `darumayama-kogen` の soloComment の標高を直す（2026-08-11）。
 *
 * 座標を目視取得した結果、国土地理院の標高は **609.1m** だった。
 * 伊豆市の資料も「標高600m」で、本文の「標高900m」は一次情報と矛盾する。
 * §6-10（データを直したら soloComment も読み直す）の見落としで、
 * 不良バッチの点検で本文を書き直したときに旧本文の数字をそのまま残していた。
 *
 * 使い方: node scripts/apply-daruma-elevation-fix.js
 */
const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const c = camps.find((x) => x.id === 'darumayama-kogen');
const before = c.soloComment;
c.soloComment = c.soloComment.replace('標高900mの高原から', '標高約600mの高原から');
if (c.soloComment === before) throw new Error('置換対象が見つからない');
fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2), 'utf-8');
console.log('darumayama-kogen: soloComment 標高900m → 標高約600m（GSI 609.1m・伊豆市の資料「標高600m」）');
