import { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertCircle, CheckCircle, Menu, X } from 'lucide-react';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState({
    anomalies: 12,
    savings: '$4,582',
    roi: '340%',
    actions_pending: 5
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        anomalies: 8,
        savings: '$5,240',
        roi: '385%',
        actions_pending: 3
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 sticky top-0 z-50 bg-slate-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Costintel
              </h1>
            </div>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-2">Active Anomalies</p>
                <p className="text-3xl font-bold text-orange-400">{metrics.anomalies}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-500/30" />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-2">Total Savings</p>
                <p className="text-3xl font-bold text-green-400">{metrics.savings}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500/30" />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-2">ROI Realized</p>
                <p className="text-3xl font-bold text-blue-400">{metrics.roi}</p>
              </div>
              <Activity className="w-12 h-12 text-blue-500/30" />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-2">Pending Actions</p>
                <p className="text-3xl font-bold text-yellow-400">{metrics.actions_pending}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-yellow-500/30" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-slate-800/30 p-2 rounded-lg border border-slate-700 w-fit">
          {['dashboard', 'anomalies', 'insights', 'actions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Panels */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">System Overview</h2>
              <p className="text-slate-300 mb-4">
                Costintel is monitoring your cloud infrastructure for cost anomalies and optimization opportunities.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Status</p>
                  <p className="text-green-400 font-semibold">All Systems Operational</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Last Update</p>
                  <p className="text-blue-400 font-semibold">2 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-orange-500/50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <AlertCircle size={20} className="text-orange-500" />
                    EC2 Usage Spike
                  </h3>
                  <p className="text-slate-300 text-sm mb-3">
                    Unexpected 45% increase in EC2 instance count detected in us-east-1 region
                  </p>
                  <div className="flex gap-2">
                    <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded text-xs font-medium">HIGH SEVERITY</span>
                    <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs font-medium">2 hours ago</span>
                  </div>
                </div>
                <button className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-medium transition">
                  Investigate
                </button>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-orange-500/50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <AlertCircle size={20} className="text-orange-500" />
                    RDS Database Scaling
                  </h3>
                  <p className="text-slate-300 text-sm mb-3">
                    Database instance automatically scaled up 3 times in the last week
                  </p>
                  <div className="flex gap-2">
                    <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded text-xs font-medium">MEDIUM SEVERITY</span>
                    <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs font-medium">12 hours ago</span>
                  </div>
                </div>
                <button className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-medium transition">
                  Investigate
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">AI-Generated Insights</h2>
              <p className="text-slate-300 mb-4">
                Based on your infrastructure patterns, here are the top optimization recommendations:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 p-3 bg-slate-900 rounded-lg">
                  <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-slate-300">
                    <strong>Reserved Instances:</strong> Switch 60% of on-demand EC2s to Reserved Instances for 40% cost savings
                  </span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-slate-900 rounded-lg">
                  <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-slate-300">
                    <strong>Unused Resources:</strong> 8 unattached EBS volumes consuming $234/month
                  </span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-slate-900 rounded-lg">
                  <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-slate-300">
                    <strong>Data Transfer:</strong> Optimize cross-AZ data transfer to reduce costs by $180/month
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 border-l-4 border-l-green-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <CheckCircle size={20} className="text-green-500" />
                    Cleaned Up Old Snapshots
                  </h3>
                  <p className="text-slate-300 text-sm mb-2">
                    Automatically deleted 24 outdated EBS snapshots from 2023
                  </p>
                  <div className="flex gap-2">
                    <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded text-xs font-medium">COMPLETED</span>
                    <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded text-xs font-medium">Saved: $450</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 border-l-4 border-l-blue-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <CheckCircle size={20} className="text-blue-500" />
                    Lambda Function Optimization
                  </h3>
                  <p className="text-slate-300 text-sm mb-2">
                    Reduced memory allocation on 12 Lambda functions, optimized cold start times
                  </p>
                  <div className="flex gap-2">
                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded text-xs font-medium">IN PROGRESS</span>
                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded text-xs font-medium">Est. Savings: $890</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6 text-center text-slate-400 text-sm">
        <p>Costintel - Cloud Cost Intelligence Platform | Powered by xAI Grok</p>
      </footer>
    </div>
  );
}
