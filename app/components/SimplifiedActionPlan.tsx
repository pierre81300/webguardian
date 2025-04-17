import React, { useMemo, useState } from 'react';
import { ActionItem } from './ActionPlan';

interface SimplifiedActionPlanProps {
  actionItems: ActionItem[];
}

const SimplifiedActionPlan: React.FC<SimplifiedActionPlanProps> = ({ actionItems }) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!actionItems || actionItems.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Ce qu'il faut améliorer</h2>
        <div className="text-gray-600 dark:text-gray-400 flex items-center justify-center flex-col py-4">
          <span className="text-green-500 text-3xl mb-3">✅</span>
          <p>Votre site semble bien optimisé !</p>
          <p className="text-sm mt-2">Aucune action prioritaire n'a été identifiée.</p>
        </div>
      </div>
    );
  }

  // Grouper les actions par catégorie
  const categorizedActions: {[key: string]: ActionItem[]} = {};
  
  actionItems.forEach(item => {
    if (!categorizedActions[item.category]) {
      categorizedActions[item.category] = [];
    }
    categorizedActions[item.category].push(item);
  });

  // Ordre personnalisé et labels simplifiés pour les catégories
  const categoryOrder = ['Performance', 'Stabilité visuelle', 'SEO', 'Accessibilité', 'UX', 'Sécurité', 'Mobile', 'Autre'];
  const categoryLabels: {[key: string]: string} = {
    'Performance': 'Temps de chargement',
    'Stabilité visuelle': 'Stabilité de l\'affichage',
    'SEO': 'Visibilité Google',
    'Accessibilité': 'Accessibilité',
    'UX': 'Expérience utilisateur',
    'Sécurité': 'Sécurité',
    'Mobile': 'Affichage mobile',
    'Autre': 'Autres améliorations'
  };

  // Icônes pour chaque catégorie
  const categoryIcons: {[key: string]: string} = {
    'Performance': '⚡',
    'Stabilité visuelle': '📐',
    'SEO': '🔍',
    'Accessibilité': '♿',
    'UX': '👆',
    'Sécurité': '🔒',
    'Mobile': '📱',
    'Autre': '🔧'
  };

  // Obtenir un résumé des bénéfices business en fonction des catégories présentes
  const getBusinessBenefitsSummary = () => {
    const presentCategories = Object.keys(categorizedActions);
    const hasPerfIssues = presentCategories.includes('Performance');
    const hasSeoIssues = presentCategories.includes('SEO');
    const hasMobileIssues = presentCategories.includes('Mobile');
    const hasUxIssues = presentCategories.includes('UX') || presentCategories.includes('Stabilité visuelle');
    const hasSecurityIssues = presentCategories.includes('Sécurité');
    
    const benefitPoints = [];
    
    if (hasPerfIssues) {
      benefitPoints.push("⚡ <strong>Amélioration de l'expérience utilisateur</strong> avec un site plus rapide. Les visiteurs ont tendance à quitter les sites lents.");
    }
    
    if (hasSeoIssues) {
      benefitPoints.push("🔍 <strong>Meilleure visibilité dans les moteurs de recherche</strong> et potentielle réduction des coûts publicitaires grâce à un trafic organique de qualité.");
    }
    
    if (hasMobileIssues) {
      benefitPoints.push("📱 <strong>Compatibilité optimale avec les appareils mobiles</strong>, essentiels aujourd'hui puisqu'une majorité de visites web proviennent de smartphones.");
    }
    
    if (hasUxIssues) {
      benefitPoints.push("👆 <strong>Parcours d'achat plus fluide</strong> qui facilite la conversion et encourage les clients à finaliser leurs transactions.");
    }
    
    if (hasSecurityIssues) {
      benefitPoints.push("🔒 <strong>Renforcement de la confiance des utilisateurs</strong> et conformité avec les réglementations de protection des données.");
    }
    
    // Ajouter un point général si peu de points spécifiques
    if (benefitPoints.length < 2) {
      benefitPoints.push("🚀 <strong>Amélioration générale de votre présence en ligne</strong> et de la perception de votre marque par les utilisateurs.");
    }
    
    return benefitPoints;
  };

  // Simplifier les descriptions trop techniques
  const simplifyDescription = (description: string, category: string): string => {
    // Si la description est trop longue, la tronquer
    if (description.length > 120) {
      description = description.substring(0, 117) + '...';
    }
    
    // Remplacer certains termes techniques par des expressions plus simples
    description = description
      .replace(/JavaScript/g, 'code')
      .replace(/CSS/g, 'style')
      .replace(/render-blocking/g, 'bloquant')
      .replace(/third-party/g, 'tiers')
      .replace(/browser/g, 'navigateur')
      .replace(/total blocking time/g, 'temps de blocage')
      .replace(/load/g, 'chargement')
      .replace(/viewport/g, 'écran');
    
    return description;
  };

  const getCategoryExplanation = (category: string): string => {
    const explanations: {[key: string]: string} = {
      'Performance': 'Chargement de votre site plus rapide',
      'Stabilité visuelle': 'Éviter les sauts d\'éléments pendant le chargement',
      'SEO': 'Meilleur positionnement sur Google',
      'Accessibilité': 'Site utilisable par tous',
      'UX': 'Navigation plus intuitive pour vos visiteurs',
      'Sécurité': 'Protection des données et de vos visiteurs',
      'Mobile': 'Meilleure expérience sur smartphone',
      'Autre': 'Autres points d\'amélioration'
    };
    
    return explanations[category] || '';
  };

  // Convertir l'impact technique en langage plus simple
  const simplifyImpact = (impact: string): string => {
    if (impact.includes('Gain potentiel:')) {
      const timeMatch = impact.match(/Gain potentiel: ([\d,]+) s/);
      if (timeMatch && timeMatch[1]) {
        const seconds = parseFloat(timeMatch[1].replace(',', '.'));
        if (seconds >= 1) {
          return `⏱️ Gagnez ${timeMatch[1]} secondes de chargement`;
        } else {
          return '⏱️ Chargement plus rapide';
        }
      }
    }
    
    return '🚀 Amélioration de l\'expérience utilisateur';
  };

  // Obtenir les 3 premières recommandations (toutes catégories confondues)
  const getTop3Recommendations = () => {
    let allRecommendations: {category: string, item: ActionItem, index: number}[] = [];
    
    categoryOrder.forEach(category => {
      if (categorizedActions[category]?.length > 0) {
        categorizedActions[category].forEach((item, index) => {
          allRecommendations.push({
            category,
            item,
            index
          });
        });
      }
    });
    
    // Trier par priorité (haute priorité d'abord)
    allRecommendations.sort((a, b) => {
      const priorityOrder = { 'Critique': 0, 'Élevée': 1, 'Moyenne': 2, 'Faible': 3 };
      const priorityA = priorityOrder[a.item.priority as keyof typeof priorityOrder] || 99;
      const priorityB = priorityOrder[b.item.priority as keyof typeof priorityOrder] || 99;
      return priorityA - priorityB;
    });
    
    // Retourner les 3 premières
    return allRecommendations.slice(0, 3);
  };

  const businessBenefitsSummary = getBusinessBenefitsSummary();
  const top3Recommendations = getTop3Recommendations();
  const totalRecommendations = Object.values(categorizedActions).flat().length;
  const remainingRecommendations = totalRecommendations - 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitting(true);
      
      // Simuler l'envoi d'un email (à remplacer par votre propre logique d'envoi)
      setTimeout(() => {
        setSubmitting(false);
        setSubmitted(true);
      }, 1500);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Ce qu'il faut améliorer</h2>
      
      {/* Résumé des bénéfices business */}
      <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
            Bénéfices
          </h3>
        </div>
        <p className="text-green-700 dark:text-green-300 text-sm mb-3">
          Ces améliorations vous aideront à :
        </p>
        <ul className="space-y-2 text-sm">
          {businessBenefitsSummary.map((benefit, idx) => (
            <li key={idx} className="flex items-start">
              <span className="inline-block mr-2">•</span>
              <span dangerouslySetInnerHTML={{ __html: benefit }} className="text-green-700 dark:text-green-300" />
            </li>
          ))}
        </ul>
      </div>
      
      {/* Afficher uniquement les 3 premières recommandations importantes */}
      <div className="space-y-6 mb-8">
        {top3Recommendations.map((recommendation, mainIndex) => {
          const { category, item, index } = recommendation;
          return (
            <div key={`${category}-${index}`} className="pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-300">{mainIndex + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <span className="text-xl mr-2">{categoryIcons[category]}</span>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.title.replace(/non-triv/g, '').replace(/third-party/g, 'externe')}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {simplifyDescription(item.description, category)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {simplifyImpact(item.impact)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Partie floutée avec le reste des recommandations */}
      {remainingRecommendations > 0 && (
        <div className="relative mb-6">
          {/* Contenu flouté avec opacité réduite */}
          <div className="opacity-30 pointer-events-none space-y-4 max-h-[300px] overflow-hidden blur-[2px] relative">
            {categoryOrder
              .filter(category => categorizedActions[category]?.length > 0)
              .slice(0, Math.min(3, categoryOrder.length)) // Limiter pour réduire l'espace vide
              .map(category => (
                <div key={category} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className="flex items-center mb-2">
                    <span className="text-xl mr-2">{categoryIcons[category]}</span>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {categoryLabels[category]}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {categorizedActions[category].slice(0, 2).map((item, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2 mt-0.5">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-300">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              {item.title.replace(/non-triv/g, '').replace(/third-party/g, 'externe')}
                            </h4>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
            {/* Dégradé pour donner l'impression que ça continue */}
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"></div>
          </div>
          
          {/* Overlay qui inclut les textes précédents */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-[3px]">
            <p className="text-gray-800 dark:text-white font-medium mb-2 text-center">
              <span role="img" aria-label="eyes">👀</span> Il reste encore <strong>{remainingRecommendations} recommandations importantes</strong> à découvrir
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-center">
              Et un <strong>plan d'action personnalisé</strong> pour corriger tout ça, point par point.
            </p>
          </div>
        </div>
      )}
      
      {/* Formulaire pour recevoir l'audit complet */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        {!submitted ? (
          <>
            <div className="mb-4 text-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-lg w-full md:w-auto">
                👉 M'envoyer l'audit complet
              </button>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
                Aucun spam. Juste ton audit, clair et actionnable.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
              <input
                type="email"
                placeholder="Ton email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className={`${submitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-3 px-6 rounded-lg transition-colors flex justify-center items-center`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Envoi...
                  </>
                ) : "Recevoir l'audit"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-green-600 dark:text-green-400 text-5xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Audit envoyé avec succès !
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Vérifie ta boîte mail, ton audit complet t'attend.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplifiedActionPlan; 