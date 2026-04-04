export interface Task {
  id: string;
  title: string;
  /** ISO date YYYY-MM-DD, or null when the task is not scheduled to a specific day */
  forDate: string | null;
  notes: string | null;
  completed: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string;
  ownerId: string | null;
}

export interface TaskCreateInput {
  title: string;
  /** Omit or set null for an outstanding (undated) task */
  forDate?: string | null;
  notes?: string | null;
}

export interface TaskUpdateInput {
  title?: string;
  /** Set to an ISO date to schedule; set to null to move back to outstanding */
  forDate?: string | null;
  notes?: string | null;
  completed?: boolean;
}

export interface Settings {
  id: string;
  ownerId: string | null;
  expirationDays: number;
}

export interface SettingsUpdateInput {
  expirationDays: number;
}
