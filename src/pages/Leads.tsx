import { useState, useMemo } from "react";
import {
  Users,
  Pencil,
  Trash2,
  Plus,
  Filter,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  AlertCircle,
  Download,
  Kanban,
  List,
  Eye,
} from "lucide-react";
import DataTable from "@/components/shared/DataTable";
import EntityDialog, { FormField } from "@/components/shared/EntityDialog";
import StatCard from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LeadService, type LeadFilters, type LeadPagination } from "@/services/LeadService";
import { useUserProfiles } from "@/hooks/useCrudHooks";
import type { 
  LeadSummary, 
  LeadStage, 
  LeadSource, 
  CreateLeadDTO, 
  UpdateLeadDTO,
  LeadStats,
  ConvertLeadDTO,
} from "@/types/database";
import { useAuth } from "@/hooks/useAuth";

// ─────────────────────────────────────────────────────────────
// LEAD STAGE BADGE COMPONENT
// ─────────────────────────────────────────────────────────────

function LeadStageBadge({ stage }: { stage: LeadStage }) {
  const stageStyles: Record<LeadStage, string> = {
    inquiry: "bg-blue-100 text-blue-700 border-blue-200",
    follow_up: "bg-yellow-100 text-yellow-700 border-yellow-200",
    demo: "bg-purple-100 text-purple-700 border-purple-200",
    converted: "bg-green-100 text-green-700 border-green-200",
    lost: "bg-red-100 text-red-700 border-red-200",
  };

  const labels: Record<LeadStage, string> = {
    inquiry: "Inquiry",
    follow_up: "Follow-up",
    demo: "Demo",
    converted: "Converted",
    lost: "Lost",
  };

  return (
    <Badge variant="outline" className={stageStyles[stage]}>
      {labels[stage]}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────
// LEAD SOURCE BADGE COMPONENT
// ─────────────────────────────────────────────────────────────

function LeadSourceBadge({ source }: { source: LeadSource }) {
  const sourceStyles: Record<LeadSource, string> = {
    "walk-in": "bg-emerald-50 text-emerald-700 border-emerald-200",
    website: "bg-cyan-50 text-cyan-700 border-cyan-200",
    referral: "bg-amber-50 text-amber-700 border-amber-200",
    social_media: "bg-pink-50 text-pink-700 border-pink-200",
    other: "bg-gray-50 text-gray-700 border-gray-200",
  };

  const labels: Record<LeadSource, string> = {
    "walk-in": "Walk-in",
    website: "Website",
    referral: "Referral",
    social_media: "Social Media",
    other: "Other",
  };

  return (
    <Badge variant="outline" className={sourceStyles[source]}>
      {labels[source]}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────
// KANBAN VIEW COMPONENT
// ─────────────────────────────────────────────────────────────

function KanbanView({
  leads,
  onEdit,
  onStageChange,
  onConvert,
  onMarkLost,
  isAdmin,
}: {
  leads: LeadSummary[];
  onEdit: (lead: LeadSummary) => void;
  onStageChange: (id: string, stage: LeadStage) => void;
  onConvert: (lead: LeadSummary) => void;
  onMarkLost: (id: string) => void;
  isAdmin: boolean;
}) {
  const stages: LeadStage[] = ["inquiry", "follow_up", "demo", "converted", "lost"];
  
  const leadsByStage = useMemo(() => {
    const grouped: Record<LeadStage, LeadSummary[]> = {
      inquiry: [],
      follow_up: [],
      demo: [],
      converted: [],
      lost: [],
    };
    leads.forEach((lead) => {
      grouped[lead.stage].push(lead);
    });
    return grouped;
  }, [leads]);

  const stageLabels: Record<LeadStage, string> = {
    inquiry: "Inquiry Received",
    follow_up: "Follow-up Done",
    demo: "Demo Attended",
    converted: "Converted",
    lost: "Lost Lead",
  };

  const stageColors: Record<LeadStage, string> = {
    inquiry: "border-blue-300",
    follow_up: "border-yellow-300",
    demo: "border-purple-300",
    converted: "border-green-300",
    lost: "border-red-300",
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => (
        <div
          key={stage}
          className={`flex-shrink-0 w-72 bg-muted/30 rounded-lg border-t-4 ${stageColors[stage]}`}
        >
          <div className="p-3 border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{stageLabels[stage]}</h3>
              <Badge variant="secondary" className="text-xs">
                {leadsByStage[stage].length}
              </Badge>
            </div>
          </div>
          <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
            {leadsByStage[stage].map((lead) => (
              <Card
                key={lead.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onEdit(lead)}
              >
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {lead.student_name}
                      </h4>
                      {lead.is_overdue_follow_up && (
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="truncate">{lead.phone_number}</span>
                      </div>
                      {lead.course_interested && (
                        <div className="truncate">
                          Course: {lead.course_interested}
                        </div>
                      )}
                      {lead.follow_up_date && stage !== "converted" && stage !== "lost" && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className={lead.is_overdue_follow_up ? "text-red-500" : ""}>
                            {new Date(lead.follow_up_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      <LeadSourceBadge source={lead.lead_source} />
                    </div>

                    {lead.counselor_name && (
                      <div className="text-xs text-muted-foreground">
                        Counselor: {lead.counselor_name}
                      </div>
                    )}

                    {/* Quick Actions */}
                    {stage !== "converted" && stage !== "lost" && (
                      <div className="flex gap-1 pt-2 border-t">
                        {stage === "inquiry" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStageChange(lead.id, "follow_up");
                            }}
                          >
                            Follow-up
                          </Button>
                        )}
                        {stage === "follow_up" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStageChange(lead.id, "demo");
                            }}
                          >
                            Demo
                          </Button>
                        )}
                        {stage === "demo" && isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                onConvert(lead);
                              }}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Convert
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkLost(lead.id);
                              }}
                            >
                              Lost
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {leadsByStage[stage].length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-4">
                No leads
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONVERT LEAD DIALOG COMPONENT
// ─────────────────────────────────────────────────────────────

function ConvertLeadDialog({
  lead,
  open,
  onClose,
  onConvert,
  loading,
}: {
  lead: LeadSummary | null;
  open: boolean;
  onClose: () => void;
  onConvert: (data: ConvertLeadDTO) => void;
  loading?: boolean;
}) {
  const [formData, setFormData] = useState({
    email: lead?.email || "",
    date_of_birth: "",
    gender: "",
    address: "",
  });

  const handleSubmit = () => {
    if (!lead) return;
    onConvert({
      lead_id: lead.id,
      email: formData.email || null,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      address: formData.address || null,
    });
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert Lead to Student</DialogTitle>
          <DialogDescription>
            Convert {lead.student_name} to an active student
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm">
              <strong>Student Name:</strong> {lead.student_name}
            </p>
            <p className="text-sm">
              <strong>Phone:</strong> {lead.phone_number}
            </p>
            <p className="text-sm">
              <strong>Course Interest:</strong> {lead.course_interested || "N/A"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email (Optional)</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="student@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date of Birth (Optional)</label>
            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gender (Optional)</label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address (Optional)</label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter address"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            Convert to Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// LEAD DETAIL PANEL COMPONENT
// ─────────────────────────────────────────────────────────────

function LeadDetailPanel({
  lead,
  onClose,
  onEdit,
  onStageChange,
  onConvert,
  onMarkLost,
  onDelete,
  isAdmin,
}: {
  lead: LeadSummary;
  onClose: () => void;
  onEdit: () => void;
  onStageChange: (stage: LeadStage) => void;
  onConvert: () => void;
  onMarkLost: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l shadow-lg z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Lead Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="space-y-4">
          {/* Basic Info */}
          <div>
            <h3 className="text-xl font-bold">{lead.student_name}</h3>
            {lead.parent_name && (
              <p className="text-muted-foreground">Parent: {lead.parent_name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Stage</p>
              <LeadStageBadge stage={lead.stage} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Source</p>
              <LeadSourceBadge source={lead.lead_source} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.phone_number}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium flex items-center gap-1">
                {lead.email ? (
                  <>
                    <Mail className="h-3 w-3" />
                    {lead.email}
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Course Interest</p>
              <p className="font-medium">{lead.course_interested || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Counselor</p>
              <p className="font-medium">{lead.counselor_name || "Unassigned"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Follow-up Date</p>
              <p className={`font-medium ${lead.is_overdue_follow_up ? "text-red-500" : ""}`}>
                {lead.follow_up_date
                  ? new Date(lead.follow_up_date).toLocaleDateString()
                  : "—"}
                {lead.is_overdue_follow_up && (
                  <span className="ml-2 text-xs">(Overdue)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(lead.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {lead.remarks && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-1">Remarks</p>
              <p className="text-sm bg-muted/50 p-2 rounded">{lead.remarks}</p>
            </div>
          )}

          {lead.converted_student_name && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-1">Converted To</p>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                <span className="font-medium">{lead.converted_student_name}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
            
            {lead.stage !== "converted" && lead.stage !== "lost" && (
              <>
                {/* Stage Change Buttons */}
                {lead.stage === "inquiry" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStageChange("follow_up")}
                  >
                    Mark Follow-up
                  </Button>
                )}
                {lead.stage === "follow_up" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStageChange("demo")}
                  >
                    Mark Demo
                  </Button>
                )}
                
                {/* Convert Button (Admin Only) */}
                {isAdmin && lead.stage === "demo" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onConvert}
                  >
                    <UserCheck className="h-4 w-4 mr-1" /> Convert to Student
                  </Button>
                )}
                
                {/* Mark Lost Button (Admin Only) */}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => {
                      if (confirm("Mark this lead as lost?")) onMarkLost();
                    }}
                  >
                    <UserX className="h-4 w-4 mr-1" /> Mark Lost
                  </Button>
                )}
              </>
            )}
            
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => {
                  if (confirm("Delete this lead?")) onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN LEADS PAGE COMPONENT
// ─────────────────────────────────────────────────────────────

export default function Leads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [filters, setFilters] = useState<LeadFilters>({});
  const [pagination, setPagination] = useState<LeadPagination>({
    page: 1,
    pageSize: 10,
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeadSummary | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadSummary | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<LeadSummary | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === "super_admin" || user?.role === "management_admin";

  // Queries
  const { data: leadsResult, isLoading } = useQuery({
    queryKey: ["leads", filters, pagination],
    queryFn: () => LeadService.getAll(filters, pagination),
  });

  const { data: stats } = useQuery({
    queryKey: ["lead-stats"],
    queryFn: () => LeadService.getStats(),
  });

  const { data: users = [] } = useUserProfiles();

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateLeadDTO) => LeadService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      toast({ title: "Lead created successfully" });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateLeadDTO) => LeadService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      toast({ title: "Lead updated successfully" });
      setDialogOpen(false);
      setEditing(null);
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => LeadService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      toast({ title: "Lead deleted successfully" });
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stageChangeMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: LeadStage }) =>
      LeadService.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      toast({ title: "Stage updated successfully" });
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating stage",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (data: ConvertLeadDTO) => LeadService.convertToStudent(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({
        title: "Lead converted successfully",
        description: `Student ID: ${result.studentId}`,
      });
      setConvertDialogOpen(false);
      setConvertingLead(null);
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error converting lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markLostMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      LeadService.markAsLost(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      toast({ title: "Lead marked as lost" });
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error marking lead as lost",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form fields for dialog
  const formFields: FormField[] = useMemo(() => [
    {
      key: "student_name",
      label: "Student Name",
      type: "text",
      required: true,
      placeholder: "Enter student name",
    },
    {
      key: "parent_name",
      label: "Parent/Guardian Name",
      type: "text",
      placeholder: "Enter parent name",
    },
    {
      key: "phone_number",
      label: "Phone Number",
      type: "tel",
      required: true,
      placeholder: "Enter phone number",
    },
    {
      key: "email",
      label: "Email",
      type: "email",
      placeholder: "Enter email address",
    },
    {
      key: "course_interested",
      label: "Course Interested",
      type: "text",
      placeholder: "Enter course of interest",
    },
    {
      key: "lead_source",
      label: "Lead Source",
      type: "select",
      required: true,
      options: [
        { value: "walk-in", label: "Walk-in" },
        { value: "website", label: "Website" },
        { value: "referral", label: "Referral" },
        { value: "social_media", label: "Social Media" },
        { value: "other", label: "Other" },
      ],
    },
    {
      key: "assigned_counselor_id",
      label: "Assigned Counselor",
      type: "select",
      options: users.map((u: any) => ({
        value: u.id,
        label: u.full_name || "Unknown",
      })),
    },
    {
      key: "stage",
      label: "Stage",
      type: "select",
      options: [
        { value: "inquiry", label: "Inquiry" },
        { value: "follow_up", label: "Follow-up" },
        { value: "demo", label: "Demo" },
        { value: "converted", label: "Converted" },
        { value: "lost", label: "Lost" },
      ],
    },
    {
      key: "follow_up_date",
      label: "Follow-up Date",
      type: "date",
    },
    {
      key: "remarks",
      label: "Remarks",
      type: "textarea",
      placeholder: "Enter any notes or remarks",
    },
  ], [users]);

  // Handlers
  const handleSubmit = (data: Record<string, any>) => {
    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        ...data,
      } as UpdateLeadDTO);
    } else {
      createMutation.mutate(data as CreateLeadDTO);
    }
  };

  const handleExport = async () => {
    try {
      const csv = await LeadService.exportToCSV(filters);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error exporting leads",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Table columns
  const columns = [
    {
      key: "student_name",
      label: "Student",
      render: (lead: LeadSummary) => (
        <div>
          <p className="font-medium">{lead.student_name}</p>
          {lead.parent_name && (
            <p className="text-xs text-muted-foreground">
              Parent: {lead.parent_name}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "phone_number",
      label: "Contact",
      render: (lead: LeadSummary) => (
        <div className="text-sm">
          <p>{lead.phone_number}</p>
          {lead.email && (
            <p className="text-muted-foreground">{lead.email}</p>
          )}
        </div>
      ),
    },
    {
      key: "course_interested",
      label: "Course",
      render: (lead: LeadSummary) => lead.course_interested || "—",
    },
    {
      key: "lead_source",
      label: "Source",
      render: (lead: LeadSummary) => <LeadSourceBadge source={lead.lead_source} />,
    },
    {
      key: "stage",
      label: "Stage",
      render: (lead: LeadSummary) => <LeadStageBadge stage={lead.stage} />,
    },
    {
      key: "follow_up_date",
      label: "Follow-up",
      render: (lead: LeadSummary) => (
        <div>
          {lead.follow_up_date ? (
            <span className={lead.is_overdue_follow_up ? "text-red-500" : ""}>
              {new Date(lead.follow_up_date).toLocaleDateString()}
              {lead.is_overdue_follow_up && (
                <span className="ml-1 text-xs">(Overdue)</span>
              )}
            </span>
          ) : (
            "—"
          )}
        </div>
      ),
    },
    {
      key: "counselor_name",
      label: "Counselor",
      render: (lead: LeadSummary) => lead.counselor_name || "Unassigned",
    },
    {
      key: "actions",
      label: "",
      render: (lead: LeadSummary) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedLead(lead)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(lead);
              setDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Admission Funnel</h1>
              <p className="page-subtitle">Track and manage inquiries and conversions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "list" ? "kanban" : "list")}
            >
              {viewMode === "list" ? (
                <>
                  <Kanban className="h-4 w-4 mr-1" /> Kanban
                </>
              ) : (
                <>
                  <List className="h-4 w-4 mr-1" /> List
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" /> Filters
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-1" /> Add Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Inquiries"
            value={stats.total_inquiries}
            icon={Users}
            color="info"
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversion_rate}%`}
            icon={TrendingUp}
            color="success"
          />
          <StatCard
            title="In Pipeline"
            value={stats.in_pipeline}
            icon={Clock}
            color="warning"
          />
          <StatCard
            title="Today's Follow-ups"
            value={stats.follow_ups_today}
            icon={Calendar}
            color="primary"
            change={stats.overdue_follow_ups > 0 ? `${stats.overdue_follow_ups} overdue` : undefined}
            changeType={stats.overdue_follow_ups > 0 ? "negative" : "neutral"}
          />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Search</label>
                <Input
                  placeholder="Search by name, phone, email..."
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value || undefined })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Stage</label>
                <Select
                  value={filters.stage || ""}
                  onValueChange={(value) =>
                    setFilters({ ...filters, stage: (value || undefined) as LeadStage })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All stages</SelectItem>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Source</label>
                <Select
                  value={filters.lead_source || ""}
                  onValueChange={(value) =>
                    setFilters({ ...filters, lead_source: (value || undefined) as LeadSource })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sources</SelectItem>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Counselor</label>
                <Select
                  value={filters.counselor_id || ""}
                  onValueChange={(value) =>
                    setFilters({ ...filters, counselor_id: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All counselors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All counselors</SelectItem>
                    {users.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ follow_up_today: true })}
              >
                Today's Follow-ups
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ overdue_follow_up: true })}
              >
                Overdue Follow-ups
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({})}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <Card>
          <CardContent className="p-4">
            <KanbanView
              leads={leadsResult?.data || []}
              onEdit={(lead) => {
                setEditing(lead);
                setDialogOpen(true);
              }}
              onStageChange={(id, stage) => stageChangeMutation.mutate({ id, stage })}
              onConvert={(lead) => {
                setConvertingLead(lead);
                setConvertDialogOpen(true);
              }}
              onMarkLost={(id) => markLostMutation.mutate({ id })}
              isAdmin={isAdmin}
            />
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={leadsResult?.data || []}
              loading={isLoading}
              emptyMessage="No leads found. Add your first lead to start tracking admissions."
            />
            {leadsResult && leadsResult.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(leadsResult.page - 1) * leadsResult.pageSize + 1} to{" "}
                  {Math.min(leadsResult.page * leadsResult.pageSize, leadsResult.total)} of{" "}
                  {leadsResult.total} leads
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={leadsResult.page === 1}
                    onClick={() => setPagination({ ...pagination, page: leadsResult.page - 1 })}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={leadsResult.page === leadsResult.totalPages}
                    onClick={() => setPagination({ ...pagination, page: leadsResult.page + 1 })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <EntityDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit Lead" : "Add New Lead"}
        fields={formFields}
        initialData={
          editing
            ? {
                id: editing.id,
                student_name: editing.student_name,
                parent_name: editing.parent_name || "",
                phone_number: editing.phone_number,
                email: editing.email || "",
                course_interested: editing.course_interested || "",
                lead_source: editing.lead_source,
                assigned_counselor_id: editing.assigned_counselor_id || "",
                stage: editing.stage,
                follow_up_date: editing.follow_up_date || "",
                remarks: editing.remarks || "",
              }
            : {
                lead_source: "other",
                stage: "inquiry",
              }
        }
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onEdit={() => {
            setEditing(selectedLead);
            setDialogOpen(true);
          }}
          onStageChange={(stage) =>
            stageChangeMutation.mutate({ id: selectedLead.id, stage })
          }
          onConvert={() => {
            setConvertingLead(selectedLead);
            setConvertDialogOpen(true);
          }}
          onMarkLost={() => markLostMutation.mutate({ id: selectedLead.id })}
          onDelete={() => deleteMutation.mutate(selectedLead.id)}
          isAdmin={isAdmin}
        />
      )}

      {/* Convert Lead Dialog */}
      <ConvertLeadDialog
        lead={convertingLead}
        open={convertDialogOpen}
        onClose={() => {
          setConvertDialogOpen(false);
          setConvertingLead(null);
        }}
        onConvert={(data) => convertMutation.mutate(data)}
        loading={convertMutation.isPending}
      />
    </div>
  );
}
