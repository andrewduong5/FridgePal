import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CheckCircle2, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";

const COLORS = {
  used: "#10b981", // Emerald-500
  wasted: "#f43f5e", // Rose-500
};

export default function InsightsTab({ history = [] }) {
  // Only look at actionable history logs with a positive quantity
  const validHistory = history.filter(
    (i) => (i.status === "used" || i.status === "wasted") && Number(i.quantity) > 0
  );

  const usedRecords = validHistory.filter((i) => i.status === "used");
  const wastedRecords = validHistory.filter((i) => i.status === "wasted");

  // Sum exact quantities logged
  const totalUnitsUsed = Math.round(
    usedRecords.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) * 10
  ) / 10;

  const totalUnitsWasted = Math.round(
    wastedRecords.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) * 10
  ) / 10;

  const totalPortions = Math.round((totalUnitsUsed + totalUnitsWasted) * 10) / 10;

  if (totalPortions === 0) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-stone-800 text-lg mb-1">No Activity Logged Yet</h4>
        <p className="text-stone-500 text-sm max-w-sm mx-auto">
          Start cooking meals or logging portions from your fridge to see your real food usage and eco-efficiency analytics here.
        </p>
      </div>
    );
  }

  const chartData = [
    { name: "Used", value: totalUnitsUsed, color: COLORS.used },
    { name: "Wasted", value: totalUnitsWasted, color: COLORS.wasted },
  ];

  const usedPercentage = Math.round((totalUnitsUsed / totalPortions) * 100);
  const wastedPercentage = 100 - usedPercentage;

  // Breakdown by category
  const categoryStats = validHistory.reduce((acc, item) => {
    const cat = item.category || "Pantry";
    if (!acc[cat]) acc[cat] = { used: 0, wasted: 0 };
    const qty = Number(item.quantity) || 0;
    if (item.status === "wasted") {
      acc[cat].wasted += qty;
    } else {
      acc[cat].used += qty;
    }
    return acc;
  }, {});

  const categories = Object.keys(categoryStats);

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-800">Food Efficiency Insights</h3>
            <p className="text-xs text-stone-400">
              Calculated from exact quantities and cooking portions
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/60 rounded-full text-xs font-semibold text-emerald-700">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{usedPercentage}% Efficiency</span>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-900">Total Saved</span>
            </div>
            <p className="text-2xl font-extrabold text-emerald-700">
              {totalUnitsUsed}{" "}
              <span className="text-xs font-semibold text-emerald-600/80">units</span>
            </p>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">
              Across {usedRecords.length} log{usedRecords.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-semibold text-rose-900">Total Wasted</span>
            </div>
            <p className="text-2xl font-extrabold text-rose-600">
              {totalUnitsWasted}{" "}
              <span className="text-xs font-semibold text-rose-500/80">units</span>
            </p>
            <p className="text-[11px] text-rose-700/70 mt-0.5">
              Across {wastedRecords.length} log{wastedRecords.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="relative flex flex-col items-center">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={4}
                  stroke="none"
                >
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} units`, name]}
                  contentStyle={{
                    borderRadius: "1rem",
                    border: "1px solid #e7e5e4",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="absolute top-[82px] flex flex-col items-center pointer-events-none">
            <span className="text-2xl font-black text-stone-800">{usedPercentage}%</span>
            <span className="text-[11px] text-stone-400 font-semibold tracking-wide uppercase">
              Used
            </span>
          </div>

          <div className="flex items-center justify-center gap-6 mt-2 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-stone-700">Used ({usedPercentage}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-stone-700">Wasted ({wastedPercentage}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-stone-800">Usage by Category</h4>
          <div className="space-y-2.5">
            {categories.map((cat) => {
              const u = Math.round(categoryStats[cat].used * 10) / 10;
              const w = Math.round(categoryStats[cat].wasted * 10) / 10;
              const catTotal = u + w;
              const catUsedPct = catTotal > 0 ? Math.round((u / catTotal) * 100) : 100;

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-stone-700">{cat}</span>
                    <span className="text-stone-500">
                      {u} saved {w > 0 && <span className="text-rose-500">· {w} lost</span>}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-rose-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${catUsedPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Logs with Exact Units */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-stone-800">Recent Activity Logs</h4>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {validHistory.slice(0, 10).map((item, idx) => {
            const isWasted = item.status === "wasted";
            return (
              <div
                key={item.id || idx}
                className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-100"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isWasted ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                  />
                  <span className="font-medium text-stone-800">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-stone-700">
                    {item.quantity} {item.unit || "units"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isWasted
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {isWasted ? "Wasted" : "Used"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}