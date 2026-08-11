import { useEffect, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  CircleHelp,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';

import { Badge } from '@/components/badge';
import { Chart } from '@/components/chart';
import FallbackAvatar from '@/components/fallback-avatar';
import { cn } from '@/lib/utils';

type View = 'Overview' | 'Projects' | 'Inbox' | 'Settings';

const navigation: Array<{ label: View; icon: typeof LayoutDashboard }> = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Projects', icon: FolderKanban },
  { label: 'Inbox', icon: Inbox },
];

const metrics = [
  { label: 'Active projects', value: '0', hint: 'Connect a project to begin', tone: 'blue' },
  { label: 'Contacts reached', value: '0', hint: 'No outreach activity yet', tone: 'violet' },
  { label: 'Reply rate', value: '—', hint: 'Calculated after replies arrive', tone: 'green' },
  { label: 'Follow-ups due', value: '0', hint: 'Nothing needs attention', tone: 'amber' },
] as const;

const activityLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const activityData = [0, 0, 0, 0, 0, 0, 0];

const responseMix = [
  { label: 'Positive', value: 0, color: 'bg-emerald-400' },
  { label: 'Neutral', value: 0, color: 'bg-slate-300' },
  { label: 'Negative', value: 0, color: 'bg-rose-300' },
];

