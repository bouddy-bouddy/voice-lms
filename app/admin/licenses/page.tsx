"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
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
import { Label } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  AlertCircle,
  Plus,
  Search,
  Calendar,
  RefreshCw,
  Filter,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { EmailNotificationToggle } from "@/components/ui";
import { toast } from "sonner";

// License type definition
interface License {
  id: string;
  licenseKey: string;
  fullName: string;
  cinNumber: string;
  email: string;
  maxDevices: number;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  createdAt: string;
  expiresAt: string;
  _count: {
    devices: number;
  };
}

// Pagination type
interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function LicensesPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [sendEmail, setSendEmail] = useState<boolean>(true);

  // Form state for creating a new license
  const [formData, setFormData] = useState({
    fullName: "",
    cinNumber: "",
    email: "",
    phoneNumber: "",
    maxDevices: 1,
  });

  // Function to fetch licenses with filters
  const fetchLicenses = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", pagination.limit.toString());

      if (searchTerm) {
        queryParams.append("name", searchTerm);
      }

      if (statusFilter) {
        queryParams.append("status", statusFilter);
      }

      const response = await fetch(`/api/licenses?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch licenses");
      }

      const data = await response.json();
      setLicenses(data.licenses);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching licenses:", err);
      setError("Failed to load licenses");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with first page of licenses
  useEffect(() => {
    fetchLicenses(1);
  }, [searchTerm, statusFilter]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: parseInt(value) });
  };

  // Handle create license form submission
  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/licenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sendEmail: sendEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create license");
      }

      const data = await response.json();

      // Close dialog and refresh license list
      setOpenCreateDialog(false);
      fetchLicenses(1);

      // Show success message with email notification status
      if (sendEmail) {
        toast.success(
          `License created successfully. Email notification sent to ${formData.email}`,
          {
            description: `License key: ${data.license.licenseKey}`,
            duration: 5000,
          }
        );
      } else {
        toast.success(`License created successfully`, {
          description: `License key: ${data.license.licenseKey}`,
          duration: 5000,
        });
      }

      // Reset form
      setFormData({
        fullName: "",
        cinNumber: "",
        email: "",
        phoneNumber: "",
        maxDevices: 1,
      });
      setSendEmail(true);
    } catch (err) {
      console.error("Error creating license:", err);
      toast.error("Failed to create license", {
        description:
          "There was an error while creating the license. Please try again.",
      });
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

  // Loading state
  if (isLoading && !licenses.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Error state
  if (error && !licenses.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">
          Error Loading Licenses
        </h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => fetchLicenses(1)}
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
        <h1 className="text-2xl font-bold">License Management</h1>

        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New License
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New License</DialogTitle>
              <DialogDescription>
                Enter the details for the new license. A license key will be
                generated automatically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLicense}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Full name"
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
                      placeholder="National ID number"
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
                      placeholder="Email address"
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
                      placeholder="Phone number"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDevices">Maximum Devices</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("maxDevices", value)
                    }
                    defaultValue="1"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of devices" />
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

                <EmailNotificationToggle
                  enabled={sendEmail}
                  onToggle={setSendEmail}
                />
              </div>
              <DialogFooter>
                <Button type="submit">
                  {sendEmail ? (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Create & Send Email
                    </>
                  ) : (
                    <>Create License</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Licenses</CardTitle>
              <CardDescription>
                Manage license keys and their status
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`${
              showFilters ? "block" : "hidden"
            } mb-6 p-4 bg-slate-50 rounded-md border`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search" className="mb-2 block">
                  Search by Name/CIN
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    placeholder="Search..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status" className="mb-2 block">
                  License Status
                </Label>
                <Select
                  onValueChange={(value) => setStatusFilter(value)}
                  defaultValue=""
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="REVOKED">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Key</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>CIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.length > 0 ? (
                  licenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium">
                        {license.licenseKey}
                      </TableCell>
                      <TableCell>{license.fullName}</TableCell>
                      <TableCell>{license.cinNumber}</TableCell>
                      <TableCell>{getStatusBadge(license.status)}</TableCell>
                      <TableCell>
                        {license._count.devices} / {license.maxDevices}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                          {format(new Date(license.expiresAt), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/licenses/${license.id}`)
                          }
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No licenses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.page > 1) {
                          fetchLicenses(pagination.page - 1);
                        }
                      }}
                      className={
                        pagination.page <= 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  )
                    .filter((page) => {
                      // Display current page, first, last, and pages around current
                      const current = pagination.page;
                      return (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= current - 1 && page <= current + 1)
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis
                      const prevPage = array[index - 1];
                      const showEllipsisBefore =
                        prevPage && page - prevPage > 1;

                      return (
                        <PaginationItem key={page}>
                          {showEllipsisBefore && (
                            <PaginationItem>
                              <PaginationLink href="#" isActive={false}>
                                ...
                              </PaginationLink>
                            </PaginationItem>
                          )}
                          <PaginationLink
                            href="#"
                            isActive={page === pagination.page}
                            onClick={(e) => {
                              e.preventDefault();
                              fetchLicenses(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.page < pagination.totalPages) {
                          fetchLicenses(pagination.page + 1);
                        }
                      }}
                      className={
                        pagination.page >= pagination.totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default LicensesPage;
