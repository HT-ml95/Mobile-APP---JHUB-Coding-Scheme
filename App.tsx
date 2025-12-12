import React, { useState, useEffect, useRef } from 'react';
import { Camera, PoundSterling, Calendar, Upload, X, Trash2, ArrowUpRight, List } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Expense, ViewState } from './types';
import { analyzeReceiptImage } from './services/geminiService';
import { Button } from './components/Button';
import { NavBar } from './components/NavBar';

// Using localStorage to persist data "natively" on the device
const STORAGE_KEY = 'snap_expense_data';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Add Expense State
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setExpenses(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load expenses", e);
      }
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        
        // Optional: Trigger AI analysis immediately
        if (process.env.API_KEY) {
          setIsAnalyzing(true);
          try {
            const result = await analyzeReceiptImage(base64String);
            if (result.amount) setAmount(result.amount.toString());
            if (result.merchant) setMerchant(result.merchant);
            if (result.date) setDate(result.date);
          } catch (error) {
            console.error("AI Analysis failed", error);
            // Non-blocking error, user can still enter manually
          } finally {
            setIsAnalyzing(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveExpense = () => {
    if (!amount || !merchant) return;

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      merchant,
      date,
      timestamp: Date.now(), // Metadata timestamp of when it was taken/saved
      description,
      imageUrl: imagePreview || undefined
    };

    setExpenses([newExpense, ...expenses]);
    resetForm();
    setView(ViewState.DASHBOARD);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const resetForm = () => {
    setAmount('');
    setMerchant('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalClaimable = expenses.reduce((sum, item) => sum + item.amount, 0);

  // Chart Data preparation
  const chartData = expenses.slice(0, 7).reverse().map(e => ({
    name: e.merchant.substring(0, 5),
    amount: e.amount
  }));

  const renderDashboard = () => (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SnapExpense</h1>
          <p className="text-slate-500 text-sm">Track your claims</p>
        </div>
        <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
          SE
        </div>
      </header>

      {/* Main Total Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-xl shadow-emerald-200/50">
        <p className="text-emerald-100 text-sm font-medium mb-1">Total Claimable</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight">£{totalClaimable.toFixed(2)}</span>
        </div>
        <div className="mt-4 flex gap-2">
           <div className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md flex items-center">
             <ArrowUpRight size={12} className="mr-1" />
             {expenses.length} Receipts
           </div>
        </div>
      </div>

      {/* Chart Section */}
      {expenses.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Activity</h3>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  itemStyle={{color: '#059669', fontWeight: 'bold'}}
                  cursor={{fill: 'transparent'}}
                  formatter={(value: number) => [`£${value.toFixed(2)}`, 'Amount']}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#059669' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-semibold text-slate-700">Latest Receipts</h3>
          <button onClick={() => setView(ViewState.HISTORY)} className="text-xs text-emerald-600 font-medium">View All</button>
        </div>
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p>No receipts logged yet.</p>
            <button onClick={() => setView(ViewState.ADD)} className="mt-2 text-emerald-600 text-sm font-medium">Add your first</button>
          </div>
        ) : (
          expenses.slice(0, 3).map(expense => (
            <div key={expense.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-400 overflow-hidden">
                {expense.imageUrl ? (
                  <img src={expense.imageUrl} alt="receipt" className="h-full w-full object-cover" />
                ) : (
                  <PoundSterling size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{expense.merchant}</p>
                <p className="text-xs text-slate-500">{expense.date}</p>
              </div>
              <div className="font-bold text-slate-900">£{expense.amount.toFixed(2)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAddExpense = () => (
    <div className="pb-24 animate-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-xl font-bold mb-6 text-slate-900">New Receipt</h2>
      
      {/* Image Capture Section */}
      <div className="mb-6">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors cursor-pointer overflow-hidden
            ${imagePreview ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
          `}
        >
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-white font-medium flex items-center gap-2"><Camera size={20}/> Retake</span>
              </div>
            </>
          ) : (
            <div className="text-center p-6">
              <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Camera size={24} />
              </div>
              <p className="font-medium text-slate-700">Take Photo</p>
              <p className="text-xs text-slate-500 mt-1">Tap to capture or upload receipt</p>
            </div>
          )}
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            capture="environment" // Forces back camera on mobile
            className="hidden" 
            onChange={handleImageCapture}
          />
        </div>
        {isAnalyzing && (
           <div className="mt-2 text-xs text-emerald-600 flex items-center justify-center animate-pulse">
             ✨ AI is analyzing receipt details...
           </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Total Amount</label>
          <div className="relative">
            <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-lg font-semibold text-slate-900 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Merchant / Business</label>
          <input 
            type="text" 
            value={merchant} 
            onChange={e => setMerchant(e.target.value)}
            placeholder="e.g. Starbucks, Uber"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full pl-10 pr-2 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category (Opt)</label>
             <input 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                placeholder="Meals, Travel..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
              />
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <Button variant="secondary" onClick={() => { resetForm(); setView(ViewState.DASHBOARD); }}>Cancel</Button>
          <Button onClick={handleSaveExpense} disabled={!amount || !merchant || isAnalyzing} isLoading={isAnalyzing}>Save Receipt</Button>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="pb-24 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold mb-6 text-slate-900">Expense History</h2>
      
      <div className="space-y-4">
        {expenses.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <List size={48} className="mb-4 opacity-50" />
             <p>No history yet</p>
           </div>
        ) : (
          expenses.map(expense => (
            <div key={expense.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative group overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {expense.imageUrl ? (
                    <img src={expense.imageUrl} alt="receipt" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                      <PoundSterling size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{expense.merchant}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        {expense.date} • {new Date(expense.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600 text-lg">£{expense.amount.toFixed(2)}</span>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-slate-600 mt-1">{expense.description}</p>
                  )}
                </div>
              </div>
              
              {/* Delete Action */}
              <button 
                onClick={() => handleDeleteExpense(expense.id)}
                className="absolute right-0 top-0 bottom-0 w-16 bg-red-50 text-red-500 flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-200"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative shadow-2xl overflow-hidden">
      <div className="h-full overflow-y-auto no-scrollbar p-6">
        {view === ViewState.DASHBOARD && renderDashboard()}
        {view === ViewState.ADD && renderAddExpense()}
        {view === ViewState.HISTORY && renderHistory()}
      </div>
      <NavBar currentView={view} onChangeView={setView} />
    </div>
  );
};

export default App;