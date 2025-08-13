import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { listUsage } from '@/lib/usage/logger';

// Configuration OpenAI
const model = openai('gpt-4o-mini');

// Fonction utilitaire pour analyser les données
export async function analyzeUsageData(date?: string, limit = 500) {
  const data = await listUsage({ date, top: limit });
  
  const stats = {
    total: data.length,
    successCount: data.filter(d => d.success).length,
    failureCount: data.filter(d => !d.success).length,
    successRate: data.length ? Math.round((data.filter(d => d.success).length / data.length) * 100) : 0,
    avgDuration: data.length ? Math.round(data.reduce((acc, d) => acc + (Number(d.durationMs) || 0), 0) / data.length) : 0
  };

  // Types pour les statistiques d'outils
  type ToolStat = {
    name: string;
    count: number;
    successes: number;
    failures: number;
    totalDuration: number;
    avgDuration: number;
    successRate: number;
  };

  // Top outils
  const toolStats = data.reduce((acc: Record<string, ToolStat>, item) => {
    const name = String(item.name);
    if (!acc[name]) {
      acc[name] = { name, count: 0, successes: 0, failures: 0, totalDuration: 0, avgDuration: 0, successRate: 0 };
    }
    acc[name].count++;
    if (item.success) acc[name].successes++;
    else acc[name].failures++;
    acc[name].totalDuration += Number(item.durationMs) || 0;
    return acc;
  }, {});

  const topTools = Object.values(toolStats)
    .map((tool: ToolStat) => ({
      ...tool,
      avgDuration: Math.round(tool.totalDuration / tool.count),
      successRate: Math.round((tool.successes / tool.count) * 100)
    }))
    .sort((a: ToolStat, b: ToolStat) => b.count - a.count)
    .slice(0, 10);

  // Erreurs récentes
  const errors = data.filter(d => !d.success).slice(0, 10);
  
  return { stats, topTools, recentErrors: errors };
}

// Message système
const systemMessage = `Tu es un assistant spécialisé dans l'analyse des données MCP (Model Context Protocol).

Tu aides les utilisateurs à comprendre l'usage de leurs outils MCP. Tu peux analyser les statistiques, identifier les tendances et donner des recommandations.

Réponds toujours en français de manière claire et structurée. Quand tu présentes des données:
- Mentionne la période analysée
- Fournis les métriques clés (total, taux de succès, durées moyennes)
- Identifie les outils les plus utilisés
- Signale les problèmes potentiels
- Propose des insights actionables`;

// Agent principal pour l'analyse des données MCP
export const dataAgent = {
  async generate(prompt: string) {
    try {
      // Récupération des données pour contexte
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const analysis = await analyzeUsageData(today, 500);
      
      let contextPrompt = '';
      if (analysis.stats.total > 0) {
        contextPrompt = `
Données MCP actuelles (${today}):
- Total des appels: ${analysis.stats.total}
- Taux de succès: ${analysis.stats.successRate}%
- Durée moyenne: ${analysis.stats.avgDuration}ms
- Top 5 outils: ${analysis.topTools.slice(0, 5).map(t => `${t.name} (${t.count} appels)`).join(', ')}

Question de l'utilisateur: ${prompt}
        `;
      } else {
        contextPrompt = `
Aucune donnée MCP trouvée pour aujourd'hui (${today}). 
L'utilisateur demande: ${prompt}

Réponds en expliquant que tu n'as pas encore de données d'usage à analyser, mais que tu peux expliquer tes capacités d'analyse.
        `;
      }

      return await generateText({
        model,
        system: systemMessage,
        prompt: contextPrompt
      });
    } catch (error) {
      console.error('Error in agent generate:', error);
      return await generateText({
        model,
        system: systemMessage,
        prompt: `L'utilisateur demande: ${prompt}\n\nNote: Erreur lors de la récupération des données MCP. Réponds en expliquant tes capacités d'analyse.`
      });
    }
  },

  async stream(params: { prompt: string }) {
    try {
      // Récupération des données pour contexte
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const analysis = await analyzeUsageData(today, 500);
      
      let contextPrompt = '';
      if (analysis.stats.total > 0) {
        contextPrompt = `
Données MCP actuelles (${today}):
- Total des appels: ${analysis.stats.total}
- Taux de succès: ${analysis.stats.successRate}%
- Durée moyenne: ${analysis.stats.avgDuration}ms
- Top 5 outils: ${analysis.topTools.slice(0, 5).map(t => `${t.name} (${t.count} appels)`).join(', ')}

Question de l'utilisateur: ${params.prompt}
        `;
      } else {
        contextPrompt = `
Aucune donnée MCP trouvée pour aujourd'hui (${today}). 
L'utilisateur demande: ${params.prompt}

Réponds en expliquant que tu n'as pas encore de données d'usage à analyser, mais que tu peux expliquer tes capacités d'analyse.
        `;
      }

      return streamText({
        model,
        system: systemMessage,
        prompt: contextPrompt
      });
    } catch (error) {
      console.error('Error in agent stream:', error);
      return streamText({
        model,
        system: systemMessage,
        prompt: `L'utilisateur demande: ${params.prompt}\n\nNote: Erreur lors de la récupération des données MCP. Réponds en expliquant tes capacités d'analyse.`
      });
    }
  }
};