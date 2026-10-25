import { useDashboard } from "./hooks/useDashboard.js";
import AppShell from "./components/layout/AppShell.jsx";
import PageBackground from "./components/layout/PageBackground.jsx";
import SetupScreen from "./components/setup/SetupScreen.jsx";

function CenterMessage({ children }) {
  return (
    <div className="center-screen">
      <div className="center-screen__box">{children}</div>
    </div>
  );
}

function Screen() {
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isLoading) {
    return (
      <CenterMessage>
        <p className="muted">Loading your dashboard...</p>
      </CenterMessage>
    );
  }

  if (isError) {
    return (
      <CenterMessage>
        <h1>Something went wrong</h1>
        <p className="muted">We couldn't load your dashboard. Please try again.</p>
        <button className="btn btn-primary" onClick={() => refetch()}>
          Try again
        </button>
      </CenterMessage>
    );
  }

  // First visit: pick your teams with the search form. No AI needed.
  if (!data.onboarded) return <SetupScreen />;
  return <AppShell dashboard={data} />;
}

export default function App() {
  return (
    <>
      <PageBackground />
      <Screen />
    </>
  );
}
