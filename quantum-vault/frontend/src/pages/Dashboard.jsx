import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h1 className="dashboard-title">Welcome, {user?.username}! 👋</h1>
        <p className="dashboard-subtitle">Your Quantum Vault Dashboard</p>
        
        <div className="dashboard-grid">
          <div className="dashboard-item">
            <div className="dashboard-icon">📧</div>
            <h3>Messages</h3>
            <p>0 unread messages</p>
            <small>Coming in Week 5-6</small>
          </div>
          
          <div className="dashboard-item">
            <div className="dashboard-icon">🔐</div>
            <h3>Encryption</h3>
            <p>ECC + PQC Ready</p>
            <small>Coming in Week 7-9</small>
          </div>
          
          <div className="dashboard-item">
            <div className="dashboard-icon">🎲</div>
            <h3>QRNG</h3>
            <p>Quantum Random</p>
            <small>Coming in Week 8</small>
          </div>
          
          <div className="dashboard-item">
            <div className="dashboard-icon">👤</div>
            <h3>Profile</h3>
            <p>Manage account</p>
            <small>Available now</small>
          </div>
        </div>
        
        <div className="dashboard-info">
          <h3>Account Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Username:</strong>
              <span>{user?.username}</span>
            </div>
            <div className="info-item">
              <strong>Email:</strong>
              <span>{user?.email}</span>
            </div>
            <div className="info-item">
              <strong>Account Created:</strong>
              <span>{new Date(user?.created_at).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <strong>Last Login:</strong>
              <span>{new Date(user?.last_login).toLocaleString()}</span>
            </div>
            <div className="info-item">
              <strong>Verified:</strong>
              <span>{user?.is_verified ? '✅ Yes' : '❌ No'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
