import { Route, Switch, Router as WouterRouter, Redirect, useParams } from 'wouter';
import VisaChat from '@/pages/VisaChat';
import Admin from '@/pages/Admin';
import NextPage from '@/pages/NextPage';
import Checkout from '@/pages/Checkout';
import NotFound from '@/pages/not-found';

/** Reserved paths that must never be treated as country slugs. */
const RESERVED = new Set(['faq', 'track', 'contact', 'checkout', 'next', 'admin', 'visa']);

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
      {/* Legacy /visa/* → redirect to root */}
      <Route path="/visa/:rest*"><Redirect to="/" /></Route>
      <Route path="/visa"><Redirect to="/" /></Route>
      <Route path="/" component={VisaChat} />
      <Route path="/admin" component={Admin} />
      {/* Application start page */}
      <Route path="/next" component={NextPage} />
      {/* Insurance checkout */}
      <Route path="/checkout" component={Checkout} />
      {/* Reserved paths — never country slugs, never "Country not found" */}
      <Route path="/faq"><Redirect to="/" /></Route>
      <Route path="/track"><Redirect to="/" /></Route>
      <Route path="/contact"><Redirect to="/" /></Route>
      {/* Country deep links redirect into chat state on "/" */}
      <Route path="/:countrySlug" component={CountryDeepLink} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  // BASE_URL is "/" now — base must be empty string for root-mounted router
  return (
    <WouterRouter base="">
      <Router />
    </WouterRouter>
  );
}
