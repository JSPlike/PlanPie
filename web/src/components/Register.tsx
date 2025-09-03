import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { RegisterRequest } from '../types/auth.types';

interface FormErrors {
  [key: string]: string | string[];
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    username: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await authAPI.register(formData);
      const { tokens } = response.data;
      
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      
      alert('회원가입 성공!');
      navigate('/profile');
    } catch (error: any) {
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        alert('회원가입 실패');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderError = (field: string): JSX.Element | null => {
    if (!errors[field]) return null;
    
    const error = errors[field];
    const errorMessage = Array.isArray(error) ? error[0] : error;
    
    return <p style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>{errorMessage}</p>;
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="email"
            name="email"
            placeholder="이메일"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          {renderError('email')}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            name="username"
            placeholder="사용자명"
            value={formData.username}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          {renderError('username')}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          {renderError('password')}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="password"
            name="password2"
            placeholder="비밀번호 확인"
            value={formData.password2}
            onChange={handleChange}
            required
            minLength={8}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          {renderError('password2')}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            name="first_name"
            placeholder="이름 (선택)"
            value={formData.first_name}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            name="last_name"
            placeholder="성 (선택)"
            value={formData.last_name}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? '처리중...' : '회원가입'}
        </button>
      </form>
    </div>
  );
};

export default Register;
