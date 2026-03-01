export interface Task {
  id: string;
  title: string;
  forDate: string;
  notes: string | null;
  completed: boolean;
  createdAt: string;
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
  expirationDays: number;
}
