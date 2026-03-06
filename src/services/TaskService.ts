import { supabase } from "@/integrations/supabase/client";
import type { 
  Task, 
  TaskSummary, 
  TaskComment, 
  TaskStats, 
  CreateTaskDTO, 
  UpdateTaskDTO, 
  CreateTaskCommentDTO,
  TaskPriority,
  TaskStatus
} from "@/types/database";

// ─────────────────────────────────────────────────────────────
// TASK SERVICE
// ─────────────────────────────────────────────────────────────

export interface TaskFilters {
  assigned_to?: string;
  status?: string;
  priority?: string;
  due_date_from?: string;
  due_date_to?: string;
  student_id?: string;
  search?: string;
}

export const TaskService = {
  // Get all tasks (with optional filters)
  async getAll(filters?: TaskFilters): Promise<TaskSummary[]> {
    let query = supabase
      .from("task_summary")
      .select("*")
      .order("due_date", { ascending: true });

    // Apply filters
    if (filters?.assigned_to) {
      query = query.eq("assigned_to_user_id", filters.assigned_to);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.priority) {
      query = query.eq("priority", filters.priority);
    }
    if (filters?.due_date_from) {
      query = query.gte("due_date", filters.due_date_from);
    }
    if (filters?.due_date_to) {
      query = query.lte("due_date", filters.due_date_to);
    }
    if (filters?.student_id) {
      query = query.eq("related_student_id", filters.student_id);
    }
    if (filters?.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as TaskSummary[];
  },

  // Get task by ID
  async getById(id: string): Promise<TaskSummary | null> {
    const { data, error } = await supabase
      .from("task_summary")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as TaskSummary;
  },

  // Get my tasks (tasks assigned to current user)
  async getMyTasks(): Promise<TaskSummary[]> {
    const { data, error } = await supabase
      .from("task_summary")
      .select("*")
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true });

    if (error) throw error;
    return (data || []) as TaskSummary[];
  },

  // Get overdue tasks
  async getOverdueTasks(): Promise<TaskSummary[]> {
    const { data, error } = await supabase
      .from("task_summary")
      .select("*")
      .eq("is_overdue", true)
      .order("due_date", { ascending: true });

    if (error) throw error;
    return (data || []) as TaskSummary[];
  },

  // Get high priority tasks
  async getHighPriorityTasks(): Promise<TaskSummary[]> {
    const { data, error } = await supabase
      .from("task_summary")
      .select("*")
      .eq("priority", "high")
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true });

    if (error) throw error;
    return (data || []) as TaskSummary[];
  },

  // Get tasks due today
  async getTasksDueToday(): Promise<TaskSummary[]> {
    const { data, error } = await supabase
      .from("task_summary")
      .select("*")
      .eq("is_due_today", true)
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true });

    if (error) throw error;
    return (data || []) as TaskSummary[];
  },

  // Create task
  async create(task: CreateTaskDTO): Promise<Task> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const payload = {
      title: task.title,
      description: task.description || null,
      assigned_to_user_id: task.assigned_to_user_id,
      assigned_by_user_id: user.user.id,
      related_student_id: task.related_student_id || null,
      related_batch_id: task.related_batch_id || null,
      related_fee_id: task.related_fee_id || null,
      priority: task.priority || "medium",
      status: task.status || "pending",
      due_date: task.due_date,
      reminder_date: task.reminder_date || null,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  // Update task
  async update(task: UpdateTaskDTO): Promise<Task> {
    const { id, ...payload } = task;
    
    const { data, error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  // Update task status
  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  // Delete task
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Get task statistics
  async getStats(): Promise<TaskStats> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    // Get counts manually since RPC might not be available
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("status, priority, due_date")
      .eq("assigned_to_user_id", user.user.id);

    if (error) throw error;

    const today = new Date().toISOString().split("T")[0];
    const stats: TaskStats = {
      total_assigned: tasks?.length || 0,
      pending: tasks?.filter(t => t.status === "pending").length || 0,
      in_progress: tasks?.filter(t => t.status === "in_progress").length || 0,
      completed: tasks?.filter(t => t.status === "completed").length || 0,
      overdue: tasks?.filter(t => t.status !== "completed" && t.status !== "cancelled" && t.due_date < today).length || 0,
      high_priority: tasks?.filter(t => t.priority === "high" && t.status !== "completed" && t.status !== "cancelled").length || 0,
      due_today: tasks?.filter(t => t.status !== "completed" && t.status !== "cancelled" && t.due_date === today).length || 0,
    };

    return stats;
  },

  // Create follow-up task from fee
  async createFollowUpFromFee(feeId: string, studentId: string, title?: string, description?: string): Promise<Task> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    // Get fee details
    const { data: fee, error: feeError } = await supabase
      .from("fees")
      .select("*, students(full_name)")
      .eq("id", feeId)
      .single();

    if (feeError) throw feeError;

    const taskTitle = title || `Fee Follow-up: ${(fee as any).students?.full_name || "Student"}`;
    const taskDescription = description || `Follow up on pending fee of ₹${(fee as any).amount} due on ${(fee as any).due_date}.`;

    return this.create({
      title: taskTitle,
      description: taskDescription,
      assigned_to_user_id: user.user.id, // Assign to self by default
      related_student_id: studentId,
      related_fee_id: feeId,
      priority: "high",
      due_date: new Date().toISOString().split("T")[0], // Due today
    });
  },

  // ─────────────────────────────────────────────────────────────
  // TASK COMMENTS
  // ─────────────────────────────────────────────────────────────

  // Get comments for a task
  async getComments(taskId: string): Promise<(TaskComment & { user_name?: string })[]> {
    const { data, error } = await supabase
      .from("task_comments")
      .select("*, user_profiles(full_name)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map((c: any) => ({
      ...c,
      user_name: c.user_profiles?.full_name || "Unknown",
    }));
  },

  // Add comment to task
  async addComment(comment: CreateTaskCommentDTO): Promise<TaskComment> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("task_comments")
      .insert({
        task_id: comment.task_id,
        user_id: user.user.id,
        comment: comment.comment,
      })
      .select()
      .single();

    if (error) throw error;
    return data as TaskComment;
  },

  // Delete comment
  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from("task_comments")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
