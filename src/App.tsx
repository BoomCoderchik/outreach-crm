import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Server,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react';

import { Badge } from '@/components/badge';
import { Chart } from '@/components/chart';
import FallbackAvatar from '@/components/fallback-avatar';
import { ApiError, api, type Project, type User } from '@/lib/api';
import { cn } from '@/lib/utils';

type View = 'Overview' | 'Projects' | 'Inbox' | 'Settings';
type Theme = 'light' | 'dark';
type Dialog = 'project' | 'help' | 'gmail' | null;

const navigation: Array<{ label: View; icon: typeof LayoutDashboard }> = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Projects', icon: FolderKanban },
  { label: 'Inbox', icon: Inbox },
];

const activityLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const activityData = [0, 0, 0, 0, 0, 0, 0];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionState, setSessionState] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [activeView, setActiveView] = useState<View>('Overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsError, setProjectsError] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [activityFilter, setActivityFilter] = useState<'7 days' | '30 days'>('7 days');
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('outreach-theme');
    return stored === 'dark' ? 'dark' : 'light';
  });
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null);
  const desktopNavRef = useRef<HTMLButtonElement>(null);
  const wasMobileNavOpenRef = useRef(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('outreach-theme', theme);
  }, [theme]);

  useEffect(() => {
    api
      .me()
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        setSessionState('ready');
      })
      .catch((error: unknown) =>
        setSessionState(error instanceof ApiError && error.status > 0 ? 'ready' : 'offline'),
      );
  }, []);

  useEffect(() => {
    if (!user) return;
    api
      .listProjects()
      .then(({ projects: nextProjects }) => {
        setProjects(nextProjects);
        setProjectsError('');
      })
      .catch((error: Error) => setProjectsError(error.message));
  }, [user]);

  useEffect(() => {
    if (mobileNavOpen) {
      wasMobileNavOpenRef.current = true;
      return;
    }
    if (wasMobileNavOpenRef.current) {
      const trigger = mobileNavTriggerRef.current;
      if (trigger && trigger.getClientRects().length > 0) trigger.focus();
      else desktopNavRef.current?.focus();
      wasMobileNavOpenRef.current = false;
    }
  }, [mobileNavOpen]);

  useEffect(() => {
    const desktopBreakpoint = window.matchMedia('(min-width: 1024px)');
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileNavOpen(false);
    };
    desktopBreakpoint.addEventListener('change', handleBreakpointChange);
    return () => desktopBreakpoint.removeEventListener('change', handleBreakpointChange);
  }, []);

  const navigate = (view: View) => {
    setActiveView(view);
    setMobileNavOpen(false);
  };

  const handleAuthenticated = (nextUser: User) => {
    setUser(nextUser);
    setSessionState('ready');
    setActiveView('Overview');
  };

  const handleLogout = async () => {
    await api.logout().catch(() => undefined);
    setUser(null);
    setProjects([]);
  };

  const handleProjectAdded = (project: Project) => {
    setProjects((current) => [project, ...current]);
    setDialog(null);
  };

  const handleProjectDeleted = async (projectId: string) => {
    await api.deleteProject(projectId);
    setProjects((current) => current.filter((project) => project.id !== projectId));
  };

  if (sessionState === 'loading') return <LoadingScreen />;
  if (!user)
    return (
      <AuthScreen
        serviceOffline={sessionState === 'offline'}
        onAuthenticated={handleAuthenticated}
      />
    );

  return (
    <div className="min-h-screen bg-[var(--surface-page)] text-[var(--text-strong)]">
      <div
        id="workspace-shell"
        inert={mobileNavOpen || undefined}
        className="mx-auto flex min-h-screen max-w-[1560px]"
      >
        <Sidebar
          activeView={activeView}
          onNavigate={navigate}
          onLogout={handleLogout}
          user={user}
          onHelp={() => setDialog('help')}
          desktopNavRef={desktopNavRef}
        />

        <main className="min-w-0 flex-1">
          <header className="flex h-[76px] items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-panel)]/90 px-5 backdrop-blur-sm sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 text-[13px] text-[var(--text-subtle)]">
              <button
                type="button"
                ref={mobileNavTriggerRef}
                className="icon-button lg:hidden"
                aria-label="Open navigation"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="size-[18px]" strokeWidth={1.8} />
              </button>
              <span className="hidden sm:inline">Workspace</span>
              <span className="hidden text-[var(--border-strong)] sm:inline">/</span>
              <span className="font-medium text-[var(--text-strong)]">{activeView}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="green"
                size="sm"
                className="hidden rounded-full px-2.5 py-1 sm:inline-flex"
              >
                Local & private
              </Badge>
              <button
                type="button"
                className="icon-button"
                aria-label="Open settings"
                onClick={() => navigate('Settings')}
              >
                <Settings2 className="size-[17px]" strokeWidth={1.8} />
              </button>
              <FallbackAvatar name={user.email} size={34} animated={false} />
            </div>
          </header>

          <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            {activeView === 'Overview' && (
              <Overview
                projects={projects}
                activityFilter={activityFilter}
                onActivityFilterChange={setActivityFilter}
                onAddProject={() => setDialog('project')}
                onViewProjects={() => navigate('Projects')}
              />
            )}
            {activeView === 'Projects' && (
              <ProjectsView
                projects={projects}
                error={projectsError}
                onAddProject={() => setDialog('project')}
                onDeleteProject={handleProjectDeleted}
              />
            )}
            {activeView === 'Inbox' && <InboxView onConnect={() => setDialog('gmail')} />}
            {activeView === 'Settings' && (
              <SettingsView
                user={user}
                theme={theme}
                onThemeChange={setTheme}
                onLogout={handleLogout}
              />
            )}
          </div>
        </main>
      </div>

      {mobileNavOpen && (
        <MobileNavigation
          activeView={activeView}
          onNavigate={navigate}
          onClose={() => setMobileNavOpen(false)}
          onHelp={() => setDialog('help')}
        />
      )}
      {dialog === 'project' && (
        <ProjectDialog onClose={() => setDialog(null)} onCreated={handleProjectAdded} />
      )}
      {dialog === 'help' && (
        <InfoDialog
          title="Help center"
          icon={<CircleHelp className="size-5" />}
          onClose={() => setDialog(null)}
        >
          <p>
            Your workspace is local-first. Start the local service if you need to sign in or connect
            project folders.
          </p>
          <p className="mt-3">
            The next integration step is Gmail OAuth. Your credentials will stay on this computer
            and will never be placed in the repository.
          </p>
        </InfoDialog>
      )}
      {dialog === 'gmail' && (
        <InfoDialog
          title="Gmail connection"
          icon={<Inbox className="size-5" />}
          onClose={() => setDialog(null)}
        >
          <p>
            Gmail OAuth is not connected yet. This action is now wired as a clear next step instead
            of a dead control.
          </p>
          <p className="mt-3">
            When enabled, tokens will belong to your local account and be stored outside Git.
          </p>
        </InfoDialog>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--surface-page)] text-sm text-[var(--text-subtle)]">
      Loading your private workspace…
    </div>
  );
}

