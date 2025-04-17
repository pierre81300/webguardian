import { ActionItem } from '../components/ActionPlan';

// Clé API Mistral
const MISTRAL_API_KEY = 'IMuZZ5jkxUCDjIVksULCEzA53X8WkMTo';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Interface pour la réponse de Mistral
export interface MistralResponse {
  success: boolean;
  data?: any;
  error?: string;
  report?: string;
}

// Format des messages pour Mistral API
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Génère un rapport à partir des données PageSpeed et l'envoie à Mistral AI
 */
export async function generateMistralReport(
  pageSpeedData: any,
  actionItems: ActionItem[],
  url: string,
  performanceScores: { mobile: number; desktop: number }
): Promise<MistralResponse> {
  try {
    // Générer le texte du rapport à partir des données
    const reportText = generateReportText(actionItems, url, performanceScores);
    
    // Prompt pour Mistral AI
    const prompt = `Voici les résultats de l'analyse PageSpeed Insights pour mon site web. Pourriez-vous me fournir un rapport détaillé des actions à réaliser, classées par priorité, pour améliorer les performances, l'accessibilité, les bonnes pratiques et le SEO de mon site ? Assurez-vous que les recommandations soient compréhensibles par des non-techniciens.\n\n${reportText}`;
    
    // Configurer les messages pour l'API
    const messages: Message[] = [
      {
        role: 'user',
        content: prompt
      }
    ];
    
    // Appeler l'API Mistral
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',  // Utiliser le modèle le plus récent
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur Mistral API:', errorData);
      return {
        success: false,
        error: `Erreur de l'API Mistral: ${errorData.error?.message || response.statusText}`
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data: data,
      report: data.choices[0]?.message?.content || 'Aucun rapport généré'
    };
  } catch (error) {
    console.error('Erreur lors de la génération du rapport Mistral:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Génère un texte formaté à partir des données d'analyse
 */
function generateReportText(
  actionItems: ActionItem[],
  url: string,
  performanceScores: { mobile: number; desktop: number }
): string {
  const report = `Résultats de l'analyse PageSpeed Insights pour ${url}:\n\n`;
  
  // Scores généraux
  const scoresSection = `## Scores généraux:\n\n` +
    `- Performance Mobile: ${performanceScores.mobile}/100\n` +
    `- Performance Desktop: ${performanceScores.desktop}/100\n\n`;
  
  // Actions prioritaires
  const actionsSection = actionItems.length > 0 
    ? `## Actions recommandées par ordre de priorité:\n\n` +
      actionItems.map((item, index) => {
        let actionText = `${index + 1}. **${item.title}** (Priorité: ${item.priority}, Catégorie: ${item.category})\n` +
          `   Description: ${item.description}\n` +
          `   Impact: ${item.impact}`;
        
        // Ajouter les éléments à modifier si présents
        if (item.elementsToModify && item.elementsToModify.length > 0) {
          actionText += `\n   Éléments à modifier:\n`;
          item.elementsToModify.forEach(element => {
            actionText += `   - ${element.type}: ${element.name}`;
            if (element.size) actionText += ` (Taille: ${element.size})`;
            if (element.potentialSavings) actionText += ` (Économie potentielle: ${element.potentialSavings})`;
            if (element.details) actionText += ` - ${element.details}`;
            actionText += `\n`;
          });
        }
        
        return actionText;
      }).join('\n\n')
    : `## Actions recommandées:\n\nAucune action prioritaire identifiée. Votre site semble bien optimisé!\n\n`;
  
  return report + scoresSection + actionsSection;
} 