"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BRAND = "#19c37d";
const GRID = "#1f232c";
const MUTED = "#9aa3b2";

const tooltipStyle = {
  background: "#0e1014",
  border: "1px solid #1f232c",
  borderRadius: 8,
  fontSize: 12,
  color: "#e7ebf3",
};

export function LitrosArea({ data }: { data: Array<{ dia: string; litros: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="litrosFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.4} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="dia" tick={{ fill: MUTED, fontSize: 10 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v} L`} />
        <Area type="monotone" dataKey="litros" stroke={BRAND} strokeWidth={2} fill="url(#litrosFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function EventosBar({
  data,
}: {
  data: Array<{ dia: string; eventos: number; bloqueios: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
        <XAxis dataKey="dia" tick={{ fill: MUTED, fontSize: 10 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="eventos" name="Eventos" fill={BRAND} radius={[3, 3, 0, 0]} />
        <Bar dataKey="bloqueios" name="Bloqueios" fill="#ef4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["#19c37d", "#3b82f6", "#f5a524", "#ef4444", "#9aa3b2"];

export function StatusPie({ data }: { data: Array<{ name: string; value: number }> }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-xs text-[color:var(--color-muted)]">
        Sem eventos no período.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={80}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TopDriversBar({ data }: { data: Array<{ nome: string; litros: number }> }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-xs text-[color:var(--color-muted)]">
        Sem dados de motoristas.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
        <XAxis type="number" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="nome"
          tick={{ fill: MUTED, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v} L`} />
        <Bar dataKey="litros" fill={BRAND} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieLegend({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-3">
      {data.map((d, i) => (
        <span key={d.name} className="flex items-center gap-1.5 text-xs text-[color:var(--color-muted)]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
          />
          {d.name} ({d.value})
        </span>
      ))}
    </div>
  );
}
