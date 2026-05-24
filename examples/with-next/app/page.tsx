export default function Page() {
  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
      }}
    >
      <div>
        <h1>Workbench · Next.js example</h1>
        <p>
          Open <a href="/jobs">/jobs</a> for the BullMQ dashboard.
        </p>
      </div>
    </main>
  );
}
