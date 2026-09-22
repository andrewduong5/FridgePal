import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = { used: "#4ade80", wasted: "#ef4444" };

export default function InsightsTab({ history }) {
  const used = history.filter((i) => i.status === "used").length;
  const wasted = history.filter((i) => i.status === "wasted").length;
  const total = used + wasted;

  if (total === 0) {
    return (
      <div className="text-center py-16 text-stone-500">
        Mark items as used or wasted to see your insights here.
      </div>
    );
  }

  const data = [
    { name: "Used", value: used, color: COLORS.used },
    { name: "Wasted", value: wasted, color: COLORS.wasted },
  ];
  const wastedPct = Math.round((wasted / total) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
      <h3 className="text-lg font-semibold text-stone-800 mb-2">Food Usage</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-stone-600 mt-2">
        {wastedPct > 0
          ? <>That's <span className="font-semibold text-red-500">{wastedPct}%</span> of your food wasted.</>
          : "Great job — no food wasted!"}
      </p>
    </div>
  );
}