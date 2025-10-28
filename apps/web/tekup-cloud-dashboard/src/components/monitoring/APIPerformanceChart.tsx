import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { APIPerformanceMetric, MCPServerMetric } from "../../types";
import { Server, Activity } from "lucide-react";

interface APIPerformanceChartProps {
  data: APIPerformanceMetric[];
  timeRange: "1h" | "6h" | "24h" | "7d";
  mcpServerMetrics?: MCPServerMetric[];
}

export function APIPerformanceChart({ data }: APIPerformanceChartProps) {
  // Group data by endpoint for bar chart
  const endpointData = data.reduce((acc, metric) => {
    const existing = acc.find((item) => item.endpoint === metric.endpoint);
    if (existing) {
      existing.total_requests += 1;
      existing.avg_response_time += metric.response_time;
      existing.error_count += metric.status_code >= 400 ? 1 : 0;
      existing.avg_response_time = existing.avg_response_time / 2; // Running average
    } else {
      acc.push({
        endpoint: metric.endpoint,
        total_requests: 1,
        avg_response_time: metric.response_time,
        error_count: metric.status_code >= 400 ? 1 : 0,
        method: metric.method,
      });
    }
    return acc;
  }, [] as any[]);

  // Time series data for response time trends
  const timeSeriesData = data.slice(0, 20).map((metric) => ({
    timestamp: new Date(metric.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    responseTime: metric.response_time,
    errorRate: metric.status_code >= 400 ? 100 : 0,
    endpoint:
      metric.endpoint.substring(0, 20) +
      (metric.endpoint.length > 20 ? "..." : ""),
  }));

  // Response time distribution for scatter plot
  const scatterData = data.map((metric) => ({
    responseTime: metric.response_time,
    statusCode: metric.status_code,
    size: Math.sqrt(metric.request_size + metric.response_size) / 10, // Scale for visibility
    endpoint: metric.endpoint,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {label || payload[0]?.payload?.endpoint}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === "avg_response_time" && "Avg Response Time: "}
              {entry.dataKey === "total_requests" && "Total Requests: "}
              {entry.dataKey === "error_count" && "Error Count: "}
              {entry.dataKey === "responseTime" && "Response Time: "}
              {entry.dataKey === "errorRate" && "Error Rate: "}
              <span className="font-medium">
                {entry.value}
                {entry.dataKey === "avg_response_time" ||
                entry.dataKey === "responseTime"
                  ? "ms"
                  : ""}
                {entry.dataKey === "errorRate" ? "%" : ""}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* API Endpoint Performance */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            API Endpoint Performance
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Average response times and request volume by endpoint
          </p>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={endpointData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="endpoint"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 11 }}
                tickLine={{ stroke: "#6b7280" }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#6b7280" }}
                label={{
                  value: "Requests",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="total_requests"
                fill="#3b82f6"
                name="Total Requests"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="error_count"
                fill="#ef4444"
                name="Error Count"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Trends */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Response Time Trends
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              API response times over time
            </p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 10 }}
                  tickLine={{ stroke: "#6b7280" }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: "#6b7280" }}
                  label={{
                    value: "Response Time (ms)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                  name="Response Time (ms)"
                />
                <Line
                  type="monotone"
                  dataKey="errorRate"
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Error Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Response Time vs Status Code Scatter */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Response Time Distribution
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Response times by HTTP status code
            </p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart data={scatterData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  type="number"
                  dataKey="statusCode"
                  domain={[190, 210, 290, 310, 390, 410, 490, 510]}
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: "#6b7280" }}
                  label={{
                    value: "Status Code",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="responseTime"
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: "#6b7280" }}
                  label={{
                    value: "Response Time (ms)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {data.endpoint}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Status: {data.statusCode}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Response Time: {data.responseTime}ms
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  dataKey="responseTime"
                  fill="#8b5cf6"
                  fillOpacity={0.7}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
