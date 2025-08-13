"use client";

type Metric = {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: string;
};

type MetricsCardProps = {
  metrics: Metric[];
  title?: string;
  description?: string;
};

export default function MetricsCard({ metrics, title, description }: MetricsCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">{metric.label}</span>
              {metric.icon && (
                <span className="text-lg">{metric.icon}</span>
              )}
            </div>
            
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-gray-900">
                {typeof metric.value === 'number' 
                  ? metric.value.toLocaleString() 
                  : metric.value}
              </div>
              
              {metric.change && (
                <div className={`text-sm font-medium flex items-center ${
                  metric.change.type === 'increase' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  <svg 
                    className={`w-4 h-4 mr-1 ${
                      metric.change.type === 'increase' ? 'rotate-0' : 'rotate-180'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M7 17l10-10M17 7H7v10" 
                    />
                  </svg>
                  {Math.abs(metric.change.value)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}