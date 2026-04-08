import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ── PageShell ──────────────────────────────────────────────────────────────
interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 animate-fade-in',
        className
      )}
    >
      {children}
    </div>
  );
}

// ── PageHeader ─────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)]',
        className
      )}
    >
      {/* Teal glow accent — top right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/8 blur-3xl"
      />
      {/* Faint grid dots */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(162 63% 38%) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          {eyebrow ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              {eyebrow}
            </span>
          ) : null}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">{actions}</div>
        ) : null}
      </div>

      {children ? <div className="relative mt-5 grid gap-4">{children}</div> : null}
    </section>
  );
}

// ── PageSection ────────────────────────────────────────────────────────────
interface PageSectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function PageSection({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
}: PageSectionProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.03)]',
        className
      )}
    >
      {(title || description || actions) && (
        <header
          className={cn(
            'flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
            headerClassName
          )}
        >
          <div className="space-y-0.5">
            {title ? (
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">{actions}</div>
          ) : null}
        </header>
      )}
      <div className={cn('p-5', contentClassName)}>{children}</div>
    </section>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────
const statCardAccents = {
  default: {
    bar:    'bg-primary',
    glow:   'bg-primary/5',
    icon:   'border-primary/20 bg-primary/8 text-primary',
    value:  'text-foreground',
  },
  amber: {
    bar:    'bg-amber-500',
    glow:   'bg-amber-50',
    icon:   'border-amber-200 bg-amber-50 text-amber-600',
    value:  'text-amber-700',
  },
  rose: {
    bar:    'bg-rose-500',
    glow:   'bg-rose-50',
    icon:   'border-rose-200 bg-rose-50 text-rose-600',
    value:  'text-rose-700',
  },
  sky: {
    bar:    'bg-sky-500',
    glow:   'bg-sky-50',
    icon:   'border-sky-200 bg-sky-50 text-sky-600',
    value:  'text-sky-700',
  },
  violet: {
    bar:    'bg-violet-500',
    glow:   'bg-violet-50',
    icon:   'border-violet-200 bg-violet-50 text-violet-600',
    value:  'text-violet-700',
  },
} as const;

export type StatCardAccent = keyof typeof statCardAccents;

interface StatCardProps {
  indicator?: ReactNode;
  title: string;
  value: ReactNode;
  helper?: string;
  footer?: ReactNode;
  accent?: StatCardAccent;
  className?: string;
  delay?: 0 | 1 | 2 | 3 | 4;
}

const delayClass: Record<number, string> = {
  0: '',
  1: 'animate-slide-up-delay-1',
  2: 'animate-slide-up-delay-2',
  3: 'animate-slide-up-delay-3',
  4: 'animate-slide-up-delay-4',
};

export function StatCard({
  indicator,
  title,
  value,
  helper,
  footer,
  accent = 'default',
  className,
  delay = 0,
}: StatCardProps) {
  const colors = statCardAccents[accent];

  return (
    <div
      className={cn(
        'relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_2px_8px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] animate-slide-up',
        delayClass[delay],
        className
      )}
    >
      {/* Left accent bar */}
      <div aria-hidden className={cn('absolute left-0 top-0 h-full w-1 rounded-r', colors.bar)} />

      {/* Faint background tint */}
      <div aria-hidden className={cn('absolute inset-0 opacity-40', colors.glow)} />

      <div className="relative flex items-start justify-between gap-3 pl-3">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </p>
          <div className={cn('tabular-nums text-3xl font-bold tracking-tight', colors.value)}>
            {value}
          </div>
          {helper ? (
            <p className="text-xs text-muted-foreground">{helper}</p>
          ) : null}
        </div>
        {indicator ? (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
              colors.icon
            )}
          >
            {indicator}
          </div>
        ) : null}
      </div>

      {footer ? (
        <div className="relative mt-4 pl-3 text-xs text-muted-foreground">{footer}</div>
      ) : null}
    </div>
  );
}
