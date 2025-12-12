import React from 'react';
import { Home, PlusCircle, List } from 'lucide-react';
import { ViewState } from '../types';

interface NavBarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ currentView, onChangeView }) => {
  const navItemClass = (view: ViewState) => `
    flex flex-col items-center justify-center w-full h-full space-y-1
    ${currentView === view ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}
  `;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around items-center h-full pb-2 max-w-md mx-auto">
        <button onClick={() => onChangeView(ViewState.DASHBOARD)} className={navItemClass(ViewState.DASHBOARD)}>
          <Home size={24} strokeWidth={currentView === ViewState.DASHBOARD ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        
        <button onClick={() => onChangeView(ViewState.ADD)} className="group relative -top-5">
          <div className={`p-4 rounded-full shadow-lg transition-transform duration-200 ${currentView === ViewState.ADD ? 'bg-emerald-600 rotate-90' : 'bg-emerald-500 group-active:scale-95'}`}>
            <PlusCircle size={32} className="text-white" />
          </div>
        </button>

        <button onClick={() => onChangeView(ViewState.HISTORY)} className={navItemClass(ViewState.HISTORY)}>
          <List size={24} strokeWidth={currentView === ViewState.HISTORY ? 2.5 : 2} />
          <span className="text-[10px] font-medium">History</span>
        </button>
      </div>
    </div>
  );
};