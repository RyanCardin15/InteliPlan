/**
 * Interface for standardized MCP responses
 */
export interface McpResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  rawData?: any;
  isError?: boolean;
}

/**
 * Helper function to format response to the MCP format
 */
export function formatMcpResponse(data: any, description: string): McpResponse {
  return {
    content: [
      {
        type: "text",
        text: description
      }
    ],
    rawData: data
  };
}

/**
 * Helper function to format error responses
 */
export function formatErrorResponse(error: unknown): McpResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    content: [
      {
        type: "text",
        text: `Error: ${errorMessage}`
      }
    ],
    isError: true,
    rawData: {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }
  };
} 