import {
  GraduationCap,
  Users,
  Layers,
  DollarSign,
  TrendingUp,
  CalendarCheck,
  Loader2,
  CheckSquare,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useCourses, useMyTasks, useOverdueTasks, useUpdateTaskStatus } from "@/hooks/useCrudHooks";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LeadService } from "@/services/LeadService";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: metrics, isLoading, error } = useDashboardMetrics();
  const { data: courses = [] } = useCourses();
  const { data: myTasks = [], isLoading: tasksLoading } = useMyTasks();
  const { data: overdueTasks = [] } = useOverdueTasks();
  const updateStatus = useUpdateTaskStatus();

  // Lead stats query
  const { data: leadStats } = useQuery({
    queryKey: ["lead-stats-dashboard"],
    queryFn: () => LeadService.getStats(),
  });

  const pendingTasks = myTasks.filter(
    (t: any) => t.status !== "completed" && t.status !== "cancelled"
  );

  const handleStatusChange = (taskId: string, newStatus: "pending" | "in_progress" | "completed" | "cancelled") => {
    updateStatus.mutate({ id: taskId, status: newStatus });
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back! Here's your organization at a glance.
            {isLoading && <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load metrics. Please ensure you're signed in.
        </div>
      )}

      {/* Key Metrics - Essential Stats Only */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Students"
          value={metrics?.total_students ?? 0}
          icon={GraduationCap}
          color="primary"
        />
        <StatCard
          title="Active Batches"
          value={metrics?.active_batches ?? 0}
          icon={Layers}
          color="success"
        />
        <StatCard
          title="Today's Classes"
          value={metrics?.todays_classes ?? 0}
          icon={CalendarCheck}
          color="info"
        />
        <StatCard
          title="Pending Fees"
          value={`₹${(metrics?.pending_fees ?? 0).toLocaleString()}`}
          icon={DollarSign}
          color="warning"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Section - Combined */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              My Tasks
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/tasks")}>
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : pendingTasks.length === 0 && overdueTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Overdue Tasks First */}
                {overdueTasks.slice(0, 2).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20 cursor-pointer hover:bg-destructive/10 transition-colors"
                    onClick={() => navigate("/tasks")}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                        <p className="font-medium text-sm truncate">{task.title}</p>
                      </div>
                      <p className="text-xs text-destructive mt-1 ml-6">Overdue</p>
                    </div>
                  </div>
                ))}

                {/* Pending Tasks */}
                {pendingTasks.slice(0, 4).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                    onClick={() => navigate("/tasks")}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3" onClick={(e) => e.stopPropagation()}>
                      {task.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleStatusChange(task.id, "in_progress")}
                        >
                          Start
                        </Button>
                      )}
                      {task.status === "in_progress" && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleStatusChange(task.id, "completed")}
                        >
                          Done
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-lg">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.monthly_revenue ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Teachers</span>
              </div>
              <p className="text-2xl font-heading font-bold">{metrics?.total_teachers ?? 0}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Collected</span>
              </div>
              <p className="text-2xl font-heading font-bold text-success">
                ₹{(metrics?.total_collected ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">In Pipeline</span>
              </div>
              <p className="text-2xl font-heading font-bold">{leadStats?.in_pipeline ?? 0}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Overdue</span>
              </div>
              <p className="text-2xl font-heading font-bold text-destructive">
                ₹{(metrics?.overdue_fees ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Growth Chart - Full Width */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-lg">Enrollment Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.monthly_enrollment ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                <Tooltip formatter={(value: number) => [value, "Students"]} />
                <Area
                  type="monotone"
                  dataKey="students"
                  stroke="hsl(228, 76%, 59%)"
                  fill="hsl(228, 76%, 59%)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
