import { useState, useEffect } from "react";
import {
  LayoutDashboard, Link2, FileText, History, Shield, Bell, BarChart3, Activity, AlertTriangle, Blocks, LogOut, UserCircle, ShieldCheck, ArrowRight, Stethoscope, ChevronRight, Lock, KeyRound, ArrowLeft
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API_URL = "https://effective-space-guacamole-pjxv5jwrw7q9f65q6-4000.app.github.dev";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "explorer", label: "Blockchain Explorer", icon: Link2 },
  { id: "records", label: "EHR Records", icon: FileText },
  { id: "audit", label: "Audit Trail", icon: History },
  { id: "attack", label: "Attack Console", icon: Shield },
  { id: "iomt", label: "IoMT Devices", icon: Activity },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "insights", label: "Insights", icon: BarChart3 },
];

const LOGIN_OPTIONS = [
  { id: "ADMIN", role: "admin", label: "Admin", description: "Full access to every record and control" },
  { id: "DOC101", role: "doctor", label: "Dr. DOC101", description: "Consented on most test records" },
  { id: "DOC102", role: "doctor", label: "Dr. DOC102", description: "Not consented on most test records — try being denied" },
  { id: "DOC109", role: "doctor", label: "Dr. DOC109", description: "Used as the test 'attacker' account in demos" },
];

