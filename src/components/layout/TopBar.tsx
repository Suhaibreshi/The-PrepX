import { Bell, Search, Menu, LogOut, User, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, useUserProfile } from "@/hooks/useCrudHooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TopBar({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useUserProfile(user?.id);
  const { data: notifications = [] } = useNotifications(user?.id);

  const unreadCount = (notifications as any[]).filter((n) => !n.read).length;
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6">
      <button
        onClick={onToggleSidebar}
        className="text-muted-foreground hover:text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative flex-1 max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students, teachers, batches..."
          className="pl-9 bg-muted border-0"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate("/notifications")}
          title="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full">
              <Avatar className="h-9 w-9 bg-primary">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-heading font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 border-b">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              {profile?.role && (
                <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                  {profile.role.replace(/_/g, " ")}
                </p>
              )}
            </div>
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
