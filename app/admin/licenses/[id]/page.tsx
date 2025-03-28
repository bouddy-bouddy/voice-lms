"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";
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
import { Label } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Computer,
  Edit,
  RefreshCw,
  Shield,
  Trash2,
  User,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { DateDisplay } from "@/components/ui";

// License type definition
interface License {
  id: string;
  licenseKey: string;
  fullName: string;
  cinNumber: string;
  email: string;
  phoneNumber: string;
  institution: string;
  maxDevices: number;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  createdAt: string;
  expiresAt: string;
  devices: Device[];
  activationLogs: ActivationLog[];
}

interface Device {
  id: string;
  deviceId: string;
  deviceName: string | null;
  deviceType: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  ipAddress: string | null;
}

interface ActivationLog {
  id: string;
  deviceId: string;
  ipAddress: string | null;
  action: "ACTIVATE" | "VALIDATE" | "DEACTIVATE" | "CHECK";
  timestamp: string;
  success: boolean;
  details: string | null;
}

interface PageProps {
  params: { id: Promise<string> };
}

export default function LicenseDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [license, setLicense] = useState<License | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [openExtendDialog, setOpenExtendDialog] = useState<boolean>(false);
  const [licenseId, setLicenseId] = useState<string>("");

  // Form state for editing a license
  const [formData, setFormData] = useState({
    fullName: "",
    cinNumber: "",
    email: "",
    phoneNumber: "",
    maxDevices: 1,
    status: "",
    expiresAt: "",
  });

  // Function to fetch license details
  const fetchLicense = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/licenses/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch license details");
      }

      const data = await response.json();
      setLicense(data.license);

      // Initialize form data for editing
      setFormData({
        fullName: data.license.fullName,
        cinNumber: data.license.cinNumber,
        email: data.license.email,
        phoneNumber: data.license.phoneNumber,
        maxDevices: data.license.maxDevices,
        status: data.license.status,
        expiresAt: new Date(data.license.expiresAt).toISOString().split("T")[0],
      });
    } catch (err) {
      console.error("Error fetching license details:", err);
      setError("Failed to load license details");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with license details
  useEffect(() => {
    const resolveParams = async () => {
      // Get the id from params which is a Promise in Next.js 15
      const id = await Promise.resolve(params.id);
      setLicenseId(id);
      fetchLicense(id);
    };

    resolveParams();
  }, [params]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    if (name === "maxDevices") {
      setFormData({ ...formData, [name]: parseInt(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle update license form submission
  const handleUpdateLicense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/licenses/${licenseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update license");
      }

      // Close dialog and refresh license details
      setOpenEditDialog(false);
      fetchLicense(licenseId);
    } catch (err) {
      console.error("Error updating license:", err);
      // You could add error handling in the UI here
    }
  };

  // Handle license deletion
  const handleDeleteLicense = async () => {
    try {
      const response = await fetch(`/api/licenses/${licenseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete license");
      }

      // Navigate back to licenses list
      router.push("/admin/licenses");
    } catch (err) {
      console.error("Error deleting license:", err);
      // You could add error handling in the UI here
    }
  };

  // Handle license extension
  const handleExtendLicense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/licenses/${licenseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiresAt: formData.expiresAt,
          status: "ACTIVE", // Also set status back to active when extending
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to extend license");
      }

      // Close dialog and refresh license details
      setOpenExtendDialog(false);
      fetchLicense(licenseId);
    } catch (err) {
      console.error("Error extending license:", err);
      // You could add error handling in the UI here
    }
  };

  // Get badge color based on license status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Active</Badge>;
      case "EXPIRED":
        return <Badge className="bg-orange-500">Expired</Badge>;
      case "REVOKED":
        return <Badge className="bg-red-500">Revoked</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  // Using the DateDisplay component for dates

  // Format timestamp for logs
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy HH:mm:ss");
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
          Error Loading License
        </h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => fetchLicense(licenseId)}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // Not found state
  if (!license) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">
          License Not Found
        </h2>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/licenses")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Licenses
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => router.push("/admin/licenses")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">License Details</h1>
        </div>

        <div className="flex gap-2">
          <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Edit License</DialogTitle>
                <DialogDescription>
                  Update the license information. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateLicense}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cinNumber">National ID</Label>
                      <Input
                        id="cinNumber"
                        name="cinNumber"
                        value={formData.cinNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxDevices">Maximum Devices</Label>
                      <Select
                        onValueChange={(value) =>
                          handleSelectChange("maxDevices", value)
                        }
                        defaultValue={formData.maxDevices.toString()}
                        value={formData.maxDevices.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 device</SelectItem>
                          <SelectItem value="2">2 devices</SelectItem>
                          <SelectItem value="3">3 devices</SelectItem>
                          <SelectItem value="5">5 devices</SelectItem>
                          <SelectItem value="10">10 devices</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        onValueChange={(value) =>
                          handleSelectChange("status", value)
                        }
                        defaultValue={formData.status}
                        value={formData.status}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="EXPIRED">Expired</SelectItem>
                          <SelectItem value="REVOKED">Revoked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openExtendDialog} onOpenChange={setOpenExtendDialog}>
            <DialogTrigger asChild>
              <Button>
                <RefreshCw className="mr-2 h-4 w-4" />
                Extend
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Extend License</DialogTitle>
                <DialogDescription>
                  Set a new expiration date for this license
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleExtendLicense}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">New Expiration Date</Label>
                    <Input
                      id="expiresAt"
                      name="expiresAt"
                      type="date"
                      value={formData.expiresAt}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Extend License</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={openDeleteDialog}
            onOpenChange={setOpenDeleteDialog}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  license and remove all associated device activations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteLicense}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Basic License Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">License Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">License Key</Label>
                <p className="font-mono text-sm mt-1 p-2 bg-gray-100 rounded">
                  {license.licenseKey}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <p className="mt-1">{getStatusBadge(license.status)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Max Devices</Label>
                  <p className="mt-1">{license.maxDevices}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Created</Label>
                  <p className="mt-1 text-sm flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                    {format(new Date(license.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Expires</Label>
                  <p className="mt-1 text-sm">
                    <DateDisplay date={license.expiresAt} />
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Full Name</Label>
                <p className="mt-1 flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  {license.fullName}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">National ID</Label>
                <p className="mt-1 flex items-center">
                  <Shield className="mr-2 h-4 w-4 text-gray-500" />
                  {license.cinNumber}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <p className="mt-1 text-sm break-all">{license.email}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Phone Number</Label>
                <p className="mt-1 text-sm">{license.phoneNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CIN Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Customer Identification Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">{license.cinNumber}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Devices Card */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Devices</CardTitle>
            <CardDescription>
              Devices that have activated this license
            </CardDescription>
          </CardHeader>
          <CardContent>
            {license.devices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device Name</TableHead>
                      <TableHead>Device ID</TableHead>
                      <TableHead>First Seen</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {license.devices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Computer className="mr-2 h-4 w-4 text-gray-500" />
                            {device.deviceName || "Unknown Device"}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {device.deviceId}
                        </TableCell>
                        <TableCell>
                          {format(new Date(device.firstSeenAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(device.lastSeenAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{device.ipAddress || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 border rounded-md">
                <Computer className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No devices have activated this license yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Logs Card */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
            <CardDescription>Recent license activity</CardDescription>
          </CardHeader>
          <CardContent>
            {license.activationLogs.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Device ID</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {license.activationLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {log.action.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="font-mono text-xs truncate max-w-[10rem]"
                          title={log.deviceId}
                        >
                          {log.deviceId}
                        </TableCell>
                        <TableCell>{log.ipAddress || "N/A"}</TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge className="bg-green-500">Success</Badge>
                          ) : (
                            <Badge className="bg-red-500">Failed</Badge>
                          )}
                        </TableCell>
                        <TableCell
                          className="max-w-[12rem] truncate"
                          title={log.details || ""}
                        >
                          {log.details || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 border rounded-md">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No activity logs yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warning about expired or revoked license */}
      {license.status !== "ACTIVE" && (
        <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-700">
              {license.status === "EXPIRED"
                ? "This license has expired"
                : "This license has been revoked"}
            </p>
            <p className="text-sm text-yellow-600 mt-1">
              {license.status === "EXPIRED"
                ? "Users will not be able to use the software until you extend the license."
                : "Users will not be able to use the software until you change the status back to active."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
