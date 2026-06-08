interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

const COLOR_MAP = {
  blue: 'bg-blue-50 border-blue-100',
  green: 'bg-green-50 border-green-100',
  purple: 'bg-purple-50 border-purple-100',
  yellow: 'bg-yellow-50 border-yellow-100',
};

const VALUE_COLOR_MAP = {
  blue: 'text-blue-700',
  green: 'text-green-700',
  purple: 'text-purple-700',
  yellow: 'text-yellow-700',
};

export default function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-6 ${COLOR_MAP[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${VALUE_COLOR_MAP[color]}`}>{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
