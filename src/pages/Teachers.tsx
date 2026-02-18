import { useState } from "react";
import { UserCog, Pencil, Trash2 } from "lucide-react";
import DataPage from "@/components/shared/DataPage";
import DataTable from "@/components/shared/DataTable";
import EntityDialog, { FormField } from "@/components/shared/EntityDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useTeachers, useUpsertTeacher, useDeleteTeacher } from "@/hooks/useCrudHooks";

const fields: FormField[] = [
  { key: "full_name", label: "Full Name", required: true, placeholder: "Enter full name" },
  { key: "email", label: "Email", type: "email", placeholder: "teacher@example.com" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "+91 9876543210" },
  { key: "subject", label: "Subject", placeholder: "e.g. Mathematics" },
  { key: "status", label: "Status", type: "select", options: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ]},
];

export default function Teachers() {
  const { data: teachers = [], isLoading } = useTeachers();
  const upsert = useUpsertTeacher();
  const remove = useDeleteTeacher();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const columns = [
    { key: "full_name", label: "Name" },
    { key: "email", label: "Email", render: (t: any) => t.email || "—" },
    { key: "phone", label: "Phone", render: (t: any) => t.phone || "—" },
    { key: "subject", label: "Subject", render: (t: any) => t.subject || "—" },
    { key: "status", label: "Status", render: (t: any) => <StatusBadge status={t.status} /> },
    { key: "actions", label: "Actions", render: (t: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setDialogOpen(true); }}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this teacher?")) remove.mutate(t.id); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    )},
  ];

  return (
    <DataPage title="Teacher Management" subtitle="Manage teaching staff" icon={UserCog} addLabel="Add Teacher" onAdd={() => { setEditing(null); setDialogOpen(true); }}>
      <DataTable columns={columns} data={teachers} loading={isLoading} emptyMessage="No teachers yet. Click 'Add Teacher' to get started." />
      <EntityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Teacher" : "Add Teacher"}
        fields={fields}
        initialData={editing}
        loading={upsert.isPending}
        onSubmit={(data) => upsert.mutate(data as any, { onSuccess: () => setDialogOpen(false) })}
      />
    </DataPage>
  );
}
