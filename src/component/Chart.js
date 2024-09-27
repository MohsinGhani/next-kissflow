import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

const ChartComponent = ({ data, dataKey, label, key }) => {
  return (
    <div className="my-4 w-full" style={{ height: "400px" }}>
      <h3 className="my-5 text-lg font-medium">{label} :</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" tickFormatter={(year) => year} />
          <YAxis />
          <RechartsTooltip />
          <Line type="monotone" dataKey={dataKey} stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent;
