import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi/authApi';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import toast from 'react-hot-toast';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.login({
        email: email.trim(),
        password: password.trim()
      });

      if (response && response.user) {
        localStorage.setItem('access_token', response.access_token);
        login(response.user);
        toast.success(`Welcome, ${response.user.name}!`);
        // Redirect to unified dashboard
        navigate('/dashboard');
      } else {
        toast.error('Login failed. Invalid response.');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = typeof error === 'string' ? error : (error.response?.data?.message || 'Login failed. Please check your credentials.');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        disabled={loading}
      />
      <InputField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
        disabled={loading}
      />
      <Button type="submit" loading={loading} className="w-full" size="lg">
        Sign In
      </Button>
      {/* <div className="text-sm text-gray-600 text-center">
        <p className="mb-2">Demo Credentials:</p>
        <p>Admin: admin@hotel.com / admin123</p>
      </div> */}
    </form>
  );
};

