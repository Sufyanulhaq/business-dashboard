import { percent } from "@/lib/format";

export function KpiCard({ label, value, change }: { label: string; value: string; change: number | null }) {
  const tone = change === null || Math.abs(change) < 0.0005 ? "flat" : change > 0 ? "up" : "down";
  return (
    <div className="card kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className={`delta ${tone}`} aria-label={`${percent(change)} compared with the previous period`}>
        {percent(change)} <span>vs previous</span>
      </div>
    </div>
  );
}
