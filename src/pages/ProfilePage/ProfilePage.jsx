import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { User, MessageSquare, Clock, ArrowRight, ShieldAlert, LogOut, Settings, Award, Trash2 } from 'lucide-react';
import './ProfilePage.css';

export default function ProfilePage() {
    const { currentUser, isSuperUser, logout } = useAuth();
    const navigate = useNavigate();
    const [userComments, setUserComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('activity'); // 'activity', 'settings'

    const [newName, setNewName] = useState(currentUser?.displayName || '');
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const [nameSuccess, setNameSuccess] = useState('');
    const [nameError, setNameError] = useState('');

    useEffect(() => {
        if (!currentUser && !loading) {
            navigate('/');
        }
    }, [currentUser, loading, navigate]);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'comments'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUserComments(fetched);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleSignOut = async () => {
        await logout();
        navigate('/');
    };

    const handleUpdateName = async () => {
        if (!newName.trim() || newName.trim() === currentUser.displayName) return;

        setIsUpdatingName(true);
        setNameSuccess('');
        setNameError('');

        try {
            await updateProfile(currentUser, {
                displayName: newName.trim()
            });
            setNameSuccess('Profile name updated successfully! Refresh to see changes globally.');
        } catch (err) {
            console.error("Error updating profile:", err);
            setNameError('Failed to update name. Please try again.');
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment? It will be removed from the platform forever.')) return;

        try {
            await deleteDoc(doc(db, 'comments', commentId));
            // Snapshot listener will automatically remove it from the UI list
        } catch (err) {
            console.error("Error deleting comment from profile:", err);
            alert("Failed to delete comment.");
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        }).format(timestamp.toDate());
    };

    const getTargetLink = (comment) => {
        if (comment.type === 'car') return `/car/${comment.targetId.replace('car_', '')}#comments-${comment.targetId}`;
        if (comment.type === 'news') return `/news/article/${comment.targetId.replace('news_', '')}#comments-${comment.targetId}`;
        return `/#comments-${comment.targetId}`;
    };

    const getTargetName = (comment) => {
        if (comment.type === 'car') return 'Car Profile';
        if (comment.type === 'news') return 'News Article';
        return 'Link';
    };

    if (!currentUser) return null;

    const carReviewsCount = userComments.filter(c => c.type === 'car').length;
    const newsCommentsCount = userComments.filter(c => c.type === 'news').length;

    return (
        <div className="profile-dashboard container-wide">
            {/* Sidebar Navigation */}
            <aside className="profile-sidebar">
                <div className="sidebar-user-card">
                    <div className="sidebar-avatar">
                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User size={40} />}
                    </div>
                    <h2>{currentUser.displayName || 'TorqueX User'}</h2>
                    <p>{currentUser.email}</p>
                    {isSuperUser && (
                        <div className="sidebar-badge super-admin">
                            <ShieldAlert size={14} /> Super Admin
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`sidebar-nav-item ${activeTab === 'activity' ? 'active' : ''}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        <MessageSquare size={18} />
                        My Activity
                    </button>
                    <button
                        className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={18} />
                        Account Settings
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-signout" onClick={handleSignOut}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="profile-main-content">
                {activeTab === 'activity' && (
                    <div className="dashboard-view fade-in">
                        <header className="dashboard-header">
                            <h1>Activity Overview</h1>
                            <p>Here's everything you've contributed to TorqueX.</p>
                        </header>

                        <div className="dashboard-stats">
                            <div className="stat-card">
                                <Award className="stat-icon text-blue" size={24} />
                                <div className="stat-info">
                                    <span className="stat-value">{carReviewsCount}</span>
                                    <span className="stat-label">Car Reviews</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <MessageSquare className="stat-icon text-purple" size={24} />
                                <div className="stat-info">
                                    <span className="stat-value">{newsCommentsCount}</span>
                                    <span className="stat-label">News Comments</span>
                                </div>
                            </div>
                        </div>

                        <section className="dashboard-feed">
                            <h2>Recent Activity Feed</h2>

                            {loading ? (
                                <div className="loading-pulse">Loading feed...</div>
                            ) : userComments.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon-wrap">
                                        <MessageSquare size={32} />
                                    </div>
                                    <h3>It's quiet here...</h3>
                                    <p>Start reviewing cars or discussing news to build your profile.</p>
                                    <Link to="/cars" className="btn btn-primary mt-3">Explore Cars</Link>
                                </div>
                            ) : (
                                <div className="activity-timeline">
                                    {userComments.map(comment => (
                                        <div key={comment.id} className="timeline-item">
                                            <div className="timeline-connector"></div>
                                            <div className="timeline-content">
                                                <div className="timeline-header">
                                                    <div className="timeline-tags">
                                                        <span className={`tag tag-${comment.type}`}>
                                                            {comment.type.toUpperCase()}
                                                        </span>
                                                        {comment.rating && (
                                                            <span className="tag tag-rating">
                                                                {comment.rating} / 10
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="timeline-date">
                                                        <Clock size={14} /> {formatDate(comment.createdAt)}
                                                    </span>
                                                </div>

                                                <p className="timeline-text">"{comment.text}"</p>

                                                <div className="timeline-footer">
                                                    <Link to={getTargetLink(comment)} className="timeline-action">
                                                        View on Page <ArrowRight size={14} />
                                                    </Link>
                                                    <button
                                                        className="timeline-delete-btn"
                                                        onClick={() => handleDelete(comment.id)}
                                                        title="Delete Comment"
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="dashboard-view fade-in">
                        <header className="dashboard-header">
                            <h1>Account Settings</h1>
                            <p>Manage your TorqueX profile.</p>
                        </header>
                        <div className="settings-panel">
                            <div className="settings-group">
                                <h3>Profile Information</h3>
                                <div className="settings-field">
                                    <label>Display Name</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="glass-input"
                                            placeholder="Enter new display name"
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleUpdateName}
                                            disabled={isUpdatingName || newName.trim() === currentUser.displayName || !newName.trim()}
                                        >
                                            {isUpdatingName ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                    {nameSuccess && <small style={{ color: '#22c55e', display: 'block', marginTop: '5px' }}>{nameSuccess}</small>}
                                    {nameError && <small style={{ color: '#ef4444', display: 'block', marginTop: '5px' }}>{nameError}</small>}
                                </div>
                                <div className="settings-field">
                                    <label>Email Address</label>
                                    <input type="email" value={currentUser.email} disabled className="glass-input locked" />
                                </div>
                            </div>

                            <div className="settings-group danger-zone">
                                <h3>Danger Zone</h3>
                                <div className="danger-action">
                                    <div>
                                        <h4>Log Out of All Devices</h4>
                                        <p>Securely end all active sessions.</p>
                                    </div>
                                    <button className="btn-danger-outline" onClick={handleSignOut}>Sign Out</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
