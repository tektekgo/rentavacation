import { ExternalLink, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useIndustryNews, useMacroIndicators } from '@/hooks/executive';
import { SectionHeading } from './SectionHeading';
import { TooltipIcon } from './TooltipIcon';
import type { NewsItem, MacroIndicator } from '@/types/executive';

function NewsCard({ item }: { item: NewsItem }) {
  const categoryColors: Record<string, string> = {
    industry: 'bg-blue-500/20 text-blue-400',
    regulatory: 'bg-rose-500/20 text-rose-400',
    market: 'bg-emerald-500/20 text-emerald-400',
    technology: 'bg-violet-500/20 text-violet-400',
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 py-2.5 border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20 -mx-1 px-1 rounded transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-200 font-medium line-clamp-2 group-hover:text-white transition-colors">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[9px] font-medium uppercase px-1.5 py-0.5 rounded ${categoryColors[item.category] || categoryColors.industry}`}>
            {item.category}
          </span>
          <span className="text-[10px] text-slate-500">{item.source}</span>
          <span className="text-[10px] text-slate-600">{timeAgo(item.publishedAt)}</span>
        </div>
      </div>
      <ExternalLink className="h-3 w-3 text-slate-600 group-hover:text-slate-400 flex-shrink-0 mt-1" />
    </a>
  );
}

function RegulatoryTimeline({ items }: { items: NewsItem[] }) {
  const regulatory = items.filter((i) => i.category === 'regulatory');

  if (regulatory.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Regulatory Radar
          <TooltipIcon
            definition="Tracks regulatory news affecting short-term rentals — local ordinances, tax changes, licensing requirements, and federal guidelines."
            whyItMatters="Regulatory changes directly impact where owners can list, what fees apply, and platform compliance requirements."
          />
        </h3>
        <p className="text-xs text-slate-500 py-4 text-center">No regulatory alerts at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
      <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        Regulatory Radar
        <TooltipIcon
          definition="Tracks regulatory news affecting short-term rentals — local ordinances, tax changes, licensing requirements, and federal guidelines."
          whyItMatters="Regulatory changes directly impact where owners can list, what fees apply, and platform compliance requirements."
        />
      </h3>
      <div className="space-y-3">
        {regulatory.slice(0, 4).map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-amber-400 mt-1.5" />
              <div className="flex-1 w-px bg-slate-700/50" />
            </div>
            <div className="pb-3">
              <p className="text-xs text-slate-200 font-medium">{item.title}</p>
              {item.summary && (
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{item.summary}</p>
              )}
              <span className="text-[10px] text-slate-500 mt-0.5">{item.source}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacroCard({ indicator }: { indicator: MacroIndicator }) {
  const TrendIcon = indicator.trend === 'up' ? TrendingUp : indicator.trend === 'down' ? TrendingDown : Minus;
  const trendColor = indicator.trend === 'up' ? 'text-emerald-400' : indicator.trend === 'down' ? 'text-rose-400' : 'text-slate-400';
  const sparkColor = indicator.trend === 'up' ? '#10b981' : indicator.trend === 'down' ? '#f43f5e' : '#94a3b8';

  const change = indicator.previousValue !== 0
    ? ((indicator.value - indicator.previousValue) / indicator.previousValue) * 100
    : 0;

  const sparkData = (indicator.sparklineData || []).map((v, i) => ({ v, i }));

  return (
    <div className="bg-slate-700/30 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-medium">{indicator.label}</p>
          <p className="text-lg font-bold text-white mt-0.5">
            {indicator.value}{indicator.unit === '%' || indicator.unit === '% YoY' ? '%' : ''}
          </p>
          <div className={`flex items-center gap-1 mt-0.5 ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span className="text-[10px] font-medium">{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
          </div>
        </div>
        {sparkData.length > 1 && (
          <div className="w-16 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <p className="text-[9px] text-slate-600 mt-1">{indicator.source}</p>
    </div>
  );
}

export function IndustryFeed() {
  const { data: news, isLoading: newsLoading } = useIndustryNews();
  const { data: indicators, isLoading: macroLoading } = useMacroIndicators();

  const isLoading = newsLoading || macroLoading;

  if (isLoading) {
    return (
      <div>
        <SectionHeading title="Industry Intelligence" subtitle="External signals and market context" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <div className="h-4 w-32 bg-slate-700 rounded animate-pulse mb-4" />
              <div className="h-48 bg-slate-700/30 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const newsItems = news || [];
  const macroItems = indicators || [];

  return (
    <div>
      <SectionHeading title="Industry Intelligence" subtitle="External signals and market context" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Industry News */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-medium text-white mb-3">
            Industry News
            <TooltipIcon
              definition="Real-time news feed covering vacation rentals, short-term rentals, and timeshare industry developments. Sourced from NewsAPI."
              whyItMatters="Stay ahead of market shifts, competitor moves, and emerging trends that affect your rental marketplace."
            />
          </h3>
          <div className="space-y-0">
            {newsItems.length > 0 ? (
              newsItems.slice(0, 7).map((item) => <NewsCard key={item.id} item={item} />)
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No news available. Configure NewsAPI key for live feed.</p>
            )}
          </div>
        </div>

        {/* Regulatory Radar */}
        <RegulatoryTimeline items={newsItems} />

        {/* Macro Indicators */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-medium text-white mb-3">
            Macro Indicators
            <TooltipIcon
              definition="Key economic metrics affecting the vacation rental market — occupancy rates, RevPAR, average daily rates, and travel spending trends. Currently using simulated data."
              whyItMatters="Macro trends signal demand shifts before they show up in your booking pipeline."
            />
          </h3>
          <div className="space-y-2">
            {macroItems.length > 0 ? (
              macroItems.map((ind) => <MacroCard key={ind.id} indicator={ind} />)
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No macro data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
