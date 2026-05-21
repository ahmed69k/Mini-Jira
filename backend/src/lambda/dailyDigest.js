/**
 * Lambda: Daily Digest
 * ---------------------
 * Scheduled Lambda (EventBridge/CloudWatch Events) that runs daily.
 * For each user with tasks due today that are not done:
 *  1. Scans tasks table for tasks due today (deadline = YYYY-MM-DD) AND status != "DONE"
 *  2. Groups tasks by assigneeId
 *  3. Gets assignee email from users table
 *  4. Sends SNS email digest to each assignee with their tasks
 *
 * Environment variables (set in Lambda console):
 *   AWS_REGION          – already set by Lambda runtime (us-east-1)
 *   TASKS_TABLE         – DynamoDB table name for tasks (default: "tasks")
 *   USERS_TABLE         – DynamoDB table name for users (default: "users")
 *   DIGEST_SNS_ARN      – SNS topic ARN for sending digest emails
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// ── AWS clients ─────────────────────────────────────────────────────────────
const region = process.env.AWS_REGION || "us-east-1";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const sns = new SNSClient({ region });

const TASKS_TABLE = process.env.TASKS_TABLE || "tasks";
const USERS_TABLE = process.env.USERS_TABLE || "users";
const DIGEST_SNS_ARN = process.env.DIGEST_SNS_ARN;

// Debug logging
console.log("Environment variables:");
console.log("- TASKS_TABLE:", TASKS_TABLE);
console.log("- USERS_TABLE:", USERS_TABLE);
console.log("- DIGEST_SNS_ARN:", DIGEST_SNS_ARN);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
function getTodayDate() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Scan tasks table for tasks due today that are not DONE
 */
async function getTodaysTasks(todayDate) {
  const params = {
    TableName: TASKS_TABLE,
    FilterExpression: "deadline = :today AND #status <> :done",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":today": todayDate,
      ":done": "DONE",
    },
  };

  const result = await dynamo.send(new ScanCommand(params));
  return result.Items || [];
}

/**
 * Group tasks by assigneeId
 */
function groupTasksByAssignee(tasks) {
  const grouped = {};

  for (const task of tasks) {
    const assigneeId = task.assigneeId;
    if (!assigneeId) {
      console.warn(`Task ${task.taskId} has no assigneeId, skipping`);
      continue;
    }

    if (!grouped[assigneeId]) {
      grouped[assigneeId] = [];
    }
    grouped[assigneeId].push(task);
  }

  return grouped;
}

/**
 * Get user email from users table
 */
async function getUserEmail(assigneeId) {
  try {
    const result = await dynamo.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId: assigneeId },
      })
    );

    return result.Item?.email || null;
  } catch (error) {
    console.error(`Error getting email for user ${assigneeId}:`, error);
    return null;
  }
}

/**
 * Send digest email via SNS with filter policy
 */
async function sendDigestEmail(assigneeEmail, tasks) {
  // Build task list
  const taskList = tasks
    .map(
      (task, index) =>
        `${index + 1}. ${task.title}
   Priority: ${task.priority}
   Status: ${task.status}
   Deadline: ${task.deadline}`
    )
    .join("\n\n");

  const message = `Daily Task Digest - ${getTodayDate()}

You have ${tasks.length} task(s) due today that are not yet completed:

${taskList}

Please log in to Mini-Jira to view and update your tasks.`;

  const subject = `Daily Digest: ${tasks.length} Task(s) Due Today`;

  try {
    console.log(`Sending digest to ${assigneeEmail} using TopicArn: ${DIGEST_SNS_ARN}`);

    await sns.send(
      new PublishCommand({
        TopicArn: DIGEST_SNS_ARN,
        Subject: subject,
        Message: message,
        MessageAttributes: {
          assigneeEmail: {
            DataType: "String",
            StringValue: assigneeEmail,
          },
        },
      })
    );

    console.log(`✅ Digest email sent to ${assigneeEmail} (${tasks.length} tasks)`);
  } catch (error) {
    console.error(`❌ Failed to send digest to ${assigneeEmail}:`, error);
    throw error;
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async () => {
  console.log("[DailyDigest] Starting daily digest process");

  const todayDate = getTodayDate();
  console.log(`[DailyDigest] Today's date: ${todayDate}`);

  // Step 1: Get all tasks due today that are not done
  const tasks = await getTodaysTasks(todayDate);
  console.log(`[DailyDigest] Found ${tasks.length} tasks due today`);

  if (tasks.length === 0) {
    console.log("[DailyDigest] No tasks due today, exiting");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "No tasks due today" }),
    };
  }

  // Step 2: Group tasks by assignee
  const tasksByAssignee = groupTasksByAssignee(tasks);
  const assigneeIds = Object.keys(tasksByAssignee);
  console.log(`[DailyDigest] Tasks grouped by ${assigneeIds.length} assignee(s)`);

  // Step 3: Send digest to each assignee
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
  };

  for (const assigneeId of assigneeIds) {
    const assigneeTasks = tasksByAssignee[assigneeId];

    // Get assignee email
    const assigneeEmail = await getUserEmail(assigneeId);

    if (!assigneeEmail) {
      console.warn(`⚠️  Skipping assignee ${assigneeId}: no email found`);
      results.skipped++;
      continue;
    }

    // Send digest email
    try {
      await sendDigestEmail(assigneeEmail, assigneeTasks);
      results.success++;
    } catch (error) {
      console.error(`Failed to send digest to ${assigneeEmail}:`, error);
      results.failed++;
    }
  }

  console.log(`[DailyDigest] Complete: ${results.success} sent, ${results.failed} failed, ${results.skipped} skipped`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Daily digest process completed",
      todayDate,
      totalTasks: tasks.length,
      totalAssignees: assigneeIds.length,
      results,
    }),
  };
};
