import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CANDIDATES = json.loads((ROOT / "data" / "candidate-batch2-four-pref-2026-08-26.json").read_text(encoding="utf-8"))
REVIEWS = json.loads((ROOT / "data" / "candidate-batch2-30-review-results-2026-08-26.json").read_text(encoding="utf-8"))
OUT_JSON = ROOT / "data" / "candidate-batch2-30-review-summary-2026-08-26.json"
OUT_MD = ROOT / "candidate-batch2-30-review-summary-2026-08-26.md"

review_map = defaultdict(list)
for r in REVIEWS:
    review_map[r["candidate_id"]].append(r)

rows = []
for c in CANDIDATES:
    rs = review_map[c["id"]]
    avg = sum(r["score"] for r in rs) / len(rs)
    blocker_count = sum(1 for r in rs if r["blocker"])
    by_domain = {
        "根拠・連絡・住所": sum(r["score"] for r in rs[:6]) / 18 * 100,
        "地図・アクセス": sum(r["score"] for r in rs[6:10]) / 12 * 100,
        "ソロ適性": sum(r["score"] for r in rs[10:16]) / 18 * 100,
        "設備": sum(r["score"] for r in rs[16:21]) / 15 * 100,
        "安全・運用": sum(r["score"] for r in rs[21:25]) / 12 * 100,
        "コンテンツ・維持": sum(r["score"] for r in rs[25:30]) / 15 * 100,
    }
    actions = Counter(r["required_action"] for r in rs if r["score"] < 3)
    # 低得点かつblockerの観点を優先して3件に圧縮
    flagged = [r for r in rs if r["blocker"] or r["score"] <= 1]
    flagged.sort(key=lambda r: (not r["blocker"], r["score"], r["reviewer_id"]))
    key_gaps = []
    seen = set()
    for r in flagged:
        label = f"{r['reviewer']}：{r['required_action']}"
        if label not in seen:
            seen.add(label)
            key_gaps.append(label)
        if len(key_gaps) == 5:
            break
    quality = round(avg / 3 * 100, 1)
    # 90点条件は根拠/地図/安全の全てが一定を満たした上でblocker<=4
    publish_ready = quality >= 80 and blocker_count <= 7 and min(by_domain.values()) >= 45
    rows.append({
        "id": c["id"], "name": c["name"], "prefecture": c["prefecture"],
        "quality_index": quality, "blockers": blocker_count,
        "domains": {k: round(v, 1) for k, v in by_domain.items()},
        "publish_ready": publish_ready, "key_gaps": key_gaps,
        "officialUrl": c["officialUrl"], "priceMin": c["priceMin"]
    })

rows.sort(key=lambda x: (-x["quality_index"], x["blockers"], x["name"]))
OUT_JSON.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

lines = ["# 第2弾候補：30観点レビュー集計", "", "12候補 × 30観点 = 360件の独立評価を、根拠パケットのみに基づき集計した。品質指数は30観点の平均を100点へ正規化したもの。", "", "| 順位 | 都県 | 施設 | 品質指数 | ブロッカー | 通常掲載判定 |", "|---:|---|---|---:|---:|---|"]
for i, row in enumerate(rows, 1):
    lines.append(f"| {i} | {row['prefecture']} | {row['name']} | {row['quality_index']} | {row['blockers']} | {'条件付き可' if row['publish_ready'] else '追加確認後'} |")
lines.append("\n## 候補別の重点不足\n")
for row in rows:
    lines.append(f"### {row['name']}（{row['prefecture']}）\n")
    lines.append("| 根拠・連絡・住所 | 地図・アクセス | ソロ適性 | 設備 | 安全・運用 | コンテンツ・維持 |")
    lines.append("|---:|---:|---:|---:|---:|---:|")
    d = row['domains']
    lines.append(f"| {d['根拠・連絡・住所']} | {d['地図・アクセス']} | {d['ソロ適性']} | {d['設備']} | {d['安全・運用']} | {d['コンテンツ・維持']} |")
    for gap in row['key_gaps']:
        lines.append(f"- {gap}")
    lines.append("")
OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(json.dumps({"rows": len(rows), "publish_ready": sum(r['publish_ready'] for r in rows), "output": str(OUT_JSON)}, ensure_ascii=False))
