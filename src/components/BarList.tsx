export function BarList({ items }: { items: { label: string; value: number; text: string }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="bars">
      {items.map((i) => (
        <li key={i.label}>
          <div className="bar-head"><span>{i.label}</span><span className="muted">{i.text}</span></div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
