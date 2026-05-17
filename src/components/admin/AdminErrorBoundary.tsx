import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AdminErrorBoundary]', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <p className="text-lg font-semibold text-destructive">حدث خطأ في تحميل الصفحة</p>
        <pre className="text-xs text-muted-foreground bg-muted rounded p-4 max-w-xl overflow-auto text-start whitespace-pre-wrap">
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
        <Button variant="outline" onClick={() => this.setState({ error: null })}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }
}
