import { createFileRoute } from "@tanstack/react-router";
import { workbenchHandlers } from "../lib/workbench-handlers";

export const Route = createFileRoute("/jobs")({
  server: {
    handlers: workbenchHandlers,
  },
});
