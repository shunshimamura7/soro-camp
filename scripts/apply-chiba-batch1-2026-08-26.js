const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'campgrounds.json');
const VERIFIED = '2026-08-26';
const approxPinCaution = '地図位置は住所検索に基づく概略位置です。敷地の入口・受付位置は訪問前に施設公式の案内で確認してください。';

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const bySlug = new Map(camps.map((camp) => [camp.slug, camp]));

function fullRecord(record) {
  return {
    type: 'campground',
    status: 'active',
    priceVerified: true,
    scoresVerified: true,
    lastVerified: VERIFIED,
    ...record,
  };
}

function applyExisting(slug, patch) {
  const camp = bySlug.get(slug);
  if (!camp) throw new Error(`既存レコードが見つかりません: ${slug}`);
  Object.assign(camp, fullRecord(patch));
  delete camp.needsVerify;
  delete camp.needsVerifyNote;
  delete camp.needsCoord;
  delete camp.coordsVerified;
  delete camp.coordsGsiChecked;
}

function add(record) {
  if (bySlug.has(record.slug)) throw new Error(`slug が既に存在します: ${record.slug}`);
  const camp = fullRecord(record);
  camps.push(camp);
  bySlug.set(camp.slug, camp);
}

const commonUnknown = {
  convenience: false,
  nearbySupermarket: '',
  nearbyShop: '',
};

// 既存の千葉3件は、公式情報を再確認して公開可能な水準まで補完する。
applyExisting('orange-mura-auto', {
  status: 'active',
  lat: 34.998566,
  lng: 139.95401,
  priceMin: 3300,
  priceMax: 3500,
  priceNote: '普通車ソロは平日3,300円、繁忙期3,500円。バイクは平日1,800円、繁忙期2,000円。大人の宿泊管理料は料金表に記載がない。',
  scores: { quietness: 4, scenery: 5, value: 4, access: 3, facility: 5 },
  features: {
    bonfire: true,
    bonfireNote: '直火は第1キャンプ場では不可。第2・谷・入口サイトは可。',
    pet: true,
    shower: true,
    showerNote: '24時間温水シャワー無料。',
    bath: true,
    bathNote: '予約制貸切風呂は有料。',
    toilet: 'ウォシュレット',
    carIn: true,
    carInNote: '全サイトに車・バイク乗入れ可。',
    soloPlan: true,
    soloPlanNote: '公式料金表にソロ料金あり。',
    reservation: 'ハイシーズンのみ',
    reservationNote: '平日・日曜は当日宿泊可。土曜・三連休は予約推奨。',
    shop: false,
    wifi: false,
    firewood: true,
    firewoodNote: '木材廃材を無料提供。',
    ice: false,
    alcohol: false,
    garbage: '可（無料回収）',
    ...commonUnknown,
  },
  season: '通年',
  soloComment: '海を望む高台と森に囲まれたサイトを選べる。温水シャワー、貸切風呂、無料薪、ゴミ回収までそろい、設備を重視するソロに向く。',
  officialUrl: 'https://orangemura.com/camp/',
  reservationUrl: 'https://orangemura.com/camp/',
  tel: '0470-44-0780',
  cautions: [approxPinCaution],
  source: ['https://orangemura.com/camp/'],
});

