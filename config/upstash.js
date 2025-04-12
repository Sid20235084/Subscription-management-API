import { Client as WorkflowClient } from "@upstash/workflow";

import { QSTASH_TOKEN, QSTASH_URL } from "./env.js";

export const workflowClient = new WorkflowClient({
  baseUrl: QSTASH_URL,
  token: QSTASH_TOKEN,
});

//workflow-> message queing or task scheduling system.
//client or an api request triggers a specific workflow to happen.
//we want to send a lot of email remainders before the subscription expires to the user
