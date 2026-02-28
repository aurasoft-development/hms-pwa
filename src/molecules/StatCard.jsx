import { Card } from '../atoms/Card';
import { theme } from '../utils/theme';

export const StatCard = ({ title, value, icon: Icon, trend, subtitle, className = '', gradient = false }) => {
  return (
    <Card
      className={`${className} transition-all duration-300 hover:scale-105`}
      hover
      gradient={gradient}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#039E2F' }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 mt-3">
              <span className={`text-sm font-semibold flex items-center gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>{trend > 0 ? '↑' : '↓'}</span>
                {Math.abs(trend)}%
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="p-4 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform duration-300 hover:scale-110"
            style={{
              background: gradient
                ? theme.colors.gradients.accent
                : `linear-gradient(135deg, ${theme.colors.background.tertiary} 0%, rgba(3,158,47,0.1) 100%)`,
            }}
          >
            <Icon
              className={`w-7 h-7 ${gradient ? 'text-white' : ''}`}
              style={gradient ? {} : { color: '#039E2F' }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

