"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  KeyRound,
  Users,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  RefreshCw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";

interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  revokedLicenses: number;
  totalDevices: number;
  activeTrials: number;
  expiredTrials: number;
  convertedTrials: number;
  conversionRate: string;
  recentActivations: RecentActivation[];
}

interface RecentActivation {
  id: string;
  licenseKey: string;
  fullName: string;
  deviceId: string;
  timestamp: string;
}

interface DailyActivity {
  date: string;
  activations: number;
  validations: number;
}

interface DeviceTypeData {
  name: string;
  value: number;
  color: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<DailyActivity[]>([]);
  const [deviceTypeData, setDeviceTypeData] = useState<DeviceTypeData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);

      // Fetch license statistics
      const licenseRes = await fetch("/api/statistics/licenses");
      const licenseData = await licenseRes.json();

      // Fetch trial statistics
      const trialRes = await fetch("/api/statistics/trials");
      const trialData = await trialRes.json();

      setStats({
        totalLicenses: licenseData.totalLicenses || 0,
        activeLicenses: licenseData.activeLicenses || 0,
        expiredLicenses: licenseData.expiredLicenses || 0,
        revokedLicenses: licenseData.revokedLicenses || 0,
        totalDevices: licenseData.totalDevices || 0,
        activeTrials: trialData.stats.activeTrials || 0,
        expiredTrials: trialData.stats.expiredTrials || 0,
        convertedTrials: trialData.stats.convertedTrials || 0,
        conversionRate: trialData.stats.conversionRate || "0%",
        recentActivations: licenseData.recentActivations || [],
      });

      // Generate sample activity data
      generateActivityData();

      // Generate sample device type data
      setDeviceTypeData([
        { name: "Windows", value: 58, color: "#3b82f6" },
        { name: "macOS", value: 27, color: "#8b5cf6" },
        { name: "Linux", value: 10, color: "#ec4899" },
        { name: "Other", value: 5, color: "#6b7280" },
      ]);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError("Failed to load dashboard statistics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Helper function to generate sample activity data
  const generateActivityData = () => {
    const data: DailyActivity[] = [];

    for (let i = 14; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Generate more realistic data with weekday patterns
      const activationBase = dayOfWeek === 0 || dayOfWeek === 6 ? 2 : 5;
      const validationBase = dayOfWeek === 0 || dayOfWeek === 6 ? 10 : 25;

      data.push({
        date: format(date, "MMM dd"),
        activations:
          Math.floor(Math.random() * activationBase) +
          (dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 3),
        validations:
          Math.floor(Math.random() * validationBase) +
          (dayOfWeek === 0 || dayOfWeek === 6 ? 5 : 15),
      });
    }

    setActivityData(data);
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
          Error Loading Dashboard
        </h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* License Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Licenses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Licenses
            </CardTitle>
            <KeyRound className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalLicenses.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Across all statuses</p>
          </CardContent>
        </Card>

        {/* Active Licenses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Licenses
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeLicenses.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalLicenses
                ? `${(
                    (stats.activeLicenses / stats.totalLicenses) *
                    100
                  ).toFixed(1)}% of total`
                : "0% of total"}
            </p>
          </CardContent>
        </Card>

        {/* Expired Licenses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Expired Licenses
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.expiredLicenses.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalLicenses
                ? `${(
                    (stats.expiredLicenses / stats.totalLicenses) *
                    100
                  ).toFixed(1)}% of total`
                : "0% of total"}
            </p>
          </CardContent>
        </Card>

        {/* Total Devices Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalDevices.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg.{" "}
              {stats?.activeLicenses && stats?.totalDevices
                ? (stats.totalDevices / stats.activeLicenses).toFixed(1)
                : "0"}{" "}
              devices per license
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Graph and Device Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Activity Graph */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>License Activity</CardTitle>
            <CardDescription>
              Activations and validations over the last 15 days
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activityData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="activations"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  name="New Activations"
                />
                <Line
                  type="monotone"
                  dataKey="validations"
                  stroke="#82ca9d"
                  name="License Validations"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Device Distribution</CardTitle>
            <CardDescription>
              Types of devices using the software
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trial Statistics */}
      <h2 className="text-xl font-bold mt-10 mb-6">Trial Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Active Trials Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeTrials.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">7-day trial period</p>
          </CardContent>
        </Card>

        {/* Expired Trials Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Expired Trials
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.expiredTrials.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Did not convert to license
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.conversionRate || "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.convertedTrials || 0} conversions from{" "}
              {(stats?.activeTrials || 0) +
                (stats?.expiredTrials || 0) +
                (stats?.convertedTrials || 0)}{" "}
              trials
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trial Conversion Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Trial to License Conversion</CardTitle>
          <CardDescription>
            Monthly conversion metrics over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { month: "Oct", trials: 42, conversions: 18, rate: 43 },
                { month: "Nov", trials: 38, conversions: 15, rate: 39 },
                { month: "Dec", trials: 55, conversions: 21, rate: 38 },
                { month: "Jan", trials: 47, conversions: 19, rate: 40 },
                { month: "Feb", trials: 52, conversions: 24, rate: 46 },
                { month: "Mar", trials: 58, conversions: 28, rate: 48 },
              ]}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="trials"
                name="Total Trials"
                fill="#8884d8"
              />
              <Bar
                yAxisId="left"
                dataKey="conversions"
                name="Conversions"
                fill="#82ca9d"
              />
              <Bar
                yAxisId="right"
                dataKey="rate"
                name="Conversion Rate (%)"
                fill="#ffc658"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <h2 className="text-xl font-bold mt-10 mb-6">Recent Activity</h2>
      <Card>
        <CardHeader>
          <CardTitle>Recent License Activations</CardTitle>
          <CardDescription>The latest license activations</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentActivations && stats.recentActivations.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivations.map((activation) => (
                <div
                  key={activation.id}
                  className="flex items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="bg-blue-100 rounded-full p-2 mr-4">
                    <Check className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{activation.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activation.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      License key:{" "}
                      <span className="font-mono">{activation.licenseKey}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Device ID: {activation.deviceId.substring(0, 16)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent activations</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-sm text-gray-500">
        <p>Dashboard last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
