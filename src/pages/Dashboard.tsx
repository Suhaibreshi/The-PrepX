import {
  GraduationCap,
  Users,
  UserCog,
  Layers,
  DollarSign,
  ClipboardList,
  TrendingUp,
  CalendarCheck,
  Loader2,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

const CHART_COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(0, 72%, 51%)",
  "hsl(38, 92%, 50%)",
];

export default function Dashboard() {
  const { data: metrics, isLoading, error } = useDashboardMetrics();

  const attendanceData = metrics
    ? [
        { name: "Present", value: metrics.todays_attendance.present },
        { name: "Absent", value: metrics.todays_attendance.absent },
        { name: "Late", value: metrics.todays_attendance.late },
      ]
    : [];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back! Here's your organization overview.
            {isLoading && <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load metrics. Please ensure you're signed in.
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={metrics?.total_students ?? 0} icon={GraduationCap} color="primary" />
        <StatCard title="Total Teachers" value={metrics?.total_teachers ?? 0} icon={UserCog} color="info" />
        <StatCard title="Active Batches" value={metrics?.active_batches ?? 0} icon={Layers} color="success" />
        <StatCard title="Pending Fees" value={`₹${metrics?.pending_fees?.toLocaleString() ?? 0}`} icon={DollarSign} color="warning" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Classes" value={metrics?.todays_classes ?? 0} icon={CalendarCheck} color="primary" />
        <StatCard title="Upcoming Exams" value={metrics?.upcoming_exams ?? 0} icon={ClipboardList} color="destructive" />
        <StatCard title="Total Collected" value={`₹${metrics?.total_collected?.toLocaleString() ?? 0}`} icon={TrendingUp} color="success" />
        <StatCard title="Total Parents" value={metrics?.total_parents ?? 0} icon={Users} color="info" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Enrollment Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics?.monthly_enrollment ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                    <Tooltip />
                    <Area type="monotone" dataKey="students" stroke="hsl(228, 76%, 59%)" fill="hsl(228, 76%, 59%)" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.monthly_revenue ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="hsl(142, 71%, 45%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Today's Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64 flex items-center justify-center">
                {attendanceData.every((d) => d.value === 0) ? (
                  <p className="text-sm text-muted-foreground">No attendance marked today.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                        {attendanceData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-sm text-muted-foreground">Total Collected</span>
                  <span className="font-heading font-bold text-success">₹{metrics?.total_collected?.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-heading font-bold text-warning">₹{metrics?.pending_fees?.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <span className="font-heading font-bold text-destructive">₹{metrics?.overdue_fees?.toLocaleString() ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
