import { ChevronRight } from 'lucide-react';

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
}

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <button
        onClick={onBack}
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
      >
        <ChevronRight size={26} className="text-gray-600" />
      </button>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    </div>
  );
}
