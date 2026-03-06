import { useState } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  Loader2,
  Camera,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/useCrudHooks";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useUserProfile(user?.id);
  const updateProfile = useUpdateUserProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = profile?.role?.replace(/_/g, " ") || "User";

  const handleSave = () => {
    if (!user?.id) return;
    updateProfile.mutate({
      id: user.id,
      full_name: fullName || undefined,
      phone: phone || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <UserIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">View and manage your profile information</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="relative mx-auto">
              <Avatar className="h-24 w-24 bg-primary text-primary-foreground text-2xl font-bold">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-heading font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground hover:bg-primary/90"
                title="Change avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <CardTitle className="mt-4 font-heading">{displayName}</CardTitle>
            <p className="text-sm text-muted-foreground capitalize">{roleLabel}</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{user?.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{profile.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              Edit Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="Enter your full name"
                value={fullName || profile?.full_name || ""}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                placeholder="Enter your phone number"
                value={phone || profile?.phone || ""}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Input
                value={roleLabel}
                disabled
                className="bg-muted capitalize"
              />
              <p className="text-xs text-muted-foreground">Role is managed by administrators</p>
            </div>
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="gap-2"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