function App() {
  const [activeView, setActiveView] = useState<View>('Overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  const navigateFromMobile = (view: View) => {
    setActiveView(view);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#152238]">
      <div className="mx-auto flex min-h-screen max-w-[1560px]">
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-slate-200/80 bg-white px-4 py-5 lg:flex">
          <div className="flex items-center gap-3 px-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[#182b49] text-white shadow-sm">
              <Sparkles className="size-[18px]" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">
                outreach
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
                workspace
              </p>
            </div>
          </div>

          <div className="mt-10">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Workspace
            </p>
            <nav aria-label="Primary navigation" className="mt-3 space-y-1">
              {navigation.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveView(label)}
                  aria-current={activeView === label ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium transition-colors',
                    activeView === label
                      ? 'bg-slate-100 text-slate-950'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                  )}
                >
                  <Icon className="size-[17px]" strokeWidth={1.8} />
                  {label}
                  {label === 'Inbox' && (
                    <span className="ml-auto rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                      0
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto space-y-1">
            <button
              type="button"
              onClick={() => setActiveView('Settings')}
              aria-current={activeView === 'Settings' ? 'page' : undefined}
              className={cn(
                'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium transition-colors',
                activeView === 'Settings'
                  ? 'bg-slate-100 text-slate-950'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Settings2 className="size-[17px]" strokeWidth={1.8} />
              Settings
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Help center is not available in foundation mode"
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <CircleHelp className="size-[17px]" strokeWidth={1.8} />
              Help center
            </button>
            <div className="mt-4 flex items-center gap-3 border-t border-slate-100 px-3 pt-4">
              <FallbackAvatar name="Local workspace" size={31} animated={false} />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-slate-700">Local workspace</p>
                <p className="text-[11px] text-slate-400">Not connected</p>
              </div>
              <ChevronDown className="ml-auto size-4 text-slate-400" />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex h-[76px] items-center justify-between border-b border-slate-200/75 bg-white/70 px-5 backdrop-blur-sm sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 text-[13px] text-slate-400">
              <button
                type="button"
                className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800 lg:hidden"
                aria-label="Open navigation"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="size-[18px]" strokeWidth={1.8} />
              </button>
              <span className="hidden sm:inline">Workspace</span>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <span className="font-medium text-slate-700">{activeView}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="green"
                size="sm"
                className="hidden rounded-full px-2.5 py-1 sm:inline-flex"
              >
                Foundation mode
              </Badge>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800"
                aria-label="Open settings"
                onClick={() => setActiveView('Settings')}
              >
                <Settings2 className="size-[17px]" strokeWidth={1.8} />
              </button>
              <FallbackAvatar name="Local workspace" size={34} animated={false} />
            </div>
          </header>

          {mobileNavOpen && (
            <MobileNavigation
              activeView={activeView}
              onNavigate={navigateFromMobile}
              onClose={() => setMobileNavOpen(false)}
            />
          )}

          <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            {activeView === 'Overview' ? <Overview /> : <EmptyView view={activeView} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function MobileNavigation({
  activeView,
  onNavigate,
  onClose,
}: {
  activeView: View;
  onNavigate: (view: View) => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Workspace navigation"
      aria-modal="true"
      className="fixed inset-0 z-50 lg:hidden"
    >
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/25"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-[min(86vw,320px)] flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-2xl">
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[#182b49] text-white shadow-sm">
              <Sparkles className="size-[18px]" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">
                outreach
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
                workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500"
            onClick={onClose}
          >
            <X className="size-[18px]" strokeWidth={1.8} />
          </button>
        </div>

        <nav aria-label="Mobile primary navigation" className="mt-10 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>
          <div className="mt-3 space-y-1">
            {navigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                aria-current={activeView === label ? 'page' : undefined}
                onClick={() => onNavigate(label)}
                className={cn(
                  'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium transition-colors',
                  activeView === label
                    ? 'bg-slate-100 text-slate-950'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                )}
              >
                <Icon className="size-[17px]" strokeWidth={1.8} />
                {label}
                {label === 'Inbox' && (
                  <span className="ml-auto rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                    0
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              aria-current={activeView === 'Settings' ? 'page' : undefined}
              onClick={() => onNavigate('Settings')}
              className={cn(
                'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium transition-colors',
                activeView === 'Settings'
                  ? 'bg-slate-100 text-slate-950'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Settings2 className="size-[17px]" strokeWidth={1.8} />
              Settings
            </button>
          </div>
        </nav>
      </aside>
    </div>
  );
}

function Overview() {
  return (
    <div data-testid="dashboard" className="mx-auto max-w-[1240px]">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6d84aa]">
            Overview
          </p>
          <h1 className="mt-2 text-[clamp(1.85rem,3vw,2.65rem)] font-semibold tracking-[-0.045em] text-slate-950">
            Your outreach, at a glance.
          </h1>
          <p className="mt-2 max-w-[560px] text-[14px] leading-6 text-slate-500">
            Connect your first project to start turning outreach activity into a clear daily rhythm.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Available when the project service is connected"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#182b49] px-4 text-[13px] font-semibold text-white opacity-45 shadow-sm"
        >
          <Plus className="size-4" />
          Connect project
        </button>
      </div>

      <section
        aria-label="Workspace metrics"
        className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_32px_rgba(53,73,104,0.045)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[14px] font-semibold text-slate-900">Pipeline activity</h2>
              <p className="mt-1 text-[12px] text-slate-400">Messages sent in the last 7 days</p>
            </div>
            <button
              type="button"
              disabled
              className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-300"
              aria-label="Filter pipeline activity"
            >
              <SlidersHorizontal className="size-4" />
            </button>
          </div>
          <div className="mt-7 min-h-[205px] rounded-xl bg-[#fbfcfe] px-2 py-3 sm:px-5">
            <Chart
              data={activityData}
              labels={activityLabels}
              name="Messages"
              color="#6d8fce"
              showFill
              showDot={false}
              animated={false}
              className="empty-chart mx-auto"
            />
            <p className="-mt-2 text-center text-[11px] text-slate-400">No activity recorded yet</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_32px_rgba(53,73,104,0.045)] sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-slate-900">Response mix</h2>
              <p className="mt-1 text-[12px] text-slate-400">Replies by tone</p>
            </div>
            <BarChart3 className="size-4 text-slate-300" strokeWidth={1.8} />
          </div>
          <div className="mt-8 space-y-5">
            {responseMix.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-slate-600">{item.label}</span>
                  <span className="tabular-nums text-slate-400">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={cn('h-full w-0 rounded-full', item.color)} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-[12px] leading-5 text-slate-400">
            Tone insights will appear after your first reply is synced.
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_32px_rgba(53,73,104,0.045)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-900">Projects</h2>
            <p className="mt-1 text-[12px] text-slate-400">Your connected outreach folders</p>
          </div>
          <div className="flex gap-2">
            <label className="relative flex h-9 min-w-0 flex-1 items-center sm:w-48">
              <Search className="absolute left-3 size-4 text-slate-300" />
              <input
                disabled
                aria-label="Search projects"
                placeholder="Search projects"
                className="h-full w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-[12px] text-slate-400 placeholder:text-slate-300"
              />
            </label>
            <button
              type="button"
              disabled
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-[12px] font-semibold text-slate-300"
            >
              <Plus className="size-3.5" />
              Add
            </button>
          </div>
        </div>
        <div className="flex min-h-[176px] flex-col items-center justify-center px-6 py-10 text-center">
          <div className="grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <FolderKanban className="size-5" strokeWidth={1.8} />
          </div>
          <h3 className="mt-4 text-[13px] font-semibold text-slate-700">No projects connected</h3>
          <p className="mt-1 max-w-[360px] text-[12px] leading-5 text-slate-400">
            When the local project service is ready, your connected folders will appear here.
          </p>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'blue' | 'violet' | 'green' | 'amber';
}) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-500',
    violet: 'bg-violet-50 text-violet-500',
    green: 'bg-emerald-50 text-emerald-500',
    amber: 'bg-amber-50 text-amber-500',
  } as const;

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_32px_rgba(53,73,104,0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-slate-500">{label}</p>
        <span className={cn('size-2 rounded-full', toneClasses[tone])} aria-hidden="true" />
      </div>
      <p className="mt-4 text-[26px] font-semibold tracking-[-0.04em] text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
    </article>
  );
}

function EmptyView({ view }: { view: Exclude<View, 'Overview'> }) {
  const descriptions: Record<Exclude<View, 'Overview'>, string> = {
    Projects: 'Projects will appear here after the local service is connected.',
    Inbox: 'Your synced conversations will appear here after Gmail is connected.',
    Settings: 'Workspace settings will be available in a future foundation stage.',
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-156px)] max-w-[780px] items-center justify-center">
      <section className="w-full rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-14 text-center shadow-[0_10px_32px_rgba(53,73,104,0.035)] sm:px-12">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <FolderKanban className="size-5" strokeWidth={1.8} />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-slate-800">{view}</h1>
        <p className="mx-auto mt-2 max-w-[390px] text-[13px] leading-6 text-slate-400">
          {descriptions[view]}
        </p>
        <Badge variant="slate" className="mt-5 rounded-full px-3 py-1.5">
          Foundation mode
        </Badge>
      </section>
    </div>
  );
}

export { App };