function AuthScreen({
  serviceOffline,
  onAuthenticated,
}: {
  serviceOffline: boolean;
  onAuthenticated: (user: User) => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(
    serviceOffline
      ? 'Local service is not running yet. Start it with npm run service:dev, then try again.'
      : '',
  );
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const result =
        mode === 'login' ? await api.login(email, password) : await api.register(email, password);
      onAuthenticated(result.user);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Could not complete the request',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,_#e0e7ff_0,_transparent_32%),var(--surface-page)] px-5 py-10">
      <section className="w-full max-w-[440px]">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-[var(--brand-9)] text-white shadow-[0_12px_28px_rgba(79,70,229,0.22)]">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-[17px] font-semibold tracking-[-0.03em]">outreach</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-subtle)]">
              private workspace
            </p>
          </div>
        </div>
        <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-6 shadow-[0_22px_60px_rgba(39,53,84,0.1)] sm:p-8">
          <div className="mb-7">
            <p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {mode === 'login' ? 'Sign in to your CRM.' : 'Keep your outreach private.'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-subtle)]">
              Each local account gets its own projects, settings, and future inbox data.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <label className="field-label">
              Email
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="field-input"
              />
            </label>
            <label className="field-label">
              Password
              <input
                required
                minLength={8}
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="field-input"
              />
            </label>
            {mode === 'register' && (
              <label className="field-label">
                Confirm password
                <input
                  required
                  minLength={8}
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  className="field-input"
                />
              </label>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] leading-5 text-rose-700"
              >
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="primary-button w-full">
              {busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
              <ArrowRight className="size-4" />
            </button>
          </form>
          <button
            type="button"
            className="mt-5 w-full text-center text-[12px] font-semibold text-[var(--brand-11)] hover:underline"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login'
              ? 'New here? Create a local account'
              : 'Already have an account? Sign in'}
          </button>
          <div className="mt-6 flex items-center gap-2 border-t border-[var(--border-subtle)] pt-5 text-[11px] text-[var(--text-subtle)]">
            <LockKeyhole className="size-3.5 text-[var(--success)]" /> Passwords and sessions stay
            on this computer.
          </div>
        </div>
      </section>
    </main>
  );
}

