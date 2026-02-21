import { ExternalLink } from 'lucide-react';

interface BYOKCardProps {
  title: string;
  provider: string;
  isDemo: boolean;
  onConnect?: () => void;
  titleExtra?: React.ReactNode;
  children: React.ReactNode;
}

export function BYOKCard({ title, provider, isDemo, onConnect, titleExtra, children }: BYOKCardProps) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white flex items-center">{title}{titleExtra}</h3>
        <div className="flex items-center gap-2">
          {isDemo ? (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-600/50 text-slate-300 rounded-full border border-slate-600">
              Demo Mode
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
              Live
            </span>
          )}
        </div>
      </div>

      {children}

      {isDemo && onConnect && (
        <button
          onClick={onConnect}
          className="mt-4 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Connect {provider} API
        </button>
      )}
    </div>
  );
}
