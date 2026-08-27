// All status values an operation can be in
export type OperationStatus = 'COMPLETED' | 'FAILED' | 'PENDING' | 'PROCESSING';

// Priority levels
export type OperationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

// Source systems that feed operations into the portal
export type SourceSystem = 'CORE_SYS' | 'PAYMENT_HUB' | 'ORDER_GATEWAY' | 'PROCESSING_ENGINE';

// Core operation interface — used everywhere in the app
export interface Operation {
  id: string;
  operationId: string;
  status: OperationStatus;
  priority: OperationPriority;
  sourceSystem: SourceSystem;
  description: string;
  createdDate: string;   // ISO date string
  updatedDate: string;
  assignedTo: string;
  errorMessage?: string; // Only present when status === 'FAILED'
  retryCount: number;
  amount: number;
  currency: string;
}

// Shape of the search/filter form
export interface OperationSearchFilters {
  operationId?: string;
  status?: OperationStatus | '';
  priority?: OperationPriority | '';
  sourceSystem?: SourceSystem | '';
  createdFrom?: string;
  createdTo?: string;
}

// Dashboard summary stats — derived from operations
export interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  processing: number;
  highPriority: number;
}
