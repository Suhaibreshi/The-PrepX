import { useState } from "react";
import { MessageSquare, Send, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMessages, useSendMessage, useMarkMessageRead, useDeleteMessage } from "@/hooks/useCrudHooks";
import { useAuth } from "@/hooks/useAuth";

const MESSAGE_TYPES = [
  { value: "class-update", label: "Class Update" },
  { value: "schedule-change", label: "Schedule Change" },
  { value: "exam-announcement", label: "Exam Announcement" },
  { value: "fee-reminder", label: "Fee Reminder" },
  { value: "emergency", label: "Emergency Alert" },
  { value: "general", label: "General" },
];

const RECIPIENT_TYPES = [
  { value: "student", label: "Individual Student" },
  { value: "parent", label: "Individual Parent" },
  { value: "teacher", label: "Individual Teacher" },
  { value: "batch", label: "Entire Batch" },
  { value: "all-students", label: "All Students" },
  { value: "all-parents", label: "All Parents" },
  { value: "all-teachers", label: "All Teachers" },
];

export default function Messages() {
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useMessages();
  const send = useSendMessage();
  const markRead = useMarkMessageRead();
  const deleteMsg = useDeleteMessage();

  const [form, setForm] = useState({
    recipient_type: "",
    message_type: "general",
    subject: "",
    body: "",
    scheduled_at: "",
  });

  const handleSend = (schedule = false) => {
    if (!form.recipient_type || !form.subject || !form.body) return;
    send.mutate(
      {
        sender_id: user?.id,
        recipient_type: form.recipient_type,
        message_type: form.message_type,
        subject: form.subject,
        body: form.body,
        scheduled_at: schedule && form.scheduled_at ? form.scheduled_at : undefined,
      },
      {
        onSuccess: () =>
          setForm({ recipient_type: "", message_type: "general", subject: "", body: "", scheduled_at: "" }),
      }
    );
  };

  const unreadCount = (messages as any[]).filter((m) => !m.read).length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Messaging Center</h1>
            <p className="page-subtitle">Send messages to students, parents, teachers, or batches</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Compose Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Recipient Type</label>
                <Select
                  value={form.recipient_type}
                  onValueChange={(v) => setForm((p) => ({ ...p, recipient_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPIENT_TYPES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Message Type</label>
                <Select
                  value={form.message_type}
                  onValueChange={(v) => setForm((p) => ({ ...p, message_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Subject</label>
              <Input
                placeholder="Message subject"
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message</label>
              <Textarea
                placeholder="Write your message here..."
                className="min-h-[160px]"
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Schedule (optional)</label>
              <Input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={send.isPending || !form.scheduled_at}
                onClick={() => handleSend(true)}
              >
                Schedule
              </Button>
              <Button
                className="gap-2"
                disabled={send.isPending || !form.recipient_type || !form.subject || !form.body}
                onClick={() => handleSend(false)}
              >
                <Send className="h-4 w-4" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center justify-between">
              Message History
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">{unreadCount} unread</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
            ) : (messages as any[]).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {(messages as any[]).map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg border p-3 text-sm transition-colors ${
                      m.read ? "bg-background" : "bg-primary/5 border-primary/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{m.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          To: {m.recipient_type} · {new Date(m.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.body}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!m.read && (
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            title="Mark as read"
                            onClick={() => markRead.mutate(m.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          title="Delete"
                          onClick={() => { if (confirm("Delete this message?")) deleteMsg.mutate(m.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {m.message_type && (
                      <Badge variant="outline" className="mt-2 text-[10px]">{m.message_type}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
