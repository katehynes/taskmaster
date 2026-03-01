export interface Task {
  id: string;
  title: string;
  forDate: string; // ISO date YYYY-MM-DD
  notes: string | null;
  completed: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string;
  ownerId: string | null;
}

export interface TaskCreateInput {
  title: string;
  forDate: string;
  notes?: string | null;
}

export interface TaskUpdateInput {
  title?: string;
  forDate?: string;
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
