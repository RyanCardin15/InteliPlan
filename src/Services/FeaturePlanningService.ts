import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getFeaturePlanningConfig } from "../config";
import { 
  PlanFeatureParams, 
  IterateFeaturePlanParams, 
  GetFeaturePlanParams, 
  ListFeaturePlansParams,
  FeaturePlan, 
  Task,
  SubTask,
  PlanIteration
} from '../Interfaces/FeaturePlanning';

export class FeaturePlanningService
{
  constructor() {
    // No configuration needed in constructor
  }

  async planFeature(params: PlanFeatureParams): Promise<FeaturePlan> {
    // Get feature planning configuration
    const featurePlanningConfig = getFeaturePlanningConfig();
    
    if (!featurePlanningConfig.enabled) {
      throw new Error("Feature planning is disabled. Enable it by setting FEATURE_PLANNING_ENABLED=true.");
    }
    
    const complexity = params.complexity || 'medium';
    const outputFormat = params.outputFormat || featurePlanningConfig.defaultFormat as 'json' | 'markdown';
    
    // Generate task counts based on complexity
    const taskCounts = {
      'low': { mainTasks: 3, subTasksPerTask: 2 },
      'medium': { mainTasks: 5, subTasksPerTask: 3 },
      'high': { mainTasks: 8, subTasksPerTask: 4 }
    }[complexity];
    
    // Generate a unique plan ID
    const planId = `plan-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    // Generate initial tasks
    const tasks = this.generateInitialTasks(
      params.featureName, 
      params.description, 
      taskCounts.mainTasks, 
      taskCounts.subTasksPerTask, 
      params.technology
    );
    
    // Create the feature plan object
    const featurePlan: FeaturePlan = {
      planId,
      featureName: params.featureName,
      description: params.description,
      complexity,
      targetDate: params.targetDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 2 weeks from now
      technology: params.technology || [],
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      estimatedEffort: `${complexity === 'low' ? '1-3' : complexity === 'medium' ? '3-8' : '8-20'} days`,
      tasks,
      iterations: [],
      currentIterationNumber: 0,
      status: 'draft',
      outputFormat
    };
    
    // Store the plan in the configured directory
    try {
      const planFilePath = path.join(featurePlanningConfig.storagePath, `${planId}.json`);
      fs.writeFileSync(planFilePath, JSON.stringify(featurePlan, null, 2));
      
      // Manage max plans to keep
      this.cleanupOldPlans(featurePlanningConfig);
    } catch (error) {
      console.warn('Failed to store feature plan:', error);
    }
    
    return featurePlan;
  }
  
  async iterateFeaturePlan(params: IterateFeaturePlanParams): Promise<FeaturePlan> {
    const config = getFeaturePlanningConfig();
    
    if (!config.enabled) {
      throw new Error("Feature planning is disabled. Enable it by setting FEATURE_PLANNING_ENABLED=true.");
    }
    
    // Verify iteration limits
    if (params.iterationNumber > config.maxIterations) {
      throw new Error(`Maximum number of iterations (${config.maxIterations}) exceeded.`);
    }
    
    // Load the existing plan
    const planPath = path.join(config.storagePath, `${params.planId}.json`);
    if (!fs.existsSync(planPath)) {
      throw new Error(`Feature plan with ID ${params.planId} not found.`);
    }
    
    const plan: FeaturePlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    
    // Create a new iteration record
    const iteration: PlanIteration = {
      iterationNumber: params.iterationNumber,
      timestamp: new Date().toISOString(),
      feedback: params.feedback,
      adjustments: {
        addedTasks: [],
        removedTasks: [],
        modifiedTasks: []
      }
    };
    
    // Apply adjustments to the plan
    if (params.adjustments) {
      // Add tasks
      if (params.adjustments.addTasks && params.adjustments.addTasks.length > 0) {
        for (const taskDesc of params.adjustments.addTasks) {
          const newTask: Task = {
            id: `task-${Date.now()}-${uuidv4().substring(0, 6)}`,
            name: taskDesc.substring(0, 50), // Use first 50 chars as name
            description: taskDesc,
            estimatedHours: 4, // Default estimate
            status: 'pending',
            subtasks: []
          };
          
          plan.tasks.push(newTask);
          iteration.adjustments.addedTasks.push(newTask.id);
        }
      }
      
      // Remove tasks
      if (params.adjustments.removeTasks && params.adjustments.removeTasks.length > 0) {
        for (const taskId of params.adjustments.removeTasks) {
          const index = plan.tasks.findIndex(t => t.id === taskId);
          if (index !== -1) {
            plan.tasks.splice(index, 1);
            iteration.adjustments.removedTasks.push(taskId);
          }
        }
      }
      
      // Modify tasks
      if (params.adjustments.modifyTasks && params.adjustments.modifyTasks.length > 0) {
        for (const mod of params.adjustments.modifyTasks) {
          const task = plan.tasks.find(t => t.id === mod.taskId);
          if (task) {
            const changes: string[] = [];
            
            if (mod.newDescription) {
              const oldDescription = task.description;
              task.description = mod.newDescription;
              changes.push(`Description updated: "${oldDescription.substring(0, 20)}..." -> "${mod.newDescription.substring(0, 20)}..."`);
            }
            
            if (mod.additionalSteps && mod.additionalSteps.length > 0) {
              for (const step of mod.additionalSteps) {
                const subtask: SubTask = {
                  id: `subtask-${Date.now()}-${uuidv4().substring(0, 6)}`,
                  name: step.substring(0, 50), // Use first 50 chars as name
                  description: step,
                  estimatedHours: 2, // Default estimate
                  status: 'pending'
                };
                
                if (!task.subtasks) {
                  task.subtasks = [];
                }
                
                task.subtasks.push(subtask);
                changes.push(`Added subtask: "${step.substring(0, 30)}..."`);
              }
            }
            
            if (changes.length > 0) {
              iteration.adjustments.modifiedTasks.push({
                taskId: task.id,
                changes: changes.join('; ')
              });
            }
          }
        }
      }
    }
    
    // Update plan metadata
    plan.iterations.push(iteration);
    plan.currentIterationNumber = params.iterationNumber;
    plan.lastUpdated = new Date().toISOString();
    plan.status = 'in-progress';
    
    // Save updated plan
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    
    return plan;
  }
  
  async getFeaturePlan(params: GetFeaturePlanParams): Promise<FeaturePlan> {
    const config = getFeaturePlanningConfig();
    
    // Load the existing plan
    const planPath = path.join(config.storagePath, `${params.planId}.json`);
    if (!fs.existsSync(planPath)) {
      throw new Error(`Feature plan with ID ${params.planId} not found.`);
    }
    
    const plan: FeaturePlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    
    // If a specific format is requested, update the plan's format
    if (params.format && params.format !== plan.outputFormat) {
      plan.outputFormat = params.format;
      fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    }
    
    return plan;
  }
  
  async listFeaturePlans(params: ListFeaturePlansParams = {}): Promise<{ plans: Partial<FeaturePlan>[]; total: number }> {
    const config = getFeaturePlanningConfig();
    
    try {
      // List all plan files
      const files = fs.readdirSync(config.storagePath)
        .filter(file => file.startsWith('plan-') && file.endsWith('.json'));
      
      // Sort based on the requested sort order
      const sort = params.sort || 'newest';
      const sortedFiles = files.map(file => {
        const fullPath = path.join(config.storagePath, file);
        const stats = fs.statSync(fullPath);
        const plan: FeaturePlan = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        
        return {
          path: fullPath,
          plan,
          mtime: stats.mtime.getTime()
        };
      }).sort((a, b) => {
        if (sort === 'newest') return b.mtime - a.mtime;
        if (sort === 'oldest') return a.mtime - b.mtime;
        if (sort === 'name') return a.plan.featureName.localeCompare(b.plan.featureName);
        return 0;
      });
      
      // Apply limit if specified
      const limit = params.limit || sortedFiles.length;
      const limitedFiles = sortedFiles.slice(0, limit);
      
      // Extract simplified plan info (we don't need all details for listing)
      const plans = limitedFiles.map(file => ({
        planId: file.plan.planId,
        featureName: file.plan.featureName,
        description: file.plan.description,
        complexity: file.plan.complexity,
        targetDate: file.plan.targetDate,
        createdDate: file.plan.createdDate,
        lastUpdated: file.plan.lastUpdated,
        status: file.plan.status,
        currentIterationNumber: file.plan.currentIterationNumber
      }));
      
      return {
        plans,
        total: files.length
      };
    } catch (error) {
      console.error('Error listing feature plans:', error);
      return { plans: [], total: 0 };
    }
  }
  
  async deleteFeaturePlan(planId: string): Promise<boolean> {
    const config = getFeaturePlanningConfig();
    
    const planPath = path.join(config.storagePath, `${planId}.json`);
    if (!fs.existsSync(planPath)) {
      throw new Error(`Feature plan with ID ${planId} not found.`);
    }
    
    try {
      fs.unlinkSync(planPath);
      return true;
    } catch (error) {
      console.error(`Error deleting feature plan ${planId}:`, error);
      return false;
    }
  }
  
  private cleanupOldPlans(config: ReturnType<typeof getFeaturePlanningConfig>) {
    try {
      // List all plan files
      const files = fs.readdirSync(config.storagePath)
        .filter(file => file.startsWith('plan-') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(config.storagePath, file),
          time: fs.statSync(path.join(config.storagePath, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Sort by modified time, newest first
      
      // Delete old files if we exceed the max
      if (files.length > config.maxPlansToKeep) {
        const filesToDelete = files.slice(config.maxPlansToKeep);
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.warn(`Failed to delete old plan: ${file.path}`, e);
          }
        });
      }
    } catch (error) {
      console.warn('Error during cleanup of old feature plans:', error);
    }
  }
  
  private generateInitialTasks(
    featureName: string, 
    description: string, 
    taskCount: number, 
    subTasksPerTask: number,
    technologies?: string[]
  ): Task[] {
    const techStack = technologies?.join(', ') || 'relevant technologies';
    
    // Common task templates
    const taskTemplates = [
      {
        name: 'Requirements Analysis',
        description: `Analyze the requirements for ${featureName} to ensure complete understanding.`,
        estimatedHours: 4,
        subtaskTemplates: [
          'Interview stakeholders to gather detailed requirements',
          'Document functional requirements',
          'Define acceptance criteria',
          'Identify potential technical challenges'
        ]
      },
      {
        name: 'Technical Design',
        description: `Create a detailed technical design for ${featureName} using ${techStack}.`,
        estimatedHours: 8,
        subtaskTemplates: [
          'Create architecture diagram',
          'Design database schema changes',
          'Define API contracts',
          'Document technical approach'
        ]
      },
      {
        name: 'Implementation',
        description: `Develop the core functionality for ${featureName}.`,
        estimatedHours: 16,
        subtaskTemplates: [
          'Set up development environment',
          'Implement core business logic',
          'Create necessary UI components',
          'Integrate with backend services',
          'Add error handling and validation'
        ]
      },
      {
        name: 'Testing',
        description: `Create and execute test cases for ${featureName}.`,
        estimatedHours: 8,
        subtaskTemplates: [
          'Create unit tests',
          'Implement integration tests',
          'Perform manual testing',
          'Verify acceptance criteria',
          'Test edge cases and error scenarios'
        ]
      },
      {
        name: 'Documentation',
        description: `Prepare user and technical documentation for ${featureName}.`,
        estimatedHours: 4,
        subtaskTemplates: [
          'Create user guide',
          'Update API documentation',
          'Document configuration options',
          'Create usage examples'
        ]
      },
      {
        name: 'Code Review',
        description: `Conduct code review and address feedback for ${featureName}.`,
        estimatedHours: 4,
        subtaskTemplates: [
          'Perform internal code review',
          'Address review comments',
          'Refactor code as needed',
          'Verify coding standards compliance'
        ]
      },
      {
        name: 'Deployment',
        description: `Prepare and execute deployment plan for ${featureName}.`,
        estimatedHours: 4,
        subtaskTemplates: [
          'Create deployment scripts',
          'Configure CI/CD pipeline',
          'Prepare rollback strategy',
          'Coordinate with operations team'
        ]
      },
      {
        name: 'Post-Deployment Verification',
        description: `Monitor and verify ${featureName} after deployment.`,
        estimatedHours: 4,
        subtaskTemplates: [
          'Monitor application metrics',
          'Verify feature functionality in production',
          'Collect user feedback',
          'Address any post-deployment issues'
        ]
      }
    ];
    
    // Generate tasks based on templates
    const tasks: Task[] = [];
    
    for (let i = 0; i < Math.min(taskCount, taskTemplates.length); i++) {
      const template = taskTemplates[i];
      
      // Create subtasks
      const subtasks: SubTask[] = [];
      for (let j = 0; j < Math.min(subTasksPerTask, template.subtaskTemplates.length); j++) {
        subtasks.push({
          id: `subtask-${Date.now()}-${uuidv4().substring(0, 6)}-${i}-${j}`,
          name: template.subtaskTemplates[j],
          description: template.subtaskTemplates[j],
          estimatedHours: Math.ceil(template.estimatedHours / subTasksPerTask),
          status: 'pending'
        });
      }
      
      // Create main task
      tasks.push({
        id: `task-${Date.now()}-${uuidv4().substring(0, 6)}-${i}`,
        name: template.name,
        description: template.description,
        estimatedHours: template.estimatedHours,
        status: 'pending',
        subtasks
      });
    }
    
    return tasks;
  }
} 