import { workbench } from "@getworkbench/tanstack-start";
import { queues } from "../queues";

const auth =
  process.env.WORKBENCH_USER && process.env.WORKBENCH_PASS
    ? {
        username: process.env.WORKBENCH_USER,
        password: process.env.WORKBENCH_PASS,
      }
    : undefined;

export const workbenchHandlers = workbench({
  queues,
  title: "TanStack Start · Workbench",
  basePath: "/jobs",
  auth,
});
