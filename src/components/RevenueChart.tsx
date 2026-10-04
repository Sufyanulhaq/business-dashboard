import { money, money2, shortDate } from "@/lib/format";

const W = 760;
const H = 250;
const PAD = { top: 16, right: 16, bottom: 30, left: 56 };

/** Rounds up to a tidy number for the top of the axis, for example 4,730 becomes 5,000. */
export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const f = v / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

export function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  const max = niceMax(Math.max(...data.map((d) => d.revenue), 0));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const step = Math.max(1, Math.ceil(data.length / 6));
  const total = data.reduce((s, d) => s + d.revenue, 0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Daily revenue over ${data.length} days, ${money(total)} in total`} className="chart">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="grid" />
          <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="axis">{money(t)}</text>
        </g>
      ))}
      <path d={area} className="area" />
      <path d={line} className="line" />
      {data.map((d, i) => (
        <g key={d.date}>
          {i % step === 0 && <text x={x(i)} y={H - 8} textAnchor="middle" className="axis">{shortDate(d.date)}</text>}
          <circle cx={x(i)} cy={y(d.revenue)} r={data.length > 40 ? 3 : 4} className="pt">
            <title>{`${shortDate(d.date)}: ${money2(d.revenue)}`}</title>
          </circle>
        </g>
      ))}
    </svg>
  );
}
