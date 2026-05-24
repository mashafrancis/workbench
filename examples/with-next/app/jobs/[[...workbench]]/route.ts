import { workbench } from "@getworkbench/next";
import { queues } from "../../queues";

export const dynamic = "force-dynamic";

const auth =
  process.env.WORKBENCH_USER && process.env.WORKBENCH_PASS
    ? {
        username: process.env.WORKBENCH_USER,
        password: process.env.WORKBENCH_PASS,
      }
    : undefined;

export const { GET, POST, PUT, PATCH, DELETE } = workbench({
  queues,
  title: "Next · Workbench",
  basePath: "/jobs",
  auth,
});
