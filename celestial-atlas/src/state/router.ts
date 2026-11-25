// URL routing for the app. Every screen has an address, so web links, refreshes
// and the browser back button work, and Android's back button follows the same
// history. Deliberately tiny: the app has a fixed set of screens.

export type TabId = 'home' | 'stars' | 'numbers' | 'tarot' | 'journal' | 'report' | 'profile' | 'privacy' | 'terms';

export interface Route {
  tab: TabId;
  /** Section inside Stars or Numbers, for example "chart" or "cycles". */
  sub?: string;
}

const BASE: Record<TabId, string> = {
  home: '/today',
  stars: '/stars',
  numbers: '/numbers',
  tarot: '/tarot',
  journal: '/journal',
  report: '/report',
  profile: '/profile',
  privacy: '/privacy',
  terms: '/terms',
};

const BY_PATH = new Map(Object.entries(BASE).map(([tab, path]) => [path, tab as TabId]));

export function pathFor(route: Route): string {
  return route.sub ? `${BASE[route.tab]}/${route.sub}` : BASE[route.tab];
}

/** Parse a pathname. Unknown paths open Today. */
export function parsePath(pathname: string): Route {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return { tab: 'home' };
  const [, first, second] = clean.split('/');
  const tab = BY_PATH.get(`/${first}`);
  if (!tab) return { tab: 'home' };
  return second && /^[a-z]+$/.test(second) ? { tab, sub: second } : { tab };
}

export function sameRoute(a: Route, b: Route): boolean {
  return a.tab === b.tab && (a.sub ?? '') === (b.sub ?? '');
}

interface HistoryState {
  atlasIndex: number;
}

const currentIndex = (): number => {
  const s = window.history.state as HistoryState | null;
  return typeof s?.atlasIndex === 'number' ? s.atlasIndex : 0;
};

/** Mark the first entry so `canGoBack` knows where the app's history starts. */
export function initHistory(): void {
  if (typeof window.history.state?.atlasIndex !== 'number') {
    window.history.replaceState({ atlasIndex: 0 } satisfies HistoryState, '');
  }
}

export function pushRoute(route: Route): void {
  window.history.pushState({ atlasIndex: currentIndex() + 1 } satisfies HistoryState, '', pathFor(route));
}

export function replaceRoute(route: Route): void {
  window.history.replaceState({ atlasIndex: currentIndex() } satisfies HistoryState, '', pathFor(route));
}

/** True when there is an earlier in-app screen to go back to. */
export function canGoBack(): boolean {
  return currentIndex() > 0;
}
