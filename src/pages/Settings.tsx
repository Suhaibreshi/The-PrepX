import { useState } from "react";
import {
  Settings as SettingsIcon,
  Shield,
  Calendar,
  DollarSign,
  Mail,
  Palette,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import EntityDialog, { FormField } from "@/components/shared/EntityDialog";
import DataTable from "@/components/shared/DataTable";
import {
  useOrgSettings,
  useUpdateOrgSetting,
  useAcademicYears,
  useUpsertAcademicYear,
  useFeeTemplates,
  useUpsertFeeTemplate,
  useDeleteFeeTemplate,
  useRolePermissions,
  useUpdateRolePermission,
  useCourses,
} from "@/hooks/useCrudHooks";

// ─── Role Permissions Tab ─────────────────────────────────────
function RolePermissionsTab() {
  const { data: permissions = [], isLoading } = useRolePermissions();
  const update = useUpdateRolePermission();

  const ROLES = [
    "super_admin",
    "management_admin",
    "academic_coordinator",
    "teacher",
    "finance_manager",
    "support_staff",
  ];

  const ROLE_LABELS: Record<string, string> = {
    super_admin: "Super Admin",
    management_admin: "Management Admin",
    academic_coordinator: "Academic Coordinator",
    teacher: "Teacher",
    finance_manager: "Finance Manager",
    support_staff: "Support Staff",
  };

  const RESOURCES = [
    "students", "teachers", "batches", "parents",
    "fees", "exams", "attendance", "messages", "reports", "settings",
  ];

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading permissions…</p>;

  return (
    <div className="space-y-6">
      {ROLES.map((role) => {
        const rolePerms = (permissions as any[]).filter((p) => p.role === role);
        return (
          <div key={role} className="rounded-lg border p-4">
            <h3 className="font-heading font-semibold mb-3">{ROLE_LABELS[role]}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Resource</th>
                    <th className="pb-2 px-3 font-medium text-center">Read</th>
                    <th className="pb-2 px-3 font-medium text-center">Create</th>
                    <th className="pb-2 px-3 font-medium text-center">Update</th>
                    <th className="pb-2 px-3 font-medium text-center">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {RESOURCES.map((resource) => {
                    const perm = rolePerms.find((p) => p.resource === resource);
                    if (!perm) return null;
                    return (
                      <tr key={resource} className="border-t">
                        <td className="py-2 pr-4 capitalize">{resource}</td>
                        {(["can_read", "can_create", "can_update", "can_delete"] as const).map((field) => (
                          <td key={field} className="py-2 px-3 text-center">
                            <Switch
                              checked={perm[field]}
                              onCheckedChange={(checked) =>
                                update.mutate({ ...perm, [field]: checked })
                              }
                              disabled={update.isPending}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Academic Year Tab ────────────────────────────────────────
function AcademicYearTab() {
  const { data: years = [], isLoading } = useAcademicYears();
  const upsert = useUpsertAcademicYear();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fields: FormField[] = [
    { key: "name", label: "Academic Year Name", required: true, placeholder: "e.g. 2025-26" },
    { key: "start_date", label: "Start Date", required: true, type: "date" },
    { key: "end_date", label: "End Date", required: true, type: "date" },
  ];

  const columns = [
    { key: "name", label: "Name" },
    { key: "start_date", label: "Start", render: (y: any) => new Date(y.start_date).toLocaleDateString() },
    { key: "end_date", label: "End", render: (y: any) => new Date(y.end_date).toLocaleDateString() },
    {
      key: "is_current", label: "Current",
      render: (y: any) => (
        <Switch
          checked={y.is_current}
          onCheckedChange={(checked) => upsert.mutate({ ...y, is_current: checked })}
          disabled={upsert.isPending}
        />
      ),
    },
    {
      key: "actions", label: "Actions",
      render: (y: any) => (
        <Button variant="ghost" size="icon" onClick={() => { setEditing(y); setDialogOpen(true); }}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" className="gap-2" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Academic Year
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={years as any[]}
        loading={isLoading}
        emptyMessage="No academic years configured."
      />
      <EntityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Academic Year" : "Add Academic Year"}
        fields={fields}
        initialData={editing}
        loading={upsert.isPending}
        onSubmit={(data) => upsert.mutate(data as any, { onSuccess: () => setDialogOpen(false) })}
      />
    </>
  );
}

// ─── Fee Templates Tab ────────────────────────────────────────
function FeeTemplatesTab() {
  const { data: templates = [], isLoading } = useFeeTemplates();
  const { data: courses = [] } = useCourses();
  const upsert = useUpsertFeeTemplate();
  const remove = useDeleteFeeTemplate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fields: FormField[] = [
    { key: "name", label: "Template Name", required: true, placeholder: "e.g. Monthly Tuition" },
    {
      key: "course_id", label: "Course (optional)", type: "select",
      options: (courses as any[]).map((c) => ({ value: c.id, label: c.name })),
    },
    { key: "amount", label: "Amount (₹)", required: true, type: "number", placeholder: "0.00" },
    {
      key: "frequency", label: "Frequency", type: "select",
      options: [
        { value: "one-time", label: "One-time" },
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly" },
        { value: "annually", label: "Annually" },
      ],
    },
    { key: "description", label: "Description", type: "textarea", placeholder: "Template description" },
  ];

  const columns = [
    { key: "name", label: "Name" },
    { key: "course", label: "Course", render: (t: any) => t.courses?.name || "All Courses" },
    { key: "amount", label: "Amount", render: (t: any) => `₹${Number(t.amount).toLocaleString()}` },
    { key: "frequency", label: "Frequency" },
    {
      key: "is_active", label: "Active",
      render: (t: any) => (
        <Switch
          checked={t.is_active}
          onCheckedChange={(checked) => upsert.mutate({ ...t, is_active: checked })}
          disabled={upsert.isPending}
        />
      ),
    },
    {
      key: "actions", label: "Actions",
      render: (t: any) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setDialogOpen(true); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={() => { if (confirm("Delete this template?")) remove.mutate(t.id); }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" className="gap-2" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Template
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={templates as any[]}
        loading={isLoading}
        emptyMessage="No fee templates yet."
      />
      <EntityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Fee Template" : "Add Fee Template"}
        fields={fields}
        initialData={editing}
        loading={upsert.isPending}
        onSubmit={(data) => upsert.mutate(data as any, { onSuccess: () => setDialogOpen(false) })}
      />
    </>
  );
}

// ─── Integrations Tab ─────────────────────────────────────────
function IntegrationsTab() {
  const { data: settings, isLoading } = useOrgSettings();
  const update = useUpdateOrgSetting();
  const [smsKey, setSmsKey] = useState("");
  const [emailKey, setEmailKey] = useState("");

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">SMS Provider API Key</label>
        <div className="flex gap-2">
          <Input
            placeholder={settings?.sms_api_key ? "••••••••" : "Enter API key"}
            type="password"
            value={smsKey}
            onChange={(e) => setSmsKey(e.target.value)}
          />
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!smsKey || update.isPending}
            onClick={() => update.mutate({ key: "sms_api_key", value: smsKey }, { onSuccess: () => setSmsKey("") })}
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Email Service API Key</label>
        <div className="flex gap-2">
          <Input
            placeholder={settings?.email_api_key ? "••••••••" : "Enter API key"}
            type="password"
            value={emailKey}
            onChange={(e) => setEmailKey(e.target.value)}
          />
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!emailKey || update.isPending}
            onClick={() => update.mutate({ key: "email_api_key", value: emailKey }, { onSuccess: () => setEmailKey("") })}
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Branding Tab ─────────────────────────────────────────────
function BrandingTab() {
  const { data: settings, isLoading } = useOrgSettings();
  const update = useUpdateOrgSetting();
  const [orgName, setOrgName] = useState("");
  const [tagline, setTagline] = useState("");

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Organisation Name</label>
        <Input
          defaultValue={settings?.org_name ?? "PREPX IQ"}
          value={orgName || settings?.org_name || ""}
          onChange={(e) => setOrgName(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Tagline</label>
        <Input
          placeholder="Your organisation tagline"
          value={tagline || settings?.org_tagline || ""}
          onChange={(e) => setTagline(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Currency Symbol</label>
        <Input
          defaultValue={settings?.currency_symbol ?? "₹"}
          className="w-24"
          readOnly
        />
      </div>
      <Button
        disabled={update.isPending}
        onClick={() => {
          if (orgName) update.mutate({ key: "org_name", value: orgName });
          if (tagline) update.mutate({ key: "org_tagline", value: tagline });
        }}
      >
        {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Branding
      </Button>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────
export default function SettingsPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Settings & Configuration</h1>
            <p className="page-subtitle">Manage system settings and permissions</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList className="overflow-x-auto flex-nowrap w-full justify-start">
          <TabsTrigger value="roles">Role Permissions</TabsTrigger>
          <TabsTrigger value="academic">Academic Year</TabsTrigger>
          <TabsTrigger value="fees">Fee Templates</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Role-Based Access Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RolePermissionsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Academic Year Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AcademicYearTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Fee Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FeeTemplatesTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                SMS / Email API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IntegrationsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Platform Branding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BrandingTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center py-8 border-t">
        <p className="text-sm text-muted-foreground">
          © 2024 PREPX IQ Nexus. All rights reserved.
        </p>
      </div>
    </div>
  );
}
