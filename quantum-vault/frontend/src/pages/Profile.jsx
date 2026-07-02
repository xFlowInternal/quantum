import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function Profile() {
  const { user, updatePassword } = useAuth();
  const navigate = useNavigate();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const result = await updatePassword(currentPassword, newPassword);
    
    if (result.success) {
      setSuccess('Password updated successfully! Please login again.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1 className="profile-title">👤 Profile Settings</h1>
        
        <div className="profile-section">
          <h2>Account Information</h2>
          <div className="profile-info">
            <div className="profile-item">
              <strong>Username:</strong>
              <span>{user?.username}</span>
            </div>
            <div className="profile-item">
              <strong>Email:</strong>
              <span>{user?.email}</span>
            </div>
            <div className="profile-item">
              <strong>Account Created:</strong>
              <span>{new Date(user?.created_at).toLocaleDateString()}</span>
            </div>
            <div className="profile-item">
              <strong>Last Login:</strong>
              <span>{new Date(user?.last_login).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Change Password</h2>
          
          {error && <div className="profile-error">{error}</div>}
          {success && <div className="profile-success">{success}</div>}
          
          <form onSubmit={handlePasswordUpdate} className="profile-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" disabled={loading} className="profile-button">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="profile-section">
          <h2>Cryptographic Keys</h2>
          <div className="profile-info">
            <div className="profile-item">
              <strong>ECC Public Key:</strong>
              <span>{user?.public_key_ecc || 'Not generated yet'}</span>
            </div>
            <div className="profile-item">
              <strong>PQC Public Key:</strong>
              <span>{user?.public_key_pqc || 'Not generated yet'}</span>
            </div>
          </div>
          <p className="profile-note">
            🔐 Cryptographic keys will be generated in Week 7-9
          </p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
