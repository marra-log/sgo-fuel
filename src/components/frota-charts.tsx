"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BRAND = "#2f6df6"; // azul (estilo Flagcard) p/ os painéis de frota
const GRID = "#1f232c";
const MUTED = "#9aa3b2";
const tip = { background: "#0e1014", border: "1px solid #1f232c", borderRadius: 8, fontSize: 12, color: "#e7ebf3" };
const brl = (v: number | string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function ConsumoDeptoBar({ data }: { data: Array<{ nome: string; consumoReais: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 54)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <XAxis type="number" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
        <YAxis type="category" dataKey="nome" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
        <Tooltip contentStyle={tip} formatter={(v) => brl(v as number)} />
        <Bar dataKey="consumoReais" fill={BRAND} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HistoricoArea({ data }: { data: Array<{ mes: string; consumo: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.35} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="mes" tick={{ fill: MUTED, fontSize: 10 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
        <Tooltip contentStyle={tip} formatter={(v) => brl(v as number)} />
        <Area type="monotone" dataKey="consumo" stroke={BRAND} strokeWidth={2} fill="url(#histFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
