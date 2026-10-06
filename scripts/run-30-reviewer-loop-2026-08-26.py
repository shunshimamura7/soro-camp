import concurrent.futures as cf
import json
import os
import time
from pathlib import Path
from openai import OpenAI

ROOT = Path(__file__).resolve().parent.parent
INPUT = ROOT / "data" / "candidate-batch2-four-pref-2026-08-26.json"
OUTPUT = ROOT / "data" / "candidate-batch2-30-review-results-2026-08-26.json"

ROLES = [
    (1, "公式根拠監査", "公式または自治体の一次情報が利用判断を支えるかを見る"),
    (2, "料金計算監査", "ソロ1名の最低総額と例外日を誤解なく説明できるかを見る"),
    (3, "情報鮮度監査", "掲載内容が現在の営業・料金を示す根拠を持つかを見る"),
    (4, "予約導線監査", "予約または問い合わせ先が公式に明確かを見る"),
    (5, "連絡先監査", "利用者が管理者へ連絡できる情報があるかを見る"),
    (6, "住所監査", "公式住所と候補住所の整合性を見る"),
    (7, "地図精度監査", "実施設・受付位置を出せる準備が整っているかを見る"),
    (8, "地域分類監査", "利用者に分かりやすいエリア分類ができるかを見る"),
    (9, "アクセス監査", "車両・荷下ろし・徒歩上の重要注意を説明できるかを見る"),
    (10, "補給監査", "食料・水・燃料の事前準備難度を説明できるかを見る"),
    (11, "単独利用監査", "一人での宿泊可否が根拠をもって確認できるかを見る"),
    (12, "ソロ料金監査", "ソロプランとサイト単位料金を明確に区別できるかを見る"),
    (13, "日付条件監査", "平日・休日・繁忙期の違いが明確かを見る"),
    (14, "静けさ監査", "静かさを裏付ける利用ルールまたは施設条件があるかを見る"),
    (15, "初心者適性監査", "初心者が判断できる設備・管理・レンタル情報があるかを見る"),
    (16, "経験者適性監査", "焚き火・景観・自由度などを根拠付きで示せるかを見る"),
    (17, "トイレ監査", "トイレ情報が確認済みかを見る"),
    (18, "入浴監査", "シャワー・風呂・近隣入浴情報が確認済みかを見る"),
    (19, "焚き火監査", "直火・焚き火台・火気ルールが確認済みかを見る"),
    (20, "車横付け監査", "横付け・荷下ろしのみ・駐車場を区別できるかを見る"),
    (21, "生活設備監査", "ゴミ・水・電源等の実用情報があるかを見る"),
    (22, "営業運用監査", "営業日・予約期限・休業条件が確認済みかを見る"),
    (23, "自然リスク監査", "河川・山道・野生動物などの注意を利用者に伝えられるかを見る"),
    (24, "利用制限監査", "ペット・騒音・グループ・利用人数の制約が確認済みかを見る"),
    (25, "注意書き監査", "未確認事項を隠さず正確に示せるかを見る"),
    (26, "スコア根拠監査", "5軸スコアをつける十分な根拠があるかを見る"),
    (27, "紹介文監査", "誇張せず事実に基づく紹介文を作れるかを見る"),
    (28, "比較価値監査", "ユーザーが他施設と比較して選ぶ理由があるかを見る"),
    (29, "検索UX監査", "フィルタ・価格順・地図が誤った期待を作らないかを見る"),
    (30, "維持性監査", "更新・再確認のための情報が十分に残るかを見る"),
]

SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "review_result",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "minimum": 0, "maximum": 3},
                "blocker": {"type": "boolean"},
                "evidence": {"type": "string"},
                "required_action": {"type": "string"}
            },
            "required": ["score", "blocker", "evidence", "required_action"],
            "additionalProperties": False
        }
    }
}

client = OpenAI()

def review(candidate, role):
    role_id, role_name, focus = role
    prompt = {
        "reviewer": {"id": role_id, "name": role_name, "focus": focus},
        "candidate": candidate,
        "task": "候補データだけを根拠に、指定観点の掲載準備度を採点する。外部知識を使わず、根拠に無い事実を補わない。scoreは0=根拠なし、1=断片的、2=概ね確認済み、3=公開に十分。blockerは通常掲載前に必ず解消すべき不足ならtrue。evidenceとrequired_actionは日本語で短く書く。"
    }
    last_error = None
    for attempt in range(3):
        try:
            resp = client.chat.completions.create(
                model="gpt-5-mini",
                messages=[
                    {"role": "system", "content": "あなたは根拠主義のキャンプ情報品質審査員です。提示資料以外を推測しません。JSONのみ出力します。"},
                    {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)}
                ],
                response_format=SCHEMA,
                max_completion_tokens=320,
            )
            payload = json.loads(resp.choices[0].message.content)
            return {
                "candidate_id": candidate["id"],
                "candidate_name": candidate["name"],
                "prefecture": candidate["prefecture"],
                "reviewer_id": role_id,
                "reviewer": role_name,
                **payload
            }
        except Exception as exc:
            last_error = str(exc)
            time.sleep(1 + attempt)
    return {
        "candidate_id": candidate["id"],
        "candidate_name": candidate["name"],
        "prefecture": candidate["prefecture"],
        "reviewer_id": role_id,
        "reviewer": role_name,
        "score": 0,
        "blocker": True,
        "evidence": "採点処理に失敗したため根拠未判定。",
        "required_action": f"再実行が必要: {last_error}"
    }

def main():
    candidates = json.loads(INPUT.read_text(encoding="utf-8"))
    tasks = [(c, role) for c in candidates for role in ROLES]
    results = []
    with cf.ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(review, c, role) for c, role in tasks]
        for i, fut in enumerate(cf.as_completed(futures), 1):
            results.append(fut.result())
            if i % 30 == 0:
                print(f"completed {i}/{len(tasks)}", flush=True)
    results.sort(key=lambda x: (x["candidate_id"], x["reviewer_id"]))
    OUTPUT.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"candidates": len(candidates), "reviews": len(results), "output": str(OUTPUT)}, ensure_ascii=False))

if __name__ == "__main__":
    main()