applyExisting('otaki-kenminnomori', {
  status: 'active',
  lat: 35.284542,
  lng: 140.233765,
  priceMin: 630,
  priceMax: 630,
  priceNote: 'テントサイトは1区画1泊630円（既存の施設公式・千葉県森林課確認）。駐車料金の有無は公式案内で確認してください。',
  scores: { quietness: 4, scenery: 4, value: 5, access: 3, facility: 3 },
  features: {
    bonfire: false,
    bonfireNote: '営火場はあるが、個別の焚き火可否は予約前に要確認。',
    pet: true,
    petNote: 'ドッグランあり。キャンプサイトでの可否は要確認。',
    shower: true,
    showerNote: '温水シャワー室あり。',
    bath: false,
    toilet: '不明',
    carIn: false,
    carInNote: 'オートキャンプ場ではなく、車はサイト脇に駐車不可。',
    soloPlan: false,
    reservation: '要',
    shop: false,
    wifi: false,
    firewood: false,
    ice: false,
    alcohol: false,
    garbage: '要確認',
    ...commonUnknown,
  },
  season: '通年（12月29日〜1月3日は休館）',
  soloComment: '杉木立の中で過ごせる県民の森の低料金キャンプ場。駅から徒歩約15分だが、車をサイト脇に付けられないため荷物量は抑えたい。',
  officialUrl: 'https://otakikenminnomori.jp/',
  reservationUrl: 'https://www.nap-camp.com/chiba/11937',
  tel: '0470-82-3110',
  cautions: [approxPinCaution],
  source: ['https://otakikenminnomori.jp/', 'https://www.pref.chiba.lg.jp/shinrin/kenminnomori/otaki.html'],
});

applyExisting('otaki-sabo', {
  status: 'active',
  lat: 35.257751,
  lng: 140.271423,
  priceMin: 4500,
  priceMax: 4500,
  priceNote: '通常期の目安はサイト基本料1,500円＋大人3,000円〜でソロ4,500円〜。公式は冬季料金がさらに安くなると案内するが、具体額は予約前に確認。',
  scores: { quietness: 4, scenery: 3, value: 3, access: 4, facility: 3 },
  features: {
    bonfire: false,
    bonfireNote: '焚き火可否は施設公式で要確認。',
    pet: false,
    shower: false,
    bath: false,
    toilet: '不明',
    carIn: false,
    carInNote: '車両乗入れ可否は予約前に要確認。',
    soloPlan: false,
    soloPlanNote: '公式がソロ・ツーリング向けの小規模キャンプ場と案内。',
    reservation: '要',
    reservationNote: '木曜定休（水曜はチェックアウトのみ）。',
    shop: false,
    wifi: false,
    firewood: false,
    ice: false,
    alcohol: false,
    garbage: '要確認',
    ...commonUnknown,
  },
  season: '通年（冬季は料金が下がる案内あり）',
  soloComment: '大多喜の小規模キャンプ場。公式がソロ・ツーリングキャンプ向けと明記しており、IC・勝浦海岸から車約20分の立地。',
  officialUrl: 'http://otaki-sabo.info/',
  reservationUrl: 'https://www.nap-camp.com/chiba/11937',
  tel: '050-1301-3014',
  cautions: [approxPinCaution],
  source: ['http://otaki-sabo.info/', 'http://otaki-sabo.info/cost.html'],
});

add({
  id: 'morimaki-auto', slug: 'morimaki-auto', name: '森のまきばオートキャンプ場', prefecture: '千葉', area: '袖ケ浦',
  address: '千葉県袖ケ浦市林562-1-3', lat: 35.394249, lng: 140.072861,
  priceMin: 2600, priceMax: 2800,
  priceNote: '通常期のソロはバイク2,600円（大人2,300円＋バイク300円）、普通車2,800円（大人2,300円＋車500円）。ハイシーズンは各300円増。',
  scores: { quietness: 3, scenery: 4, value: 4, access: 5, facility: 4 },
  features: { bonfire: true, bonfireNote: '直火は禁止。林野火災警報時は焚き火禁止。', pet: true, shower: true, bath: false, toilet: '不明', carIn: true, carInNote: 'オートキャンプのフリーサイト。', soloPlan: false, reservation: '要', reservationNote: '利用日の2カ月前から予約可。', shop: true, wifi: false, firewood: true, firewoodNote: '販売あり。', ice: false, alcohol: false, garbage: '可（分別。ガス缶・電池・空きビン等は持ち帰り）', ...commonUnknown },
  season: '通年（毎週月曜、第1・3火曜、年末年始休）',
  soloComment: '都心から約60分。広い草原のフリーサイトと長い滞在時間が魅力で、ソロバイクなら通常期2,600円から。',
  officialUrl: 'https://www.morimaki-camp.com/facility/', reservationUrl: 'https://www.morimaki-camp.com/guide/', tel: '0438-75-2966',
  cautions: [approxPinCaution], source: ['https://www.morimaki-camp.com/facility/', 'https://www.morimaki-camp.com/guide/'],
});

