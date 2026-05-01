import React, { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, ShieldCheck, User, Lock, ArrowRight, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(username, password);
      if (user.role === 'Admin') navigate('/admin');
      else if (user.role === 'Sales') navigate('/sales');
      else if (user.role === 'Warehouse') navigate('/warehouse');
      else navigate('/dispatch');
    } catch (err) {
      setError(err || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-visual">
        <div className="visual-content">
          <div className="logo-badge">
            <Package size={40} color="white" />
          </div>
          <h1>Derma Touch</h1>
          <p>Premium supply chain management portal. Real-time tracking, seamless integration, and advanced analytics for Derma Touch operations.</p>

          <div className="feature-list">
            <div className="feature-item">
              <ShieldCheck size={20} />
              <span>Role Based Access Control</span>
            </div>
            <div className="feature-item">
              <ShieldCheck size={20} />
              <span>Real-time Inventory Sync</span>
            </div>
            <div className="feature-item">
              <ShieldCheck size={20} />
              <span>Automated Dispatch Flow</span>
            </div>
          </div>
        </div>
        <div className="visual-decoration"></div>
      </div>

      <div className="login-form-area">
        <div className="form-card">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Please enter your credentials to access the portal</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="input-group">
              <label>Username</label>
              <div className="input-wrapper">
                <User size={18} />
                <input
                  type="text"
                  placeholder="admin / sales / warehouse"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Login to Portal <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>Forgot password? Contact your administrator</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          min-height: 100vh;
          width: 100vw;
          background: #f8fafc;
          font-family: 'Inter', sans-serif;
        }

        .login-visual {
          flex: 1.2;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .visual-content {
          position: relative;
          z-index: 10;
          max-width: 500px;
        }

        .logo-badge {
          background: rgba(255, 255, 255, 0.1);
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 40px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .login-visual h1 {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 20px;
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-visual p {
          font-size: 1.1rem;
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #e2e8f0;
          font-size: 0.95rem;
        }

        .feature-item svg {
          color: #38bdf8;
        }

        .visual-decoration {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background: radial-gradient(circle at 0% 0%, rgba(56, 189, 248, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 100% 100%, rgba(56, 189, 248, 0.05) 0%, transparent 50%);
        }

        .login-form-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: white;
        }

        .form-card {
          width: 100%;
          max-width: 420px;
        }

        .form-header {
          margin-bottom: 40px;
        }

        .form-header h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 10px;
        }

        .form-header p {
          color: #64748b;
          font-size: 1rem;
        }

        .input-group {
          margin-bottom: 24px;
        }

        .input-group label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-wrapper svg {
          position: absolute;
          left: 14px;
          color: #94a3b8;
        }

        .input-wrapper input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s;
          background: #f8fafc;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: #38bdf8;
          background: white;
          box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1);
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 32px;
        }

        .login-btn:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          background: #fef2f2;
          color: #ef4444;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-bottom: 24px;
          border: 1px solid #fee2e2;
        }

        .form-footer {
          margin-top: 32px;
          text-align: center;
        }

        .form-footer p {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 968px) {
          .login-visual {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
