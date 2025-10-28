import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { InfrastructureMetric, MCPServerMetric, MCPServer } from "../../types";
import { Server, Activity } from "lucide-react";

interface InfrastructureChartProps {
  data: InfrastructureMetric[];
  timeRange: "1h" | "6h" | "24h" | "7d";
  serviceId?: string;
  mcpServerMetrics?: MCPServerMetric[];
  mcpServers?: MCPServer[];
}

export function InfrastructureChart({ data }: InfrastructureChartProps) {
  // Process data for charts
  const chartData = data.map((metric) => ({
    timestamp: new Date(metric.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    cpu: Math.round(metric.cpu_usage),
    memory: Math.round(metric.memory_usage),
    disk: Math.round(metric.disk_usage),
    networkIn: Math.round(metric.network_in),
    networkOut: Math.round(metric.network_out),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === "cpu" && "CPU: "}
              {entry.dataKey === "memory" && "Memory: "}
              {entry.dataKey === "disk" && "Disk: "}
              {entry.dataKey === "networkIn" && "Network In: "}
              {entry.dataKey === "networkOut" && "Network Out: "}
              <span className="font-medium">
                {entry.value}
                {entry.dataKey.includes("network") ? " KB/s" : "%"}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CPU & Memory Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            CPU & Memory Usage
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            System resource utilization over time
          </p>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#6b7280" }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#6b7280" }}
                label={{
                  value: "Usage (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444", strokeWidth: 2, r: 3 }}
                name="CPU Usage"
              />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                name="Memory Usage"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Disk & Network Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Disk & Network I/O
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Storage and network utilization over time
          </p>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#6b7280" }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#6b7280" }}
                label={{ value: "KB/s", angle: -90, position: "insideLeft" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="networkIn"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Network In"
              />
              <Area
                type="monotone"
                dataKey="networkOut"
                stackId="2"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
                name="Network Out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}
