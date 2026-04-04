export interface Task {
  id: string;
  title: string;
  /** ISO date YYYY-MM-DD, or null when not scheduled to a specific day */
  forDate: string | null;
  notes: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: string | null;
}

export interface TaskCreateInput {
  title: string;
  /** Omit or null for an outstanding task */
  forDate?: string | null;
  notes?: string | null;
}

export interface TaskUpdateInput {
  title?: string;
  forDate?: string | null;
  notes?: string | null;
  completed?: boolean;
}

export interface Settings {
  expirationDays: number;
}
