import React from 'react';

interface ActionPlanProps {
  data: {
    mobile: any;
    desktop: any;
  };
}

// Définir l'interface pour les éléments d'action
export interface ActionItem {
  title: string;
  description: string;
  priority: string;
  impact: string;
  category: string;
  metricImpacted?: string; // Champ optionnel
  elementsToModify?: {
    type: string;       // Type d'élément (image, script, css, etc.)
    name: string;       // Nom de l'élément (URL, chemin, etc.)
    size?: string;      // Taille de l'élément (si applicable)
    potentialSavings?: string; // Économies potentielles
    details?: string;   // Détails supplémentaires
  }[];                  // Liste des éléments spécifiques à modifier
}

// Exporter une méthode qui retourne les actions recommandées à partir des données d'analyse
export function generateActionItems(data: any): ActionItem[] {
  if (!data || !data.mobile || !data.mobile.lighthouseResult) {
    return [];
  }

  const mobileLighthouse = data.mobile.lighthouseResult;
  const audits = mobileLighthouse.audits || {};
  
  // Récupérer toutes les opportunités et les trier par impact potentiel (économie en secondes)
  const opportunities = Object.values(audits)
    .filter((audit: any) => 
      audit.details?.type === 'opportunity' && 
      typeof audit.numericValue === 'number'
    )
    .sort((a: any, b: any) => {
      // Priorité aux audits avec numericSavings, puis aux scores les plus bas
      const savingsA = a.numericSavings || 0;
      const savingsB = b.numericSavings || 0;
      
      if (savingsA > 0 || savingsB > 0) {
        return savingsB - savingsA;
      }
      
      return (a.score || 1) - (b.score || 1);
    });
  
  // Récupérer les diagnostics importants
  const diagnostics = Object.values(audits)
    .filter((audit: any) => 
      audit.details?.type === 'diagnostic' && 
      audit.score !== null && 
      audit.score < 0.9
    )
    .sort((a: any, b: any) => (a.score || 0) - (b.score || 0));

  const actionItems: ActionItem[] = [];

  // 1. Vérifier d'abord les problèmes critiques
  if (!audits['is-on-https']?.score) {
    actionItems.push({
      title: 'Migrer vers HTTPS',
      description: 'Configurer HTTPS sur votre serveur est essentiel pour la sécurité et le SEO.',
      priority: 'Critique',
      impact: 'Élevé',
      category: 'Sécurité'
    });
  }

  if (!audits['viewport']?.score) {
    actionItems.push({
      title: 'Configurer la balise viewport',
      description: 'Ajouter une meta viewport pour rendre votre site responsive sur mobile.',
      priority: 'Critique',
      impact: 'Élevé',
      category: 'Mobile'
    });
  }

  // 2. Analyser le score de performance mobile
  const performanceScore = mobileLighthouse?.categories?.performance?.score || 0;
  
  // Si le score de performance est sous 90, ajouter automatiquement des recommandations
  if (performanceScore < 0.9) {
    // Ajouter des recommandations basées sur les métriques clés faibles
    const coreMetrics = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'total-blocking-time',
      'cumulative-layout-shift',
      'speed-index',
      'interactive'
    ];
    
    coreMetrics.forEach(metricId => {
      const metric = audits[metricId];
      if (metric && metric.score < 0.7) {
        // C'est une métrique faible qui mérite une action
        const relatedAudits = getRelatedAuditsForMetric(metricId, audits);
        
        if (relatedAudits.length > 0) {
          // Ajouter les audits liés comme actions prioritaires
          relatedAudits.forEach((audit: any) => {
            const savings = audit.numericSavings ? Math.round(audit.numericSavings / 1000 * 10) / 10 : 0;
            
            actionItems.push({
              title: audit.title,
              description: audit.description,
              priority: metric.score < 0.5 ? 'Élevée' : 'Moyenne',
              impact: savings > 0 ? `Gain potentiel: ${savings} s` : 'Amélioration de performance',
              category: 'Performance',
              metricImpacted: getMetricName(metricId)
            });
          });
        } else {
          // Si aucun audit lié, ajouter une action générique pour cette métrique
          actionItems.push({
            title: `Améliorer ${getMetricName(metricId)}`,
            description: metric.description,
            priority: metric.score < 0.5 ? 'Élevée' : 'Moyenne',
            impact: 'Amélioration de performance',
            category: 'Performance',
            metricImpacted: getMetricName(metricId)
          });
        }
      }
    });
  }

  // 3. Ajouter les opportunités d'optimisation les plus impactantes non déjà incluses
  const existingTitles = actionItems.map(item => item.title);
  
  opportunities.slice(0, 5).forEach((opp: any) => {
    // Ne pas dupliquer les recommandations déjà ajoutées
    if (!existingTitles.includes(opp.title)) {
      const savings = opp.numericSavings ? Math.round(opp.numericSavings / 1000 * 10) / 10 : 0;
      
      actionItems.push({
        title: opp.title,
        description: opp.description,
        priority: savings > 1 ? 'Élevée' : 'Moyenne',
        impact: savings > 0 ? `Gain potentiel: ${savings} s` : 'Amélioration de performance',
        category: getCategoryFromAudit(opp.id)
      });
    }
  });

  // 4. Ajouter quelques diagnostics importants
  diagnostics.slice(0, 3).forEach((diag: any) => {
    if (!existingTitles.includes(diag.title)) {
      actionItems.push({
        title: diag.title,
        description: diag.description,
        priority: diag.score < 0.5 ? 'Élevée' : 'Moyenne',
        impact: 'Amélioration globale',
        category: getCategoryFromAudit(diag.id)
      });
    }
  });

  // 5. Ajouter actions liées au SEO si nécessaire
  if (mobileLighthouse.categories?.seo?.score < 0.9) {
    const seoIssues = Object.values(audits)
      .filter((audit: any) => audit.group === 'seo' && audit.score < 0.9)
      .slice(0, 2);
    
    seoIssues.forEach((issue: any) => {
      if (!existingTitles.includes(issue.title)) {
        actionItems.push({
          title: issue.title,
          description: issue.description,
          priority: 'Moyenne',
          impact: 'Meilleur référencement',
          category: 'SEO'
        });
      }
    });
  }

  return actionItems;
}

