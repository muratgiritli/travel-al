import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import VisaChat from '@/pages/VisaChat';
import Admin from '@/pages/Admin';
import CountryPage from '@/pages/CountryPage';
import NotFound from '@/pages/not-found';

function Router() {
  return (
    <Switch>
      {/* Legacy /visa/* → redirect to root */}
      <Route path="/visa/:rest*"><Redirect to="/" /></Route>
      <Route path="/visa"><Redirect to="/" /></Route>
      <Route path="/" component={VisaChat} />
      <Route path="/admin" component={Admin} />
      {/* Country landing pages: /bangladesh, /egypt, /algeria, etc. */}
      <Route path="/:countrySlug" component={CountryPage} />
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
