import React, { useState } from 'react';
import { db } from '../services/db';
import { User, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UserPlus } from 'lucide-react';

interface RegisterProps {
  onRegisterSuccess: () => void; 
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    phoneNumber: '+234',
    guardianPhoneNumber: '+234',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Enforce numeric only for password fields
    if (name === 'password' || name === 'confirmPassword') {
      const numericVal = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: numericVal }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validatePhone = (phone: string) => {
    const regex = /^\+234\d{10}$/;
    return regex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length !== 4) {
      setError('Password must be exactly 4 digits.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!validatePhone(formData.phoneNumber)) {
      setError('Phone number must start with +234 followed by 10 digits (e.g., +2348012345678).');
      return;
    }

    if (!validatePhone(formData.guardianPhoneNumber)) {
      setError('Guardian phone number must start with +234 followed by 10 digits.');
      return;
    }

    setLoading(true);
    
    try {
      const existingUsers = await db.getUsers();
      if (existingUsers.some(u => u.phoneNumber === formData.phoneNumber)) {
        setError('A user with this phone number already exists.');
        setLoading(false);
        return;
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        fullName: formData.fullName,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        guardianPhoneNumber: formData.guardianPhoneNumber,
        password: formData.password,
        role: UserRole.WORKER,
        cashAtHand: 0,
        cashInBank: 0,
        createdAt: new Date().toISOString(),
      };

      await db.saveUser(newUser);
      alert('Registration successful! Please login with your credentials.');
      onSwitchToLogin();
    } catch (e) {
      setError('Registration failed. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 to-slate-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-lg border border-white/50">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="bg-teal-500 p-3 rounded-xl text-white shadow-lg shadow-teal-500/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Join the Team</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <Input 
            label="Full Name" 
            name="fullName"
            value={formData.fullName} 
            onChange={handleChange} 
            required
          />
          
          <Input 
            label="Address" 
            name="address"
            value={formData.address} 
            onChange={handleChange} 
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Your Phone (+234...)" 
              name="phoneNumber"
              type="tel"
              placeholder="+2348000000000"
              value={formData.phoneNumber} 
              onChange={handleChange} 
              required
            />
             <Input 
              label="Guardian Phone (+234...)" 
              name="guardianPhoneNumber"
              type="tel"
              placeholder="+2348000000000"
              value={formData.guardianPhoneNumber} 
              onChange={handleChange} 
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="4-Digit PIN" 
              name="password"
              type="password"
              value={formData.password} 
              onChange={handleChange} 
              required
              placeholder="****"
              className="font-mono tracking-widest"
            />
             <Input 
              label="Confirm PIN" 
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword} 
              onChange={handleChange} 
              required
              placeholder="****"
              className="font-mono tracking-widest"
            />
          </div>

          {error && <p className="text-sm text-rose-500 text-center bg-rose-50 p-2 rounded-lg">{error}</p>}

          <Button 
            type="submit" 
            variant="secondary"
            className="w-full h-12 mt-2" 
            isLoading={loading}
          >
            Create Profile
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={onSwitchToLogin}
            className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
          >
            Already registered? Login here
          </button>
        </div>
      </div>
    </div>
  );
};