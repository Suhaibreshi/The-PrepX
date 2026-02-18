import { Bell, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/hooks/useCrudHooks";
import { useAuth } from "@/hooks/useAuth";

const TYPE_COLORS: Record<string, string> = {
  system: "bg-blue-100 text-blue-700",
  fee: "bg-yellow-100 text-yellow-700",
  exam: "bg-purple-100 text-purple-700",
  attendance: "bg-green-100 text-green-700",
  message: "bg-pink-100 text-pink-700",
  enrollment: "bg-orange-100 text-orange-700",
};

export default function Notifications() {
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications(user?.id);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();

  const unreadCount = (notifications as any[]).filter((n) => !n.read).length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Notification Center</h1>
              <p className="page-subtitle">View all system and admin notifications</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => markAllRead.mutate(user?.id)}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base flex items-center gap-2">
            All Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount} unread</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
          ) : (notifications as any[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">
                No notifications yet. They will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {(notifications as any[]).map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                    n.read ? "bg-background" : "bg-primary/5 border-primary/20"
                  }`}
                >
                  {/* Type badge */}
                  <span
                    className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      TYPE_COLORS[n.type] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {n.type || "system"}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${n.read ? "" : "text-foreground"}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    {n.action_url && (
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title="Open link"
                        onClick={() => window.open(n.action_url, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {!n.read && (
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title="Mark as read"
                        onClick={() => markRead.mutate(n.id)}
                        disabled={markRead.isPending}
                      >
                        <CheckCheck className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      title="Delete"
                      onClick={() => deleteNotif.mutate(n.id)}
                      disabled={deleteNotif.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
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
