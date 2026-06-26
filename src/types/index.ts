export enum UserRole {
  owner = 'owner',
  admin = 'admin',
  member = 'member',
  guest = 'guest',
}

export enum WorkspaceRole {
  owner = 'owner',
  admin = 'admin',
  member = 'member',
  guest = 'guest',
}

export enum JenisUnitKerja {
  KC = 'KC',
  KCP = 'KCP',
  KK = 'KK',
  Unit = 'Unit',
}

export enum ProjectStatus {
  active = 'active',
  archived = 'archived',
  completed = 'completed',
}

export enum TaskPriority {
  low = 'low',
  medium = 'medium',
  high = 'high',
  urgent = 'urgent',
}

export enum TaskStatus {
  todo = 'todo',
  in_progress = 'in_progress',
  review = 'review',
  completed = 'completed',
}

export enum InvitationStatus {
  pending = 'pending',
  accepted = 'accepted',
  declined = 'declined',
}

export enum NotificationType {
  task_assigned = 'task_assigned',
  task_updated = 'task_updated',
  comment_added = 'comment_added',
  mention = 'mention',
  invitation = 'invitation',
  status_change = 'status_change',
  due_date_reminder = 'due_date_reminder',
}

export interface User {
  id: string;
  name: string;
  email?: string;
  image: string | null;
  role?: UserRole;
  createdAt?: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  user: User;
  joinedAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string | null;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  duration: number;
  note: string | null;
  date: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  publicId: string;
  size: number;
  type: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  user: User;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  details: Record<string, unknown> | null;
  user: User;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  project?: { id: string; name: string };
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  estimatedHours: number | null;
  order: number;
  parentId: string | null;
  unitKerjaId: string | null;
  unitKerja?: { id: string; kode: string; nama: string } | null;
  subtasks: Task[];
  assignments: User[];
  labels: Label[];
  comments: Comment[];
  attachments: Attachment[];
  timeEntries: TimeEntry[];
  createdBy?: { id: string; name: string; image: string | null };
  updatedBy?: { id: string; name: string; image: string | null };
  createdAt: string;
  updatedAt: string;
  _count?: { comments: number; subtasks: number; attachments: number };
}

export interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  alamat: string | null;
  jenis: JenisUnitKerja;
  longitude: string | null;
  latitude: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number };
  tasks?: { id: string; title: string; status: string }[];
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  status: ProjectStatus;
  isFavorite: boolean;
  _count?: { tasks: number };
  tasks: Task[];
  createdBy?: { id: string; name: string; image: string | null };
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  ownerId: string;
  owner?: { id: string; name: string; image: string | null };
  members: WorkspaceMember[];
  projects: Project[];
  _count?: { members: number; projects: number };
}

export interface Invitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: Task[];
}

export interface TaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  teamMembers: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}