// Déplacer les méthodes utilitaires comme fonctions internes dans la fonction exportée
const getRelatedAuditsForMetric = (metricId: string, audits: any) => {
  // Mappage des métriques clés aux audits qui les impactent
  const metricAuditMap: {[key: string]: string[]} = {
    'first-contentful-paint': [
      'render-blocking-resources',
      'server-response-time',
      'redirects',
      'critical-request-chains',
      'uses-text-compression',
      'uses-rel-preconnect',
      'uses-rel-preload',
      'font-display'
    ],
    'largest-contentful-paint': [
      'largest-contentful-paint-element',
      'prioritize-lcp-image',
      'render-blocking-resources',
      'unused-javascript',
      'unused-css-rules',
      'uses-responsive-images',
      'uses-optimized-images',
      'efficient-animated-content',
      'server-response-time'
    ],
    'total-blocking-time': [
      'long-tasks',
      'third-party-summary',
      'bootup-time',
      'mainthread-work-breakdown',
      'unused-javascript',
      'unused-css-rules',
      'dom-size'
    ],
    'cumulative-layout-shift': [
      'layout-shift-elements',
      'non-composited-animations',
      'unsized-images',
      'uses-responsive-images'
    ],
    'speed-index': [
      'render-blocking-resources',
      'unused-css-rules',
      'unused-javascript',
      'unminified-css',
      'unminified-javascript',
      'server-response-time'
    ],
    'interactive': [
      'third-party-summary',
      'bootup-time',
      'mainthread-work-breakdown',
      'unused-javascript',
      'duplicated-javascript',
      'legacy-javascript'
    ]
  };

  const relatedAuditIds = metricAuditMap[metricId] || [];
  
  return Object.values(audits)
    .filter((audit: any) => 
      relatedAuditIds.includes(audit.id) && 
      audit.score !== null && 
      audit.score < 0.9
    )
    .sort((a: any, b: any) => (a.score || 0) - (b.score || 0))
    .slice(0, 2); // Prendre les 2 plus importants
};

