"use client";

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type BarChartProps = {
  data: {
    labels: string[];
    values: number[];
    label?: string;
    color?: string;
  };
  title?: string;
  description?: string;
  orientation?: 'vertical' | 'horizontal';
};

export default function BarChart({ data, title, description, orientation = 'vertical' }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const color = data.color || '#3b82f6';

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: data.label || 'Valeurs',
          data: data.values,
          backgroundColor: color + '80',
          borderColor: color,
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: orientation === 'horizontal' ? 'y' : 'x',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return `${context[0].label}`;
              },
              label: function(context) {
                return `${data.label || 'Valeur'}: ${context.formattedValue}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              display: true,
              color: '#f3f4f6'
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: '#f3f4f6'
            },
            ticks: {
              font: {
                size: 11
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
  }, [data, orientation]);

  const max = Math.max(...data.values);
  const min = Math.min(...data.values);
  const avg = data.values.reduce((sum, val) => sum + val, 0) / data.values.length;

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

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-700">Maximum:</span>
          <span className="ml-2 text-gray-900">{max}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Minimum:</span>
          <span className="ml-2 text-gray-900">{min}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Moyenne:</span>
          <span className="ml-2 text-gray-900">{avg.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}