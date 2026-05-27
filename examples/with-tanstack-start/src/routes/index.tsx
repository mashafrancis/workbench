import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Workbench · TanStack Start example</h1>
      <p>
        Try <a href="/jobs">/jobs</a> for the Workbench dashboard.
      </p>
    </main>
  );
}
