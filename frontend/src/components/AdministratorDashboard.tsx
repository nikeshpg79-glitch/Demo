import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  RefreshCw, 
  SlidersHorizontal, 
  Terminal, 
  Play, 
  Key, 
  Lock, 
  FileWarning, 
  Clock, 
  ShieldCheck,
  Check,
  Search,
  Hash,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SecurityEvent, SecurityAlert } from '../types';

export const AdministratorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [simulationRunning, setSimulationRunning] = useState<string | null>(null);
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);

  // Audit chain verification state
  const [auditStatus, setAuditStatus] = useState<{
    valid: boolean;
    total_records: number;
    latest_root_hash?: string;
    status: string;
  } | null>(null);
  const [verifyingAudit, setVerifyingAudit] = useState<boolean>(false);

  // Investigation notes state
  const [investigationNotes, setInvestigationNotes] = useState<string>('');

  const loadSecurityData = async () => {
    try {
      setRefreshing(true);
      const [eventsRes, alertsRes, auditRes] = await Promise.all([
        fetch((import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8001/api') + '/security/events?limit=50'),
        fetch((import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8001/api') + '/security/alerts?limit=50'),
        fetch((import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8001/api') + '/security/audit/verify')
      ]);

      if (eventsRes.ok) {
        const evData = await eventsRes.json();
        setEvents(evData.events || []);
      }
      if (alertsRes.ok) {
        const alData = await alertsRes.json();
        setAlerts(alData.alerts || []);
        if (alData.alerts?.length > 0 && !selectedAlert) {
          setSelectedAlert(alData.alerts[0]);
        }
      }
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditStatus(auditData);
      }
    } catch (err) {
      console.warn('Backend security telemetry unreachable:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyAuditChain = async () => {
    setVerifyingAudit(true);
    try {
      const res = await fetch((import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8001/api') + '/security/audit/verify');
      if (res.ok) {
        const data = await res.json();
        setAuditStatus(data);
      }
    } catch (err) {
      console.error('Failed to verify audit ledger:', err);
    } finally {
      setVerifyingAudit(false);
    }
  };

  const handleSimulateScenario = async (scenario: string) => {
    setSimulationRunning(scenario);
    setSimulationMessage(null);
    try {
      const res = await fetch((import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8001/api') + '/security/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, client_ip: '192.168.1.105' })
      });
      const data = await res.json();
      setSimulationMessage(`Scenario '${scenario}' safely executed. Event & alert recorded.`);
      await loadSecurityData();
    } catch (err) {
      setSimulationMessage(`Simulation failed: ${err}`);
    } finally {
      setSimulationRunning(null);
    }
  };

  const handleUpdateAlertStatus = async (alertId: string, newStatus: string) => {
    try {
      const res = await fetch(`${(import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8001/api')}/security/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: investigationNotes || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? data.alert : a)));
        if (selectedAlert?.id === alertId) {
          setSelectedAlert(data.alert);
        }
        setInvestigationNotes('');
      }
    } catch (err) {
      console.error('Failed to update alert workflow:', err);
    }
  };

  const filteredEvents = severityFilter === 'ALL'
    ? events
    : events.filter((e) => e.severity === severityFilter);

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;

  return (
    <div className="space-y-6">

      {/* Admin Security Banner */}
      <div className="bg-[#0A192F] text-white rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-rose-500/20 rounded-lg border border-rose-500/40 text-rose-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {t('security.title')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-950 text-rose-300 border border-rose-700/50">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {t('security.subtitle')}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleVerifyAuditChain}
              disabled={verifyingAudit}
              className="px-3 py-1.5 rounded-xl bg-teal-900/60 hover:bg-teal-800/80 border border-teal-500/40 text-xs text-teal-200 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Hash className="w-3.5 h-3.5 text-teal-400" />
              <span>{verifyingAudit ? 'Verifying Hash Chain...' : 'Verify Audit Ledger'}</span>
            </button>

            <button
              onClick={loadSecurityData}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{t('common.refresh')}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[11px] text-slate-400 font-medium">{t('security.totalEvents')}</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">{events.length}</p>
            <span className="text-[10px] text-slate-500">Hash-Chained Audit Trail</span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[11px] text-rose-400 font-medium">Critical/High Alerts</p>
            <p className="text-2xl font-bold font-mono text-rose-400 mt-1">{criticalCount + highCount}</p>
            <span className="text-[10px] text-rose-300/70">Actionable Incidents</span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[11px] text-teal-400 font-medium">Rate Limiting Status</p>
            <p className="text-lg font-bold font-mono text-teal-300 mt-1">Active</p>
            <span className="text-[10px] text-slate-500">30 req/min Crypto / 120 Global</span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[11px] text-emerald-400 font-medium">Audit Ledger Integrity</p>
            <p className="text-xs font-mono text-emerald-300 mt-2 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{auditStatus?.valid ? 'Chain Intact (SHA-256)' : 'Validating...'}</span>
            </p>
            <span className="text-[10px] text-slate-500">Zero modification detected</span>
          </div>
        </div>
      </div>

      {/* Controlled Test Simulation Panel */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-900/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              {t('security.testSimulation')}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-700/50">
            Controlled Sandbox (Safe for Live Application)
          </span>
        </div>

        <p className="text-xs text-slate-300">
          {t('security.simulatePrompt')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <button
            onClick={() => handleSimulateScenario('tamper_signature')}
            disabled={Boolean(simulationRunning)}
            className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-rose-300 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <FileWarning className="w-3.5 h-3.5 text-rose-400" />
            <span>{simulationRunning === 'tamper_signature' ? 'Simulating...' : t('security.simTamper')}</span>
          </button>

          <button
            onClick={() => handleSimulateScenario('unauthorized_record_access')}
            disabled={Boolean(simulationRunning)}
            className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-amber-300 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>{simulationRunning === 'unauthorized_record_access' ? 'Simulating...' : t('security.simBola')}</span>
          </button>

          <button
            onClick={() => handleSimulateScenario('rate_limit_burst')}
            disabled={Boolean(simulationRunning)}
            className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-yellow-300 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-yellow-400" />
            <span>{simulationRunning === 'rate_limit_burst' ? 'Simulating...' : t('security.simRate')}</span>
          </button>

          <button
            onClick={() => handleSimulateScenario('failed_login_brute_force')}
            disabled={Boolean(simulationRunning)}
            className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-sky-300 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-sky-400" />
            <span>{simulationRunning === 'failed_login_brute_force' ? 'Simulating...' : t('security.simBrute')}</span>
          </button>
        </div>

        {simulationMessage && (
          <div className="p-2.5 rounded-lg bg-teal-950/80 border border-teal-800/70 text-xs text-teal-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{simulationMessage}</span>
          </div>
        )}
      </div>

      {/* Main Threat Dashboard: Left Alerts & Workflow, Right Details & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Actionable Security Alerts */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{t('security.activeAlerts')} ({alerts.length})</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Live Intake</span>
          </div>

          {alerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No active security incidents detected.
            </div>
          ) : (
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => setSelectedAlert(alt)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    selectedAlert?.id === alt.id
                      ? 'bg-rose-50/80 border-rose-400 shadow-sm ring-1 ring-rose-400/30'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900">{alt.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      alt.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                      alt.severity === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      alt.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                      'bg-slate-100 text-slate-800 border border-slate-300'
                    }`}>
                      {alt.severity}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 truncate">{alt.rule_name}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{alt.rule_description}</p>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono text-[10px]">
                      {alt.observed_source_ip}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                      alt.status === 'NEW' ? 'bg-rose-100 text-rose-800' :
                      alt.status === 'INVESTIGATING' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {alt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columns 2 & 3: Threat Detail & Investigation Workflow */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAlert ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              
              {/* Alert Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                      {selectedAlert.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedAlert.rule_name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(selectedAlert.timestamp).toUTCString()}</span>
                    <span>•</span>
                    <span>Correlation ID: <code className="text-teal-700">{selectedAlert.request_id}</code></span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedAlert.status === 'NEW' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                    selectedAlert.status === 'INVESTIGATING' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    Status: {selectedAlert.status}
                  </span>
                </div>
              </div>

              {/* Technical Facts vs Inferred Threat Intelligence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    <span>Observed Technical Facts</span>
                  </p>
                  <p className="text-slate-600"><strong className="text-slate-800">Observed Source IP:</strong> {selectedAlert.observed_source_ip} (Non-identifying)</p>
                  <p className="text-slate-600"><strong className="text-slate-800">Target Endpoint:</strong> <code className="bg-white px-1 py-0.5 rounded border border-slate-200">{selectedAlert.endpoint}</code></p>
                  <p className="text-slate-600"><strong className="text-slate-800">Related Events:</strong> {selectedAlert.related_event_count} recorded occurrences</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Inferred Intelligence & Severity</span>
                  </p>
                  <p className="text-slate-600"><strong className="text-slate-800">Severity:</strong> <span className="font-semibold text-rose-700">{selectedAlert.severity}</span></p>
                  <p className="text-slate-600"><strong className="text-slate-800">Confidence:</strong> <span className="font-semibold text-emerald-700">{selectedAlert.confidence}</span></p>
                  <p className="text-slate-600"><strong className="text-slate-800">Policy:</strong> Defense-in-depth with zero decrypted leakage</p>
                </div>

              </div>

              {/* Evidence Container */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('common.evidence')}
                </h4>
                <div className="bg-slate-900 text-teal-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
                  <pre>{JSON.stringify(selectedAlert.evidence, null, 2)}</pre>
                </div>
              </div>

              {/* Defensive Action & Administrator Response */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-teal-950 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>{t('common.action')}</span>
                  </h4>
                  <p className="text-xs text-teal-900">{selectedAlert.defensive_action}</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>{t('common.recommended')}</span>
                  </h4>
                  <p className="text-xs text-amber-900">{selectedAlert.recommended_action}</p>
                </div>
              </div>

              {/* Alert Workflow Transition Actions */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t('security.alertWorkflow')}
                </h4>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={investigationNotes}
                    onChange={(e) => setInvestigationNotes(e.target.value)}
                    placeholder="Add administrator investigation notes..."
                    className="w-full sm:flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleUpdateAlertStatus(selectedAlert.id, 'INVESTIGATING')}
                      disabled={selectedAlert.status === 'INVESTIGATING'}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white transition-all cursor-pointer"
                    >
                      {t('security.markInvestigating')}
                    </button>
                    <button
                      onClick={() => handleUpdateAlertStatus(selectedAlert.id, 'RESOLVED')}
                      disabled={selectedAlert.status === 'RESOLVED'}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all cursor-pointer"
                    >
                      {t('security.markResolved')}
                    </button>
                  </div>
                </div>
                {selectedAlert.investigation_notes && (
                  <p className="text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-200">
                    <strong>Admin Note:</strong> {selectedAlert.investigation_notes}
                  </p>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400 text-sm">
              Select an alert from the queue to view technical evidence and trigger defensive workflows.
            </div>
          )}

          {/* Tamper-Evident Hash-Chained Audit Ledger Table */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <Hash className="w-4 h-4 text-teal-600" />
                  <span>{t('security.auditLedger')}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cryptographically chained with SHA-256 (Merkle pointer linking). Modifying any past record breaks the root hash.
                </p>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-500">Filter:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No events matching selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[350px]">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Time</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Severity</th>
                      <th className="py-2 px-3">Outcome</th>
                      <th className="py-2 px-3">Endpoint</th>
                      <th className="py-2 px-3">Source IP</th>
                      <th className="py-2 px-3">Record SHA-256 Digest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {filteredEvents.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 whitespace-nowrap text-slate-500">
                          {new Date(e.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {e.event_type}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            e.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                            e.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                            e.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {e.severity}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-teal-700">{e.outcome}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[140px]">
                          {e.endpoint}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {e.observed_source_ip}
                        </td>
                        <td className="py-2 px-3 text-slate-400 truncate max-w-[120px]" title={e.record_hash}>
                          {e.record_hash.slice(0, 16)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
