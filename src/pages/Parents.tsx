import { useState } from "react";
import { Users, Pencil, Trash2 } from "lucide-react";
import DataPage from "@/components/shared/DataPage";
import DataTable from "@/components/shared/DataTable";
import EntityDialog, { FormField } from "@/components/shared/EntityDialog";
import { Button } from "@/components/ui/button";
import { useParents, useUpsertParent, useDeleteParent } from "@/hooks/useCrudHooks";

const fields: FormField[] = [
  { key: "full_name", label: "Full Name", required: true, placeholder: "Enter full name" },
  { key: "email", label: "Email", type: "email", placeholder: "parent@example.com" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "+91 9876543210" },
];

export default function Parents() {
  const { data: parents = [], isLoading } = useParents();
  const upsert = useUpsertParent();
  const remove = useDeleteParent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const columns = [
    { key: "full_name", label: "Name" },
    { key: "email", label: "Email", render: (p: any) => p.email || "—" },
    { key: "phone", label: "Phone", render: (p: any) => p.phone || "—" },
    { key: "created_at", label: "Added", render: (p: any) => new Date(p.created_at).toLocaleDateString() },
    { key: "actions", label: "Actions", render: (p: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setDialogOpen(true); }}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this parent?")) remove.mutate(p.id); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    )},
  ];

  return (
    <DataPage title="Parent Management" subtitle="Manage parent accounts and communication" icon={Users} addLabel="Add Parent" onAdd={() => { setEditing(null); setDialogOpen(true); }}>
      <DataTable columns={columns} data={parents} loading={isLoading} emptyMessage="No parents yet. Click 'Add Parent' to get started." />
      <EntityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Parent" : "Add Parent"}
        fields={fields}
        initialData={editing}
        loading={upsert.isPending}
        onSubmit={(data) => upsert.mutate(data as any, { onSuccess: () => setDialogOpen(false) })}
      />
    </DataPage>
  );
}
