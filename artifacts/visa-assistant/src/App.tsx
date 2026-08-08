import { Route, Switch, Router as WouterRouter, Redirect, useParams } from 'wouter';
import EntryChat from '@/pages/EntryChat';
import Admin from '@/pages/Admin';
import NextPage from '@/pages/NextPage';
import Checkout from '@/pages/Checkout';
import FaqPage from '@/pages/FaqPage';
import ContactPage from '@/pages/ContactPage';
import TrackPage from '@/pages/TrackPage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import NotFound from '@/pages/not-found';
import { legacyPathSegment } from '@/lib/wireCodes';
import { I18nProvider } from '@/lib/i18n';

const LEGACY = legacyPathSegment();

/** Reserved paths that must never be treated as country slugs. */
const RESERVED = new Set([
  'faq',
  'track',
  'contact',
  'privacy',
  'terms',
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
      <Route path="/:countrySlug" component={CountryDeepLink} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <WouterRouter base="">
        <Router />
      </WouterRouter>
    </I18nProvider>
  );
}
