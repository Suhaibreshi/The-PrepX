import { useState, useMemo } from "react";
import { Layers, Pencil, Trash2 } from "lucide-react";
import DataPage from "@/components/shared/DataPage";
import DataTable from "@/components/shared/DataTable";
import EntityDialog, { FormField } from "@/components/shared/EntityDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useBatches, useUpsertBatch, useDeleteBatch, useTeachers, useCourses } from "@/hooks/useCrudHooks";

export default function Batches() {
  const { data: batches = [], isLoading } = useBatches();
  const { data: teachers = [] } = useTeachers();
  const { data: courses = [] } = useCourses();
  const upsert = useUpsertBatch();
  const remove = useDeleteBatch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fields: FormField[] = useMemo(() => [
    { key: "name", label: "Batch Name", required: true, placeholder: "e.g. Batch A - 2025" },
    { key: "schedule", label: "Schedule", placeholder: "e.g. Mon, Wed, Fri 10:00 AM" },
    { key: "teacher_id", label: "Teacher", type: "select" as const, options: teachers.map((t: any) => ({ value: t.id, label: t.full_name })) },
    { key: "course_id", label: "Course", type: "select" as const, options: courses.map((c: any) => ({ value: c.id, label: c.name })) },
    { key: "start_date", label: "Start Date", type: "date" as const },
    { key: "end_date", label: "End Date", type: "date" as const },
    { key: "status", label: "Status", type: "select" as const, options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ]},
  ], [teachers, courses]);

  const columns = [
    { key: "name", label: "Batch Name" },
    { key: "course", label: "Course", render: (b: any) => b.courses?.name || "—" },
    { key: "teacher", label: "Teacher", render: (b: any) => b.teachers?.full_name || "—" },
    { key: "schedule", label: "Schedule", render: (b: any) => b.schedule || "—" },
    { key: "status", label: "Status", render: (b: any) => <StatusBadge status={b.status} /> },
    { key: "actions", label: "Actions", render: (b: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => { setEditing(b); setDialogOpen(true); }}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this batch?")) remove.mutate(b.id); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    )},
  ];

  return (
    <DataPage title="Batch Management" subtitle="Manage batches, classes and timetables" icon={Layers} addLabel="Create Batch" onAdd={() => { setEditing(null); setDialogOpen(true); }}>
      <DataTable columns={columns} data={batches} loading={isLoading} emptyMessage="No batches yet. Click 'Create Batch' to get started." />
      <EntityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Batch" : "Create Batch"}
        fields={fields}
        initialData={editing}
        loading={upsert.isPending}
        onSubmit={(data) => upsert.mutate(data as any, { onSuccess: () => setDialogOpen(false) })}
      />
    </DataPage>
  );
}
