import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ButtonLoader } from "@/components/ui/loading-spinner";
import { Loader2, Shield, Bell, Lock, User, Eye, Mail } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Account state
  const [accountData, setAccountData] = useState({
    email: "",
    bio: "",
    username: ""
  });

  // Notification state
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    messages: true,
    trades: true
  });

  // Privacy state
  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showEmail: false,
    showLocation: true
  });

  // Password state
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  // Initialize state from profile
  useEffect(() => {
    if (profile) {
      setAccountData({
        email: profile.email || user?.email || "",
        bio: profile.bio || "",
        username: profile.username || ""
      });

      setNotifications({
        email: profile.email_notifications ?? true,
        push: profile.push_notifications ?? false,
        messages: profile.message_notifications ?? true,
        trades: profile.trade_notifications ?? true
      });

      setPrivacy({
        profilePublic: profile.is_public ?? true,
        showEmail: profile.show_email ?? false,
        showLocation: profile.show_location ?? true
      });
    }
  }, [profile, user]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const { success, error } = await updateProfile({
        bio: accountData.bio,
        email_notifications: notifications.email,
        push_notifications: notifications.push,
        message_notifications: notifications.messages,
        trade_notifications: notifications.trades,
        is_public: privacy.profilePublic,
        show_email: privacy.showEmail,
        show_location: privacy.showLocation
      });

      if (success) {
        toast({
          title: "Settings saved",
          description: "Your preferences have been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: error || "Failed to update settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.new || !passwords.confirm) {
      toast({
        title: "Validation error",
        description: "Please enter both new password and confirmation",
        variant: "destructive"
      });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Validation error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwords.new.length < 6) {
      toast({
        title: "Validation error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    try {
      setUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Password updated successfully",
        });
        setPasswords({ current: "", new: "", confirm: "" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton />
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[80px]"
            >
              {saving ? <ButtonLoader size="sm" /> : (
                <>
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-8">
        <div className="mb-8">
          <p className="text-gray-600 mt-2">Manage your account preferences and privacy settings</p>
        </div>

        <div className="grid gap-8">
          {/* Account Settings */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 flex flex-row items-center space-x-3 py-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <User className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Account Profile</CardTitle>
                <CardDescription>Update your basic account information</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={accountData.email}
                      disabled
                      className="pl-10 bg-gray-50 cursor-not-allowed border-gray-200"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">Email can only be changed via account verification services.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
                  <Input
                    id="username"
                    value={accountData.username}
                    onChange={(e) => setAccountData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="johndoe"
                    className="border-gray-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-semibold">Bio</Label>
                <Textarea
                  id="bio"
                  value={accountData.bio}
                  onChange={(e) => setAccountData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell others about yourself..."
                  className="min-h-[100px] border-gray-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 flex flex-row items-center space-x-3 py-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
                <CardDescription>Control how you receive alerts and updates</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-gray-100">
              <div className="flex items-center justify-between py-5">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive transactional emails and updates</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between py-5">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Push Notifications</Label>
                  <p className="text-sm text-gray-500">Receive real-time alerts in your browser</p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, push: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between py-5">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">New Messages</Label>
                  <p className="text-sm text-gray-500">Get notified when you receive a message</p>
                </div>
                <Switch
                  checked={notifications.messages}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, messages: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between py-5">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Trade Requests</Label>
                  <p className="text-sm text-gray-500">Get notified of new MeritOne trade requests</p>
                </div>
                <Switch
                  checked={notifications.trades}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, trades: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 flex flex-row items-center space-x-3 py-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Privacy Settings</CardTitle>
                <CardDescription>Manage your visibility and data sharing</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-gray-100">
              <div className="flex items-center justify-between py-5">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Public Profile</Label>
                  <p className="text-sm text-gray-500">Allow everyone to see your profile and posts</p>
                </div>
                <Switch
                  checked={privacy.profilePublic}
                  onCheckedChange={(checked) =>
                    setPrivacy(prev => ({ ...prev, profilePublic: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between py-5">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Show Email Address</Label>
                  <p className="text-sm text-gray-500">Display your email to other users on your profile</p>
                </div>
                <Switch
                  checked={privacy.showEmail}
                  onCheckedChange={(checked) =>
                    setPrivacy(prev => ({ ...prev, showEmail: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between py-5">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Show Location</Label>
                  <p className="text-sm text-gray-500">Display your current city and country</p>
                </div>
                <Switch
                  checked={privacy.showLocation}
                  onCheckedChange={(checked) =>
                    setPrivacy(prev => ({ ...prev, showLocation: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 flex flex-row items-center space-x-3 py-4">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Security & Password</CardTitle>
                <CardDescription>Keep your account secure with a strong password</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                    placeholder="Min. 6 characters"
                    className="border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    placeholder="Repeat new password"
                    className="border-gray-200"
                  />
                </div>
              </div>
              <Button
                onClick={handleUpdatePassword}
                variant="outline"
                disabled={updatingPassword}
                className="w-full md:w-auto mt-2 border-red-200 text-red-600 hover:bg-red-50"
              >
                {updatingPassword ? <ButtonLoader size="sm" /> : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 italic">Last profile update: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Never'}</p>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                {saving ? <ButtonLoader size="sm" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
