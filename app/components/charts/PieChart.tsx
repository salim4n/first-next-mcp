"use client";

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type PieChartProps = {
  data: {
    labels: string[];
    values: number[];
    colors?: string[];
  };
  title?: string;
  description?: string;
};

const defaultColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export default function PieChart({ data, title, description }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const colors = data.colors || defaultColors.slice(0, data.labels.length);

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: colors,
          borderColor: colors.map(color => color + '20'),
          borderWidth: 2,
          hoverBorderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((sum, val) => sum + (val as number), 0);
                const percentage = (((context.raw as number) / total) * 100).toFixed(1);
                return `${context.label}: ${context.formattedValue} (${percentage}%)`;
              }
            }
          }
        },
        layout: {
          padding: 10
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  const total = data.values.reduce((sum, val) => sum + val, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {title && (
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
      
      <div className="relative" style={{ height: '300px' }}>
        <canvas ref={canvasRef} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-700">Total:</span>
          <span className="ml-2 text-gray-900">{total}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Éléments:</span>
          <span className="ml-2 text-gray-900">{data.labels.length}</span>
        </div>
      </div>
    </div>
  );
}