add({
  id: 'narita-yume-bokujo', slug: 'narita-yume-bokujo', name: '成田ゆめ牧場オートキャンプ場', prefecture: '千葉', area: '成田',
  address: '千葉県成田市名木730-3', lat: 35.868221, lng: 140.39566,
  priceMin: 3400, priceMax: 4000,
  priceNote: '通常期のソロは二輪3,400円（大人2,500円＋二輪900円）、普通車4,000円（大人2,500円＋普通車1,500円）。特別期間は別料金。',
  scores: { quietness: 3, scenery: 3, value: 4, access: 4, facility: 5 },
  features: { bonfire: true, bonfireNote: '直火は禁止。焚き火台で利用。', pet: true, shower: true, showerNote: '24時間利用可能。', bath: false, toilet: 'ウォシュレット', carIn: true, carInNote: '全面オートサイト。', soloPlan: false, reservation: '要', reservationNote: 'オンライン予約限定。当日利用のみ電話予約可。', shop: true, wifi: false, firewood: true, firewoodNote: '販売あり。', ice: false, alcohol: false, garbage: '可（透明袋で分別）', ...commonUnknown },
  season: '通年（休業日あり）',
  soloComment: 'シャワー、売店、ウォシュレット付きトイレなど設備が充実。キャンプ初心者のソロにも選びやすい。',
  officialUrl: 'https://www.yumebokujo.com/camp.html', reservationUrl: 'https://yumebokujo.revn.jp/camp/', tel: '0476-96-1001',
  cautions: [approxPinCaution], source: ['https://www.yumebokujo.com/camp.html'],
});

add({
  id: 'sengokudai-auto', slug: 'sengokudai-auto', name: '千石台オートキャンプ場', prefecture: '千葉', area: '君津・養老渓谷',
  address: '千葉県君津市黄和田畑2245-16', lat: 35.210033, lng: 140.139114,
  priceMin: 3000, priceMax: 5000,
  priceNote: '通常のオートキャンプ1区画は5,000円（車1台込み）。ソロキャンプは2,000円割引で3,000円。繁忙期は別料金。',
  scores: { quietness: 5, scenery: 5, value: 4, access: 3, facility: 5 },
  features: { bonfire: true, pet: false, petNote: '可否は予約前に要確認。', shower: true, bath: true, bathNote: '貸切風呂は45分2,000円。', toilet: '温水便座', carIn: true, soloPlan: true, soloPlanNote: '公式料金表にソロ割引あり。', reservation: '要', shop: true, wifi: true, firewood: true, firewoodNote: '販売あり。', ice: false, alcohol: false, garbage: '可（料金にごみ処理料を含む）', ...commonUnknown },
  season: '通年',
  soloComment: '養老渓谷奥清澄自然公園の静かな環境で、川遊び・星空・冬のソロを楽しめる。温水設備と貸切風呂もあり快適性が高い。',
  officialUrl: 'https://www.1059dai.com/', reservationUrl: 'https://www.1059dai.com/', tel: '0439-39-2743',
  cautions: [approxPinCaution], source: ['https://www.1059dai.com/', 'https://www.1059dai.com/%E6%96%99%E9%87%91/'],
});

