import { useState, useMemo } from "react";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import DataPage from "@/components/shared/DataPage";
import DataTable from "@/components/shared/DataTable";
import EntityDialog, { FormField } from "@/components/shared/EntityDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useCourses, useUpsertCourse, useDeleteCourse } from "@/hooks/useCrudHooks";

export default function Courses() {
  const { data: courses = [], isLoading } = useCourses();
  const upsert = useUpsertCourse();
  const remove = useDeleteCourse();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fields: FormField[] = useMemo(() => [
    { key: "name", label: "Course Name", required: true, placeholder: "e.g. Mathematics Foundation" },
    { key: "description", label: "Description", type: "textarea" as const, placeholder: "Course description..." },
    { key: "duration_weeks", label: "Duration (Weeks)", type: "number" as const, placeholder: "e.g. 12" },
    { key: "base_fee", label: "Base Fee", type: "number" as const, placeholder: "e.g. 5000" },
    { key: "is_active", label: "Status", type: "select" as const, options: [
      { value: "true", label: "Active" },
      { value: "false", label: "Inactive" },
    ]},
  ], []);

  const columns = [
    { key: "name", label: "Course Name" },
    { key: "description", label: "Description", render: (c: any) => c.description || "—" },
    { key: "duration_weeks", label: "Duration", render: (c: any) => c.duration_weeks ? `${c.duration_weeks} weeks` : "—" },
    { key: "base_fee", label: "Base Fee", render: (c: any) => c.base_fee ? `₹${c.base_fee.toLocaleString()}` : "—" },
    { key: "is_active", label: "Status", render: (c: any) => <StatusBadge status={c.is_active ? "active" : "inactive"} /> },
    { key: "actions", label: "Actions", render: (c: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setDialogOpen(true); }}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this course?")) remove.mutate(c.id); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    )},
  ];

  const handleSubmit = (data: any) => {
    const payload = {
      ...data,
      duration_weeks: data.duration_weeks ? parseInt(data.duration_weeks) : null,
      base_fee: data.base_fee ? parseFloat(data.base_fee) : null,
      is_active: data.is_active === "true" || data.is_active === true,
    };
    upsert.mutate(payload, { onSuccess: () => setDialogOpen(false) });
  };

  return (
    <DataPage title="Course Management" subtitle="Manage courses, curriculum, and pricing" icon={BookOpen} addLabel="Add Course" onAdd={() => { setEditing(null); setDialogOpen(true); }}>
      <DataTable columns={columns} data={courses} loading={isLoading} emptyMessage="No courses yet. Click 'Add Course' to get started." />
      <EntityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Course" : "Add Course"}
        fields={fields}
        initialData={editing}
        loading={upsert.isPending}
        onSubmit={handleSubmit}
      />
    </DataPage>
  );
}
