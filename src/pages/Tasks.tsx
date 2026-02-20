import { useState, useMemo } from "react";
import {
  CheckSquare,
  Pencil,
  Trash2,
  Plus,
  Filter,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import DataPage from "@/components/shared/DataPage";
import DataTable from "@/components/shared/DataTable";
import EntityDialog, { FormField } from "@/components/shared/EntityDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  useTasks,
  useUpsertTask,
  useDeleteTask,
  useUpdateTaskStatus,
  useTaskStats,
  useUserProfiles,
  useStudents,
  useBatches,
  useTaskComments,
  useAddTaskComment,
} from "@/hooks/useCrudHooks";
import type { TaskSummary } from "@/types/database";

// Priority Badge Component
function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-700 border-gray-200",
    medium: "bg-blue-100 text-blue-700 border-blue-200",
    high: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <Badge variant="outline" className={colors[priority] || colors.medium}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

// Task Status Badge Component
function TaskStatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-muted text-muted-foreground border-muted",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <Badge variant="outline" className={statusStyles[status] || statusStyles.pending}>
      {labels[status] || status}
    </Badge>
  );
}

// Task Detail Panel Component
function TaskDetailPanel({
  task,
  onClose,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  task: TaskSummary;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: "pending" | "in_progress" | "completed" | "cancelled") => void;
  onDelete: () => void;
}) {
  const [newComment, setNewComment] = useState("");
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const { data: comments = [], isLoading: commentsLoading } = useTaskComments(task.id);
  const addComment = useAddTaskComment();

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment.mutate({ taskId: task.id, comment: newComment.trim() }, {
      onSuccess: () => setNewComment(""),
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l shadow-lg z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Task Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {/* Task Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold">{task.title}</h3>
            {task.description && (
              <p className="text-muted-foreground mt-2">{task.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <TaskStatusBadge status={task.status || "pending"} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <PriorityBadge priority={task.priority || "medium"} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
                {task.is_overdue && (
                  <span className="ml-2 text-red-500 text-xs">(Overdue)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned To</p>
              <p className="font-medium">{task.assigned_to_name || "—"}</p>
            </div>
          </div>

          {/* Related Entities */}
          {(task.student_name || task.batch_name || task.related_fee_id) && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Related To</p>
              <div className="space-y-1">
                {task.student_name && (
                  <p className="text-sm">
                    <span className="font-medium">Student:</span> {task.student_name}
                  </p>
                )}
                {task.batch_name && (
                  <p className="text-sm">
                    <span className="font-medium">Batch:</span> {task.batch_name}
                  </p>
                )}
                {task.related_fee_id && task.fee_amount && (
                  <p className="text-sm">
                    <span className="font-medium">Fee:</span> ₹{task.fee_amount}
                    {task.fee_due_date && ` (Due: ${new Date(task.fee_due_date).toLocaleDateString()})`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
            {task.status !== "completed" && (
              <>
                {task.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange("in_progress")}
                  >
                    Start Progress
                  </Button>
                )}
                {task.status === "in_progress" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onStatusChange("completed")}
                  >
                    <CheckSquare className="h-4 w-4 mr-1" /> Complete
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => {
                if (confirm("Delete this task?")) onDelete();
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>

          {/* Comments Section */}
          <div className="border-t pt-4">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => setCommentsExpanded(!commentsExpanded)}
            >
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({comments.length})
              </h4>
              {commentsExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {commentsExpanded && (
              <div className="mt-4 space-y-4">
                {/* Add Comment */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addComment.isPending}
                  >
                    Add
                  </Button>
                </div>

                {/* Comments List */}
                {commentsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{comment.user_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [filters, setFilters] = useState<{
    status?: string;
    priority?: string;
    assigned_to?: string;
    search?: string;
  }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: tasks = [], isLoading } = useTasks(filters);
  const { data: stats } = useTaskStats();
  const { data: users = [] } = useUserProfiles();
  const { data: students = [] } = useStudents();
  const { data: batches = [] } = useBatches();

  const upsert = useUpsertTask();
  const remove = useDeleteTask();
  const updateStatus = useUpdateTaskStatus();

  // Form fields for create/edit dialog
  const fields: FormField[] = useMemo(
    () => [
      { key: "title", label: "Title", required: true, placeholder: "Task title" },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Task description...",
      },
      {
        key: "assigned_to_user_id",
        label: "Assign To",
        required: true,
        type: "select",
        options: users.map((u: any) => ({
          value: u.id,
          label: `${u.full_name || "Unknown"} (${u.role?.replace("_", " ") || ""})`,
        })),
      },
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ],
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "pending", label: "Pending" },
          { value: "in_progress", label: "In Progress" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ],
      },
      { key: "due_date", label: "Due Date", required: true, type: "date" },
      { key: "reminder_date", label: "Reminder Date", type: "date" },
      {
        key: "related_student_id",
        label: "Related Student",
        type: "select",
        options: students.map((s: any) => ({ value: s.id, label: s.full_name })),
      },
      {
        key: "related_batch_id",
        label: "Related Batch",
        type: "select",
        options: batches.map((b: any) => ({ value: b.id, label: b.name })),
      },
    ],
    [users, students, batches]
  );

  // Table columns
  const columns = [
    {
      key: "title",
      label: "Task",
      render: (t: TaskSummary) => (
        <div>
          <p className="font-medium">{t.title}</p>
          {t.is_overdue && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Overdue
            </span>
          )}
          {t.is_due_today && !t.is_overdue && (
            <span className="text-xs text-orange-500 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Due Today
            </span>
          )}
        </div>
      ),
    },
    {
      key: "assigned_to",
      label: "Assigned To",
      render: (t: TaskSummary) => t.assigned_to_name || "—",
    },
    {
      key: "priority",
      label: "Priority",
      render: (t: TaskSummary) => <PriorityBadge priority={t.priority || "medium"} />,
    },
    {
      key: "status",
      label: "Status",
      render: (t: TaskSummary) => <TaskStatusBadge status={t.status || "pending"} />,
    },
    {
      key: "due_date",
      label: "Due Date",
      render: (t: TaskSummary) =>
        t.due_date ? new Date(t.due_date).toLocaleDateString() : "—",
    },
    {
      key: "related",
      label: "Related To",
      render: (t: TaskSummary) => (
        <div className="text-sm">
          {t.student_name && <p>Student: {t.student_name}</p>}
          {t.batch_name && <p>Batch: {t.batch_name}</p>}
          {!t.student_name && !t.batch_name && "—"}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (t: TaskSummary) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="View Details"
            onClick={() => setSelectedTask(t)}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(t);
              setDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm("Delete this task?")) remove.mutate(t.id!);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const handleStatusChange = (id: string, status: "pending" | "in_progress" | "completed" | "cancelled") => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => {
        setSelectedTask(null);
      },
    });
  };

  return (
    <DataPage
      title="Task Management"
      subtitle="Assign and track internal tasks for staff"
      icon={CheckSquare}
      addLabel="New Task"
      onAdd={() => {
        setEditing(null);
        setDialogOpen(true);
      }}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="My Tasks"
          value={stats?.total_assigned ?? 0}
          icon={CheckSquare}
          color="primary"
        />
        <StatCard
          title="Pending"
          value={stats?.pending ?? 0}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Overdue"
          value={stats?.overdue ?? 0}
          icon={AlertTriangle}
          color="destructive"
        />
        <StatCard
          title="High Priority"
          value={stats?.high_priority ?? 0}
          icon={AlertTriangle}
          color="destructive"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Search</label>
                <Input
                  placeholder="Search tasks..."
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value || undefined }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, status: v === "all" ? undefined : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <Select
                  value={filters.priority || "all"}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, priority: v === "all" ? undefined : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Assigned To</label>
                <Select
                  value={filters.assigned_to || "all"}
                  onValueChange={(v) =>
                    setFilters((f) => ({
                      ...f,
                      assigned_to: v === "all" ? undefined : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tasks Table */}
      <DataTable
        columns={columns}
        data={tasks}
        loading={isLoading}
        emptyMessage="No tasks found. Click 'New Task' to create one."
      />

      {/* Create/Edit Dialog */}
      <EntityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Task" : "New Task"}
        fields={fields}
        initialData={editing}
        loading={upsert.isPending}
        onSubmit={(data) =>
          upsert.mutate(data as any, { onSuccess: () => setDialogOpen(false) })
        }
      />

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={() => {
            setEditing(selectedTask);
            setDialogOpen(true);
            setSelectedTask(null);
          }}
          onStatusChange={(status) => handleStatusChange(selectedTask.id!, status)}
          onDelete={() => {
            remove.mutate(selectedTask.id!);
            setSelectedTask(null);
          }}
        />
      )}
    </DataPage>
  );
}