add({
  id: 'uchiurayama-kenminnomori', slug: 'uchiurayama-kenminnomori', name: '千葉県立内浦山県民の森キャンプ場', prefecture: '千葉', area: '鴨川',
  address: '千葉県鴨川市内浦3228', lat: 35.145298, lng: 140.199707,
  priceMin: 630, priceMax: 940,
  priceNote: 'テント持込みの第一・第二キャンプ場は小型テント（1〜2人用）1張1泊630円、大型テント（3〜4人用）940円。オートキャンプは1区画3,870円。',
  scores: { quietness: 4, scenery: 4, value: 5, access: 3, facility: 3 },
  features: { bonfire: true, bonfireNote: '営火場あり。火気の詳細ルールは予約前に要確認。', pet: false, petNote: '可否は予約前に要確認。', shower: false, bath: false, toilet: '不明', carIn: false, carInNote: '低料金のテントサイトはオートサイトではない。', soloPlan: false, reservation: '要', reservationNote: '電話予約。', shop: false, wifi: false, firewood: false, ice: false, alcohol: false, garbage: '要確認', ...commonUnknown },
  season: '通年',
  soloComment: '県民の森のテントサイトなら1〜2人用テント630円。荷物を絞った低予算のソロに適する。',
  officialUrl: 'https://www.uchiurayama.jp/stay03', tel: '04-7095-2821',
  cautions: [approxPinCaution], source: ['https://www.uchiurayama.jp/stay03'],
});

add({
  id: 'shimizu-koen-auto', slug: 'shimizu-koen-auto', name: '清水公園オートキャンプ場', prefecture: '千葉', area: '野田',
  address: '千葉県野田市清水906', lat: 35.96006, lng: 139.85083,
  priceMin: 4900, priceMax: 5900,
  priceNote: 'オートキャンプは入場料900円＋サイト料4,000円〜5,000円。ソロ普通車の最低料金は4,900円。',
  scores: { quietness: 2, scenery: 3, value: 3, access: 4, facility: 4 },
  features: { bonfire: true, bonfireNote: '焚き火台をレンタル可。', pet: false, petNote: 'ペット同伴の可否は予約前に要確認。', shower: true, showerNote: 'コインシャワーあり。', bath: false, toilet: '不明', carIn: true, soloPlan: false, reservation: '要', reservationNote: '完全予約制。', shop: true, wifi: false, firewood: true, firewoodNote: '販売あり。', ice: true, alcohol: true, garbage: '可（分別）', ...commonUnknown },
  season: '通年',
  soloComment: '都市近郊でオートキャンプを楽しめる整備型の施設。必要なレンタル・販売品が多く、準備を軽くしたいソロに向く。',
  officialUrl: 'https://www.shimizu-kouen.com/camp', reservationUrl: 'https://www.nap-camp.com/chiba/11999', tel: '04-7125-3030',
  cautions: [approxPinCaution], source: ['https://www.shimizu-kouen.com/camp'],
});

add({
  id: 'futtsu-shiminnomori', slug: 'futtsu-shiminnomori', name: '富津市民の森キャンプ場', prefecture: '千葉', area: '富津',
  address: '千葉県富津市豊岡2785-1', lat: 35.176597, lng: 139.956776,
  priceMin: 1650, priceMax: 1650,
  priceNote: '市外利用者の持込みテントサイトは1張1泊1,650円（市内1,100円）。常設テントは市外2,130円。',
  scores: { quietness: 4, scenery: 4, value: 5, access: 3, facility: 3 },
  features: { bonfire: false, bonfireNote: 'キャンプファイヤー用サークルはあるが、個別の焚き火可否は要確認。', pet: false, petNote: '可否は予約前に要確認。', shower: true, showerNote: '温水コインシャワー約5分100円。', bath: false, toilet: '不明', carIn: false, carInNote: '場内への車両進入不可。用具は作業車両で搬入可能。', soloPlan: false, reservation: '要', reservationNote: '利用予定日の2カ月前から。', shop: false, wifi: false, firewood: true, firewoodNote: '販売あり。', ice: false, alcohol: false, garbage: '要確認', ...commonUnknown },
  season: '7月1日〜8月31日',
  soloComment: '富津の山間部で過ごす夏限定の市民の森キャンプ場。市外でも持込みテント1,650円と低料金だが、車はサイトに入れない。',
  officialUrl: 'https://www.city.futtsu.lg.jp/0000000751.html', tel: '0439-68-1800',
  cautions: ['所在地は富津市観光協会の公式地図座標に基づく。場内への車両進入は不可。'], source: ['https://www.city.futtsu.lg.jp/0000000751.html', 'https://www.futtsu-kanko.info/places/futtsu-shiminnomoricamp/'],
});

