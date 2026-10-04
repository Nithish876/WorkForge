export type UserRole = 'freelancer' | 'business_owner';

export interface User {
  id: number;
  name: string;
  email: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  github_username?: string | null;
  twitter_username?: string | null;
  linkedin_url?: string | null;
  avatar_url?: string | null;
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
  user_id?: number;
  title: string;
  description: string | null;
  github_repo: string | null;
  status: ProjectStatus;
  deadline: string | null;
  is_public?: boolean;
  created_at: string;
  client_name?: string;
  client_company?: string | null;
  task_count?: number;
  completed_task_count?: number;
  progress_percentage?: number;
  user_role?: 'owner' | 'contributor' | 'viewer';
  collaborators_count?: number;
}

export type CollaboratorRole = 'contributor' | 'viewer';
export type CollaboratorStatus = 'pending' | 'accepted' | 'declined';

export interface ProjectCollaborator {
  id: number;
  project_id: number;
  user_id: number;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  invited_by: number;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_headline?: string | null;
  user_avatar?: string | null;
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
  image_url?: string | null;
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

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  github_username: string | null;
  twitter_username: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  created_at: string;
  is_owner: boolean;
  public_projects: Project[];
  metrics: {
    total_projects: number;
    public_projects_count: number;
    total_tasks_completed: number;
    total_contributions: number;
    current_streak_days: number;
    completion_rate_percentage: number;
    activity_heatmap: ActivityDay[];
  };
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
