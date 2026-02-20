import { useState } from "react";
import {
  Settings as SettingsIcon,
  Calendar,
  DollarSign,
  Mail,
  Palette,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  Bell,
  Play,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  useCourses,
  useNotificationSettings,
  useUpdateNotificationSettings,
  useCommunicationLogs,
  useCommunicationLogStats,
} from "@/hooks/useCrudHooks";
import { AutomatedNotificationService } from "@/services";

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

// ─── Notification Engine Tab ───────────────────────────────────
function NotificationEngineTab() {
  const { data: settings, isLoading: settingsLoading } = useNotificationSettings();
  const { data: stats } = useCommunicationLogStats();
  const { data: logs } = useCommunicationLogs();
  const updateSettings = useUpdateNotificationSettings();
  const [isRunning, setIsRunning] = useState(false);

  if (settingsLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const handleToggleMode = (enabled: boolean) => {
    updateSettings.mutate({ enable_automatic_mode: enabled });
  };

  const handleToggle = (key: string, value: boolean) => {
    updateSettings.mutate({ [key]: value });
  };

  const handleDaysChange = (key: string, value: number) => {
    if (value >= 0 && value <= 30) {
      updateSettings.mutate({ [key]: value });
    }
  };

  const handleRunManually = async () => {
    setIsRunning(true);
    try {
      const result = await AutomatedNotificationService.runAllNotifications();
      console.log("Notification run result:", result);
    } catch (error) {
      console.error("Failed to run notifications:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Mode
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-normal text-muted-foreground">
                {settings?.enable_automatic_mode ? "Automatic" : "Manual"}
              </span>
              <Switch
                checked={settings?.enable_automatic_mode ?? false}
                onCheckedChange={handleToggleMode}
                disabled={updateSettings.isPending}
              />
            </div>
          </CardTitle>
          <CardDescription>
            In automatic mode, notifications are sent automatically based on triggers.
            In manual mode, you need to trigger notifications manually.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats?.sent ?? 0}</div>
            <div className="text-xs text-muted-foreground">Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats?.failed ?? 0}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending ?? 0}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Notification Types</CardTitle>
          <CardDescription>Enable or disable specific notification types</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fee Reminder */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Fee Reminder</Label>
              <p className="text-xs text-muted-foreground">
                Send reminder X days before fee due date
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                className="w-16"
                value={settings?.fee_reminder_days_before ?? 3}
                onChange={(e) => handleDaysChange("fee_reminder_days_before", parseInt(e.target.value) || 0)}
                disabled={!settings?.enable_fee_reminder}
              />
              <span className="text-xs text-muted-foreground">days</span>
              <Switch
                checked={settings?.enable_fee_reminder ?? true}
                onCheckedChange={(v) => handleToggle("enable_fee_reminder", v)}
              />
            </div>
          </div>
          <Separator />

          {/* Overdue Alert */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Overdue Alert</Label>
              <p className="text-xs text-muted-foreground">
                Send alert when fee payment is overdue
              </p>
            </div>
            <Switch
              checked={settings?.enable_overdue_alert ?? true}
              onCheckedChange={(v) => handleToggle("enable_overdue_alert", v)}
            />
          </div>
          <Separator />

          {/* Exam Reminder */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Exam Reminder</Label>
              <p className="text-xs text-muted-foreground">
                Send reminder X days before exam
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                className="w-16"
                value={settings?.exam_reminder_days_before ?? 1}
                onChange={(e) => handleDaysChange("exam_reminder_days_before", parseInt(e.target.value) || 0)}
                disabled={!settings?.enable_exam_reminder}
              />
              <span className="text-xs text-muted-foreground">days</span>
              <Switch
                checked={settings?.enable_exam_reminder ?? true}
                onCheckedChange={(v) => handleToggle("enable_exam_reminder", v)}
              />
            </div>
          </div>
          <Separator />

          {/* Absent Alert */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Absent Alert</Label>
              <p className="text-xs text-muted-foreground">
                Send alert to parent when student is marked absent
              </p>
            </div>
            <Switch
              checked={settings?.enable_absent_alert ?? true}
              onCheckedChange={(v) => handleToggle("enable_absent_alert", v)}
            />
          </div>
          <Separator />

          {/* Birthday Wish */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Birthday Wish</Label>
              <p className="text-xs text-muted-foreground">
                Send birthday wishes to students
              </p>
            </div>
            <Switch
              checked={settings?.enable_birthday_wish ?? false}
              onCheckedChange={(v) => handleToggle("enable_birthday_wish", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Manual Trigger */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Manual Trigger</CardTitle>
          <CardDescription>
            Manually run the notification engine to process all pending notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleRunManually}
            disabled={isRunning || !settings?.enable_automatic_mode}
            className="gap-2"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Notification Engine
          </Button>
          {!settings?.enable_automatic_mode && (
            <p className="text-xs text-muted-foreground mt-2">
              Enable automatic mode to run the notification engine
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Recent Communication Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(logs as any[])?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No communication logs yet
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(logs as any[])?.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        log.delivery_status === "sent"
                          ? "default"
                          : log.delivery_status === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {log.message_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {log.message_content?.substring(0, 50)}...
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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

      <Tabs defaultValue="academic" className="space-y-4">
        <TabsList className="overflow-x-auto flex-nowrap w-full justify-start">
          <TabsTrigger value="academic">Academic Year</TabsTrigger>
          <TabsTrigger value="fees">Fee Templates</TabsTrigger>
          <TabsTrigger value="notifications">Notification Engine</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

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

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationEngineTab />
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
          DESIGNED AND DEVELOPED BY SUHAIB REYAZ & SHAHEEN NAZIR
        </p>
      </div>
    </div>
  );
}
