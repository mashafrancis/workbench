import router from "@adonisjs/core/services/router";
import { mountWorkbench } from "@getworkbench/adonis";
import { queues } from "../src/queues.js";

router.get("/", () => {
  return "Try /jobs for the Workbench dashboard.";
});

const auth =
  process.env.WORKBENCH_USER && process.env.WORKBENCH_PASS
    ? {
        username: process.env.WORKBENCH_USER,
        password: process.env.WORKBENCH_PASS,
      }
    : undefined;

mountWorkbench(router, "/jobs", {
  queues,
  title: "AdonisJS · Workbench",
  auth,
});
