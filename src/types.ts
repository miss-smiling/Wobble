export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id?: string;
  uid: string;
  title: string;
  deadline: string;
  priority: 'Urgent' | 'High' | 'Normal' | 'Low';
  riskScore: number;
  subtasks: Subtask[];
  estimatedHours: number;
  status: 'pending' | 'completed';
  createdAt: number;
}

export interface TimeBlock {
  time: string;
  action: string;
  status: 'pending' | 'completed';
}

export interface DominoStep {
  step: number;
  trigger: string;
  consequence: string;
  severity: 'critical' | 'high' | 'medium';
}

export interface CascadeAnalysis {
  collisionSummary: string;
  hoursUntilCollision: number;
  dominoes: DominoStep[];
}

export interface AgenticDeliverable {
  type: 'extension_email' | 'reschedule_email' | 'outline' | 'apology_plan' | 'cram_sheet';
  label: string;
  content: string;
}

export interface RescueReceiptPreview {
  headline: string;
  verdict: string;
  proofPoints: string[];
}

export interface RescuePlan {
  title: string;
  survivalStrategy: string;
  riskReduction: string;
  timeBreakdown: TimeBlock[];
  priorityActions: string[];
  instantTasks?: Task[];
  cascade?: CascadeAnalysis;
  deliverables?: AgenticDeliverable[];
  receiptPreview?: RescueReceiptPreview;
}

export interface ParsedTaskResult {
  title?: string;
  deadline?: string;
  priority?: 'Urgent' | 'High' | 'Normal' | 'Low';
  riskScore?: number;
  subtasks?: string[];
  estimatedHours?: number;
  cascade?: CascadeAnalysis;
}

export interface RescueReceipt {
  id: string;
  createdAt: number;
  panicText: string;
  planTitle: string;
  headline: string;
  verdict: string;
  proofPoints: string[];
  riskReduction: string;
  deliverableCount: number;
  tasksInjected: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  name: string;
  email: string;
  photoURL: string;
  theme: string;
  focusBackground: 'forest' | 'rain' | 'library';
  createdAt: number;
  lastLoginAt: number;
  lastLogoutAt?: number;
}

export interface UserUsage {
  uid: string;
  month: string;
  taskGenerations: number;
  rescueGenerations: number;
}

export type PlanCacheType = 'task' | 'rescue';

export interface CachedPlan<T = unknown> {
  uid: string;
  type: PlanCacheType;
  input: string;
  result: T;
  createdAt: number;
}
