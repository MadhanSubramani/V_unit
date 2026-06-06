// src/components/StatsCard.tsx
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'yellow';
  isLoading?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-600',
    ring: 'ring-2 ring-blue-400',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-600',
    ring: 'ring-2 ring-green-400',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-600',
    ring: 'ring-2 ring-red-400',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'bg-yellow-100 text-yellow-600',
    text: 'text-yellow-600',
    ring: 'ring-2 ring-yellow-400',
  },
};

export default function StatsCard({
  title,
  count,
  icon: Icon,
  color,
  isLoading,
  onClick,
  isActive,
}: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      onClick={onClick}
      className={`card p-6 ${colors.bg} border-none transition-all
        ${onClick ? 'cursor-pointer hover:brightness-95' : ''}
        ${isActive ? colors.ring : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {isLoading ? (
            <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <p className={`text-3xl font-bold ${colors.text} mt-1`}>{count}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}