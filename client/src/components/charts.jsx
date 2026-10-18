import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { money, number } from '../utils/format';
const colors = ['#536e4d', '#98ac85', '#c5cdb6', '#e5e7d9', '#b4b9a8', '#7f9180'];
const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid var(--color-line)',
  background: 'var(--color-canvas)',
  fontSize: 11,
  color: 'var(--color-ink)',
};
export function RevenueChart({ data, metric = 'revenue', height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
        <defs>
          <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a2b68c" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#a2b68c" stopOpacity={0.015} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 5" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} dy={9} minTickGap={20} />
        <YAxis
          tickFormatter={(v) =>
            metric === 'revenue' ? money(v, true) : metric === 'engagement' ? `${v}%` : number(v)
          }
          tickLine={false}
          axisLine={false}
          tickCount={5}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v) =>
            metric === 'revenue'
              ? money(v)
              : metric === 'engagement'
                ? `${Number(v).toFixed(2)}%`
                : number(v)
          }
        />
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey={metric}
          stroke="#819969"
          strokeWidth={2.5}
          fill={`url(#fill-${metric})`}
          activeDot={{ r: 5, strokeWidth: 3, stroke: 'white' }}
        />
        {metric === 'revenue' && (
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="expenses"
            stroke="#c6c9bf"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="transparent"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
export function PlatformChart({ data, total }) {
  return (
    <>
      <div className="relative">
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              isAnimationActive={false}
              data={data}
              dataKey="followers"
              nameKey="platform"
              innerRadius={62}
              outerRadius={80}
              paddingAngle={4}
              cornerRadius={3}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((item, i) => (
                <Cell key={item.platform} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => number(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[24px] font-semibold tracking-tight">{number(total)}</p>
          <p className="mt-1 text-[10px] text-muted">Total audience</p>
        </div>
      </div>
      <div className="mt-1 space-y-3">
        {data.map((item, i) => (
          <div key={item.platform} className="flex items-center text-[11px]">
            <span
              className="mr-2 h-2 w-2 rounded-full"
              style={{ background: colors[i % colors.length] }}
            />
            <span>{item.platform}</span>
            <span className="ml-auto mr-4 text-muted">{number(item.followers)}</span>
            <span className="w-8 text-right font-medium">
              {total ? Math.round((item.followers / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
export function CompareChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis dataKey="platform" axisLine={false} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} tickFormatter={number} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        <Bar isAnimationActive={false} dataKey="followers" fill="#819969" radius={[4, 4, 0, 0]} />
        <Bar isAnimationActive={false} dataKey="views" fill="#c5cdb6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}