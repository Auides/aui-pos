import React, { useState } from 'react';
import { db } from '../services/db';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Lock, Phone } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [phone, setPhone] = useState('+234');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await db.login(phone, pin);
      if (user) {
        onLoginSuccess();
      } else {
        setError('Invalid credentials. Please check your phone number and PIN.');
      }
    } catch (e) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-white/50 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
             <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <Input 
              label="Phone Number" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="+2348000000000"
              required
            />
             <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-[38px]" />
          </div>

          <div className="relative">
            <Input 
              label="4-Digit PIN" 
              type="password" 
              maxLength={4}
              value={pin} 
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
              placeholder="****"
              required
              className="tracking-widest font-mono"
            />
          </div>

          {error && <p className="text-sm text-rose-500 text-center bg-rose-50 p-2 rounded-lg">{error}</p>}

          <Button 
            type="submit" 
            className="w-full h-12 text-lg" 
            isLoading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-600">Don't have an account?</p>
          <button 
            onClick={onSwitchToRegister}
            className="text-indigo-600 font-semibold hover:text-indigo-700 mt-1 transition-colors"
          >
            Register as a new worker
          </button>
        </div>
      </div>
    </div>
  );
};