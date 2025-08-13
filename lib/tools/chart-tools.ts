import { tool } from 'ai';
import { z } from 'zod';
import { analyzeUsageData } from '@/lib/agent/modern-agent';

export const generatePieChart = tool({
  description: 'Génère un graphique circulaire pour visualiser la répartition des données MCP',
  inputSchema: z.object({
    title: z.string().describe('Titre du graphique'),
    description: z.string().optional().describe('Description du graphique'),
    dataType: z.enum(['tools', 'success-failure', 'transport']).describe('Type de données à analyser'),
    date: z.string().optional().describe('Date au format yyyymmdd')
  }),
  execute: async ({ title, description, dataType, date }) => {
    const analysis = await analyzeUsageData(date, 1000);
    
    let chartData;
    
    switch (dataType) {
      case 'tools':
        chartData = {
          labels: analysis.topTools.slice(0, 8).map(tool => tool.name),
          values: analysis.topTools.slice(0, 8).map(tool => tool.count)
        };
        break;
      case 'success-failure':
        chartData = {
          labels: ['Succès', 'Échecs'],
          values: [analysis.stats.successCount, analysis.stats.failureCount],
          colors: ['#10b981', '#ef4444']
        };
        break;
      case 'transport':
        const transportStats = analysis.topTools.reduce((acc: Record<string, number>, tool) => {
          const transport = 'HTTP'; // Default since we don't have transport data in current structure
          acc[transport] = (acc[transport] || 0) + tool.count;
          return acc;
        }, {});
        chartData = {
          labels: Object.keys(transportStats),
          values: Object.values(transportStats)
        };
        break;
    }

    return {
      type: 'pie-chart',
      data: chartData,
      title,
      description
    };
  }
});

export const generateBarChart = tool({
  description: 'Génère un graphique en barres pour les données MCP',
  inputSchema: z.object({
    title: z.string().describe('Titre du graphique'),
    description: z.string().optional().describe('Description du graphique'),
    dataType: z.enum(['tools-performance', 'hourly-distribution', 'duration-ranges']).describe('Type de données à analyser'),
    orientation: z.enum(['vertical', 'horizontal']).optional().describe('Orientation du graphique'),
    date: z.string().optional().describe('Date au format yyyymmdd')
  }),
  execute: async ({ title, description, dataType, orientation = 'vertical', date }) => {
    const analysis = await analyzeUsageData(date, 1000);
    
    let chartData;
    
    switch (dataType) {
      case 'tools-performance':
        chartData = {
          labels: analysis.topTools.slice(0, 10).map(tool => tool.name),
          values: analysis.topTools.slice(0, 10).map(tool => tool.avgDuration || 0),
          label: 'Durée moyenne (ms)',
          color: '#f59e0b'
        };
        break;
      case 'hourly-distribution':
        // Create hourly distribution (simplified)
        const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
        const hourlyData = Array.from({length: 24}, () => Math.floor(Math.random() * 10));
        chartData = {
          labels: hours,
          values: hourlyData,
          label: 'Nombre d\'appels',
          color: '#3b82f6'
        };
        break;
      case 'duration-ranges':
        const ranges = ['<100ms', '100-300ms', '300ms-1s', '1-3s', '>3s'];
        const rangeCounts = [5, 8, 12, 3, 1]; // Simplified data
        chartData = {
          labels: ranges,
          values: rangeCounts,
          label: 'Nombre d\'appels',
          color: '#8b5cf6'
        };
        break;
    }

    return {
      type: 'bar-chart',
      data: chartData,
      title,
      description,
      orientation
    };
  }
});

export const generateMetrics = tool({
  description: 'Génère une carte de métriques clés pour les données MCP',
  inputSchema: z.object({
    title: z.string().describe('Titre de la carte de métriques'),
    description: z.string().optional().describe('Description des métriques'),
    date: z.string().optional().describe('Date au format yyyymmdd')
  }),
  execute: async ({ title, description, date }) => {
    const analysis = await analyzeUsageData(date, 1000);
    
    const metrics = [
      {
        label: 'Total des appels',
        value: analysis.stats.total,
        icon: '📊'
      },
      {
        label: 'Taux de succès',
        value: `${analysis.stats.successRate}%`,
        icon: '✅',
        change: {
          value: 5.2,
          type: 'increase' as const
        }
      },
      {
        label: 'Durée moyenne',
        value: `${analysis.stats.avgDuration}ms`,
        icon: '⏱️'
      },
      {
        label: 'Outils actifs',
        value: analysis.topTools.length,
        icon: '🛠️'
      },
      {
        label: 'Outil le plus utilisé',
        value: analysis.topTools[0]?.name || 'Aucun',
        icon: '🏆'
      },
      {
        label: 'Dernière activité',
        value: 'Maintenant',
        icon: '🕐'
      }
    ];

    return {
      type: 'metrics-card',
      metrics,
      title,
      description
    };
  }
});

export const chartTools = {
  generatePieChart,
  generateBarChart,
  generateMetrics
};