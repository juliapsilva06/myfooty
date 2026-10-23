import { useDashboard } from "./hooks/useDashboard.js";
import AppShell from "./components/layout/AppShell.jsx";
import OnboardingScreen from "./components/onboarding/OnboardingScreen.jsx";

function CenterMessage({ children }) {
  return (
    <div className="center-screen">
      <div className="center-screen__box">{children}</div>
    </div>
  );
}

export default function App() {
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
        <h1>Can't reach the server</h1>
        <p className="muted">Check that the backend is running, then try again.</p>
        <button className="btn btn-primary" onClick={() => refetch()}>
          Try again
        </button>
      </CenterMessage>
    );
  }

  if (!data.onboarded) return <OnboardingScreen />;
  return <AppShell dashboard={data} />;
}
