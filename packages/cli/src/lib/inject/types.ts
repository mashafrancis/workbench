export interface InjectionResult {
  ok: boolean;
  /** Path of the file that was edited or scaffolded (when known). */
  path?: string;
  /** Why the injection bailed when `ok` is false. */
  reason?: string;
}

export interface InjectorContext {
  /** Project root. */
  cwd: string;
  /** Detected source file containing the framework constructor, when applicable. */
  entry: string | null;
  /** URL path the dashboard should be mounted at (e.g. "/jobs"). */
  mountPath: string;
  /** Whether to inject Basic-Auth env reads in the snippet. */
  withAuth: boolean;
}

export type Injector = (ctx: InjectorContext) => Promise<InjectionResult>;
