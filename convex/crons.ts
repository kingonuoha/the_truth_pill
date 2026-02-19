import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

// Run the AI schedule check every 15 minutes
crons.interval(
  "check-and-run-ai-schedule",
  { minutes: 15 },
  api.ai.processScheduleCheck,
);

// Run the email queue processor every 5 minutes
crons.interval(
  "process-email-queue",
  { minutes: 5 },
  internal.email_actions.processQueue,
  { limit: 50 },
);

// Weekly Digest Newsletter - Every Monday at 8:00 AM
crons.cron(
  "weekly-newsletter-digest",
  "0 8 * * 1", // 8:00 AM every Monday
  internal.emails.generateWeeklyNewsletter,
);

export default crons;
