import { useState, useMemo } from "react";
import { ClipboardList, Pencil, Trash2 } from "lucide-react";
import DataPage from "@/components/shared/DataPage";
import DataTable from "@/components/shared/DataTable";
import EntityDialog, { FormField } from "@/components/shared/EntityDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useExams, useUpsertExam, useDeleteExam, useBatches } from "@/hooks/useCrudHooks";

export default function Exams() {
  const { data: exams = [], isLoading } = useExams();
  const { data: batches = [] } = useBatches();
  const upsert = useUpsertExam();
  const remove = useDeleteExam();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fields: FormField[] = useMemo(() => [
    { key: "title", label: "Exam Title", required: true, placeholder: "e.g. Unit Test 1" },
    {
      key: "batch_id", label: "Batch", type: "select",
      options: (batches as any[]).map((b) => ({ value: b.id, label: b.name })),
    },
    { key: "exam_date", label: "Exam Date", type: "date" },
    { key: "total_marks", label: "Total Marks", type: "number", placeholder: "100" },
    { key: "passing_marks", label: "Passing Marks", type: "number", placeholder: "40" },
    { key: "duration_minutes", label: "Duration (minutes)", type: "number", placeholder: "60" },
    {
      key: "exam_type", label: "Exam Type", type: "select",
      options: [
        { value: "MCQ", label: "MCQ" },
        { value: "written", label: "Written" },
        { value: "practical", label: "Practical" },
        { value: "oral", label: "Oral" },
        { value: "online", label: "Online" },
        { value: "mock", label: "Mock Test" },
      ],
    },
    {
      key: "status", label: "Status", type: "select",
      options: [
        { value: "upcoming", label: "Upcoming" },
        { value: "ongoing", label: "Ongoing" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    { key: "instructions", label: "Instructions", type: "textarea", placeholder: "Exam instructions..." },
  ], [batches]);

  const columns = [
    { key: "title", label: "Exam Title" },
    { key: "batch", label: "Batch", render: (e: any) => e.batches?.name || "—" },
    {
      key: "exam_date", label: "Date",
      render: (e: any) => e.exam_date ? new Date(e.exam_date).toLocaleDateString() : "—",
    },
    { key: "exam_type", label: "Type", render: (e: any) => e.exam_type || "—" },
    {
      key: "total_marks", label: "Marks",
      render: (e: any) => `${e.total_marks}${e.passing_marks ? ` (Pass: ${e.passing_marks})` : ""}`,
    },
    {
      key: "duration_minutes", label: "Duration",
      render: (e: any) => e.duration_minutes ? `${e.duration_minutes} min` : "—",
    },
    {
      key: "status", label: "Status",
      render: (e: any) => <StatusBadge status={e.status || "upcoming"} />,
    },
    {
      key: "actions", label: "Actions",
      render: (e: any) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setEditing(e); setDialogOpen(true); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={() => { if (confirm("Delete this exam?")) remove.mutate(e.id); }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataPage
      title="Exam & Test Management"
      subtitle="Create and manage exams, MCQs, and results"
      icon={ClipboardList}
      addLabel="Create Exam"
      onAdd={() => { setEditing(null); setDialogOpen(true); }}
    >
      <DataTable
        columns={columns}
        data={exams}
        loading={isLoading}
        emptyMessage="No exams yet. Click 'Create Exam' to get started."
      />
      <EntityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Exam" : "Create Exam"}
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
