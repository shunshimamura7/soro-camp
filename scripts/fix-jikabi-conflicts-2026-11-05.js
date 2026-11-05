// 公式の原文で「直火は禁止」の4施設に残っていた「直火OK」の記述を、公式の原文に合わせて直す（審査3回目 審査員7）
const fs=require('fs');const P='data/campgrounds.json';const raw=fs.readFileSync(P,'utf8');const d=JSON.parse(raw);
const by=s=>d.find(x=>x.slug===s);
const fixes={
  'motosu-lakeside':{note:'焚き火は焚き火台で可。直火は禁止（公式「環境保護の観点により直火は禁止とさせていただきます。 必ず焚き火台をご使用ください。」https://motosulakeside.com/index.php/rule/）',solo:['ペットOK・直火OK・車横付けOKの三拍子揃った貴重なキャンプ場。','ペットOK・車横付けOKのキャンプ場（直火は禁止で、焚き火は焚き火台を使う）。']},
  'saiko-jiyu':{note:'直火も、焚き火台だけでの焚き火も禁止（公式「当キャンプ場は直火及び焚き火台のみでの焚き火は禁止です。」https://saiko-jiyuu.camp/page/requests）',solo:['西湖畔で直火OKかつ車横付け可能な稀有なキャンプ場。','西湖畔で車横付けができるキャンプ場（直火は禁止。焚き火のルールは公式で確認）。']},
  'doshi-keikoku':{note:'直火は禁止（公式「直火は禁止、ゴミはお持ち帰りください」https://doushi-keikoku.jp/?page_id=65）',solo:['直火OKかつ予約不要で1,700円〜（入場700円+駐車1,000円）。','予約不要で1,700円〜（入場700円+駐車1,000円）。直火は禁止。']},
  'westriver-auto-camp':{note:'直火は不可。焚き火は焚き火台で（公式「直火は不可です、たき火をご希望の場合にはたき火台などをご持参いただくか有料レンタルをご利用ください。」https://westriver-camp.com/information/）'},
};
for(const [s,f] of Object.entries(fixes)){const c=by(s);c.features.bonfireNote=f.note;
  if(f.solo){if(!c.soloComment.includes(f.solo[0]))throw new Error(s);c.soloComment=c.soloComment.replace(f.solo[0],f.solo[1]);}}
fs.writeFileSync(P,JSON.stringify(d,null,2)+(raw.endsWith('\n')?'\n':''));console.log('ok');