function LoginPage({ onLogin }) {
  const [chainLength, setChainLength] = useState(null);
  const [step, setStep] = useState("select"); // select | password | forgot
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/chain`)
      .then((r) => r.json())
      .then((data) => setChainLength(data.length))
      .catch(() => setChainLength(null));
  }, []);

  const doctors = LOGIN_OPTIONS.filter((o) => o.role === "doctor");
  const admin = LOGIN_OPTIONS.find((o) => o.role === "admin");

  function chooseIdentity(option) {
    setSelected(option);
    setPassword("");
    setError(null);
    setMessage(null);
    setStep("password");
  }

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selected.id, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLogin(selected);
      } else {
        setError(data.error || "Incorrect password");
      }
    } catch (err) {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetNewPassword() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selected.id, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("Password updated. You can sign in now.");
        setStep("password");
        setPassword("");
        setNewPassword("");
      } else {
        setError(data.error || "Could not update password");
      }
    } catch (err) {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center relative overflow-hidden p-6">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#e8a33d]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4fd1c5]/10 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6 text-xs text-[#5b6672]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4fd1c5] animate-pulse" />
          <span>{chainLength !== null ? `Blockchain synced · ${chainLength} blocks` : "Connecting to blockchain..."}</span>
        </div>

        <div className="bg-[#12161c]/80 backdrop-blur-xl border border-[#232b34] rounded-2xl p-8 shadow-2xl">
          <div className="w-11 h-11 rounded-xl bg-[#e8a33d]/10 border border-[#e8a33d]/30 flex items-center justify-center mb-5">
            <ShieldCheck size={22} className="text-[#e8a33d]" />
          </div>

          {step === "select" && (
            <>
              <h1 className="text-[#eef2f6] text-xl font-semibold mb-1">Sign in to EHR Security</h1>
              <p className="text-sm text-[#7a8794] mb-7">Blockchain-secured records with real-time ransomware detection.</p>

              <button
                onClick={() => chooseIdentity(admin)}
                className="w-full flex items-center gap-3 bg-[#e8a33d] hover:bg-[#f0ad4a] text-[#1a1305] font-medium rounded-xl px-4 py-3.5 mb-3 transition-colors"
              >
                <ShieldCheck size={18} />
                <span className="flex-1 text-left">Continue as Admin</span>
                <ArrowRight size={16} />
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[#232b34]" />
                <span className="text-xs text-[#5b6672]">or continue as a doctor</span>
                <div className="flex-1 h-px bg-[#232b34]" />
              </div>

              <div className="space-y-2">
                {doctors.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => chooseIdentity(doc)}
                    className="w-full flex items-center gap-3 bg-[#181d24] hover:bg-[#1e242c] border border-[#232b34] hover:border-[#4fd1c5]/40 rounded-xl px-4 py-3 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#4fd1c5]/10 flex items-center justify-center shrink-0">
                      <Stethoscope size={15} className="text-[#4fd1c5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#eef2f6] text-sm font-medium">{doc.label}</p>
                      <p className="text-xs text-[#5b6672] truncate">{doc.description}</p>
                    </div>
                    <ChevronRight size={16} className="text-[#5b6672]" />
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "password" && (
            <>
              <button onClick={() => setStep("select")} className="flex items-center gap-1 text-xs text-[#5b6672] hover:text-[#9aa5b1] mb-4">
                <ArrowLeft size={14} /> Back
              </button>
              <h1 className="text-[#eef2f6] text-xl font-semibold mb-1">{selected.label}</h1>
              <p className="text-sm text-[#7a8794] mb-6">Enter the password to continue.</p>

              {message && <p className="text-xs text-[#4fd1c5] mb-3">{message}</p>}

              <div className="relative mb-2">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b6672]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Password"
                  className="w-full bg-[#181d24] border border-[#232b34] focus:border-[#4fd1c5]/50 rounded-xl pl-10 pr-4 py-3 text-sm text-[#eef2f6] outline-none"
                />
              </div>

              {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#e8a33d] hover:bg-[#f0ad4a] text-[#1a1305] font-medium rounded-xl px-4 py-3 mt-2 transition-colors disabled:opacity-50"
              >
                {loading ? "Checking..." : "Sign in"}
              </button>

              <button
                onClick={() => { setStep("forgot"); setError(null); setMessage(null); }}
                className="w-full text-center text-xs text-[#5b6672] hover:text-[#9aa5b1] mt-4"
              >
                Forgot password?
              </button>
            </>
          )}

          {step === "forgot" && (
            <>
              <button onClick={() => setStep("password")} className="flex items-center gap-1 text-xs text-[#5b6672] hover:text-[#9aa5b1] mb-4">
                <ArrowLeft size={14} /> Back
              </button>
              <h1 className="text-[#eef2f6] text-xl font-semibold mb-1">Set a new password</h1>
              <p className="text-sm text-[#7a8794] mb-6">For {selected.label}. This takes effect immediately.</p>

              <div className="relative mb-3">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b6672]" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 4 characters)"
                  className="w-full bg-[#181d24] border border-[#232b34] focus:border-[#4fd1c5]/50 rounded-xl pl-10 pr-4 py-3 text-sm text-[#eef2f6] outline-none"
                />
              </div>

              {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

              <button
                onClick={handleSetNewPassword}
                disabled={loading}
                className="w-full bg-[#4fd1c5] hover:bg-[#5fdccf] text-[#0a1a18] font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </>
          )}

          <p className="text-xs text-[#5b6672] text-center mt-6">
            Demo environment — passwords reset instantly, no email required.
          </p>
        </div>
      </div>
    </div>
  );
}
function Overview() {
  const [chain, setChain] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [chainRes, alertsRes] = await Promise.all([
          fetch(`${API_URL}/api/chain`),
          fetch(`${API_URL}/api/alerts`),
        ]);
        setChain(await chainRes.json());
        setAlerts(await alertsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-gray-400">Loading system status...</div>;

  const stats = [
    { label: "Chain Length", value: chain.length, icon: Blocks, color: "text-purple-400" },
    { label: "Total Alerts", value: alerts.length, icon: AlertTriangle, color: "text-red-400" },
    { label: "System Status", value: "Online", icon: Activity, color: "text-green-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{stat.label}</span>
                <Icon size={18} className={stat.color} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Recent Alerts</h3>
        {alerts.length === 0 ? (
          <p className="text-gray-500 text-sm">No alerts yet. System is clean.</p>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-medium">{alert.flag}</p>
                  <p className="text-xs text-gray-500">{alert.source} • {new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockchainExplorer() {
  const [chain, setChain] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchChain() {
    try {
      const res = await fetch(`${API_URL}/api/chain`);
      setChain(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchChain(); }, []);

  if (loading) return <div className="text-gray-400">Loading blockchain...</div>;

  return (
    <div className="space-y-4">
      <button onClick={fetchChain} className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300">
        Refresh Chain
      </button>
      <div className="space-y-3">
        {chain.map((block) => (
          <div key={block.index} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-purple-400">Block #{block.index}</span>
              <span className="text-xs text-gray-500">{new Date(block.timestamp).toLocaleString()}</span>
            </div>
            <div className="space-y-2 text-xs">
              <div><span className="text-gray-500">Transactions: </span><span className="text-gray-300">{block.transactions.length} record(s)</span></div>
              <div className="font-mono break-all"><span className="text-gray-500">Hash: </span><span className="text-green-400">{block.hash}</span></div>
              <div className="font-mono break-all"><span className="text-gray-500">Previous Hash: </span><span className="text-gray-400">{block.previousHash}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttackConsole() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [attackType, setAttackType] = useState(null);

  async function launchRansomware() {
    setRunning(true); setAttackType("ransomware"); setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/simulate/ransomware`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
      });
      setResult(await res.json());
    } catch (err) { setResult({ error: "Failed to reach backend" }); }
    finally { setRunning(false); }
  }

  async function launchMitm() {
    setRunning(true); setAttackType("mitm"); setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/simulate/mitm`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blockIndex: 1 }),
      });
      setResult(await res.json());
    } catch (err) { setResult({ error: "Failed to reach backend" }); }
    finally { setRunning(false); }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button onClick={launchRansomware} disabled={running} className="bg-red-950 hover:bg-red-900 border border-red-800 rounded-xl p-6 text-left transition disabled:opacity-50">
          <p className="text-red-400 font-bold text-lg mb-1">Launch Ransomware Attack</p>
          <p className="text-gray-400 text-sm">Simulates a rapid burst of suspicious record access.</p>
        </button>
        <button onClick={launchMitm} disabled={running} className="bg-orange-950 hover:bg-orange-900 border border-orange-800 rounded-xl p-6 text-left transition disabled:opacity-50">
          <p className="text-orange-400 font-bold text-lg mb-1">Launch MITM Attack</p>
          <p className="text-gray-400 text-sm">Simulates an intercepted, altered transaction.</p>
        </button>
      </div>

      {running && <div className="text-gray-400 text-sm animate-pulse">Running attack simulation...</div>}

      {result && attackType === "ransomware" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-bold text-red-400 mb-3">Ransomware Simulation Result</h3>
          <p className="text-sm mb-2">Detected at action: <span className="font-mono text-yellow-400">{result.detected_at_action}</span> / {result.total_actions}</p>
          <div className="space-y-1 mt-4 max-h-64 overflow-y-auto">
            {result.results?.map((r, i) => (
              <div key={i} className={`text-xs font-mono px-3 py-2 rounded flex justify-between ${r?.is_anomalous ? "bg-red-950 text-red-300" : "bg-gray-800 text-gray-400"}`}>
                <span>Action #{i + 1}</span>
                <span>{r?.is_anomalous ? `🚨 ${r.reason}` : "Normal"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && attackType === "mitm" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-bold text-orange-400 mb-3">MITM Simulation Result</h3>
          <p className="text-sm mb-3">Chain valid: <span className={result.validation?.valid ? "text-green-400" : "text-red-400"}>{result.validation?.valid ? "Yes" : "No - Attack Detected"}</span></p>
          {result.validation?.issues?.map((issue, i) => (
            <div key={i} className="text-xs font-mono px-3 py-2 rounded bg-red-950 text-red-300 mb-1">🚨 Block #{issue.blockIndex}: {issue.flag}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function IoMTDevices() {
  const [devices, setDevices] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/iomt/devices`).then((r) => r.json()).then((data) => {
      setDevices(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function simulateReading(deviceId, abnormal) {
    try {
      const res = await fetch(`${API_URL}/api/iomt/simulate-reading`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, abnormal }),
      });
      const data = await res.json();
      setResults((prev) => ({ ...prev, [deviceId]: data }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [deviceId]: { error: "Failed to reach backend" } }));
    }
  }

  if (loading) return <div className="text-gray-400">Loading devices...</div>;

  return (
    <div className="space-y-4">
      {devices.map((device) => {
        const result = results[device.device_id];
        const isAbnormal = result?.reading?.note?.includes("CRITICAL");
        return (
          <div key={device.device_id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold">{device.type}</p>
                <p className="text-xs text-gray-500">{device.device_id} • Linked to {device.patient_record}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => simulateReading(device.device_id, false)}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  Send Normal Reading
                </button>
                <button
                  onClick={() => simulateReading(device.device_id, true)}
                  className="text-xs px-3 py-1.5 bg-red-900 hover:bg-red-800 rounded-lg text-red-300"
                >
                  Inject Abnormal Reading
                </button>
              </div>
            </div>
            {result && (
              <div className={`text-xs font-mono p-3 rounded-lg ${isAbnormal ? "bg-red-950 text-red-300" : "bg-gray-800 text-gray-400"}`}>
                {isAbnormal ? "🚨 " : ""}{result.reading?.note} {result.alert_triggered ? "— Alert logged" : ""}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EHRRecords({ currentUser }) {
  const [form, setForm] = useState({ record_id: "", patient_name: "", diagnosis: "", medication: "", attending_doctor: currentUser?.id || "DOC101" });
  const [message, setMessage] = useState(null);
  const [readForm, setReadForm] = useState({ record_id: "", user_id: currentUser?.id || "DOC101", role: currentUser?.role || "doctor" });
  const [readResult, setReadResult] = useState(null);

  async function handleCreate() {
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/records`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = await res.json();
      setMessage(res.ok ? `✅ Record ${form.record_id} created (Block #${data.block.index})` : `❌ ${data.error}`);
    } catch (err) { setMessage("❌ Failed to reach backend"); }
  }

  async function handleRead() {
    setReadResult(null);
    try {
      const res = await fetch(`${API_URL}/api/records/${readForm.record_id}/read`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: readForm.user_id, role: readForm.role }),
      });
      setReadResult(await res.json());
    } catch (err) { setReadResult({ error: "Failed to reach backend" }); }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold mb-2">Create EHR Record</h3>
        {["record_id", "patient_name", "diagnosis", "medication", "attending_doctor"].map((field) => (
          <input
            key={field}
            placeholder={field.replace("_", " ")}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
        ))}
        <button onClick={handleCreate} className="w-full bg-purple-600 hover:bg-purple-700 rounded-lg py-2 text-sm font-medium">
          Create Record
        </button>
        {message && <p className="text-sm mt-2">{message}</p>}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold mb-2">Read Record (Access-Controlled)</h3>
        <p className="text-xs text-gray-500">Logged in as: <span className="text-purple-400">{readForm.user_id} ({readForm.role})</span></p>
        <input placeholder="record_id" value={readForm.record_id} onChange={(e) => setReadForm({ ...readForm, record_id: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
        <button onClick={handleRead} className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-2 text-sm font-medium">
          Attempt Read
        </button>
        {readResult && (
          <pre className="text-xs bg-gray-800 rounded-lg p-3 mt-2 overflow-x-auto">{JSON.stringify(readResult, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

function AuditTrail() {
  const [recordId, setRecordId] = useState("");
  const [history, setHistory] = useState(null);

  async function fetchHistory() {
    try {
      const res = await fetch(`${API_URL}/api/records/${recordId}/history`);
      setHistory(await res.json());
    } catch (err) { setHistory([]); }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input placeholder="Enter record_id (e.g. EHR6001)" value={recordId} onChange={(e) => setRecordId(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
        <button onClick={fetchHistory} className="bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-2 text-sm font-medium">Search</button>
      </div>
      {history && (
        history.length === 0 ? (
          <p className="text-gray-500 text-sm">No history found for this record.</p>
        ) : (
          <div className="space-y-3">
            {history.map((entry, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-sm font-bold text-purple-400 mb-1">Version {i + 1} - Block #{entry.blockIndex}</p>
                <p className="text-xs text-gray-500 mb-2">{new Date(entry.timestamp).toLocaleString()}</p>
                <pre className="text-xs bg-gray-800 rounded-lg p-3 overflow-x-auto">{JSON.stringify(entry.data, null, 2)}</pre>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/alerts`).then((r) => r.json()).then(setAlerts).catch(() => setAlerts([]));
  }, []);

  return (
    <div className="space-y-3">
      {alerts.length === 0 ? (
        <p className="text-gray-500 text-sm">No alerts recorded.</p>
      ) : (
        alerts.map((alert) => (
          <div key={alert.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between">
            <div>
              <p className="font-medium text-red-400">{alert.flag}</p>
              <p className="text-xs text-gray-500 mt-1">Source: {alert.source} • {new Date(alert.timestamp).toLocaleString()}</p>
              <pre className="text-xs text-gray-400 mt-2">{JSON.stringify(alert.details)}</pre>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Insights() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/evaluation`).then((r) => r.json()).then(setData).catch(() => setData(null));
  }, []);

  if (!data || data.error) {
    return <p className="text-gray-500 text-sm">No evaluation data yet. Run <code className="text-purple-400">node benchmark.js</code> in the backend first.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="font-semibold mb-4">Transaction Throughput (TPS) vs Load</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.throughput}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="load" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ background: "#1f2937", border: "none" }} />
            <Bar dataKey="throughput_tps" fill="#a855f7" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="font-semibold mb-4">Average Latency (ms) vs Load</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.throughput}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="load" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ background: "#1f2937", border: "none" }} />
            <Line type="monotone" dataKey="avg_latency_ms" stroke="#f97316" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">MTTD</p>
          <p className="text-2xl font-bold text-purple-400">{data.latency.mttd_ms}ms</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Alert Latency</p>
          <p className="text-2xl font-bold text-purple-400">{data.latency.alert_latency_ms}ms</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">MTTR</p>
          <p className="text-2xl font-bold text-purple-400">{data.latency.mttr_ms}ms</p>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <Overview />;
      case "explorer": return <BlockchainExplorer />;
      case "records": return <EHRRecords currentUser={currentUser} />;
      case "audit": return <AuditTrail />;
      case "attack": return <AttackConsole />;
      case "iomt": return <IoMTDevices />;
      case "alerts": return <Alerts />;
      case "insights": return <Insights />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-lg font-bold text-white">EHR Security</h1>
          <p className="text-xs text-gray-400">Blockchain + AI Detection</p>
        </div>

        <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
          <UserCircle size={18} className="text-purple-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.label}</p>
            <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
          </div>
          <button onClick={onLogout} title="Switch user" className="text-gray-500 hover:text-white">
            <LogOut size={16} />
          </button>
        </div>

        <div className="px-5 py-2 border-b border-gray-800">
          <button
            onClick={async () => {
              if (!confirm("Reset the demo to a clean state? This clears all records and alerts.")) return;
              await fetch(`${API_URL}/api/reset`, { method: "POST" });
              window.location.reload();
            }}
            className="w-full text-xs text-gray-500 hover:text-red-400 border border-gray-800 hover:border-red-900 rounded-lg py-2 transition-colors"
          >
            Reset Demo
          </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-6 capitalize">{activeTab}</h2>
        {renderTab()}
      </main>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  return <Dashboard currentUser={currentUser} onLogout={() => setCurrentUser(null)} />;
}

export default App;