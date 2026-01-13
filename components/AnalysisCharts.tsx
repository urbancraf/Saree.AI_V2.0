import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { StyleMetric } from '../types';

interface AnalysisChartsProps {
  data: StyleMetric[];
}

export const AnalysisCharts: React.FC<AnalysisChartsProps> = ({ data }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="attribute" tick={{ fill: '#475569', fontSize: 12 }} />
          <Radar
            name="Style Profile"
            dataKey="value"
            stroke="#be185d"
            fill="#ec4899"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};