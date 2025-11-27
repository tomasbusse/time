import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useWorkspace } from "../../../lib/WorkspaceContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function LiquidityHistoryChart() {
  const { workspaceId } = useWorkspace();
  const history = useQuery(
    api.simpleFinance.getLiquidityHistory,
    workspaceId ? { workspaceId } : "skip"
  );

  if (!history) {
    return <div>Loading chart...</div>;
  }

  const formatYAxis = (tickItem: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(tickItem);
  };

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={history}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={formatYAxis} />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "EUR",
              }).format(value)
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="totalLiquidity"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}