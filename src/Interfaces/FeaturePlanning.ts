export interface FeaturePlanningConfig {
  enabled: boolean;
  defaultFormat: 'json' | 'markdown';
  storagePath: string;
  maxPlansToKeep: number;
  defaultIterationPattern: string;
  maxIterations: number;
}

export interface PlanFeatureParams {
  featureName: string;
  description: string;
  complexity?: 'low' | 'medium' | 'high';
  targetDate?: string;
  technology?: string[];
  outputFormat?: 'json' | 'markdown';
}

export interface IterateFeaturePlanParams {
  planId: string;
  iterationNumber: number;
  feedback: string;
  adjustments?: {
    addTasks?: string[];
    removeTasks?: string[];
    modifyTasks?: {
      taskId: string;
      newDescription?: string;
      additionalSteps?: string[];
    }[];
  };
}

export interface GetFeaturePlanParams {
  planId: string;
  format?: 'json' | 'markdown';
}

export interface ListFeaturePlansParams {
  limit?: number;
  sort?: 'newest' | 'oldest' | 'name';
}

export interface Task {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  status: 'pending' | 'in-progress' | 'completed';
  subtasks?: SubTask[];
}

export interface SubTask {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface FeaturePlan {
  planId: string;
  featureName: string;
  description: string;
  complexity: 'low' | 'medium' | 'high';
  targetDate: string;
  technology: string[];
  createdDate: string;
  lastUpdated: string;
  estimatedEffort: string;
  tasks: Task[];
  iterations: PlanIteration[];
  currentIterationNumber: number;
  status: 'draft' | 'in-progress' | 'completed';
  outputFormat: 'json' | 'markdown';
}

export interface PlanIteration {
  iterationNumber: number;
  timestamp: string;
  feedback: string;
  adjustments: {
    addedTasks: string[];
    removedTasks: string[];
    modifiedTasks: {
      taskId: string;
      changes: string;
    }[];
  };
} 