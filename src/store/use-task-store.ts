import { create } from 'zustand';
import type { Task } from '@/types';
import { TaskPriority, TaskStatus } from '@/types';

interface TaskFilters {
  priority?: TaskPriority;
  assignee?: string;
  status?: TaskStatus;
  dueDate?: string;
  labels?: string[];
  search?: string;
}

type ViewMode = 'kanban' | 'list' | 'calendar' | 'table';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  filters: TaskFilters;
  viewMode: ViewMode;

  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setViewMode: (mode: ViewMode) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  removeTask: (id: string) => void;
  get filteredTasks(): Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  filters: {},
  viewMode: 'kanban',

  setTasks: (tasks) => set({ tasks }),

  setSelectedTask: (task) => set({ selectedTask: task }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setViewMode: (mode) => set({ viewMode: mode }),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),

  updateTask: (id, data) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
      selectedTask:
        state.selectedTask?.id === id
          ? { ...state.selectedTask, ...data }
          : state.selectedTask,
    })),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTask:
        state.selectedTask?.id === id ? null : state.selectedTask,
    })),

  get filteredTasks(): Task[] {
    const { tasks, filters } = get();
    return tasks.filter((task) => {
      if (
        filters.priority &&
        task.priority !== filters.priority
      )
        return false;
      if (
        filters.assignee &&
        !task.assignments.some((a) => a.id === filters.assignee)
      )
        return false;
      if (filters.status && task.status !== filters.status)
        return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !task.title.toLowerCase().includes(q) &&
          !task.description?.toLowerCase().includes(q)
        )
          return false;
      }
      if (filters.labels && filters.labels.length > 0) {
        if (
          !task.labels.some((l) => filters.labels!.includes(l.name))
        )
          return false;
      }
      return true;
    });
  },
}));
