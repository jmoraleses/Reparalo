
import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-xl w-full bg-white rounded-lg shadow-lg overflow-hidden border border-red-200">
                        <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                            <h2 className="text-lg font-semibold text-red-800">Has encontrado un error</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">
                                La aplicación ha encontrado un problema inesperado y no ha podido mostrar esta página.
                            </p>

                            <div className="bg-gray-100 p-4 rounded text-sm font-mono overflow-auto max-h-64 border border-gray-200">
                                <p className="font-bold text-red-600 mb-2">{this.state.error?.toString()}</p>
                                <code className="text-gray-600 block whitespace-pre-wrap">
                                    {this.state.errorInfo?.componentStack}
                                </code>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <Button
                                    onClick={() => window.location.href = '/'}
                                    variant="default"
                                >
                                    Volver al inicio
                                </Button>
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="outline"
                                >
                                    Recargar página
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
