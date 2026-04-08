'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Boxes,
  AlertTriangle,
  CalendarOff,
  Truck,
  BrainCircuit,
  FlaskConical,
  ArrowRight,
  ClipboardList,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bar,
  BarChart as RechartsBarChart,
  Line as RechartsLineElement,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as RechartsLineChartComponent,
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from '@/components/ui/chart';
import { useAuth } from '@/providers/AuthProvider';
import { useDashboardMetrics } from '@/hooks/use-dashboard';
import { useMedicines } from '@/hooks/use-medicines';
import { PageShell, PageSection, StatCard } from '@/components/layout/page';
import { cn } from '@/lib/utils';

const expiryChartData = [
  { month: 'Jan', expiring: 2, expired: 1 },
  { month: 'Feb', expiring: 3, expired: 0 },
  { month: 'Mar', expiring: 1, expired: 2 },
  { month: 'Apr', expiring: 4, expired: 1 },
  { month: 'May', expiring: 2, expired: 0 },
  { month: 'Jun', expiring: 3, expired: 1 },
];

const recordsTrendData = [
  { month: 'Jan', records: 45 },
  { month: 'Feb', records: 52 },
  { month: 'Mar', records: 38 },
  { month: 'Apr', records: 61 },
  { month: 'May', records: 47 },
  { month: 'Jun', records: 55 },
];

const chartConfig = {
  expiring: { label: 'Expiring Soon', color: 'hsl(38 96% 54%)' },
  expired:  { label: 'Expired',       color: 'hsl(0 72% 56%)' },
  records:  { label: 'Patient Records', color: 'hsl(162 63% 38%)' },
} satisfies ChartConfig;

const quickActions = [
  {
    href: '/inventory',
    icon: Boxes,
    label: 'Inventory',
    description: 'Review stock levels, batch details, and expiry exposure.',
    iconBg: 'bg-primary/10 text-primary border-primary/20',
    hoverBorder: 'hover:border-primary/30',
    badge: null,
  },
  {
    href: '/shipments',
    icon: Truck,
    label: 'Shipments',
    description: 'Track active orders and cold-chain compliance.',
    iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
    hoverBorder: 'hover:border-sky-300/50',
    badge: null,
  },
  {
    href: '/rxai',
    icon: BrainCircuit,
    label: 'RxAI',
    description: 'Submit patient symptoms for AI-backed clinical insights.',
    iconBg: 'bg-violet-50 text-violet-600 border-violet-200',
    hoverBorder: 'hover:border-violet-300/50',
    badge: 'AI',
  },
  {
    href: '/pharmanet',
    icon: FlaskConical,
    label: 'PharmaNet',
    description: 'Drug lookup, interaction checks, and R&D alerts.',
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    hoverBorder: 'hover:border-amber-300/50',
    badge: null,
  },
  {
    href: '/history',
    icon: ClipboardList,
    label: 'Patient History',
    description: 'Access patient records and consultation history.',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    hoverBorder: 'hover:border-emerald-300/50',
    badge: null,
  },
] as const;

