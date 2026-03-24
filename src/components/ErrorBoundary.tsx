// @ts-nocheck
import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if ((this.props as Props).fallback) return (this.props as Props).fallback;

      return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-red-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Đã xảy ra lỗi</h2>
                <p className="text-red-200 text-xs">Hệ thống gặp sự cố không mong muốn</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Rất xin lỗi, ứng dụng đã gặp lỗi không mong muốn. 
                Vui lòng thử tải lại trang hoặc liên hệ bộ phận hỗ trợ.
              </p>

              {/* Error Details (dev only) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-4">
                  <summary className="text-xs font-bold text-red-600 cursor-pointer hover:text-red-800 uppercase tracking-wider">
                    Chi tiết lỗi (Dev)
                  </summary>
                  <pre className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 overflow-auto max-h-40 font-mono">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Thử lại
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-b from-[#FF8800] to-[#E55A00] hover:from-[#FFAA00] hover:to-[#FF6600] text-white font-bold text-sm rounded-lg shadow-md flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw size={14} />
                  Tải lại trang
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
