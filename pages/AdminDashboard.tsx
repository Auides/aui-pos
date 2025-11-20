import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { User, Transaction, UserRole, TransactionType, Notification } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { StatCard } from '../components/StatCard';
import { Users, TrendingUp, Wallet, Building2, Search, Bell, Check, Filter, XCircle, CheckCircle, ArrowRightLeft, Banknote, Smartphone, Zap, Wifi, AlertCircle, Shuffle, Database, Download, Trash2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [workers, setWorkers] = useState<User[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<User | null>(null);
  const [workerTransactions, setWorkerTransactions] = useState<Transaction[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<Notification[]>([]);
  
  // UI State
  const [editMode, setEditMode] = useState(false);
  const [searchWorker, setSearchWorker] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Edit Form State
  const [cashAtHand, setCashAtHand] = useState(0);
  const [cashInBank, setCashInBank] = useState(0);

  // Transaction Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const allUsers = await db.getUsers();
    setWorkers(allUsers.filter(u => u.role === UserRole.WORKER));

    const currentUser = await db.getCurrentUser();
    if (currentUser) {
      const notifs = await db.getNotifications(currentUser.id, UserRole.ADMIN);
      setAdminNotifications(notifs.filter(n => n.recipientId === 'ADMIN'));
    }
  };

  const handleSelectWorker = async (worker: User) => {
    setSelectedWorker(worker);
    const txs = await db.getTransactionsByUserId(worker.id);
    setWorkerTransactions(txs.sort((a, b) => b.timestamp - a.timestamp));
    setCashAtHand(worker.cashAtHand);
    setCashInBank(worker.cashInBank);
    setEditMode(false);
    // Reset filters
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterType('ALL');
  };

  const handleUpdateBalance = async () => {
    if (selectedWorker) {
      setLoading(true);
      const updatedUser = await db.updateUserBalance(selectedWorker.id, Number(cashAtHand), Number(cashInBank));
      if (updatedUser) {
        setSelectedWorker(updatedUser);
        await refreshData(); // Update list view as well
      }
      setEditMode(false);
      alert('Balances updated successfully');
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    await db.markNotificationRead(id);
    refreshData();
  };

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterType('ALL');
  };

  const handleExportData = async () => {
    const data = await db.getFullDatabase();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aui_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Are you sure you want to wipe the entire database? This action cannot be undone. It will delete all workers and transactions.')) {
      await db.resetDatabase();
    }
  };

  // Filter Logic
  const filteredWorkers = workers.filter(w => 
    w.fullName.toLowerCase().includes(searchWorker.toLowerCase()) || 
    w.phoneNumber.includes(searchWorker)
  );

  const filteredTransactions = workerTransactions.filter(t => {
    const txDate = new Date(t.date).getTime();
    const start = filterStartDate ? new Date(filterStartDate).getTime() : 0;
    const end = filterEndDate ? new Date(filterEndDate).getTime() : Infinity;
    
    const dateMatch = txDate >= start && txDate <= end;
    const typeMatch = filterType === 'ALL' || t.type === filterType;

    return dateMatch && typeMatch;
  });

  // System Stats
  const totalCashAtHand = workers.reduce((acc, w) => acc + w.cashAtHand, 0);
  const totalCashInBank = workers.reduce((acc, w) => acc + w.cashInBank, 0);

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500">Monitor activity, manage funds, and view alerts.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 flex items-center text-slate-500 text-sm font-medium shadow-sm">
          <Users className="w-4 h-4 mr-2 text-indigo-500" />
          {workers.length} Active Workers
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Worker Directory */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-1 h-[650px] flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <h2 className="font-semibold text-slate-700 flex items-center">
              <Search className="w-4 h-4 mr-2" /> Worker Directory
            </h2>
            <div className="relative">
              <Input 
                label="" 
                placeholder="Search name or phone..." 
                value={searchWorker}
                onChange={(e) => setSearchWorker(e.target.value)}
                className="bg-white text-sm"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {filteredWorkers.length === 0 ? (
              <div className="text-center text-slate-400 py-8 px-4">
                <p>No workers found matching "{searchWorker}"</p>
              </div>
            ) : (
              filteredWorkers.map(worker => {
                const isLowBalance = worker.cashAtHand < 10000;
                return (
                  <div 
                    key={worker.id}
                    onClick={() => handleSelectWorker(worker)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border group ${
                      selectedWorker?.id === worker.id 
                        ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm' 
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-full">
                        <div className="flex justify-between items-center">
                          <h3 className={`font-bold ${selectedWorker?.id === worker.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {worker.fullName}
                          </h3>
                          {selectedWorker?.id === worker.id && (
                            <span className="bg-indigo-200 text-indigo-700 p-1 rounded-full">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{worker.phoneNumber}</p>
                        
                        {isLowBalance && (
                          <div className="flex items-center text-rose-500 text-xs font-medium bg-rose-50 px-2 py-1 rounded-md border border-rose-100 w-fit">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Low Balance (₦{worker.cashAtHand.toLocaleString()})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Detail View or Overview */}
        <div className="lg:col-span-2 space-y-6 h-[650px] overflow-y-auto pr-1 custom-scrollbar">
          {selectedWorker ? (
            <>
              {/* Balance Management Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Wallet className="w-48 h-48 text-indigo-600" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                    <div>
                      <button 
                        onClick={() => setSelectedWorker(null)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-1 flex items-center"
                      >
                        ← Back to Overview
                      </button>
                      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {selectedWorker.fullName}
                      </h2>
                      <p className="text-slate-500 text-sm">{selectedWorker.address}</p>
                    </div>
                    <Button 
                      variant={editMode ? 'secondary' : 'outline'}
                      onClick={() => {
                        if(editMode) handleUpdateBalance();
                        else setEditMode(true);
                      }}
                      size="sm"
                      isLoading={loading}
                    >
                      {editMode ? 'Save Balance' : 'Set Balance'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center mb-2 text-teal-600">
                        <Wallet className="w-5 h-5 mr-2" />
                        <span className="font-medium text-sm">Cash at Hand</span>
                      </div>
                      {editMode ? (
                        <Input 
                          label="" 
                          type="number" 
                          value={cashAtHand} 
                          onChange={(e) => setCashAtHand(parseFloat(e.target.value))}
                          className="bg-white"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-slate-800">
                          ₦{selectedWorker.cashAtHand.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center mb-2 text-indigo-600">
                        <Building2 className="w-5 h-5 mr-2" />
                        <span className="font-medium text-sm">Cash in Bank</span>
                      </div>
                      {editMode ? (
                        <Input 
                          label="" 
                          type="number" 
                          value={cashInBank} 
                          onChange={(e) => setCashInBank(parseFloat(e.target.value))}
                          className="bg-white"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-slate-800">
                          ₦{selectedWorker.cashInBank.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" /> Transaction History
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearFilters}
                      className="text-xs h-8"
                      disabled={!filterStartDate && !filterEndDate && filterType === 'ALL'}
                    >
                      <XCircle className="w-3 h-3 mr-1" /> Clear Filters
                    </Button>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl">
                    <div>
                      <label className="text-xs text-slate-500 font-medium ml-1 mb-1 block">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium ml-1 mb-1 block">End Date</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                      />
                    </div>
                    <div>
                       <label className="text-xs text-slate-500 font-medium ml-1 mb-1 block">Type</label>
                       <select 
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                       >
                         <option value="ALL">All Types</option>
                         <option value={TransactionType.TRANSFER}>Transfer</option>
                         <option value={TransactionType.WITHDRAWAL}>Withdrawal</option>
                         <option value={TransactionType.AIRTIME}>Airtime</option>
                         <option value={TransactionType.UTILITIES}>Utilities</option>
                         <option value={TransactionType.DATA}>Data</option>
                         <option value={TransactionType.WITHDRAW_AND_TRANSFER}>Withdraw & Transfer</option>
                       </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/50 text-slate-700 font-semibold">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3 text-right">Charge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                            {workerTransactions.length === 0 
                              ? "No transactions found for this user." 
                              : "No transactions match your filters."}
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((t) => {
                           const { icon, color } = getTransactionConfig(t.type);
                           return (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 whitespace-nowrap">{t.date}</td>
                              <td className="px-6 py-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${color}`}>
                                  {icon}
                                  {t.type}
                                </span>
                              </td>
                              <td className="px-6 py-3 truncate max-w-xs">{t.description || '-'}</td>
                              <td className="px-6 py-3 font-medium">₦{t.amount.toLocaleString()}</td>
                              <td className="px-6 py-3 text-right font-mono font-medium text-slate-800">
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
            </>
          ) : (
            /* Dashboard Overview (No Worker Selected) */
            <div className="space-y-6">
              
              {/* System Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <StatCard 
                    title="Total Cash at Hand" 
                    amount={totalCashAtHand} 
                    icon={<Wallet className="w-6 h-6" />} 
                    color="teal" 
                  />
                  <StatCard 
                    title="Total Cash in Bank" 
                    amount={totalCashInBank} 
                    icon={<Building2 className="w-6 h-6" />} 
                    color="indigo" 
                  />
              </div>

              {/* Admin Notifications Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-amber-500" /> Admin Alerts
                  </h3>
                  <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                    {adminNotifications.length} Total
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {adminNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                      <p>No admin alerts at this time.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {adminNotifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`p-4 transition-colors flex justify-between items-start ${
                            notification.read ? 'bg-white hover:bg-slate-50' : 'bg-amber-50/50 hover:bg-amber-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center mb-1">
                              {!notification.read && <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>}
                              <h4 className={`text-sm font-semibold ${notification.read ? 'text-slate-700' : 'text-slate-900'}`}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-slate-400 ml-2">
                                {new Date(notification.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">{notification.message}</p>
                          </div>
                          {!notification.read && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkRead(notification.id);
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-white px-2 py-1 rounded border border-indigo-100 hover:border-indigo-300 transition-colors"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

               {/* Database Management Section */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center">
                    <Database className="w-4 h-4 mr-2 text-slate-500" /> Database & System
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Export Data</h4>
                    <p className="text-sm text-slate-500 mb-4">Download a JSON copy of all workers, transactions, and logs for backup.</p>
                    <Button variant="outline" onClick={handleExportData} size="sm">
                      <Download className="w-4 h-4 mr-2" /> Download Backup
                    </Button>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-6 md:pt-0">
                    <h4 className="text-sm font-semibold text-rose-600 mb-2">Danger Zone</h4>
                    <p className="text-sm text-slate-500 mb-4">Clear all data and restore the application to its initial state. This cannot be undone.</p>
                    <Button variant="danger" onClick={handleResetDatabase} size="sm">
                      <Trash2 className="w-4 h-4 mr-2" /> Reset System
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-slate-400">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>Select a worker from the directory to manage their specific details and transactions.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};