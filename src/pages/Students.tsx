import { useState } from "react";
import { GraduationCap, Pencil, Trash2 } from "lucide-react";
import DataPage from "@/components/shared/DataPage";
import DataTable from "@/components/shared/DataTable";
import EntityDialog, { FormField } from "@/components/shared/EntityDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useStudents, useUpsertStudent, useDeleteStudent } from "@/hooks/useCrudHooks";

const fields: FormField[] = [
  { key: "full_name", label: "Full Name", required: true, placeholder: "Enter full name" },
  { key: "email", label: "Email", type: "email", placeholder: "student@example.com" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "+91 9876543210" },
  { key: "status", label: "Status", type: "select", options: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "alumni", label: "Alumni" },
  ]},
];

export default function Students() {
  const { data: students = [], isLoading } = useStudents();
  const upsert = useUpsertStudent();
  const remove = useDeleteStudent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const columns = [
    { key: "full_name", label: "Name" },
    { key: "email", label: "Email", render: (s: any) => s.email || "—" },
    { key: "phone", label: "Phone", render: (s: any) => s.phone || "—" },
    { key: "status", label: "Status", render: (s: any) => <StatusBadge status={s.status} /> },
    { key: "joined_at", label: "Joined", render: (s: any) => new Date(s.joined_at).toLocaleDateString() },
    { key: "actions", label: "Actions", render: (s: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setDialogOpen(true); }}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this student?")) remove.mutate(s.id); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    )},
  ];

  return (
    <DataPage
      title="Student Management"
      subtitle="Manage all enrolled students"
      icon={GraduationCap}
      addLabel="Add Student"
      onAdd={() => { setEditing(null); setDialogOpen(true); }}
    >
      <DataTable columns={columns} data={students} loading={isLoading} emptyMessage="No students yet. Click 'Add Student' to get started." />
      <EntityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Student" : "Add Student"}
        fields={fields}
        initialData={editing}
        loading={upsert.isPending}
        onSubmit={(data) => upsert.mutate(data as any, { onSuccess: () => setDialogOpen(false) })}
      />
    </DataPage>
  );
}
