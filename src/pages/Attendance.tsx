import { useState, useMemo } from "react";
import { CalendarCheck, Pencil, Trash2, Users } from "lucide-react";
import DataPage from "@/components/shared/DataPage";
import DataTable from "@/components/shared/DataTable";
import EntityDialog, { FormField } from "@/components/shared/EntityDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  useAttendance,
  useAttendanceSummary,
  useUpsertAttendance,
  useDeleteAttendance,
  useBatches,
  useStudents,
} from "@/hooks/useCrudHooks";

export default function Attendance() {
  const { data: batches = [] } = useBatches();
  const { data: students = [] } = useStudents();
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: attendance = [], isLoading } = useAttendance(
    selectedBatch || undefined,
    undefined
  );
  const { data: summary = [] } = useAttendanceSummary(selectedBatch || undefined);
  const upsert = useUpsertAttendance();
  const remove = useDeleteAttendance();

  const fields: FormField[] = useMemo(() => [
    {
      key: "student_id", label: "Student", required: true, type: "select",
      options: (students as any[]).map((s) => ({ value: s.id, label: s.full_name })),
    },
    {
      key: "batch_id", label: "Batch", required: true, type: "select",
      options: (batches as any[]).map((b) => ({ value: b.id, label: b.name })),
    },
    { key: "date", label: "Date", type: "date" },
    {
      key: "status", label: "Status", type: "select",
      options: [
        { value: "present", label: "Present" },
        { value: "absent", label: "Absent" },
        { value: "late", label: "Late" },
      ],
    },
    { key: "notes", label: "Notes", type: "textarea", placeholder: "Optional notes..." },
  ], [students, batches]);

  const columns = [
    {
      key: "date", label: "Date",
      render: (a: any) => new Date(a.date).toLocaleDateString(),
    },
    {
      key: "student", label: "Student",
      render: (a: any) => a.students?.full_name || "—",
    },
    {
      key: "batch", label: "Batch",
      render: (a: any) => a.batches?.name || "—",
    },
    {
      key: "status", label: "Status",
      render: (a: any) => <StatusBadge status={a.status} />,
    },
    {
      key: "notes", label: "Notes",
      render: (a: any) => a.notes || "—",
    },
    {
      key: "marked_at", label: "Marked At",
      render: (a: any) => new Date(a.marked_at).toLocaleTimeString(),
    },
    {
      key: "actions", label: "Actions",
      render: (a: any) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setDialogOpen(true); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={() => { if (confirm("Delete this record?")) remove.mutate(a.id); }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const summaryColumns = [
    { key: "date", label: "Date", render: (s: any) => new Date(s.date).toLocaleDateString() },
    { key: "batch_name", label: "Batch" },
    { key: "total", label: "Total" },
    { key: "present", label: "Present" },
    { key: "absent", label: "Absent" },
    { key: "late", label: "Late" },
    {
      key: "attendance_pct", label: "Attendance %",
      render: (s: any) => `${s.attendance_pct ?? 0}%`,
    },
  ];

  return (
    <DataPage
      title="Attendance System"
      subtitle="Track and manage daily attendance"
      icon={CalendarCheck}
      addLabel="Mark Attendance"
      onAdd={() => { setEditing(null); setDialogOpen(true); }}
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="w-56">
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger>
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Batches</SelectItem>
              {(batches as any[]).map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Summary Cards */}
      {summary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {(() => {
            const today = (summary as any[]).find(
              (s) => s.date === selectedDate
            );
            if (!today) return null;
            return (
              <>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{today.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold text-success">{today.present}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold text-destructive">{today.absent}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Attendance %</p>
                    <p className="text-2xl font-bold">{today.attendance_pct ?? 0}%</p>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>
      )}

      {/* Summary Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Daily Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={summaryColumns}
            data={summary as any[]}
            loading={isLoading}
            emptyMessage="No attendance summary available."
          />
        </CardContent>
      </Card>

      {/* Individual Records */}
      <DataTable
        columns={columns}
        data={attendance as any[]}
        loading={isLoading}
        emptyMessage="No attendance records. Click 'Mark Attendance' to get started."
      />

      <EntityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Attendance" : "Mark Attendance"}
        fields={fields}
        initialData={editing}
        loading={upsert.isPending}
        onSubmit={(data) =>
          upsert.mutate(data as any, { onSuccess: () => setDialogOpen(false) })
        }
      />
    </DataPage>
  );
}
