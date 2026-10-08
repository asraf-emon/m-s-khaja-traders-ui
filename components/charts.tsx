'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { formatBdt } from '@/lib/format';
import { useI18n } from '@/components/providers';

export function ProfitChart({ sales, cost, profit, margin }: { sales: number; cost: number; profit: number; margin: number }) {
  const { t } = useI18n();
  const slices = [
    { name: t('dash.cost'), value: Math.max(cost, 0), fill: '#78716c' },
    { name: profit >= 0 ? t('dash.profit') : t('dash.profit'), value: Math.abs(profit), fill: profit >= 0 ? '#1f7a3a' : '#b91c1c' },
  ].filter((item) => item.value > 0);

  if (!slices.length) return <p className="text-sm text-stone-500">{t('common.empty')}</p>;

  return (
    <div className="min-w-0">
      <div className="relative h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="82%" paddingAngle={2} stroke="none">
              {slices.map((slice) => <Cell key={slice.name} fill={slice.fill} />)}
            </Pie>
            <Tooltip formatter={(value) => formatBdt(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-semibold">{margin}%</p>
            <p className="text-xs text-stone-500">{t('dash.margin')}</p>
          </div>
        </div>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-stone-500">{t('dash.sales')}</dt><dd className="font-semibold">{formatBdt(sales)}</dd></div>
        <div><dt className="text-stone-500">{t('dash.cost')}</dt><dd className="font-semibold">{formatBdt(cost)}</dd></div>
        <div><dt className="text-stone-500">{t('dash.profit')}</dt><dd className="font-semibold">{formatBdt(profit)}</dd></div>
        <div><dt className="text-stone-500">{t('dash.margin')}</dt><dd className="font-semibold">{margin}%</dd></div>
      </dl>
    </div>
  );
}

export function TrendChart({ points }: { points: { date: string; sales: number }[] }) {
  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(value: string) => value.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip formatter={(value) => formatBdt(Number(value))} />
          <Bar dataKey="sales" fill="#1f7a3a" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
