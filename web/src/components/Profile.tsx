import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { User } from '../types/auth.types';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
      setError('');
    } catch (error: any) {
      console.error('프로필 로드 실패:', error);
      setError('프로필을 불러올 수 없습니다.');
      
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = (): void => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      authAPI.logout();
      navigate('/login');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>사용자 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h2>프로필</h2>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px' 
      }}>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold', width: '150px' }}>ID:</td>
              <td style={{ padding: '8px' }}>{user.id}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>이메일:</td>
              <td style={{ padding: '8px' }}>{user.email || '없음'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>사용자명:</td>
              <td style={{ padding: '8px' }}>{user.username}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>이름:</td>
              <td style={{ padding: '8px' }}>
                {user.first_name || user.last_name 
                  ? `${user.first_name} ${user.last_name}`.trim()
                  : '미설정'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>가입 방법:</td>
              <td style={{ padding: '8px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: user.login_method === 'email' ? '#007bff' 
                    : user.login_method === 'google' ? '#4285f4' 
                    : '#FEE500',
                  color: user.login_method === 'kakao' ? '#000' : '#fff',
                  fontSize: '12px'
                }}>
                  {user.login_method.toUpperCase()}
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>가입일:</td>
              <td style={{ padding: '8px' }}>{formatDate(user.date_joined)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>인증 상태:</td>
              <td style={{ padding: '8px' }}>
                {user.is_verified ? (
                  <span style={{ color: 'green' }}>✓ 인증됨</span>
                ) : (
                  <span style={{ color: 'orange' }}>⚠ 미인증</span>
                )}
              </td>
            </tr>
            {user.is_staff && (
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>권한:</td>
                <td style={{ padding: '8px' }}>
                  <span style={{ color: 'red' }}>스태프</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {user.profile_image_url && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>프로필 이미지:</p>
            <img 
              src={user.profile_image_url} 
              alt="프로필" 
              style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%',
                border: '2px solid #ddd'
              }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleLogout}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          로그아웃
        </button>
        
        <button 
          onClick={() => navigate('/edit-profile')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          프로필 수정
        </button>
      </div>
    </div>
  );
};

export default Profile;
