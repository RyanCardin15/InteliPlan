import { FeaturePlanningService } from "../Services/FeaturePlanningService";
import { formatMcpResponse, formatErrorResponse, McpResponse } from '../Interfaces/Common';
import {
  PlanFeatureParams,
  IterateFeaturePlanParams,
  GetFeaturePlanParams,
  ListFeaturePlansParams,
  FeaturePlanningConfig
} from "../Interfaces/FeaturePlanning";
import getClassMethods from "../utils/getClassMethods";

export class FeaturePlanningTools {
  private service: FeaturePlanningService;

  constructor() {
    this.service = new FeaturePlanningService();
  }

  async planFeature(params: PlanFeatureParams): Promise<McpResponse> {
    try {
      const result = await this.service.planFeature(params);
      return formatMcpResponse(result, `Feature planning for ${params.featureName}`);
    } catch (error: unknown) {
      console.error('Error creating feature plan:', error);
      return formatErrorResponse(error);
    }
  }

  async iterateFeaturePlan(params: IterateFeaturePlanParams): Promise<McpResponse> {
    try {
      const result = await this.service.iterateFeaturePlan(params);
      return formatMcpResponse(result, `Feature plan iteration ${params.iterationNumber} for plan ${params.planId}`);
    } catch (error: unknown) {
      console.error('Error iterating feature plan:', error);
      return formatErrorResponse(error);
    }
  }

  async getFeaturePlan(params: GetFeaturePlanParams): Promise<McpResponse> {
    try {
      const result = await this.service.getFeaturePlan(params);
      return formatMcpResponse(result, `Feature plan ${params.planId}`);
    } catch (error: unknown) {
      console.error('Error getting feature plan:', error);
      return formatErrorResponse(error);
    }
  }

  async listFeaturePlans(params: ListFeaturePlansParams = {}): Promise<McpResponse> {
    try {
      const result = await this.service.listFeaturePlans(params);
      return formatMcpResponse(result, `Feature plans (${result.total} total)`);
    } catch (error: unknown) {
      console.error('Error listing feature plans:', error);
      return formatErrorResponse(error);
    }
  }

  async deleteFeaturePlan(planId: string): Promise<McpResponse> {
    try {
      const result = await this.service.deleteFeaturePlan(planId);
      return formatMcpResponse({ success: result }, `Feature plan ${planId} deletion ${result ? 'successful' : 'failed'}`);
    } catch (error: unknown) {
      console.error('Error deleting feature plan:', error);
      return formatErrorResponse(error);
    }
  }
}

export const FeaturePlanningToolMethods = getClassMethods(FeaturePlanningTools.prototype); 