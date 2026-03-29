import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Rocket, MapPin, Loader2 } from 'lucide-react';

interface Log {
  type: string;
  message: string;
  time: string;
}

function App() {
  const [niche, setNiche] = useState('Dentist');
  const [location, setLocation] = useState('Noida');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState({ found: 0, qualified: 0, completed: 0 });
  const [waStatus, setWaStatus] = useState({ isReady: false, qr: '', status: 'IDLE' });
  const [activeTab, setActiveTab] = useState('campaign');
  const [leads, setLeads] = useState<any[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const checkStatus = () => {
      axios.get('http://localhost:3001/api/whatsapp-status').then(res => {
        console.log('WA Status:', res.data);
        if (res.data.isReady) {
          setWaStatus({ isReady: true, qr: '', status: 'READY' });
          clearInterval(pollInterval);
        } else {
          setWaStatus(s => ({ ...s, qr: res.data.qrCodeData, status: res.data.status || s.status }));
        }
      });
    };

    checkStatus();
    const pollInterval = setInterval(checkStatus, 3000);

    const eventSource = new EventSource('http://localhost:3001/api/events');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'WA_QR') setWaStatus({ isReady: false, qr: data.qr, status: 'QR' });
      if (data.type === 'WA_READY') {
        setWaStatus({ isReady: true, qr: '', status: 'READY' });
        clearInterval(pollInterval);
      }
      if (data.type === 'WA_STATUS') {
        setWaStatus(s => ({ ...s, status: data.status }));
      }
      if (data.type === 'WA_DISCONNECTED') {
        setWaStatus({ isReady: false, qr: '', status: 'DISCONNECTED' });
      }
      if (data.type === 'WA_ERROR') setLogs(prev => [...prev, { type: 'ERROR', message: data.message, time: new Date().toLocaleTimeString() }]);

      if (data.type === 'INFO' || data.type === 'SUCCESS' || data.type === 'ERROR' || data.type === 'DONE') {
        setLogs(prev => [...prev, { type: data.type, message: data.message, time: new Date().toLocaleTimeString() }]);
      }

      if (data.type === 'INFO' && data.rawLeads) {
        setStats(s => ({ ...s, found: data.rawLeads.length }));
        setLeads(data.rawLeads.map((l: any) => ({ ...l, status: 'Discovered' })));
      }
      if (data.type === 'INFO' && data.qualifiedLeads) {
        setStats(s => ({ ...s, qualified: data.qualifiedLeads.length }));
        setLeads(prev => prev.map(l => data.qualifiedLeads.find((q: any) => q.name === l.name) ? { ...l, status: 'Qualified' } : l));
      }
      if (data.type === 'INFO' && data.lead) {
        setLeads(prev => prev.map(l => l.name === data.lead.name ? { ...l, ...data.lead } : l));
      }
      if (data.type === 'SUCCESS') {
        setStats(s => ({ ...s, completed: s.completed + 1 }));
        setLeads(prev => prev.map(l => l.name === data.lead.name ? { ...l, ...data.lead } : l));
      }
      if (data.type === 'ERROR' && data.lead) {
        setLeads(prev => prev.map(l => l.name === data.lead.name ? { ...l, ...data.lead } : l));
      }
      if (data.type === 'DONE') {
        setIsRunning(false);
      }
    };
    return () => {
      eventSource.close();
      clearInterval(pollInterval);
    };
  }, []);

  const startGrowth = async () => {
    if (!waStatus.isReady) {
      alert('Please link your WhatsApp first!');
      setActiveTab('connectivity');
      return;
    }
    setLogs([{ type: 'INFO', message: '🔔 Starting Growth Engine...', time: new Date().toLocaleTimeString() }]);
    setStats({ found: 0, qualified: 0, completed: 0 });
    setLeads([]);
    setIsRunning(true);
    setActiveTab('leads');

    try {
      await axios.post('http://localhost:3001/api/start-growth', { niche, location });
    } catch (e: any) {
      setLogs(prev => [...prev, { type: 'ERROR', message: 'Connection Error: ' + e.message, time: new Date().toLocaleTimeString() }]);
      setIsRunning(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Autonomous Growth Agent</h1>
        <p>Identify leads, generate demos, and automate outreach in seconds.</p>
        <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: 10 }}>Powered by Playwright Desktop Engine & Gemini AI</div>
      </header>

      <nav className="tab-nav">
        <button className={activeTab === 'connectivity' ? 'active' : ''} onClick={() => setActiveTab('connectivity')}>Connectivity</button>
        <button className={activeTab === 'campaign' ? 'active' : ''} onClick={() => setActiveTab('campaign')}>Campaign</button>
        <button className={activeTab === 'leads' ? 'active' : ''} onClick={() => setActiveTab('leads')}>Leads & Tracking</button>
      </nav>

      <div className="tab-content">
        {activeTab === 'connectivity' && (
          <div className="setup-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ margin: 0 }}>
              {waStatus.isReady ? '✅ WhatsApp Connected' :
                waStatus.status === 'AUTHENTICATED' ? '🔄 Synchronizing...' :
                  'Link Your WhatsApp'}
            </h2>
            {!waStatus.isReady ? (
              <>
                <p style={{ color: 'var(--text-muted)' }}>
                  {waStatus.status === 'AUTHENTICATED' ? 'Session established! WhatsApp is synchronizing your chats. This will only take a moment...' :
                    'Scan this QR code with your phone to start automated outreach from your number.'}
                </p>
                {waStatus.qr ? (
                  <img src={waStatus.qr} alt="WA QR" style={{ borderRadius: 12, border: '10px solid #fff', margin: '20px 0', width: 250 }} />
                ) : (
                  <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Loader2 className="spin" />
                    <span>{waStatus.status === 'AUTHENTICATED' ? 'Resuming Session...' : 'Initializing Secure Browser...'}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>This may take up to 30-40 seconds</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <p style={{ color: 'var(--success)', fontWeight: 600 }}>Your personal account is linked and ready for outreach.</p>
                <button
                  onClick={async () => {
                    await axios.post('http://localhost:3001/api/whatsapp-logout');
                    setWaStatus({ isReady: false, qr: '', status: 'DISCONNECTED' });
                  }}
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                >
                  Disconnect WhatsApp
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'campaign' && (
          <>
            <div className="setup-card">
              <div className="field">
                <label><Rocket size={14} style={{ marginRight: 6 }} /> Targeted Niche</label>
                <input
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  placeholder="e.g. Dentist, Salon, Gym"
                  disabled={isRunning}
                />
              </div>
              <div className="field">
                <label><MapPin size={14} style={{ marginRight: 6 }} /> Location</label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Noida, Delhi"
                  disabled={isRunning}
                />
              </div>
              <button
                className="start-btn"
                onClick={startGrowth}
                disabled={isRunning}
              >
                {isRunning ? <><Loader2 size={18} className="spin" style={{ marginRight: 8 }} /> Running...</> : 'Launch Agent'}
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <h3>Leads Discovered</h3>
                <div className="value">{stats.found}</div>
              </div>
              <div className="stat-card">
                <h3>Qualified High-Value</h3>
                <div className="value">{stats.qualified}</div>
              </div>
              <div className="stat-card">
                <h3>Outreach Completed</h3>
                <div className="value" style={{ color: 'var(--success)' }}>{stats.completed}</div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'leads' && (
          <div className="leads-container">
            <div className="log-container" style={{ marginBottom: 30 }}>
              <div className="log-header">Live Tracking Table</div>
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Phone</th>
                    <th>Rating</th>
                    <th>Reviews</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{lead.name}</div>
                        {lead.videoUrl && <a href={lead.videoUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--primary)', textDecoration: 'none' }}>📺 Watch Demo</a>}
                      </td>
                      <td>{lead.phone || 'N/A'}</td>
                      <td>{lead.stars ? `${lead.stars}★` : 'N/A'}</td>
                      <td>{lead.reviews}</td>
                      <td><span className={`status-pill ${lead.status}`}>{lead.status}</span></td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No leads yet. Start a campaign to see results.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="log-container">
              <div className="log-header">Growth Engine Logs</div>
              <div className="logs">
                {logs.map((log, i) => (
                  <div key={i} className={`log-item ${log.type}`}>
                    <span className="time">{log.time}</span>
                    <span className="msg">{log.message}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
