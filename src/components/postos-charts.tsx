"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

const tip = {
  background: "#0e1014",
  border: "1px solid #1f232c",
  borderRadius: 8,
  fontSize: 12,
  color: "#e7ebf3",
};

const brl = (v: number | string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function FaturamentoRede({ data }: { data: Array<{ mes: string; faturamento: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="fatFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.35} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="mes" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis
          tick={{ fill: MUTED, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={64}
          tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
        />
        <Tooltip contentStyle={tip} formatter={(v) => brl(v as number)} />
        <Area type="monotone" dataKey="faturamento" stroke={BRAND} strokeWidth={2} fill="url(#fatFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LitrosRede({ data }: { data: Array<{ mes: string; litros: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="mes" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis
          tick={{ fill: MUTED, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
        />
        <Tooltip contentStyle={tip} formatter={(v) => `${Number(v).toLocaleString("pt-BR")} L`} />
        <Bar dataKey="litros" fill="#3b82f6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopPostosBar({ data }: { data: Array<{ nome: string; faturamento: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <XAxis
          type="number"
          tick={{ fill: MUTED, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
        />
        <YAxis
          type="category"
          dataKey="nome"
          tick={{ fill: MUTED, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={150}
        />
        <Tooltip contentStyle={tip} formatter={(v) => brl(v as number)} />
        <Bar dataKey="faturamento" fill={BRAND} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["#19c37d", "#3b82f6", "#f5a524", "#ef4444", "#a855f7"];

export function MixPie({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip contentStyle={tip} formatter={(v) => `${Number(v).toLocaleString("pt-BR")} L`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MixLegend({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  return (
    <div className="mt-2 space-y-1.5">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-[color:var(--color-muted)]">
            <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            {d.name}
          </span>
          <span className="font-mono text-[color:var(--color-text-strong)]">{Math.round((d.value / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

export function PostoSerieLine({
  data,
}: {
  data: Array<{ mes: string; faturamento: number; litros: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="mes" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis
          tick={{ fill: MUTED, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={64}
          tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
        />
        <Tooltip contentStyle={tip} formatter={(v) => brl(v as number)} />
        <Line type="monotone" dataKey="faturamento" stroke={BRAND} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
