import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Activity,
    BarChart3,
    MessageSquare,
    ShieldAlert,
    Clock,
    Search,
    Trash2,
    Lock,
    Unlock,
    ExternalLink,
    Terminal,
    Eye
} from 'lucide-react';
import './AdminConsole.css';

export default function AdminConsole() {
    const { currentUser, isSuperUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalComments: 0,
        todayViews: 0
    });

    const [users, setUsers] = useState([]);
    const [traffic, setTraffic] = useState([]);
    const [globalComments, setGlobalComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isSuperUser && currentUser) {
            navigate('/');
        }
    }, [isSuperUser, currentUser, navigate]);

    useEffect(() => {
        if (!isSuperUser) return;

        // Fetch Stats
        const fetchStats = async () => {
            const userSnap = await getDocs(collection(db, 'users'));
            const commentSnap = await getDocs(collection(db, 'comments'));
            const trafficSnap = await getDocs(collection(db, 'analytics_traffic'));

            setStats({
                totalUsers: userSnap.size,
                totalComments: commentSnap.size,
                todayViews: trafficSnap.size
            });

            const userList = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(userList);
        };

        fetchStats();

        // Real-time Traffic Feed
        const trafficQuery = query(collection(db, 'analytics_traffic'), orderBy('timestamp', 'desc'), limit(50));
        const unsubTraffic = onSnapshot(trafficQuery, (snap) => {
            setTraffic(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Real-time Global Activity
        const commentQuery = query(collection(db, 'comments'), orderBy('createdAt', 'desc'), limit(50));
        const unsubComments = onSnapshot(commentQuery, (snap) => {
            setGlobalComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => {
            unsubTraffic();
            unsubComments();
        };
    }, [isSuperUser]);

    const handleBanUser = async (userId, currentlyBanned) => {
        if (!window.confirm(`Are you sure you want to ${currentlyBanned ? 'unban' : 'ban'} this user?`)) return;
        try {
            await updateDoc(doc(db, 'users', userId), {
                isBanned: !currentlyBanned
            });
            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, isBanned: !currentlyBanned } : u));
        } catch (err) {
            alert('Failed to update user status');
        }
    };

    const handleDeleteComment = async (id) => {
        if (!window.confirm('Delete this comment permanently?')) return;
        await deleteDoc(doc(db, 'comments', id));
    };

    const formatDate = (ts) => {
        if (!ts) return 'N/A';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleString();
    };

    if (!isSuperUser) return null;

    const filteredUsers = users.filter(u =>
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="admin-console container-wide">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <Terminal size={24} className="text-primary" />
                    <h2>TorqueX<span>COCKPIT</span></h2>
                </div>

                <nav className="admin-nav">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                        <BarChart3 size={18} /> Dashboard
                    </button>
                    <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                        <Users size={18} /> User Records
                    </button>
                    <button className={activeTab === 'traffic' ? 'active' : ''} onClick={() => setActiveTab('traffic')}>
                        <Activity size={18} /> Live Traffic
                    </button>
                    <button className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>
                        <MessageSquare size={18} /> Audit Log
                    </button>
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="status-indicator">
                        <span className="pulse-dot green"></span>
                        SYSTEMS_OPERATIONAL
                    </div>
                </div>
            </aside>

            <main className="admin-main">
                {activeTab === 'overview' && (
                    <div className="admin-view fade-in">
                        <header className="admin-header">
                            <h1>System Overview</h1>
                            <p>Real-time technical metrics of the TorqueX platform.</p>
                        </header>

                        <div className="admin-stats-grid">
                            <div className="admin-stat-card">
                                <Users size={32} className="text-blue" />
                                <div className="stat-content">
                                    <span className="value">{stats.totalUsers}</span>
                                    <span className="label">Registered Drivers</span>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <MessageSquare size={32} className="text-purple" />
                                <div className="stat-content">
                                    <span className="value">{stats.totalComments}</span>
                                    <span className="label">Total Signals (Comments)</span>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <Eye size={32} className="text-green" />
                                <div className="stat-content">
                                    <span className="value">{stats.todayViews}</span>
                                    <span className="label">Live Data Packets (Traffic)</span>
                                </div>
                            </div>
                        </div>

                        <div className="admin-split-layout">
                            <section className="admin-recent-box">
                                <h3><Activity size={16} /> Recent Intercepts</h3>
                                <div className="admin-mini-list">
                                    {traffic.slice(0, 5).map(t => (
                                        <div key={t.id} className="mini-item">
                                            <span className="code">{t.path}</span>
                                            <span className="meta">{t.userEmail}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                            <section className="admin-recent-box">
                                <h3><ShieldAlert size={16} /> Latest Signals</h3>
                                <div className="admin-mini-list">
                                    {globalComments.slice(0, 5).map(c => (
                                        <div key={c.id} className="mini-item">
                                            <span className="text">{c.text.substring(0, 30)}...</span>
                                            <span className="meta">{c.userName}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="admin-view fade-in">
                        <header className="admin-header split">
                            <div>
                                <h1>User Directory</h1>
                                <p>Manage specialized access and platform discipline.</p>
                            </div>
                            <div className="admin-search">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by ID or Email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </header>

                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Driver</th>
                                        <th>Status</th>
                                        <th>Last Seen</th>
                                        <th>Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.uid}>
                                            <td>
                                                <div className="table-user">
                                                    <div className="avatar">{user.displayName?.charAt(0)}</div>
                                                    <div className="info">
                                                        <strong>{user.displayName}</strong>
                                                        <span>{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${user.isBanned ? 'banned' : 'active'}`}>
                                                    {user.isBanned ? 'BANNED' : 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td>{formatDate(user.lastSeen)}</td>
                                            <td><span className="role-chip">{user.role || 'user'}</span></td>
                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        className={`btn-icon ${user.isBanned ? 'text-green' : 'text-red'}`}
                                                        onClick={() => handleBanUser(user.id, user.isBanned)}
                                                        title={user.isBanned ? 'Unban User' : 'Ban User'}
                                                    >
                                                        {user.isBanned ? <Unlock size={16} /> : <Lock size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'traffic' && (
                    <div className="admin-view fade-in">
                        <header className="admin-header">
                            <h1>Live Data Stream</h1>
                            <p>Real-time packet interception across the site.</p>
                        </header>

                        <div className="traffic-stream">
                            {traffic.map(log => (
                                <div key={log.id} className="traffic-line">
                                    <span className="timestamp">[{formatDate(log.timestamp).split(',')[1]}]</span>
                                    <span className="method">GET</span>
                                    <span className="path">{log.path}</span>
                                    <span className="user">BY: {log.userEmail}</span>
                                    <span className="agent">{log.userAgent.substring(0, 40)}...</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="admin-view fade-in">
                        <header className="admin-header">
                            <h1>Platform Audit Log</h1>
                            <p>Complete global history of user interactions.</p>
                        </header>

                        <div className="audit-log">
                            {globalComments.map(c => (
                                <div key={c.id} className="audit-item">
                                    <div className="audit-meta">
                                        <span className="user">{c.userName}</span>
                                        <span className="type">/{c.type}</span>
                                        <span className="time">{formatDate(c.createdAt)}</span>
                                    </div>
                                    <p className="content">"{c.text}"</p>
                                    <div className="audit-actions">
                                        <button onClick={() => handleDeleteComment(c.id)} className="text-red">
                                            <Trash2 size={14} /> SCRUB_SIGNAL
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
