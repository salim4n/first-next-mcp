import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { analyzeUsageData } from '@/lib/agent/modern-agent';
import { generatePieChart, generateBarChart, generateMetrics } from '@/lib/tools/chart-tools';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // Get the last message content
    const lastMessage = messages[messages.length - 1];
    let prompt = '';
    
    // Extract text from the last message
    if (typeof lastMessage?.content === 'string') {
      prompt = lastMessage.content;
    } else if (lastMessage?.parts) {
      const textParts = lastMessage.parts.filter((part: { type: string; text?: string }) => part.type === 'text');
      prompt = textParts.map((part: { text?: string }) => part.text || '').join(' ');
    }

    // Récupération des données pour contexte
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let contextPrompt = '';
    
    try {
      const analysis = await analyzeUsageData(today, 500);
      
      if (analysis.stats.total > 0) {
        contextPrompt = `
Données MCP actuelles (${today}):
- Total des appels: ${analysis.stats.total}
- Taux de succès: ${analysis.stats.successRate}%
- Durée moyenne: ${analysis.stats.avgDuration}ms
- Top 5 outils: ${analysis.topTools.slice(0, 5).map((t: { name: string; count: number }) => `${t.name} (${t.count} appels)`).join(', ')}

Question de l'utilisateur: ${prompt}
        `;
      } else {
        contextPrompt = `
Aucune donnée MCP trouvée pour aujourd'hui (${today}). 
L'utilisateur demande: ${prompt}

Réponds en expliquant que tu n'as pas encore de données d'usage à analyser, mais que tu peux expliquer tes capacités d'analyse.
        `;
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
      contextPrompt = `L'utilisateur demande: ${prompt}\n\nNote: Erreur lors de la récupération des données MCP. Réponds en expliquant tes capacités d'analyse.`;
    }

    // Replace the last message with our enriched context
    const enrichedMessages = [
      ...messages.slice(0, -1),
      { 
        role: 'user', 
        content: contextPrompt,
        parts: [{ type: 'text', text: contextPrompt }]
      }
    ];

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: `Tu es un assistant spécialisé dans l'analyse des données MCP (Model Context Protocol).

Tu aides les utilisateurs à comprendre l'usage de leurs outils MCP. Tu peux analyser les statistiques, identifier les tendances et donner des recommandations.
      
      Réponds toujours en français de manière claire et structurée, en __HTML simple__ (balises comme <p>, <ul>, <li>, <strong>, <em>). N'utilise pas Markdown.
      Quand tu présentes des données:
- Mentionne la période analysée
- Fournis les métriques clés (total, taux de succès, durées moyennes)
- Identifie les outils les plus utilisés
- Signale les problèmes potentiels
- Propose des insights actionables
      
      Quand l'utilisateur demande un graphique (camembert, barres, lignes, métriques) ou une visualisation:
- Utilise les outils disponibles si pertinent: generatePieChart, generateBarChart, generateMetrics.
- Renseigne les paramètres (title, description, dataType, orientation, date) selon la requête et le contexte.
      - Retourne à la fois une réponse textuelle concise (en HTML) ET déclenche l'outil pour produire le bloc visuel.

Si l'appel d'outil n'est pas possible, fournis aussi un bloc JSON autonome décrivant le graphique (strictement valide), par exemple: { "type": "pie-chart", "title": "Répartition des outils", "description": "Top outils aujourd'hui", "data": { "labels": ["toolA", "toolB"], "values": [10, 5] } }`,
      messages: convertToModelMessages(enrichedMessages),
      tools: { generatePieChart, generateBarChart, generateMetrics },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { 
        error: 'Failed to process chat request', 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ 
    message: 'MCP Data Agent Chat API',
    usage: 'POST /api/chat with { messages: [...] }',
    capabilities: [
      'Analyze MCP tool usage data',
      'Generate usage statistics and insights', 
      'Identify performance bottlenecks',
      'Track error patterns',
      'Provide optimization recommendations'
    ]
  });
}