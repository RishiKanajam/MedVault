'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Boxes, AlertTriangle, CalendarOff, Truck, BrainCircuit } from 'lucide-react';
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
import { PageShell, PageHeader, PageSection, StatCard } from '@/components/layout/page';

// Mock chart data (replace with real data from Firestore)
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
  expiring: {
    label: "Expiring Soon",
    color: "hsl(var(--chart-1))",
  },
  expired: {
    label: "Expired",
    color: "hsl(var(--chart-2))",
  },
  records: {
    label: "Patient Records",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { profile } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: medicines = [] } = useMedicines();

  const welcomeCopy = `Welcome back${profile?.name ? `, ${profile.name}` : ''}. Keep tabs on stock, shipments, and patient activity in seconds.`;

  const header = (
    <PageHeader
      eyebrow="Today"
      title="Operations Pulse"
      description={welcomeCopy}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/settings">Team preferences</Link>
        </Button>
      }
    />
  );

  if (metricsLoading) {
    return (
      <PageShell>
        {header}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-border/60 bg-background/90 p-5 shadow-sm"
            >
              <Skeleton className="mb-4 h-3 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="mt-4 h-3 w-32" />
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  const metricCards = [
    {
      title: 'Total Medicines',
      value: metrics?.totalMeds ?? 0,
      helper: 'Items currently stocked',
      indicator: <Boxes className="h-4 w-4" />,
    },
    {
      title: 'Expiring Soon',
      value: metrics?.expiringSoon ?? 0,
      helper: 'Within the next 30 days',
      indicator: <CalendarOff className="h-4 w-4" />,
    },
    {
      title: 'Expired',
      value: metrics?.expired ?? 0,
      helper: 'Requires removal',
      indicator: <AlertTriangle className="h-4 w-4" />,
    },
    {
      title: 'Active Shipments',
      value: metrics?.activeShipments ?? 0,
      helper: 'In transit right now',
      indicator: <Truck className="h-4 w-4" />,
    },
  ];

  return (
    <PageShell>
      {header}

      <div className="grid gap-8">
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => (
            <StatCard
              key={card.title}
              indicator={card.indicator}
              title={card.title}
              value={card.value}
              helper={card.helper}
            />
          ))}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <PageSection
            title="Medicine expiry trends"
            description="Track where inventory is approaching its use-by window."
          >
            <ChartContainer config={chartConfig}>
              <RechartsBarChart data={expiryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                <Bar dataKey="expiring" fill="var(--color-expiring)" />
                <Bar dataKey="expired" fill="var(--color-expired)" />
              </RechartsBarChart>
            </ChartContainer>
          </PageSection>

          <PageSection
            title="Patient records trend"
            description="Monitor how many clinical notes are being filed each month."
          >
            <ChartContainer config={chartConfig}>
              <RechartsLineChartComponent data={recordsTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                <RechartsLineElement
                  type="monotone"
                  dataKey="records"
                  stroke="var(--color-records)"
                  strokeWidth={2}
                />
              </RechartsLineChartComponent>
            </ChartContainer>
          </PageSection>
        </div>

        <PageSection
          title="Quick actions"
          description="Jump straight into the tools your team uses most."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/inventory"
              className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-sm transition hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Boxes className="h-5 w-5 text-primary" />
                  Inventory
                </span>
                <span className="text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                  Open →
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Review stock levels, batch details, and expiry exposure.
              </p>
            </Link>

            <Link
              href="/shipments"
              className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-sm transition hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Truck className="h-5 w-5 text-primary" />
                  Shipments
                </span>
                <span className="text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                  Track →
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Check routing status and manage cold-chain compliance.
              </p>
            </Link>

            <Link
              href="/rxai"
              className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-sm transition hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  RxAI Assistant
                </span>
                <span className="text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                  Launch →
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Submit symptoms for instant clinical insights powered by AI.
              </p>
            </Link>
          </div>
        </PageSection>

        <PageSection
          title="Recent activity"
          description="Latest moves across inventory and patient tracking."
        >
          <div className="space-y-4">
            {medicines.slice(0, 4).map((medicine) => (
              <div
                key={medicine.id}
                className="flex items-center gap-4 rounded-xl border border-border/40 bg-muted/40 p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
                  {medicine.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{medicine.name}</p>
                  <p className="text-xs text-muted-foreground">Added to inventory</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {medicine.createdAt ? new Date(medicine.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>
            ))}
            {medicines.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/60 bg-background/80 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No recent updates yet. Add medicines to see activity here.
                </p>
              </div>
            )}
          </div>
        </PageSection>
      </div>
    </PageShell>
  );
}
