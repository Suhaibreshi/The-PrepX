import { Badge } from "@/components/ui/badge";

type StatusType = "active" | "inactive" | "pending" | "paid" | "overdue" | "alumni";

const statusStyles: Record<StatusType, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-muted",
  pending: "bg-warning/10 text-warning border-warning/20",
  paid: "bg-success/10 text-success border-success/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  alumni: "bg-info/10 text-info border-info/20",
};

export default function StatusBadge({ status }: { status: StatusType }) {
  return (
    <Badge variant="outline" className={`capitalize ${statusStyles[status] || ""}`}>
      {status}
    </Badge>
  );
}
