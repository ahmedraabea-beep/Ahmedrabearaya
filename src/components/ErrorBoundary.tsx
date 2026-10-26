import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Root Application ErrorBoundary
 * Catches uncaught fatal errors with safe reload (never deletes local user data).
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Raya App Root Uncaught Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-700 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-inner border border-rose-100">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">عذراً، حدث خطأ غير متوقع في المنظومة</h2>
              <p className="text-xs text-slate-500 mt-1">
                تم عزل الخطأ بنجاح لحماية بياناتك. اضغط إعادة المحاولة لاستئناف التشغيل بأمان دون أي فقدان للبيانات.
              </p>
            </div>
            <div className="text-[11px] font-mono bg-slate-100 p-3 rounded-xl overflow-auto text-left max-h-32 text-rose-700 border border-slate-200">
              {this.state.error?.message || 'Unknown React error'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة المحاولة واستئناف العمل (Retry)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface PageErrorBoundaryProps {
  pageName: string;
  pageNameAr: string;
  children: ReactNode;
  onRetry?: () => void;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Isolated Page ErrorBoundary
 * Encapsulates an individual page so failures in one page never crash the other 8 pages or wipe data.
 */
export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  public state: PageErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in page ${this.props.pageName}:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-10 my-4 bg-white rounded-3xl border border-rose-200 shadow-sm text-center max-w-2xl mx-auto space-y-4" dir="rtl">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
            <AlertTriangle className="w-7 h-7 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              حدث خطأ غير متوقع أثناء عرض صفحة {this.props.pageNameAr} ({this.props.pageName})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              تم احتواء المشكلة بأمان دون التأثير على باقي أقسام النظام أو بياناتك المحفوظة.
            </p>
          </div>

          <div className="text-[11px] font-mono bg-slate-50 p-3 rounded-xl overflow-auto text-left max-h-28 text-rose-700 border border-slate-200">
            {this.state.error?.message || 'Page render error'}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleRetry}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة المحاولة (Retry)</span>
            </button>
            <button
              onClick={() => {
                window.location.hash = '#/';
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-2 border border-slate-200"
            >
              <Home className="w-4 h-4 text-slate-500" />
              <span>العودة للوحة الرئيسية</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
