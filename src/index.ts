import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getAllowedTools, getFeaturePlanningConfig } from './config';
import { FeaturePlanningTools } from './Tools/FeaturePlanningTools';
import { z } from 'zod';

async function main() {
  try {
    // Log startup info
    console.log('Starting MCP server for InteliPlan...');
    
    // Load configuration
    const featurePlanningConfig = getFeaturePlanningConfig();
    console.log('Successfully loaded feature planning configuration');

    // Load allowed tools
    const allowedTools = getAllowedTools();
    console.log('Successfully loaded allowed tools');
    
    // Initialize tools
    const featurePlanningTools = new FeaturePlanningTools();
    
    console.log('Initialized tools');

    // Create MCP server
    const server = new McpServer({
      name: 'inteliplan-mcp',
      version: '1.0.0',
      description: 'MCP server for intelligent planning',
    });
    
    // Register Feature Planning Tools
    allowedTools.has("planFeature") && server.tool("planFeature", 
      "Create a plan for implementing a new feature",
      {
        featureName: z.string().describe("Name of the feature"),
        description: z.string().describe("Description of the feature"),
        complexity: z.enum(['low', 'medium', 'high']).optional().describe("Complexity of the feature"),
        targetDate: z.string().optional().describe("Target completion date (YYYY-MM-DD)"),
        technology: z.array(z.string()).optional().describe("Technologies to be used"),
        outputFormat: z.enum(['json', 'markdown']).optional().describe("Output format")
      },
      async (params, extra) => {
        const result = await featurePlanningTools.planFeature(params);
        return {
          content: result.content,
          rawData: result.rawData,
          isError: result.isError
        };
      }
    );
    
    allowedTools.has("iterateFeaturePlan") && server.tool("iterateFeaturePlan", 
      "Iterate on an existing feature plan with feedback",
      {
        planId: z.string().describe("ID of the feature plan"),
        iterationNumber: z.number().describe("Iteration number"),
        feedback: z.string().describe("Feedback on the feature plan"),
        adjustments: z.object({
          addTasks: z.array(z.string()).optional().describe("Tasks to add"),
          removeTasks: z.array(z.string()).optional().describe("Task IDs to remove"),
          modifyTasks: z.array(z.object({
            taskId: z.string().describe("ID of the task to modify"),
            newDescription: z.string().optional().describe("New description for the task"),
            additionalSteps: z.array(z.string()).optional().describe("Additional steps/subtasks to add")
          })).optional().describe("Tasks to modify")
        }).optional().describe("Adjustments to make to the plan")
      },
      async (params, extra) => {
        const result = await featurePlanningTools.iterateFeaturePlan(params);
        return {
          content: result.content,
          rawData: result.rawData,
          isError: result.isError
        };
      }
    );
    
    allowedTools.has("getFeaturePlan") && server.tool("getFeaturePlan", 
      "Get a specific feature plan by ID",
      {
        planId: z.string().describe("ID of the feature plan"),
        format: z.enum(['json', 'markdown']).optional().describe("Output format")
      },
      async (params, extra) => {
        const result = await featurePlanningTools.getFeaturePlan(params);
        return {
          content: result.content,
          rawData: result.rawData,
          isError: result.isError
        };
      }
    );
    
    allowedTools.has("listFeaturePlans") && server.tool("listFeaturePlans", 
      "List all existing feature plans",
      {
        limit: z.number().optional().describe("Maximum number of plans to return"),
        sort: z.enum(['newest', 'oldest', 'name']).optional().describe("Sort order for plans")
      },
      async (params, extra) => {
        const result = await featurePlanningTools.listFeaturePlans(params);
        return {
          content: result.content,
          rawData: result.rawData,
          isError: result.isError
        };
      }
    );
    
    allowedTools.has("deleteFeaturePlan") && server.tool("deleteFeaturePlan", 
      "Delete a feature plan",
      {
        planId: z.string().describe("ID of the feature plan to delete")
      },
      async (params, extra) => {
        const result = await featurePlanningTools.deleteFeaturePlan(params.planId);
        return {
          content: result.content,
          rawData: result.rawData,
          isError: result.isError
        };
      }
    );

    console.log(`Registered tools`);
    // Create a transport (use stdio for simplicity)
    console.log('Creating StdioServerTransport');
    const transport = new StdioServerTransport();
    
    // Connect to the transport and start listening
    console.log('Connecting to transport...');
    await server.connect(transport);
    console.log('Connected to transport');

  } catch (error) {
    console.error('Error starting MCP server:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Set an environment variable to indicate we're in MCP mode
// This helps prevent console.log from interfering with stdio communication
process.env.MCP_MODE = 'true';

// Run the server
main(); 