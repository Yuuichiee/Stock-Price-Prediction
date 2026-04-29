import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area
} from 'recharts';

export default function StockChart({ historical, predictions }) {
  // Combine historical and predictions for a continuous chart
  // Add a "type" field to distinguish line color
  
  const dataMap = new Map();
  
  // Historical Data
  if (historical) {
    historical.forEach(point => {
        dataMap.set(point.Date, { Date: point.Date, Historical: point.Close });
    });
  }
  
  // Future Predictions
  if (predictions) {
    predictions.forEach(point => {
        const existing = dataMap.get(point.Date) || { Date: point.Date };
        existing.Predicted = point.Predicted_Close;
        dataMap.set(point.Date, existing);
    });
    
    // Connect the lines: find the last historical point and add it to predictions line
    if (historical && historical.length > 0 && predictions.length > 0) {
        const lastHist = historical[historical.length - 1];
        const existing = dataMap.get(lastHist.Date);
        if (existing) {
            existing.Predicted = lastHist.Close; // connection point
            dataMap.set(lastHist.Date, existing);
        }
    }
  }
  
  // Sort chronologically
  const chartData = Array.from(dataMap.values()).sort((a, b) => new Date(a.Date) - new Date(b.Date));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[320px] sm:h-96 w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800 p-4 text-center text-sm font-bold text-slate-500">
        No chart data available.
      </div>
    );
  }

  return (
    <div className="w-full h-[320px] sm:h-96 p-2 sm:p-4 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 16, right: 8, bottom: 10, left: 0 }}>
                <defs>
                  <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="Date" 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                  tickMargin={10}
                  minTickGap={22}
                  tickFormatter={(value) => String(value).slice(5)}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                  tickMargin={6}
                  width={46}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelFormatter={(value) => `Date: ${value}`}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
                
                <Area type="monotone" dataKey="Historical" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHist)" activeDot={{r: 6}} />
                <Area type="monotone" dataKey="Predicted" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPred)" activeDot={{r: 6}} />
                
            </ComposedChart>
        </ResponsiveContainer>
    </div>
  );
}
