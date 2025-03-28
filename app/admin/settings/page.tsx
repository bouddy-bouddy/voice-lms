"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { Switch } from "@/components/ui";
import {
  AlertCircle,
  Mail,
  RefreshCw,
  Shield,
  Key,
  Calendar,
  Settings as SettingsIcon,
  Save,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui";

interface SystemSettings {
  emailNotificationsEnabled: boolean;
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailFrom: string;
  defaultLicenseDuration: number;
  defaultMaxDevices: number;
  trialPeriodDays: number;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({
    emailNotificationsEnabled: true,
    emailHost: "",
    emailPort: 587,
    emailUser: "",
    emailFrom: "",
    defaultLicenseDuration: 365,
    defaultMaxDevices: 1,
    trialPeriodDays: 7,
  });
  const [testEmailAddress, setTestEmailAddress] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/settings");

        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }

        const data = await response.json();
        setSettings(data.settings);

        // Set debug mode based on localStorage or default to false
        const savedDebugMode = localStorage.getItem("debugMode") === "true";
        setDebugMode(savedDebugMode);
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof SystemSettings
  ) => {
    const value =
      e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setSettings({ ...settings, [field]: value });
  };

  // Handle toggle changes
  const handleToggleChange = (field: keyof SystemSettings, value: boolean) => {
    setSettings({ ...settings, [field]: value });
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Settings saved successfully");
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Send test email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error("Please enter a test email address");
      return;
    }

    try {
      setIsSendingTest(true);

      const response = await fetch("/api/settings/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmailAddress,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send test email");
      }

      toast.success("Test email sent successfully");
    } catch (err: any) {
      console.error("Error sending test email:", err);
      toast.error(err.message || "Failed to send test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Error changing password:", err);
      toast.error(err.message || "Failed to change password");
    }
  };

  // Export license data
  const handleExportData = async () => {
    try {
      setIsExporting(true);

      // Use window.open to download the file
      window.open("/api/settings/export-data", "_blank");

      toast.success("Export started");
    } catch (err) {
      console.error("Error exporting data:", err);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  // Purge expired trials
  const handlePurgeTrials = async () => {
    try {
      setIsPurging(true);

      const response = await fetch("/api/settings/purge-trials", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to purge trial data");
      }

      const data = await response.json();
      toast.success(`Purged ${data.purgedCount} expired trials`);
    } catch (err: any) {
      console.error("Error purging trials:", err);
      toast.error(err.message || "Failed to purge trial data");
    } finally {
      setIsPurging(false);
    }
  };

  // Toggle debug mode
  const handleToggleDebugMode = (enabled: boolean) => {
    setDebugMode(enabled);
    localStorage.setItem("debugMode", enabled.toString());
    toast.success(`Debug mode ${enabled ? "enabled" : "disabled"}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">
          Error Loading Settings
        </h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Settings</h1>

        <Button onClick={handleSaveSettings} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="license">
            <Key className="mr-2 h-4 w-4" />
            License
          </TabsTrigger>
          <TabsTrigger value="account">
            <Shield className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="system">
            <SettingsIcon className="mr-2 h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure email settings for license notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-y-0 rounded-md border p-4">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable email notifications for new licenses
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotificationsEnabled}
                  onCheckedChange={(checked) =>
                    handleToggleChange("emailNotificationsEnabled", checked)
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emailHost">SMTP Host</Label>
                  <Input
                    id="emailHost"
                    value={settings.emailHost}
                    onChange={(e) => handleInputChange(e, "emailHost")}
                    placeholder="smtp.example.com"
                    disabled={!settings.emailNotificationsEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailPort">SMTP Port</Label>
                  <Input
                    id="emailPort"
                    type="number"
                    value={settings.emailPort}
                    onChange={(e) => handleInputChange(e, "emailPort")}
                    placeholder="587"
                    disabled={!settings.emailNotificationsEnabled}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emailUser">SMTP Username</Label>
                  <Input
                    id="emailUser"
                    value={settings.emailUser}
                    onChange={(e) => handleInputChange(e, "emailUser")}
                    placeholder="user@example.com"
                    disabled={!settings.emailNotificationsEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailPassword">SMTP Password</Label>
                  <Input
                    id="emailPassword"
                    type="password"
                    placeholder="••••••"
                    disabled={!settings.emailNotificationsEnabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password is stored securely and won't be displayed
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailFrom">From Email Address</Label>
                <Input
                  id="emailFrom"
                  value={settings.emailFrom}
                  onChange={(e) => handleInputChange(e, "emailFrom")}
                  placeholder="no-reply@yourdomain.com"
                  disabled={!settings.emailNotificationsEnabled}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-2">Send Test Email</h3>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="test@example.com"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    disabled={!settings.emailNotificationsEnabled}
                  />
                  <Button
                    onClick={handleSendTestEmail}
                    disabled={
                      isSendingTest || !settings.emailNotificationsEnabled
                    }
                  >
                    {isSendingTest ? "Sending..." : "Send Test"}
                  </Button>
                </div>
                {!settings.emailNotificationsEnabled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Enable email notifications to send test emails
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* License Settings */}
        <TabsContent value="license">
          <Card>
            <CardHeader>
              <CardTitle>License Configuration</CardTitle>
              <CardDescription>
                Configure default settings for new licenses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="defaultLicenseDuration">
                  Default License Duration (days)
                </Label>
                <Input
                  id="defaultLicenseDuration"
                  type="number"
                  value={settings.defaultLicenseDuration}
                  onChange={(e) =>
                    handleInputChange(e, "defaultLicenseDuration")
                  }
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  Default expiration period for new licenses (365 days = 1 year)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultMaxDevices">
                  Default Maximum Devices
                </Label>
                <Input
                  id="defaultMaxDevices"
                  type="number"
                  value={settings.defaultMaxDevices}
                  onChange={(e) => handleInputChange(e, "defaultMaxDevices")}
                  min="1"
                  max="10"
                />
                <p className="text-xs text-muted-foreground">
                  Default number of devices allowed per license
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialPeriodDays">Trial Period (days)</Label>
                <Input
                  id="trialPeriodDays"
                  type="number"
                  value={settings.trialPeriodDays}
                  onChange={(e) => handleInputChange(e, "trialPeriodDays")}
                  min="1"
                  max="30"
                />
                <p className="text-xs text-muted-foreground">
                  Duration of trial period for new users
                </p>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-2">
                  License Key Format Settings
                </h3>
                <div className="px-4 py-3 bg-muted/30 rounded-md">
                  <p className="text-sm">
                    Current format:{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      VM-XXXX-XXXX-XXXX-XXXX
                    </code>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    License keys are automatically generated with this format.
                    The format cannot be changed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Update your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {newPassword &&
                  confirmPassword &&
                  newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1">
                      Passwords do not match
                    </p>
                  )}
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
              <CardDescription>
                System maintenance and backup options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-y-0 rounded-md border p-4">
                <div>
                  <h3 className="font-medium">Debug Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable detailed logging for troubleshooting
                  </p>
                </div>
                <Switch
                  checked={debugMode}
                  onCheckedChange={handleToggleDebugMode}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Export Licenses</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export all license data to CSV
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export Data"}
                  </Button>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Purge Expired Trials</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Remove trial data older than 90 days
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" disabled={isPurging}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isPurging ? "Purging..." : "Purge Data"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete expired trial data older than 90 days.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePurgeTrials}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="mt-4 p-4 border rounded-md">
                <h3 className="font-medium mb-2">System Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Version</div>
                  <div>1.0.0</div>
                  <div className="text-muted-foreground">Database</div>
                  <div>MongoDB</div>
                  <div className="text-muted-foreground">Last Updated</div>
                  <div>{new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
