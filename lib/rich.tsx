import { Fragment, type ReactNode } from "react";

/**
 * データ中の強調記法 `**…**` を画面用に描画する（2026-11-05）。
 *
 * soloComment・cautions・priceNote などは人が書いた文で、重要な語を `**` で囲んでいる。
 * 以前はそのまま出していたので「**座標が未取得。**」のように記号が画面に残り、
 * 審査（10人採点）で全員から指摘された。**データは書き換えず、表示側で解釈する。**
 * 対応するのは `**` だけ。閉じていない `**` は記号を外して文字だけ出す。
 */
export function RichText({ text, strongClassName = "font-bold" }: { text?: string | null; strongClassName?: string }): ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\*\*[^*]+\*\*$/.test(p) ? (
          <strong key={i} className={strongClassName}>{p.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{p.replace(/\*\*/g, "")}</Fragment>
        )
      )}
    </>
  );
}

/** meta description・JSON-LD・title 属性など、HTML を使えない場所向けに `**` を外す */
export function plainText(text?: string | null): string {
  return (text ?? "").replace(/\*\*/g, "");
}

/**
 * 注意事項のうち「施設の注意」ではなく「このサイト側のデータの状況」を書いた行。
 * 例：「**座標が未取得。**地図にピンを出していない」「**料金が公式に載っていない。**…」
 * 施設の注意（定休日・直火禁止など）と同じ重さで並べると、予定に関わる注意が埋もれるので、
 * 詳細ページでは下にまとめて小さく出す（審査員2・7の指摘）。
 */
export function isSiteStatusCaution(text: string): boolean {
  return /座標が未取得|地図にピンを出していない|料金が公式に載っていない/.test(plainText(text));
}
