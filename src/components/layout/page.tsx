import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 mx-auto', className)}>
      {children}
    </div>
  );
}

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
        'flex flex-col gap-6 border border-border/60 bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm',
        className
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          {eyebrow ? (
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </span>
          ) : null}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-col gap-2 sm:items-end">{actions}</div> : null}
      </div>
      {children ? <div className="grid gap-4">{children}</div> : null}
    </section>
  );
}

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
      className={cn('rounded-2xl border border-border/60 bg-background/90 shadow-sm', className)}
    >
      {(title || description || actions) && (
        <header
          className={cn(
            'flex flex-col gap-4 border-b border-border/60 p-6 sm:flex-row sm:items-center sm:justify-between',
            headerClassName
          )}
        >
          <div className="space-y-1.5">
            {title ? <h2 className="text-base font-semibold text-foreground">{title}</h2> : null}
            {description ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-col gap-2 sm:items-end">{actions}</div> : null}
        </header>
      )}
      <div className={cn('p-6', contentClassName)}>{children}</div>
    </section>
  );
}

interface StatCardProps {
  indicator?: ReactNode;
  title: string;
  value: ReactNode;
  helper?: string;
  footer?: ReactNode;
  className?: string;
}

export function StatCard({
  indicator,
  title,
  value,
  helper,
  footer,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col justify-between rounded-2xl border border-border/60 bg-background/95 p-5 shadow-sm transition-shadow hover:shadow-lg',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
            {title}
          </p>
          <div className="text-2xl font-semibold text-foreground">{value}</div>
          {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
        </div>
        {indicator ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            {indicator}
          </div>
        ) : null}
      </div>
      {footer ? <div className="mt-4 text-xs text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
