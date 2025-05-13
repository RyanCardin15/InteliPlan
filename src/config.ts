import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { FeaturePlanningConfig } from './Interfaces/FeaturePlanning';
import { FeaturePlanningToolMethods } from './Tools/FeaturePlanningTools';

// Try to load environment variables from .env file with multiple possible locations
function loadEnvFile() {
  // First try the current directory
  if (fs.existsSync('.env')) {
    dotenv.config();
    return;
  }
  
  // Try the directory of the running script
  const scriptDir = __dirname;
  const envPath = path.join(scriptDir, '..', '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    return;
  }

  // If we still haven't loaded env vars, try a few other common locations
  const possiblePaths = [
    // One level above the dist directory
    path.join(process.cwd(), '.env'),
    // User's home directory
    path.join(process.env.HOME || '', '.inteliplan.env')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      return;
    }
  }

  console.warn('No .env file found. Using environment variables if available.');
}

// Load environment variables
loadEnvFile();

const ALL_ALLOWED_TOOLS = FeaturePlanningToolMethods;

/**
 * Get allowed tools from `process.env.ALLOWED_TOOLS`.
 * 
 * For backward compatibility, if `process.env.ALLOWED_TOOLS` is `undefined`, all tools are allowed.
 */
export function getAllowedTools(): Set<string> {
  const ALLOWED_TOOLS = process.env.ALLOWED_TOOLS;
  if (!ALLOWED_TOOLS) return new Set(ALL_ALLOWED_TOOLS);
  const allowedTools = ALLOWED_TOOLS.split(',');
  return new Set(allowedTools);
}

/**
 * Get feature planning configuration from environment variables
 */
export function getFeaturePlanningConfig(): FeaturePlanningConfig {
  // Whether feature planning is enabled - defaults to true
  const enabled = process.env.FEATURE_PLANNING_ENABLED !== 'false';
  
  // Default output format - defaults to 'json'
  const defaultFormat = process.env.FEATURE_PLANNING_DEFAULT_FORMAT === 'markdown' ? 'markdown' : 'json';
  
  // Path to store feature plans - defaults to './feature-plans'
  const storagePath = process.env.FEATURE_PLANNING_STORAGE_PATH || './feature-plans';
  
  // Ensure the storage directory exists
  if (!fs.existsSync(storagePath)) {
    try {
      fs.mkdirSync(storagePath, { recursive: true });
    } catch (error) {
      console.warn(`Failed to create feature planning storage directory at ${storagePath}:`, error);
    }
  }
  
  // Maximum number of plans to keep - defaults to 50
  const maxPlansToKeep = parseInt(process.env.FEATURE_PLANNING_MAX_PLANS || '50', 10);
  
  // Default iteration pattern - supports simple placeholders
  const defaultIterationPattern = process.env.FEATURE_PLANNING_ITERATION_PATTERN || 'Iteration {n}: {description}';
  
  // Maximum allowed iterations
  const maxIterations = parseInt(process.env.FEATURE_PLANNING_MAX_ITERATIONS || '10', 10);
  
  return {
    enabled,
    defaultFormat: defaultFormat as 'json' | 'markdown',
    storagePath,
    maxPlansToKeep,
    defaultIterationPattern,
    maxIterations
  };
}
