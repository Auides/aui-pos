import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Transaction, TransactionType, User } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { StatCard } from '../components/StatCard';
import { Wallet, Building2, PlusCircle, History, ArrowRightLeft, Banknote, Smartphone, Zap, Wifi, Shuffle } from 'lucide-react';

interface WorkerDashboardProps {
  user: User;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [charge, setCharge] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.TRANSFER);
  const [description, setDescription] = useState('');
  
  // Auto-update date
  const [today] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    const txs = await db.getTransactionsByUserId(user.id);
    setTransactions(txs.sort((a, b) => b.timestamp - a.timestamp));
    
    const freshUser = await db.getCurrentUser();
    if (freshUser) setCurrentUser(freshUser);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !charge) return;
    setLoading(true);

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.fullName,
      date: today,
      type,
      amount: parseFloat(amount),
      charge: parseFloat(charge),
      description,
      timestamp: Date.now(),
    };

    await db.addTransaction(newTx);
    // Clear fields
    setAmount('');
    setCharge('');
    setDescription('');
    await loadData(); // Refresh list
    setLoading(false);
  };

  const getTransactionConfig = (type: TransactionType) => {
    switch (type) {
      case TransactionType.TRANSFER: 
        return { icon: <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />, color: 'bg-teal-100 text-teal-800 border-teal-200' };
      case TransactionType.WITHDRAWAL: 
        return { icon: <Banknote className="w-3.5 h-3.5 mr-1.5" />, color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case TransactionType.AIRTIME: 
        return { icon: <Smartphone className="w-3.5 h-3.5 mr-1.5" />, color: 'bg-sky-100 text-sky-800 border-sky-200' };
      case TransactionType.UTILITIES: 
        return { icon: <Zap className="w-3.5 h-3.5 mr-1.5" />, color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case TransactionType.DATA: 
        return { icon: <Wifi className="w-3.5 h-3.5 mr-1.5" />, color: 'bg-violet-100 text-violet-800 border-violet-200' };
      case TransactionType.WITHDRAW_AND_TRANSFER: 
        return { icon: <Shuffle className="w-3.5 h-3.5 mr-1.5" />, color: 'bg-gray-100 text-gray-800 border-gray-200' };
      default: 
        return { icon: null, color: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome, {currentUser.fullName.split(' ')[0]}!</h1>
          <p className="text-slate-500">Here is your financial overview for today.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Current Date</p>
          <p className="text-xl font-semibold text-slate-700">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Balance Section - Read Only */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          title="Cash at Hand" 
          amount={currentUser.cashAtHand} 
          icon={<Wallet className="w-6 h-6" />} 
          color="teal" 
        />
        <StatCard 
          title="Cash in Bank" 
          amount={currentUser.cashInBank} 
          icon={<Building2 className="w-6 h-6" />} 
          color="indigo" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg shadow-indigo-100 p-6 border border-indigo-50 sticky top-8">
            <div className="flex items-center mb-6 space-x-2">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Log Transaction</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                label="Date" 
                value={today} 
                disabled 
                className="bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              
              <Input 
                label="Transaction Type" 
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                options={[
                  { value: TransactionType.TRANSFER, label: 'Transfer' },
                  { value: TransactionType.WITHDRAWAL, label: 'Withdrawal' },
                  { value: TransactionType.AIRTIME, label: 'Airtime' },
                  { value: TransactionType.UTILITIES, label: 'Utilities' },
                  { value: TransactionType.DATA, label: 'Data' },
                  { value: TransactionType.WITHDRAW_AND_TRANSFER, label: 'Withdraw and Transfer' },
                ]}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Amount (₦)" 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <Input 
                  label="Charge (₦)" 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={charge}
                  onChange={(e) => setCharge(e.target.value)}
                  required
                />
              </div>
              
              <Input 
                label="Description (Optional)" 
                placeholder="e.g., Customer Name"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <Button type="submit" className="w-full mt-2" isLoading={loading}>
                Add Record
              </Button>
            </form>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <History className="w-5 h-5 mr-2 text-slate-400" /> Recent Records
              </h2>
              <span className="text-xs font-medium bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                {transactions.length} entries
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Charge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-slate-50 p-4 rounded-full mb-3">
                            <PlusCircle className="w-8 h-8 text-slate-300" />
                          </div>
                          <p>No transactions logged yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => {
                      const { icon, color } = getTransactionConfig(t.type);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">{t.date}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${color}`}>
                                {icon}
                                {t.type}
                              </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{t.description || '-'}</td>
                          <td className="px-6 py-4 font-medium text-slate-800">
                            ₦{t.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-medium text-slate-600">
                            ₦{t.charge.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};