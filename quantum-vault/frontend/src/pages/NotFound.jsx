import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  return (
    <div className="notfound-container">
      <div className="notfound-card">
        <h1 className="notfound-title">404</h1>
        <p className="notfound-subtitle">Page Not Found</p>
        <p className="notfound-text">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/dashboard" className="notfound-button">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
