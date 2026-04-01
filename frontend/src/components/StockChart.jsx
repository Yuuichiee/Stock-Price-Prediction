import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
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

  return (
    <div className="w-full h-96 p-4 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  tickMargin={10}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  tickMargin={10}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                
                <Area type="monotone" dataKey="Historical" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHist)" activeDot={{r: 6}} />
                <Area type="monotone" dataKey="Predicted" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPred)" activeDot={{r: 6}} />
                
            </ComposedChart>
        </ResponsiveContainer>
    </div>
  );
}
