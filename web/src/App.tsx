/*
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './components/Profile';

// Private Route 컴포넌트
interface PrivateRouteProps {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('access_token') !== null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const isAuthenticated = (): boolean => {
    return localStorage.getItem('access_token') !== null;
  };

  const handleLogout = (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <Router>
      <div>
        <nav style={{ 
          backgroundColor: '#333', 
          padding: '10px 20px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div>
              <Link 
                to="/" 
                style={{ 
                  color: 'white', 
                  marginRight: '20px', 
                  textDecoration: 'none',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                Django + React Auth
              </Link>
            </div>
            
            <div>
              {!isAuthenticated() ? (
                <>
                  <Link 
                    to="/login" 
                    style={{ 
                      color: 'white', 
                      marginRight: '20px', 
                      textDecoration: 'none' 
                    }}
                  >
                    로그인
                  </Link>
                  <Link 
                    to="/register" 
                    style={{ 
                      color: 'white', 
                      textDecoration: 'none' 
                    }}
                  >
                    회원가입
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/profile" 
                    style={{ 
                      color: 'white', 
                      marginRight: '20px', 
                      textDecoration: 'none' 
                    }}
                  >
                    프로필
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'white',
                      border: '1px solid white',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    로그아웃
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

// 홈 컴포넌트
const Home: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px', padding: '20px' }}>
      <h1>Django + React 인증 시스템</h1>
      <p style={{ fontSize: '18px', marginTop: '20px' }}>
        TypeScript로 구현된 회원가입, 로그인, 소셜 로그인 테스트
      </p>
      <div style={{ marginTop: '30px' }}>
        <Link 
          to="/register"
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            marginRight: '10px',
            display: 'inline-block'
          }}
        >
          시작하기
        </Link>
      </div>
    </div>
  );
};

export default App;
*/


import React from 'react';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/Common/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="App">
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;