import { lazy, Suspense } from 'react';
import { Route, Switch, Router as WouterRouter, Redirect, useParams } from 'wouter';
import EntryChat from '@/pages/EntryChat';
import CookieNotice from '@/components/CookieNotice';
import WhatsAppButton from '@/components/WhatsAppButton';
import { legacyPathSegment } from '@/lib/wireCodes';
import { useAnalytics } from '@/lib/useAnalytics';
import { useErrorTracking } from '@/lib/useErrorTracking';
import { I18nProvider } from '@/lib/i18n';

// Only the chat entry point ships in the first bundle; everything else is
// fetched on demand so phones download far less JavaScript up front.
const Admin = lazy(() => import('@/pages/Admin'));
const NextPage = lazy(() => import('@/pages/NextPage'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const FaqPage = lazy(() => import('@/pages/FaqPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const TrackPage = lazy(() => import('@/pages/TrackPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const RefundPage = lazy(() => import('@/pages/RefundPage'));
const DistanceSalesPage = lazy(() => import('@/pages/DistanceSalesPage'));
const NotFound = lazy(() => import('@/pages/not-found'));

const LEGACY = legacyPathSegment();

/** Reserved paths that must never be treated as country slugs. */
const RESERVED = new Set([
  'faq',
  'track',
  'contact',
  'privacy',
  'terms',
  'refunds',
  'distance-sales',
  'checkout',
  'next',
  'admin',
  LEGACY,
]);

/**
 * Deep links like /pakistan redirect into chat state on "/".
 * The chat reads ?country= and renders the result in-thread.
 * No separate country landing pages exist.
 */
function CountryDeepLink() {
  const params = useParams<{ countrySlug: string }>();
  const slug = (params.countrySlug || '').toLowerCase();
  if (!slug || RESERVED.has(slug)) return <Redirect to="/" />;
  return <Redirect to={`/?country=${encodeURIComponent(slug)}`} />;
}

function RouteFallback() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center bg-[#f4f6f9]"
      role="status"
      aria-label="Loading"
    >
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-[#ff3c00]" />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={`/${LEGACY}/:rest*`}><Redirect to="/" /></Route>
      <Route path={`/${LEGACY}`}><Redirect to="/" /></Route>
      <Route path="/" component={EntryChat} />
      <Route path="/admin" component={Admin} />
      <Route path="/next" component={NextPage} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/faq" component={FaqPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/track" component={TrackPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/refunds" component={RefundPage} />
      <Route path="/distance-sales" component={DistanceSalesPage} />
      <Route path="/:countrySlug" component={CountryDeepLink} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Shell() {
  useAnalytics();
  useErrorTracking();
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Router />
      </Suspense>
      <WhatsAppButton />
      <CookieNotice />
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <WouterRouter base="">
        <Shell />
      </WouterRouter>
    </I18nProvider>
  );
}
