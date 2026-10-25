import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Raya App Uncaught Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-700 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-inner border border-rose-100">
              ⚠️
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">عذراً، حدث خطأ غير متوقع في العرض</h2>
              <p className="text-xs text-slate-500 mt-1">
                نعتذر عن هذا الخلل المؤقت. يجدر إعادة تحميل الصفحة لاستعادة الاتصال بالمنظومة.
              </p>
            </div>
            <div className="text-[11px] font-mono bg-slate-100 p-3 rounded-xl overflow-auto text-left max-h-32 text-rose-700 border border-slate-200">
              {this.state.error?.message || 'Unknown React render error'}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('raya_concorde_store_cache_v2');
                window.location.reload();
              }}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.01]"
            >
              إعادة تحميل الصفحة وتنظيف الذاكرة المؤقتة (Reload & Reset)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
