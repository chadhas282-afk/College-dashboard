interface StatsCardsProps {
  totalEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  totalCapacity: number;
}

export default function StatsCards({
  totalEvents,
  upcomingEvents,
  totalRegistrations,
  totalCapacity,
}: StatsCardsProps) {
  const fillRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

  const cards = [
    { label: 'Total events', value: totalEvents, icon: '📅', from: 'from-cyan-400/25', text: 'text-cyan-300' },
    { label: 'Upcoming', value: upcomingEvents, icon: '⏳', from: 'from-sky-400/25', text: 'text-sky-300' },
    {
      label: 'Registrations',
      value: totalRegistrations,
      icon: '📝',
      from: 'from-emerald-400/25',
      text: 'text-emerald-300',
    },
    {
      label: 'Capacity fill',
      value: `${fillRate}%`,
      icon: '📊',
      from: 'from-fuchsia-400/25',
      text: 'text-fuchsia-300',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="glass-card transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-neon-sm"
        >
          <div
            className={`flex items-center justify-between border-b border-white/10 bg-gradient-to-r ${c.from} to-transparent px-5 py-3`}
          >
            <span className={`text-lg ${c.text}`} aria-hidden>
              {c.icon}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              live
            </span>
          </div>
          <div className="p-5">
            <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-white">
              {c.value}
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-slate-400">
              {c.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}