export default function DashboardPage() {
  const { profile } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: medicines = [] } = useMedicines();

  const firstName = profile?.name?.split(' ')[0] ?? null;
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const expiredCount    = metrics?.expired      ?? 0;
  const expiringSoon    = metrics?.expiringSoon  ?? 0;
  const hasUrgent       = expiredCount > 0;
  const hasWarning      = expiringSoon > 0;

  if (metricsLoading) {
    return (
      <PageShell>
        {/* Skeleton header */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <Skeleton className="mb-2 h-5 w-32" />
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl border border-border bg-white p-5 shadow-sm">
              <Skeleton className="mb-3 h-3 w-20" />
              <Skeleton className="h-8 w-14" />
              <Skeleton className="mt-3 h-3 w-28" />
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>

      {/* ── Clinical alert banner (only when there are expired items) ── */}
      {hasUrgent && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <ShieldAlert className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold text-rose-800">
                {expiredCount} expired medicine{expiredCount !== 1 ? 's' : ''} require immediate removal
              </p>
              <p className="text-xs text-rose-600/80">
                Dispensing expired stock is a patient safety risk. Quarantine and dispose immediately.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="shrink-0 bg-rose-600 text-white hover:bg-rose-700">
            <Link href="/inventory">Review now <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      )}

      {/* ── Expiry warning banner ─────────────────────────────────────── */}
      {hasWarning && !hasUrgent && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <CalendarOff className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold text-amber-800">
                {expiringSoon} medicine{expiringSoon !== 1 ? 's' : ''} expiring within 30 days
              </p>
              <p className="text-xs text-amber-600/80">
                Prioritise using these items and plan replacement orders.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100">
            <Link href="/inventory">View stock <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      )}

      {/* ── Compact header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white px-6 py-5 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {greeting}{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Clinic overview — stock, shipments, and patient activity at a glance.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 rounded-xl border-border">
          <Link href="/settings">Preferences</Link>
        </Button>
      </div>

      {/* ── Stat tiles ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Expired"
          value={expiredCount}
          helper={expiredCount > 0 ? 'Requires immediate removal' : 'No expired stock — great!'}
          indicator={<AlertTriangle className="h-4 w-4" />}
          accent="rose"
          delay={1}
          footer={
            expiredCount > 0 ? (
              <Link href="/inventory" className="font-medium text-rose-600 hover:underline underline-offset-4">
                Review {expiredCount} item{expiredCount !== 1 ? 's' : ''} →
              </Link>
            ) : null
          }
        />
        <StatCard
          title="Expiring Soon"
          value={expiringSoon}
          helper="Within the next 30 days"
          indicator={<CalendarOff className="h-4 w-4" />}
          accent="amber"
          delay={2}
          footer={
            expiringSoon > 0 ? (
              <Link href="/inventory" className="font-medium text-amber-600 hover:underline underline-offset-4">
                Plan restocking →
              </Link>
            ) : null
          }
        />
        <StatCard
          title="Total Medicines"
          value={metrics?.totalMeds ?? 0}
          helper="Items currently stocked"
          indicator={<Boxes className="h-4 w-4" />}
          accent="default"
          delay={3}
        />
        <StatCard
          title="Active Shipments"
          value={metrics?.activeShipments ?? 0}
          helper="In transit right now"
          indicator={<Truck className="h-4 w-4" />}
          accent="sky"
          delay={4}
        />
      </div>

      {/* ── Quick actions launcher ───────────────────────────────────── */}
      <PageSection
        title="Module launcher"
        description="Jump straight into the tools your clinic uses most."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map(({ href, icon: Icon, label, description, iconBg, hoverBorder, badge }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex flex-col gap-3 rounded-xl border border-border bg-background p-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]',
                hoverBorder
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl border', iconBg)}>
                  <Icon className="h-4 w-4" />
                </div>
                {badge && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-600">
                    {badge}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{description}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/70" />
            </Link>
          ))}
        </div>
      </PageSection>

      {/* ── Charts ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PageSection
          title="Medicine expiry trends"
          description="Expiring and expired counts per month — act before they peak."
        >
          <ChartContainer config={chartConfig} className="h-52 w-full">
            <RechartsBarChart data={expiryChartData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 28% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(218 14% 50%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(218 14% 50%)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="expiring" fill="hsl(38 96% 54%)"  radius={[4, 4, 0, 0]} />
              <Bar dataKey="expired"  fill="hsl(0 72% 56%)"   radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ChartContainer>
        </PageSection>

        <PageSection
          title="Patient record volume"
          description="Clinical notes filed each month — spot workload spikes early."
          actions={
            <span className="flex items-center gap-1 text-xs font-medium text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              +22% vs last quarter
            </span>
          }
        >
          <ChartContainer config={chartConfig} className="h-52 w-full">
            <RechartsLineChartComponent data={recordsTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 28% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(218 14% 50%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(218 14% 50%)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
              <RechartsLineElement
                type="monotone"
                dataKey="records"
                stroke="hsl(162 63% 38%)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'hsl(162 63% 38%)' }}
                activeDot={{ r: 5, fill: 'hsl(162 63% 38%)' }}
              />
            </RechartsLineChartComponent>
          </ChartContainer>
        </PageSection>
      </div>

      {/* ── Recent inventory ─────────────────────────────────────────── */}
      <PageSection
        title="Recent inventory"
        description="Latest additions to your medicine library."
        actions={
          <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs text-muted-foreground hover:text-foreground">
            <Link href="/inventory">
              View all
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      >
        <div className="space-y-2">
          {medicines.slice(0, 5).map((medicine) => {
            const isExpired   = medicine.expiryDate && new Date(medicine.expiryDate) < new Date();
            const isExpiring  = !isExpired && medicine.expiryDate &&
              new Date(medicine.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            return (
              <div
                key={medicine.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-muted/30',
                  isExpired  ? 'border-rose-200  bg-rose-50/60'  :
                  isExpiring ? 'border-amber-200 bg-amber-50/60' :
                               'border-border   bg-background'
                )}
              >
                <span className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                  isExpired  ? 'bg-rose-100 text-rose-600'   :
                  isExpiring ? 'bg-amber-100 text-amber-600' :
                               'bg-primary/10 text-primary'
                )}>
                  {medicine.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{medicine.name}</p>
                  <p className="text-xs text-muted-foreground">{medicine.manufacturer}</p>
                </div>
                {isExpired ? (
                  <Badge className="shrink-0 border-rose-200 bg-rose-100 text-rose-700 text-[10px]">Expired</Badge>
                ) : isExpiring ? (
                  <Badge className="shrink-0 border-amber-200 bg-amber-100 text-amber-700 text-[10px]">Expiring</Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 text-xs">{medicine.quantity} units</Badge>
                )}
                <span className="shrink-0 text-xs text-muted-foreground">
                  {medicine.expiryDate
                    ? new Date(medicine.expiryDate).toLocaleDateString()
                    : medicine.createdAt
                    ? new Date(medicine.createdAt).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            );
          })}
          {medicines.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Boxes className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No medicines yet.{' '}
                <Link href="/inventory" className="font-medium text-primary hover:underline underline-offset-4">
                  Add your first item.
                </Link>
              </p>
            </div>
          )}
        </div>
      </PageSection>
    </PageShell>
  );
}
