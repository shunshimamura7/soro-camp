type Props = {
  label: string;
  score: number;
  max?: number;
  color?: string;
};

export default function ScoreBar({ label, score, max = 5, color = "#1d9bf0" }: Props) {
  const pct = (score / max) * 100;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-14 shrink-0 text-slate-500">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-5 text-right text-slate-700 font-medium">{score}</span>
    </div>
  );
}
