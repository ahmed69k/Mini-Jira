const { v4: uuidv4 } = require("uuid");
const dynamodb = require("../config/dynamodb");
const { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const PROJECTS_TABLE = "projects";

// POST /api/projects - Create new project (manager only)
exports.createProject = async (req, res) => {
  try {
    // Check if user is manager
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only managers can create projects" });
    }

    const { title, description, teamId } = req.body;

    // Validate required fields
    if (!title || !teamId) {
      return res.status(400).json({ error: "Missing required fields: title and teamId" });
    }

    const projectId = uuidv4();
    const now = new Date().toISOString();

    const project = {
      projectId,
      title,
      description: description || "",
      teamId,
      createdBy: req.user.userId,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: PROJECTS_TABLE,
      Item: project,
    });

    await dynamodb.send(command);

    return res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({ error: "Failed to create project" });
  }
};

// GET /api/projects - Get all projects (filtered by role)
exports.getProjects = async (req, res) => {
  try {
    const { teamId } = req.query;

    // If user is employee, only return projects from their team
    if (req.user.role === "employee") {
      const command = new QueryCommand({
        TableName: PROJECTS_TABLE,
        IndexName: "teamId-index",
        KeyConditionExpression: "teamId = :teamId",
        ExpressionAttributeValues: {
          ":teamId": req.user.teamId,
        },
      });

      const result = await dynamodb.send(command);
      return res.status(200).json(result.Items || []);
    }

    // If user is manager
    if (teamId) {
      // Filter by teamId if provided
      const command = new QueryCommand({
        TableName: PROJECTS_TABLE,
        IndexName: "teamId-index",
        KeyConditionExpression: "teamId = :teamId",
        ExpressionAttributeValues: {
          ":teamId": teamId,
        },
      });

      const result = await dynamodb.send(command);
      return res.status(200).json(result.Items || []);
    } else {
      // Scan entire table to get all projects
      const command = new ScanCommand({
        TableName: PROJECTS_TABLE,
      });

      const result = await dynamodb.send(command);
      return res.status(200).json(result.Items || []);
    }
  } catch (error) {
    console.error("Error getting projects:", error);
    return res.status(500).json({ error: "Failed to get projects" });
  }
};

// GET /api/projects/:id - Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const command = new GetCommand({
      TableName: PROJECTS_TABLE,
      Key: { projectId: id },
    });

    const result = await dynamodb.send(command);

    if (!result.Item) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = result.Item;

    // If employee, check if project belongs to their team
    if (req.user.role === "employee" && project.teamId !== req.user.teamId) {
      return res.status(403).json({ error: "Forbidden: Project does not belong to your team" });
    }

    return res.status(200).json(project);
  } catch (error) {
    console.error("Error getting project by ID:", error);
    return res.status(500).json({ error: "Failed to get project" });
  }
};

// PUT /api/projects/:id - Update project (manager only)
exports.updateProject = async (req, res) => {
  try {
    // Check if user is manager
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only managers can update projects" });
    }

    const { id } = req.params;
    const { title, description } = req.body;

    // Check if project exists
    const getCommand = new GetCommand({
      TableName: PROJECTS_TABLE,
      Key: { projectId: id },
    });

    const getResult = await dynamodb.send(getCommand);

    if (!getResult.Item) {
      return res.status(404).json({ error: "Project not found" });
    }

    const now = new Date().toISOString();

    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (title !== undefined) {
      updateExpressions.push("#title = :title");
      expressionAttributeNames["#title"] = "title";
      expressionAttributeValues[":title"] = title;
    }

    if (description !== undefined) {
      updateExpressions.push("#description = :description");
      expressionAttributeNames["#description"] = "description";
      expressionAttributeValues[":description"] = description;
    }

    // Always update updatedAt
    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = now;

    if (updateExpressions.length === 1) {
      // Only updatedAt, nothing to update
      return res.status(200).json(getResult.Item);
    }

    const updateCommand = new UpdateCommand({
      TableName: PROJECTS_TABLE,
      Key: { projectId: id },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    const updateResult = await dynamodb.send(updateCommand);

    return res.status(200).json(updateResult.Attributes);
  } catch (error) {
    console.error("Error updating project:", error);
    return res.status(500).json({ error: "Failed to update project" });
  }
};

// DELETE /api/projects/:id - Delete project (manager only)
exports.deleteProject = async (req, res) => {
  try {
    // Check if user is manager
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only managers can delete projects" });
    }

    const { id } = req.params;

    // Check if project exists
    const getCommand = new GetCommand({
      TableName: PROJECTS_TABLE,
      Key: { projectId: id },
    });

    const getResult = await dynamodb.send(getCommand);

    if (!getResult.Item) {
      return res.status(404).json({ error: "Project not found" });
    }

    const deleteCommand = new DeleteCommand({
      TableName: PROJECTS_TABLE,
      Key: { projectId: id },
    });

    await dynamodb.send(deleteCommand);

    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({ error: "Failed to delete project" });
  }
};
