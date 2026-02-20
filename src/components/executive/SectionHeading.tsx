interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}

export function SectionHeading({ title, subtitle, badge, action }: SectionHeadingProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {badge && (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
