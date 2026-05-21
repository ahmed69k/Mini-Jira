/**
 * Lambda: Assignment Worker
 * --------------------------
 * Triggered by SQS (fan-out from SNS task-assignment topic).
 * For each message it:
 *  1. Parses the assignment event.
 *  2. Writes an activity-log entry to DynamoDB (ActivityLogs table).
 *  3. Publishes a custom CloudWatch metric: TasksAssignedPerTeam.
 *
 * Environment variables (set in Lambda console):
 *   AWS_REGION          – already set by Lambda runtime (us-east-1)
 *   ACTIVITY_LOG_TABLE  – DynamoDB table name for activity logs
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");
const { randomUUID } = require("crypto");

// ── AWS clients ─────────────────────────────────────────────────────────────
const region = process.env.AWS_REGION || "us-east-1";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const cloudwatch = new CloudWatchClient({ region });

const ACTIVITY_LOG_TABLE = process.env.ACTIVITY_LOG_TABLE || "ActivityLogs";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse an SQS record.
 * When SQS receives from SNS, the real payload is nested inside
 * record.body → outer.Message (both JSON strings).
 */
function parseRecord(record) {
  const outer = JSON.parse(record.body);
  return typeof outer.Message === "string" ? JSON.parse(outer.Message) : outer;
}

/**
 * Write one activity-log row to DynamoDB.
 * Uses DynamoDBDocumentClient so we pass plain JS objects (no { S: } wrapping).
 *
 * Table schema:
 *   logId      (S) – partition key
 *   taskId     (S)
 *   teamId     (S)
 *   assigneeId (S)
 *   assignedBy (S)
 *   action     (S)
 *   timestamp  (S)
 */
async function writeActivityLog(payload) {
  const item = {
    logId:        randomUUID(),
    taskId:       payload.taskId       || "unknown",
    teamId:       payload.teamId       || "unknown",
    assigneeId:   payload.assigneeId   || "unknown",
    assignedBy:   payload.assignedBy   || "unknown",
    action:       "TASK_ASSIGNED",
    timestamp:    new Date().toISOString(),
    // optional fields — only written if present
    ...(payload.taskTitle    && { taskTitle:    payload.taskTitle }),
    ...(payload.teamName     && { teamName:     payload.teamName }),
    ...(payload.assigneeName && { assigneeName: payload.assigneeName }),
  };

  await dynamo.send(new PutCommand({
    TableName: ACTIVITY_LOG_TABLE,
    Item: item,
  }));

  console.log(`[ActivityLog] Written for taskId=${payload.taskId}`);
}

/**
 * Publish a custom CloudWatch metric: TasksAssignedPerTeam
 * Namespace : MiniJira/Tasks
 * Dimensions: TeamId, TeamName
 */
async function publishMetric(teamId, teamName) {
  await cloudwatch.send(new PutMetricDataCommand({
    Namespace: "MiniJira/Tasks",
    MetricData: [{
      MetricName: "TasksAssignedPerTeam",
      Dimensions: [
        { Name: "TeamId",   Value: teamId   || "unknown" },
        { Name: "TeamName", Value: teamName || "unknown" },
      ],
      Value:     1,
      Unit:      "Count",
      Timestamp: new Date(),
    }],
  }));

  console.log(`[CloudWatch] Metric published for team=${teamName || teamId}`);
}

// ── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  console.log(`[AssignmentWorker] Processing ${event.Records.length} record(s)`);

  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      const payload = parseRecord(record);
      console.log("[AssignmentWorker] Payload:", JSON.stringify(payload));

      await writeActivityLog(payload);
      await publishMetric(payload.teamId, payload.teamName);

    } catch (err) {
      console.error(`[AssignmentWorker] Failed on messageId=${record.messageId}:`, err);
      // Partial batch failure — SQS will retry only this message
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};