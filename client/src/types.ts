export type UserRole = 'freelancer' | 'business_owner';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Client {
  id: number;
  user_id: number;
  name: string;
  email: string | null;
  company: string | null;
  share_token: string;
  created_at: string;
  project_count?: number;
}

export type ProjectStatus = 'active' | 'completed' | 'on_hold';

export interface Project {
  id: number;
  client_id: number;
  title: string;
  description: string | null;
  github_repo: string | null;
  status: ProjectStatus;
  deadline: string | null;
  created_at: string;
  client_name?: string;
  client_company?: string | null;
  task_count?: number;
  completed_task_count?: number;
  progress_percentage?: number;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  sort_order: number;
  is_client_visible: boolean;
  due_date: string | null;
  created_at?: string;
}

export type UploadedBy = 'freelancer' | 'client';

export interface Asset {
  id: number;
  project_id: number;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: UploadedBy;
  created_at: string;
  download_url?: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface PortalProject {
  id: number;
  title: string;
  description: string | null;
  status: ProjectStatus;
  deadline: string | null;
  progressPercentage: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: Task[];
  reviewTasks: Task[];
  completedTasksList: Task[];
  assets: Asset[];
}

export interface PortalData {
  client: {
    id: number;
    name: string;
    company: string | null;
    email: string | null;
  };
  freelancer: {
    name: string;
    email: string;
  };
  projects: PortalProject[];
}
