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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui";
import { format, subDays, subMonths } from "date-fns";

interface ActivationData {
  date: string;
  activations: number;
  validations: number;
}

interface LicenseStatusData {
  name: string;
  value: number;
  color: string;
}

interface DeviceTypeData {
  name: string;
  value: number;
  color: string;
}

interface ConversionData {
  month: string;
  trials: number;
  conversions: number;
  rate: number;
}

function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activationData, setActivationData] = useState<ActivationData[]>([]);
  const [licenseStatusData, setLicenseStatusData] = useState<
    LicenseStatusData[]
  >([]);
  const [deviceTypeData, setDeviceTypeData] = useState<DeviceTypeData[]>([]);
  const [conversionData, setConversionData] = useState<ConversionData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("week");

  // Function to fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Normally, we would fetch this data from an API endpoint
      // For now, we'll generate some sample data
      generateSampleData();
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate sample data
  const generateSampleData = () => {
    // Generate activation data
    const activationSampleData: ActivationData[] = [];
    const dayCount =
      selectedTimeframe === "week"
        ? 7
        : selectedTimeframe === "month"
        ? 30
        : 90;

    for (let i = dayCount - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      activationSampleData.push({
        date: format(date, "MMM dd"),
        activations: Math.floor(Math.random() * 10) + 1,
        validations: Math.floor(Math.random() * 30) + 5,
      });
    }
    setActivationData(activationSampleData);

    // Generate license status data
    setLicenseStatusData([
      { name: "Active", value: 65, color: "#22c55e" },
      { name: "Expired", value: 25, color: "#f97316" },
      { name: "Revoked", value: 10, color: "#ef4444" },
    ]);

    // Generate device type data
    setDeviceTypeData([
      { name: "Windows", value: 58, color: "#3b82f6" },
      { name: "macOS", value: 27, color: "#8b5cf6" },
      { name: "Linux", value: 10, color: "#ec4899" },
      { name: "Other", value: 5, color: "#6b7280" },
    ]);

    // Generate conversion data
    const conversionSampleData: ConversionData[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = format(subMonths(new Date(), i), "MMM yy");
      const trials = Math.floor(Math.random() * 50) + 20;
      const conversions = Math.floor(Math.random() * trials * 0.7);
      const rate = Math.round((conversions / trials) * 100);

      conversionSampleData.push({
        month,
        trials,
        conversions,
        rate,
      });
    }
    setConversionData(conversionSampleData);
  };

  // Initialize with analytics data
  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeframe]);

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value);
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
          Error Loading Analytics
        </h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => fetchAnalyticsData()}
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
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <Tabs
            defaultValue="week"
            value={selectedTimeframe}
            onValueChange={handleTimeframeChange}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* License Activations Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>License Activity</CardTitle>
            <CardDescription>
              Number of activations and validations over time
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activationData}
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
                />
                <Line type="monotone" dataKey="validations" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* License Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>License Status Distribution</CardTitle>
            <CardDescription>
              Current distribution of license statuses
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={licenseStatusData}
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
                  {licenseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Device Type Distribution</CardTitle>
            <CardDescription>
              Types of devices using the software
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
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

        {/* Conversion Rate Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Trial Conversion Metrics</CardTitle>
            <CardDescription>
              Trial to paid license conversion rates by month
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={conversionData}
                margin={{
                  top: 5,
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
      </div>

      <div className="mt-8">
        <div className="flex items-center mb-4">
          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
          <h2 className="text-xl font-semibold">Key Insights</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Top Growth Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                Wednesday
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                25% higher activations than average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                Avg. Devices Per License
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.8</div>
              <p className="text-muted-foreground text-sm mt-1">
                Up from 1.5 last {selectedTimeframe}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">License Renewal Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">76%</div>
              <p className="text-muted-foreground text-sm mt-1">
                Based on expirations in the last 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>Note: This is sample data for demonstration purposes only.</p>
      </div>
    </div>
  );
}

export default AnalyticsPage;
