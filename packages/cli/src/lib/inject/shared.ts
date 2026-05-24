/**
 * Build the inline workbench(...) options snippet shared across injectors.
 *
 * Renders as:
 *   queues: [/* add your BullMQ queues *\/],
 *   auth: { username: process.env.WORKBENCH_USER!, password: process.env.WORKBENCH_PASS! },
 */
export function workbenchOptionsSnippet(
  withAuth: boolean,
  indent = "  ",
): string {
  const lines = [`${indent}queues: [/* add your BullMQ queues */],`];
  if (withAuth) {
    lines.push(
      `${indent}auth: {`,
      `${indent}  username: process.env.WORKBENCH_USER!,`,
      `${indent}  password: process.env.WORKBENCH_PASS!,`,
      `${indent}},`,
    );
  }
  return lines.join("\n");
}

/**
 * Insert a new `import` line into `src`. Tries to place it directly after an
 * existing import for a known package, falling back to after the last import
 * statement, or at the top of the file when no imports exist.
 */
export function addImport(
  src: string,
  importLine: string,
  anchorPackage?: string,
): string {
  if (anchorPackage) {
    const anchorRe = new RegExp(
      `import\\s+[^;\\n]*from\\s+["']${escapeRegExp(anchorPackage)}["'];?\\n`,
    );
    const m = src.match(anchorRe);
    if (m && m.index !== undefined) {
      const insertAt = m.index + m[0].length;
      return src.slice(0, insertAt) + importLine + src.slice(insertAt);
    }
  }

  const lastImport = [...src.matchAll(/^import\s.+from\s.+;?\s*$/gm)].pop();
  if (lastImport && lastImport.index !== undefined) {
    const insertAt = lastImport.index + lastImport[0].length;
    return `${src.slice(0, insertAt)}\n${importLine}${src.slice(insertAt)}`;
  }

  return `${importLine}\n${src}`;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