function Sidebar({
  activeView,
  onNavigate,
  onLogout,
  user,
  onHelp,
  desktopNavRef,
}: {
  activeView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  user: User;
  onHelp: () => void;
  desktopNavRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-panel)] px-4 py-5 lg:flex">
      <Brand />
      <div className="mt-10">
        <p className="nav-label">Workspace</p>
        <nav aria-label="Primary navigation" className="mt-3 space-y-1">
          {navigation.map(({ label, icon: Icon }) => (
            <NavButton
              key={label}
              label={label}
              icon={Icon}
              active={activeView === label}
              onClick={() => onNavigate(label)}
              buttonRef={label === 'Overview' ? desktopNavRef : undefined}
            />
          ))}
        </nav>
      </div>
      <div className="mt-auto space-y-1">
        <NavButton
          label="Settings"
          icon={Settings2}
          active={activeView === 'Settings'}
          onClick={() => onNavigate('Settings')}
        />
        <button
          type="button"
          className="nav-button text-[var(--text-subtle)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-strong)]"
          onClick={onHelp}
        >
          <CircleHelp className="size-[17px]" strokeWidth={1.8} />
          Help center
        </button>
        <div className="mt-4 flex items-center gap-3 border-t border-[var(--border-subtle)] px-3 pt-4">
          <FallbackAvatar name={user.email} size={31} animated={false} />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-[var(--text-strong)]">
              {user.email}
            </p>
            <p className="text-[11px] text-[var(--success)]">Local account</p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            className="ml-auto rounded-lg p-2 text-[var(--text-subtle)] hover:bg-[var(--surface-subtle)] hover:text-[var(--danger)]"
            onClick={onLogout}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-3">
      <div className="grid size-9 place-items-center rounded-xl bg-[var(--brand-9)] text-white shadow-sm">
        <Sparkles className="size-[18px]" strokeWidth={2.25} />
      </div>
      <div>
        <p className="text-[15px] font-semibold tracking-[-0.02em]">outreach</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[var(--text-subtle)]">
          workspace
        </p>
      </div>
    </div>
  );
}

function NavButton({
  label,
  icon: Icon,
  active,
  onClick,
  buttonRef,
}: {
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onClick: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'nav-button',
        active
          ? 'bg-[var(--brand-3)] text-[var(--brand-11)]'
          : 'text-[var(--text-subtle)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-strong)]',
      )}
    >
      <Icon className="size-[17px]" strokeWidth={1.8} />
      {label}
      {label === 'Inbox' && (
        <span className="ml-auto rounded-full bg-[var(--surface-subtle)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-subtle)]">
          0
        </span>
      )}
    </button>
  );
}

function MobileNavigation({
  activeView,
  onNavigate,
  onClose,
  onHelp,
}: {
  activeView: View;
  onNavigate: (view: View) => void;
  onClose: () => void;
  onHelp: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeButtonRef.current?.focus(), []);
  return (
    <div
      role="dialog"
      aria-label="Workspace navigation"
      aria-modal="true"
      className="fixed inset-0 z-50 lg:hidden"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
          return;
        }
        if (event.key !== 'Tab') return;
        const elements = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled])'),
        ).filter((element) => !element.hasAttribute('aria-hidden'));
        if (!elements.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/35"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-[min(86vw,320px)] flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-panel)] px-4 py-5 shadow-2xl">
        <div className="flex items-center justify-between px-3">
          <Brand />
          <button
            type="button"
            ref={closeButtonRef}
            aria-label="Close navigation drawer"
            className="icon-button"
            onClick={onClose}
          >
            <X className="size-[18px]" />
          </button>
        </div>
        <nav aria-label="Mobile primary navigation" className="mt-10 space-y-1">
          <p className="nav-label">Workspace</p>
          <div className="mt-3 space-y-1">
            {navigation.map(({ label, icon: Icon }) => (
              <NavButton
                key={label}
                label={label}
                icon={Icon}
                active={activeView === label}
                onClick={() => onNavigate(label)}
              />
            ))}
            <NavButton
              label="Settings"
              icon={Settings2}
              active={activeView === 'Settings'}
              onClick={() => onNavigate('Settings')}
            />
            <button
              type="button"
              className="nav-button text-[var(--text-subtle)]"
              onClick={() => {
                onClose();
                onHelp();
              }}
            >
              <CircleHelp className="size-[17px]" />
              Help center
            </button>
          </div>
        </nav>
      </aside>
    </div>
  );
}

