import React, { useState, useEffect } from 'react';
import { Zap, TrendingDown, AlertCircle, CheckCircle2, ChevronRight, Brain, Activity, BarChart3, Settings } from 'lucide-react';

interface Anomaly {
  id: number;
  title: string;
  severity: 'low' | 'medium' | 'high';
  service: string;
  cost: number;
  timestamp: string;
  status: 'investigating' | 'resolved';
}

interface Insight {
  id: number;
  title: string;
  description: string;
  impact: string;
  status: 'pending' | 'applied';
}

interface Action {
  id: number;
  name: string;
  type: 'auto' | 'manual';
  savings: number;
  timestamp: string;
}

export function HomePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'anomalies' | 'insights' | 'actions'>('dashboard');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([
    {
      id: 1,
      title: 'EC2 Demand Spike',
      severity: 'high',
      service: 'us-east-1',
      cost: 450,
      timestamp: '2024-03-28 02:15 AM',
      status: 'investigating'
    },
    {
      id: 2,
      title: 'Storage Anomaly',
      severity: 'medium',
      service: 'S3',
      cost: 124,
      timestamp: '2024-03-28 01:45 AM',
      status: 'resolved'
    },
    {
      id: 3,
      title: 'Lambda Throttling',
      severity: 'medium',
      service: 'Lambda',
      cost: 89,
      timestamp: '2024-03-28 12:30 AM',
      status: 'resolved'
    }
  ]);

  const [insights, setInsights] = useState<Insight[]>([
    {
      id: 1,
      title: 'Implement stricter scaling bounds',
      description: 'Costs increased by 18% due to anomalous scaling of the e-commerce backend cluster in us-east-1 during off-peak hours.',
      impact: '-$450/week',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Cleanup unattached volumes',
      description: 'Detected 4 unattached EBS volumes left over from terminated c5.xlarge instances in the development environment.',
      impact: '-$124/week',
      status: 'applied'
    }
  ]);

  const [actions, setActions] = useState<Action[]>([
    { id: 1, name: 'Executed cleanup storage logic', type: 'auto', savings: 0.01, timestamp: '3/28/2026 01:48 AM' },
    { id: 2, name: 'Executed cleanup storage logic', type: 'auto', savings: 0.00, timestamp: '3/28/2026 01:47 AM' },
    { id: 3, name: 'Executed throttle lambda logic', type: 'auto', savings: 0.00, timestamp: '3/28/2026 01:47 AM' },
  ]);

  const totalSavings = 0.30;
  const anomaliesDetected = anomalies.length;
  const monitoringCost = 5.10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">COSTINTEL</h1>
              <p className="text-xs text-indigo-400">Sentinel v4.2</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm text-zinc-400 hover:text-white transition">Docs</button>
            <button className="w-10 h-10 rounded-full bg-indigo-600 text-white text-sm font-bold">n</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">Welcome back, Administrator 👋</h2>
          <p className="text-zinc-400">Monitoring ${monitoringCost} across your infrastructure</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-6 backdrop-blur-sm hover:bg-red-950/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm font-semibold uppercase tracking-wider">Anomalies</p>
                <p className="text-3xl font-bold text-white mt-2">{anomaliesDetected}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-500/30" />
            </div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-6 backdrop-blur-sm hover:bg-emerald-950/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Total Savings</p>
                <p className="text-3xl font-bold text-white mt-2">${totalSavings}</p>
              </div>
              <TrendingDown className="w-12 h-12 text-emerald-500/30" />
            </div>
          </div>

          <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-2xl p-6 backdrop-blur-sm hover:bg-indigo-950/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">ROI Realized</p>
                <p className="text-3xl font-bold text-white mt-2">+100%</p>
              </div>
              <Activity className="w-12 h-12 text-indigo-500/30" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/5">
          {(['dashboard', 'anomalies', 'insights', 'actions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold uppercase text-xs tracking-wider transition border-b-2 ${
                activeTab === tab
                  ? 'text-indigo-400 border-indigo-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {tab === 'dashboard' && 'Overview'}
              {tab === 'anomalies' && 'Anomalies'}
              {tab === 'insights' && 'AI Insights'}
              {tab === 'actions' && 'Actions'}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                Automated Intelligence Summary
              </h3>
              <p className="text-indigo-300 bg-indigo-950/30 rounded-lg p-4 border border-indigo-900/50">
                <span className="font-bold">Insight:</span> Cost spiked mid-week due to unplanned EC2 scaling. Our autonomous corrections stabilized the run-rate, reducing your weekly spend by 28%.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Recent Actions
                </h3>
                <div className="space-y-3">
                  {actions.slice(0, 3).map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-white text-sm font-medium">{action.name}</p>
                        <p className="text-zinc-500 text-xs">{action.timestamp}</p>
                      </div>
                      <p className="text-emerald-400 font-bold">${action.savings.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  Service Breakdown
                </h3>
                <div className="space-y-3">
                  {[
                    { service: 'EC2', cost: 2.78, percent: 54 },
                    { service: 'S3', cost: 1.35, percent: 26 },
                    { service: 'Lambda', cost: 0.88, percent: 17 },
                    { service: 'RDS', cost: 0.09, percent: 3 }
                  ].map((item) => (
                    <div key={item.service}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white text-sm font-medium">{item.service}</span>
                        <span className="text-zinc-400 text-sm">${item.cost}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400" style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && (
          <div className="space-y-4">
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {anomaly.severity === 'high' && <span className="px-3 py-1 bg-red-900/40 text-red-400 text-xs font-bold rounded-full border border-red-900">HIGH</span>}
                      {anomaly.severity === 'medium' && <span className="px-3 py-1 bg-amber-900/40 text-amber-400 text-xs font-bold rounded-full border border-amber-900">MEDIUM</span>}
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        anomaly.status === 'investigating'
                          ? 'bg-amber-900/40 text-amber-400 border-amber-900'
                          : 'bg-emerald-900/40 text-emerald-400 border-emerald-900'
                      }`}>
                        {anomaly.status === 'investigating' ? 'Investigating' : 'Resolved'}
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-lg mb-1">{anomaly.title}</h4>
                    <p className="text-zinc-400 text-sm mb-2">Service: {anomaly.service}</p>
                    <p className="text-zinc-500 text-xs">{anomaly.timestamp}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold text-lg">${anomaly.cost}</p>
                    <p className="text-zinc-500 text-xs">Estimated Savings</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-indigo-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-bold text-lg">{insight.title}</h4>
                      <p className="text-zinc-400 text-sm mt-1">{insight.description}</p>
                    </div>
                  </div>
                  {insight.status === 'applied' && <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <p className="text-emerald-400 font-bold">{insight.impact}</p>
                  {insight.status === 'pending' && (
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition flex items-center gap-2">
                      Execute <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-zinc-400 font-semibold">Action</th>
                  <th className="text-left py-3 px-4 text-zinc-400 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 text-zinc-400 font-semibold">Savings</th>
                  <th className="text-left py-3 px-4 text-zinc-400 font-semibold">Executed</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action) => (
                  <tr key={action.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-4 px-4 text-white font-medium">{action.name}</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs font-semibold uppercase">
                        {action.type === 'auto' ? 'Autonomous' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-emerald-400 font-bold">${action.savings.toFixed(2)}</td>
                    <td className="py-4 px-4 text-zinc-500">{action.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
