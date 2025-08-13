"use client";

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type LineChartProps = {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      values: number[];
      color?: string;
    }>;
  };
  title?: string;
  description?: string;
};

const defaultColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function LineChart({ data, title, description }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const datasets = data.datasets.map((dataset, index) => {
      const color = dataset.color || defaultColors[index % defaultColors.length];
      return {
        label: dataset.label,
        data: dataset.values,
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: data.datasets.length > 1,
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: function(context) {
                return data.labels[context[0].dataIndex];
              }
            }
          }
        },
        scales: {
          x: {
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
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
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

      <div className="mt-4">
        <div className="text-sm text-gray-600">
          Période: {data.labels[0]} - {data.labels[data.labels.length - 1]}
        </div>
      </div>
    </div>
  );
}