function Overview({
  projects,
  activityFilter,
  onActivityFilterChange,
  onAddProject,
  onViewProjects,
}: {
  projects: Project[];
  activityFilter: '7 days' | '30 days';
  onActivityFilterChange: (filter: '7 days' | '30 days') => void;
  onAddProject: () => void;
  onViewProjects: () => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  return (
    <div data-testid="dashboard" className="mx-auto max-w-[1240px]">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="mt-2 text-[clamp(1.85rem,3vw,2.65rem)] font-semibold tracking-[-0.045em]">
            Your outreach, at a glance.
          </h1>
          <p className="mt-2 max-w-[560px] text-[14px] leading-6 text-[var(--text-subtle)]">
            A quiet command center for your outreach work, with your data kept on this computer.
          </p>
        </div>
        <button type="button" className="primary-button" onClick={onAddProject}>
          <Plus className="size-4" />
          Connect project
        </button>
      </div>
      <section
        aria-label="Workspace metrics"
        className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Active projects"
          value={String(projects.length)}
          hint={projects.length ? 'Folders in your workspace' : 'Connect a project to begin'}
          tone="blue"
        />
        <MetricCard
          label="Contacts reached"
          value="0"
          hint="No outreach activity yet"
          tone="violet"
        />
        <MetricCard
          label="Reply rate"
          value="—"
          hint="Calculated after replies arrive"
          tone="green"
        />
        <MetricCard label="Follow-ups due" value="0" hint="Nothing needs attention" tone="amber" />
      </section>
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)]">
        <section className="panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="section-title">Pipeline activity</h2>
              <p className="section-caption">Messages sent in the last {activityFilter}</p>
            </div>
            <div className="relative">
              <button
                type="button"
                className="icon-button"
                aria-label="Filter pipeline activity"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen((open) => !open)}
              >
                <SlidersHorizontal className="size-4" />
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-10 z-10 w-32 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-1.5 shadow-xl">
                  {(['7 days', '30 days'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={cn(
                        'w-full rounded-lg px-2.5 py-2 text-left text-[12px]',
                        activityFilter === filter
                          ? 'bg-[var(--brand-3)] font-semibold text-[var(--brand-11)]'
                          : 'text-[var(--text-subtle)] hover:bg-[var(--surface-subtle)]',
                      )}
                      onClick={() => {
                        onActivityFilterChange(filter);
                        setFilterOpen(false);
                      }}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-7 min-h-[205px] rounded-xl bg-[var(--surface-subtle)] px-2 py-3 sm:px-5">
            <Chart
              data={activityData}
              labels={activityLabels}
              name="Messages"
              color="#6366f1"
              showFill
              showDot={false}
              animated={false}
              className="empty-chart mx-auto"
            />
            <p className="-mt-2 text-center text-[11px] text-[var(--text-subtle)]">
              No activity recorded yet
            </p>
          </div>
        </section>
        <section className="panel">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="section-title">Response mix</h2>
              <p className="section-caption">Replies by tone</p>
            </div>
            <BarChart3 className="size-4 text-[var(--text-subtle)]" strokeWidth={1.8} />
          </div>
          <div className="mt-8 space-y-5">
            {[
              { label: 'Positive', color: 'bg-emerald-500' },
              { label: 'Neutral', color: 'bg-slate-400' },
              { label: 'Negative', color: 'bg-rose-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-[var(--text-muted)]">{item.label}</span>
                  <span className="tabular-nums text-[var(--text-subtle)]">0</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--border-subtle)]">
                  <div className={cn('h-full w-0 rounded-full', item.color)} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-[12px] leading-5 text-[var(--text-subtle)]">
            Tone insights will appear after your first reply is synced.
          </div>
        </section>
      </div>
      <section className="panel mt-5">
        <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="section-title">Projects</h2>
            <p className="section-caption">Your connected outreach folders</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="secondary-button" onClick={onViewProjects}>
              View all
              <ArrowRight className="size-3.5" />
            </button>
            <button
              type="button"
              className="primary-button h-9 px-3 text-[12px]"
              onClick={onAddProject}
            >
              <Plus className="size-3.5" />
              Add
            </button>
          </div>
        </div>
        {projects.length ? (
          <div className="divide-y divide-[var(--border-subtle)]">
            {projects.slice(0, 3).map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyProjects onAddProject={onAddProject} />
        )}
      </section>
    </div>
  );
}

function ProjectsView({
  projects,
  error,
  onAddProject,
  onDeleteProject,
}: {
  projects: Project[];
  error: string;
  onAddProject: () => void;
  onDeleteProject: (id: string) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const filteredProjects = projects.filter((project) =>
    `${project.name} ${project.folderPath}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 className="mt-2 page-title">Projects</h1>
          <p className="mt-2 text-sm text-[var(--text-subtle)]">
            Manage the folders that belong to this local account.
          </p>
        </div>
        <button type="button" className="primary-button" onClick={onAddProject}>
          <Plus className="size-4" />
          Add project
        </button>
      </div>
      <section className="panel mt-8">
        <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-title">Connected folders</h2>
            <p className="section-caption">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} in this account
            </p>
          </div>
          <label className="relative flex h-10 min-w-0 items-center sm:w-64">
            <Search className="absolute left-3 size-4 text-[var(--text-subtle)]" />
            <input
              aria-label="Search projects"
              placeholder="Search projects"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field-input h-full pl-9"
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="m-5 rounded-xl bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
            {error}
          </p>
        )}
        {filteredProjects.length ? (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filteredProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onDelete={() => onDeleteProject(project.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyProjects onAddProject={onAddProject} query={query} />
        )}
      </section>
    </div>
  );
}

function ProjectRow({ project, onDelete }: { project: Project; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-3)] text-[var(--brand-11)]">
        <FolderKanban className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">{project.name}</p>
        <p className="truncate text-[12px] text-[var(--text-subtle)]">{project.folderPath}</p>
      </div>
      <Badge variant="green" size="sm" className="hidden rounded-full sm:inline-flex">
        Ready to connect
      </Badge>
      {onDelete && (
        <button
          type="button"
          aria-label={`Remove ${project.name}`}
          className="rounded-lg p-2 text-[var(--text-subtle)] hover:bg-rose-50 hover:text-[var(--danger)]"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
function EmptyProjects({ onAddProject, query = '' }: { onAddProject: () => void; query?: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="grid size-11 place-items-center rounded-2xl bg-[var(--surface-subtle)] text-[var(--text-subtle)]">
        <FolderKanban className="size-5" />
      </div>
      <h3 className="mt-4 text-[13px] font-semibold">
        {query ? 'No matching projects' : 'No projects connected'}
      </h3>
      <p className="mt-1 max-w-[380px] text-[12px] leading-5 text-[var(--text-subtle)]">
        {query
          ? 'Try another search term.'
          : 'Add a project folder to start building your private outreach workspace.'}
      </p>
      {!query && (
        <button type="button" className="secondary-button mt-5" onClick={onAddProject}>
          <Plus className="size-3.5" />
          Connect first project
        </button>
      )}
    </div>
  );
}

function InboxView({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="mx-auto max-w-[900px]">
      <p className="eyebrow">Workspace</p>
      <h1 className="mt-2 page-title">Inbox</h1>
      <p className="mt-2 text-sm text-[var(--text-subtle)]">
        Keep replies and follow-ups close to the work that created them.
      </p>
      <section className="panel mt-8 flex min-h-[360px] flex-col items-center justify-center px-6 py-14 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-[var(--brand-3)] text-[var(--brand-11)]">
          <Inbox className="size-5" />
        </div>
        <h2 className="mt-5 text-lg font-semibold">Your inbox is ready for Gmail</h2>
        <p className="mx-auto mt-2 max-w-[420px] text-sm leading-6 text-[var(--text-subtle)]">
          Connect Gmail when you are ready. The integration will sync replies into this local
          account without mixing them with another clone or user.
        </p>
        <button type="button" className="primary-button mt-6" onClick={onConnect}>
          Connect Gmail
          <ArrowRight className="size-4" />
        </button>
      </section>
    </div>
  );
}

function SettingsView({
  user,
  theme,
  onThemeChange,
  onLogout,
}: {
  user: User;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onLogout: () => void;
}) {
  return (
    <div className="mx-auto max-w-[900px]">
      <p className="eyebrow">Workspace</p>
      <h1 className="mt-2 page-title">Settings</h1>
      <p className="mt-2 text-sm text-[var(--text-subtle)]">
        Your preferences and local privacy controls.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="panel p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-[var(--brand-3)] text-[var(--brand-11)]">
              <Settings2 className="size-4" />
            </div>
            <div>
              <h2 className="section-title">Appearance</h2>
              <p className="section-caption">Choose the workspace surface</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-subtle)] p-1">
            <button
              type="button"
              aria-pressed={theme === 'light'}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-semibold',
                theme === 'light'
                  ? 'bg-[var(--surface-panel)] text-[var(--text-strong)] shadow-sm'
                  : 'text-[var(--text-subtle)]',
              )}
              onClick={() => onThemeChange('light')}
            >
              <Sun className="size-3.5" />
              Light
            </button>
            <button
              type="button"
              aria-pressed={theme === 'dark'}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-semibold',
                theme === 'dark'
                  ? 'bg-[var(--surface-panel)] text-[var(--text-strong)] shadow-sm'
                  : 'text-[var(--text-subtle)]',
              )}
              onClick={() => onThemeChange('dark')}
            >
              <Moon className="size-3.5" />
              Dark
            </button>
          </div>
        </section>
        <section className="panel p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-[var(--success)]">
              <LockKeyhole className="size-4" />
            </div>
            <div>
              <h2 className="section-title">Private account</h2>
              <p className="section-caption">The account currently in use</p>
            </div>
          </div>
          <p className="mt-6 break-all text-sm font-semibold">{user.email}</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--text-subtle)]">
            Your password hash, session, project paths, and future outreach data are stored locally
            and excluded from Git.
          </p>
          <button
            type="button"
            className="secondary-button mt-5 text-[var(--danger)]"
            onClick={onLogout}
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </section>
      </div>
      <section className="panel mt-5 p-6">
        <div className="flex items-start gap-3">
          <Server className="mt-0.5 size-5 text-[var(--brand-11)]" />
          <div>
            <h2 className="section-title">Local service</h2>
            <p className="mt-1 text-[12px] leading-5 text-[var(--text-subtle)]">
              The CRM service runs on loopback and keeps runtime data in the ignored{' '}
              <code className="rounded bg-[var(--surface-subtle)] px-1">data/</code> directory.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[12px] font-semibold text-[var(--success)]">
              <CheckCircle2 className="size-4" />
              Account isolation is active
            </div>
          </div>
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
    blue: 'bg-indigo-100',
    violet: 'bg-violet-100',
    green: 'bg-emerald-100',
    amber: 'bg-amber-100',
  } as const;
  return (
    <article className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-[var(--text-muted)]">{label}</p>
        <span className={cn('size-2 rounded-full', toneClasses[tone])} aria-hidden="true" />
      </div>
      <p className="mt-4 text-[26px] font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-[11px] text-[var(--text-subtle)]">{hint}</p>
    </article>
  );
}

function ProjectDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const [name, setName] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { project } = await api.addProject(name, folderPath);
      onCreated(project);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not add project');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Connect a project" icon={<FolderKanban className="size-5" />} onClose={onClose}>
      <p className="text-[13px] leading-5 text-[var(--text-subtle)]">
        Save the project metadata first. File validation and Excel sync will use this folder in the
        next integration step.
      </p>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <label className="field-label">
          Project name
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Q3 founders outreach"
            className="field-input"
          />
        </label>
        <label className="field-label">
          Folder path
          <input
            required
            value={folderPath}
            onChange={(event) => setFolderPath(event.target.value)}
            placeholder="C:\\Work\\Outreach\\Q3"
            className="field-input"
          />
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-[12px] text-rose-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className="primary-button">
            {busy ? 'Saving…' : 'Save project'}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>
    </Modal>
  );
}
function InfoDialog({
  title,
  icon,
  children,
  onClose,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal title={title} icon={icon} onClose={onClose}>
      <div className="text-[13px] leading-6 text-[var(--text-subtle)]">{children}</div>
      <div className="mt-6 flex justify-end">
        <button type="button" className="primary-button" onClick={onClose}>
          Got it
        </button>
      </div>
    </Modal>
  );
}
function Modal({
  title,
  icon,
  children,
  onClose,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/40 px-5 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-[480px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-[var(--brand-3)] text-[var(--brand-11)]">
              {icon}
            </div>
            <h2 className="text-lg font-semibold tracking-[-0.03em]">{title}</h2>
          </div>
          <button
            type="button"
            ref={closeRef}
            className="icon-button"
            aria-label={`Close ${title}`}
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export { App };
