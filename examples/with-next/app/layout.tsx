import type { ReactNode } from "react";

export const metadata = {
  title: "Workbench · Next.js example",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          background: "#0a0a0a",
          color: "#fafafa",
        }}
      >
        {children}
      </body>
    </html>
  );
}