const getMetricName = (metricId: string) => {
  const metricNames: {[key: string]: string} = {
    'first-contentful-paint': 'le Premier Affichage de Contenu',
    'largest-contentful-paint': 'le Plus Grand Élément Affiché',
    'total-blocking-time': 'le Temps de Blocage Total',
    'cumulative-layout-shift': 'la Stabilité Visuelle',
    'speed-index': 'l\'Indice de Vitesse',
    'interactive': 'le Temps d\'Interactivité'
  };
  
  return metricNames[metricId] || metricId;
};

const getCategoryFromAudit = (auditId: string) => {
  const categories: {[key: string]: string} = {
    'render-blocking-resources': 'Performance',
    'server-response-time': 'Performance',
    'redirects': 'Performance',
    'unused-css-rules': 'Performance',
    'unused-javascript': 'Performance',
    'offscreen-images': 'Performance',
    'unminified-css': 'Performance',
    'unminified-javascript': 'Performance',
    'responsive-images': 'Performance',
    'efficient-animated-content': 'Performance',
    'uses-optimized-images': 'Performance',
    'uses-webp-images': 'Performance',
    'uses-text-compression': 'Performance',
    'uses-responsive-images': 'Performance',
    'dom-size': 'Performance',
    'bootup-time': 'Performance',
    'mainthread-work-breakdown': 'Performance',
    'third-party-summary': 'Performance',
    'font-display': 'Performance',
    'critical-request-chains': 'Performance',
    'uses-rel-preconnect': 'Performance',
    'uses-rel-preload': 'Performance',
    'prioritize-lcp-image': 'Performance',
    'largest-contentful-paint-element': 'Performance',
    'layout-shift-elements': 'Stabilité visuelle',
    'non-composited-animations': 'Performance',
    'unsized-images': 'Stabilité visuelle',
    'long-tasks': 'Performance',
    'duplicated-javascript': 'Performance',
    'legacy-javascript': 'Performance',
    'meta-description': 'SEO',
    'document-title': 'SEO',
    'http-status-code': 'SEO',
    'link-text': 'SEO',
    'crawlable-anchors': 'SEO',
    'is-crawlable': 'SEO',
    'robots-txt': 'SEO',
    'tap-targets': 'UX',
    'color-contrast': 'Accessibilité',
    'button-name': 'Accessibilité',
    'image-alt': 'Accessibilité'
  };
  
  return categories[auditId] || 'Autre';
};

const ActionPlan: React.FC<ActionPlanProps> = ({ data }) => {
  const actionItems = generateActionItems(data);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critique': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'Élevée': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Moyenne': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getElementTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'image': return '🖼️';
      case 'script': return '📜';
      case 'css': return '🎨';
      case 'font': return '🔤';
      case 'html': return '📄';
      case 'api': return '🔌';
      default: return '📁';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Plan d'action prioritaire
      </h2>
      
      {actionItems.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-400">
          Aucune action prioritaire identifiée. Votre site semble en bonne santé !
        </div>
      ) : (
        <div className="space-y-4">
          {actionItems.map((item, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${item.priority === 'Critique' ? 'bg-red-500' : item.priority === 'Élevée' ? 'bg-orange-500' : 'bg-yellow-500'}`}></span>
                  <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                  Impact: {item.impact}
                  {item.metricImpacted && ` (Améliore ${item.metricImpacted})`}
                </p>
                
                {/* Affichage des éléments spécifiques à modifier */}
                {item.elementsToModify && item.elementsToModify.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Éléments à modifier:
                    </h4>
                    <div className="space-y-2">
                      {item.elementsToModify.map((element, elementIndex) => (
                        <div 
                          key={elementIndex} 
                          className="flex items-start p-2 text-xs bg-gray-50 dark:bg-gray-700/50 rounded"
                        >
                          <span className="mr-2" aria-hidden="true">
                            {getElementTypeIcon(element.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 dark:text-white truncate">
                              {element.name}
                            </div>
                            <div className="flex flex-wrap gap-x-3 mt-1 text-gray-600 dark:text-gray-400">
                              {element.size && (
                                <span>Taille: {element.size}</span>
                              )}
                              {element.potentialSavings && (
                                <span className="text-green-600 dark:text-green-400">
                                  Économie potentielle: {element.potentialSavings}
                                </span>
                              )}
                              {element.details && (
                                <span>{element.details}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionPlan; 