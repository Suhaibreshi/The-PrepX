import { useState, useMemo } from "react";
import { DollarSign, Pencil, Trash2, CheckCircle, TrendingUp, AlertCircle } from "lucide-react";
import DataPage from "@/components/shared/DataPage";
import DataTable from "@/components/shared/DataTable";
import EntityDialog, { FormField } from "@/components/shared/EntityDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { useFees, useUpsertFee, useDeleteFee, useMarkFeesPaid, useStudents, useBatches } from "@/hooks/useCrudHooks";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

export default function Fees() {
  const { data: fees = [], isLoading } = useFees();
  const { data: students = [] } = useStudents();
  const { data: batches = [] } = useBatches();
  const { data: metrics } = useDashboardMetrics();
  const upsert = useUpsertFee();
  const remove = useDeleteFee();
  const markPaid = useMarkFeesPaid();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fields: FormField[] = useMemo(() => [
    {
      key: "student_id", label: "Student", required: true, type: "select",
      options: (students as any[]).map((s) => ({ value: s.id, label: s.full_name })),
    },
    {
      key: "batch_id", label: "Batch", type: "select",
      options: (batches as any[]).map((b) => ({ value: b.id, label: b.name })),
    },
    { key: "amount", label: "Amount (₹)", required: true, type: "number", placeholder: "0.00" },
    { key: "due_date", label: "Due Date", required: true, type: "date" },
    { key: "paid_date", label: "Paid Date", type: "date" },
    {
      key: "status", label: "Status", type: "select",
      options: [
        { value: "pending", label: "Pending" },
        { value: "paid", label: "Paid" },
        { value: "overdue", label: "Overdue" },
      ],
    },
    {
      key: "payment_method", label: "Payment Method", type: "select",
      options: [
        { value: "cash", label: "Cash" },
        { value: "bank_transfer", label: "Bank Transfer" },
        { value: "upi", label: "UPI" },
        { value: "cheque", label: "Cheque" },
        { value: "card", label: "Card" },
        { value: "other", label: "Other" },
      ],
    },
    { key: "transaction_ref", label: "Transaction Reference", placeholder: "UTR / Cheque No." },
    { key: "receipt_number", label: "Receipt Number", placeholder: "RCP-001" },
    { key: "discount", label: "Discount (₹)", type: "number", placeholder: "0" },
    { key: "description", label: "Description", placeholder: "Fee description" },
  ], [students, batches]);

  const columns = [
    {
      key: "student", label: "Student",
      render: (f: any) => f.students?.full_name || "—",
    },
    {
      key: "batch", label: "Batch",
      render: (f: any) => f.batches?.name || "—",
    },
    {
      key: "amount", label: "Amount",
      render: (f: any) => `₹${Number(f.amount).toLocaleString()}`,
    },
    {
      key: "due_date", label: "Due Date",
      render: (f: any) => new Date(f.due_date).toLocaleDateString(),
    },
    {
      key: "paid_date", label: "Paid Date",
      render: (f: any) => f.paid_date ? new Date(f.paid_date).toLocaleDateString() : "—",
    },
    {
      key: "status", label: "Status",
      render: (f: any) => <StatusBadge status={f.status} />,
    },
    {
      key: "payment_method", label: "Method",
      render: (f: any) => f.payment_method || "—",
    },
    {
      key: "actions", label: "Actions",
      render: (f: any) => (
        <div className="flex gap-1">
          {f.status !== "paid" && (
            <Button
              variant="ghost" size="icon"
              title="Mark as Paid"
              onClick={() => markPaid.mutate({ id: f.id })}
            >
              <CheckCircle className="h-4 w-4 text-success" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => { setEditing(f); setDialogOpen(true); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={() => { if (confirm("Delete this fee record?")) remove.mutate(f.id); }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataPage
      title="Fee & Finance"
      subtitle="Manage fee structures, payments, and invoices"
      icon={DollarSign}
      addLabel="Add Fee Entry"
      onAdd={() => { setEditing(null); setDialogOpen(true); }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Collected"
          value={`₹${metrics?.total_collected?.toLocaleString() ?? 0}`}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Pending"
          value={`₹${metrics?.pending_fees?.toLocaleString() ?? 0}`}
          icon={AlertCircle}
          color="warning"
        />
        <StatCard
          title="Overdue"
          value={`₹${metrics?.overdue_fees?.toLocaleString() ?? 0}`}
          icon={AlertCircle}
          color="destructive"
        />
      </div>

      <DataTable
        columns={columns}
        data={fees}
        loading={isLoading}
        emptyMessage="No fee records yet. Click 'Add Fee Entry' to get started."
      />

      <EntityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Fee Record" : "Add Fee Entry"}
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