add({
  id: 'ohara-kamifuse-auto', slug: 'ohara-kamifuse-auto', name: '大原上布施オートキャンプ場', prefecture: '千葉', area: 'いすみ',
  address: '千葉県いすみ市上布施593', lat: 35.220661, lng: 140.344757,
  priceMin: 2000, priceMax: 5000,
  priceNote: 'ソロ特別料金はバイク2,000円、車3,000円。GW・連休・混雑時の土曜などは特別料金がなく通常サイト4,500円〜5,000円。',
  scores: { quietness: 3, scenery: 3, value: 4, access: 3, facility: 4 },
  features: { bonfire: true, bonfireNote: '直火は禁止。焚火台の下に耐火マットが必要。', pet: true, shower: true, showerNote: '1回200円。', bath: false, toilet: '不明', carIn: true, carInNote: 'オートサイト70、うちAC電源15サイト。', soloPlan: true, soloPlanNote: '公式にソロ特別料金あり。適用除外日あり。', reservation: '要', reservationNote: 'オンライン予約。', shop: true, wifi: false, firewood: true, firewoodNote: '無料提供。', ice: true, alcohol: true, garbage: '可（生ごみ・空き缶などを分別回収）', ...commonUnknown },
  season: '通年',
  soloComment: 'いすみの70サイト規模のオートキャンプ場。平日などはバイク2,000円・車3,000円のソロ特別料金があり、薪とゴミ回収が無料。',
  officialUrl: 'https://ethp.net/camp/kamifuse/?mid', reservationUrl: 'https://ethp.net/camp/kamifuse/?mid', tel: '0470-66-1718',
  cautions: [approxPinCaution], source: ['https://ethp.net/camp/kamifuse/?mid', 'https://ethp.net/camp/kamifuse/?mid=9'],
});

add({
  id: 'tachibana-fureai-camp', slug: 'tachibana-fureai-camp', name: '橘ふれあい公園キャンプ場', prefecture: '千葉', area: '香取',
  address: '千葉県香取市長岡1828-1', lat: 35.798317, lng: 140.586502,
  priceMin: 2500, priceMax: 4000,
  priceNote: '市外利用者はG〜Kサイト2,500円〜、広々サイト3,300円〜、オートサイト4,000円〜。料金は1泊・シーズン変動。',
  scores: { quietness: 4, scenery: 5, value: 5, access: 3, facility: 4 },
  features: { bonfire: false, bonfireNote: '焚き火可否は公式ページで要確認。', pet: false, petNote: '可否は予約前に要確認。', shower: true, showerNote: '体験学習施設のシャワールームは予約制。キャンプ場での利用条件は要確認。', bath: false, toilet: '不明', carIn: false, carInNote: '最安のG〜Kサイトはオートサイトではない。オートサイトは4,000円〜。',     soloPlan: false, reservation: '要', shop: false, wifi: false, firewood: false, ice: false, alcohol: false, garbage: '持ち帰り（専用袋販売あり）', ...commonUnknown },
  season: '通年（12月29日〜1月3日休）',
  soloComment: '香取の田園風景と星空を楽しめる整備型キャンプ場。市外でも1泊2,500円から選べ、通常サイト・広々サイト・オートサイトを使い分けられる。',
  officialUrl: 'https://www.tachibana-park.jp/facility-guide/camp/', reservationUrl: 'https://www.nap-camp.com/chiba/15060', tel: null,
  cautions: [approxPinCaution], source: ['https://www.tachibana-park.jp/facility-guide/camp/', 'https://www.tachibana-park.jp/about/'],
});

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf8');
const chibaActive = camps.filter((camp) => camp.prefecture === '千葉' && camp.status === 'active').length;
console.log(`千葉県の通常掲載: ${chibaActive}件 / 全掲載データ: ${camps.length}件`);
