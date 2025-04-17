import React from 'react';

interface DetailedReportProps {
  data: {
    mobile: any;
    desktop: any;
  };
  mainMetrics?: {
    firstContentfulPaint: { mobile: number; desktop: number; };
    largestContentfulPaint: { mobile: number; desktop: number; };
    totalBlockingTime: { mobile: number; desktop: number; };
    cumulativeLayoutShift: { mobile: number; desktop: number; };
    speedIndex: { mobile: number; desktop: number; };
  };
  performanceScores?: {
    mobile: number;
    desktop: number;
  };
}

const DetailedReport: React.FC<DetailedReportProps> = ({ data, mainMetrics, performanceScores }) => {
  if (!data || !data.mobile || !data.desktop) {
    return <div>Aucune donnée disponible</div>;
  }

  const mobile = data.mobile;
  const desktop = data.desktop;
  
  // Extraire les données importantes
  const mobileLighthouse = mobile.lighthouseResult;
  const desktopLighthouse = desktop.lighthouseResult;
  
  // Objectif : afficher les métriques clés de performance
  const performanceMetricsMobile = mobileLighthouse?.audits || {};
  const performanceMetricsDesktop = desktopLighthouse?.audits || {};

  // Extraire les scores des catégories
  const mobileScores = {
    performance: performanceScores?.mobile || Math.round((mobileLighthouse?.categories?.performance?.score || 0) * 100),
    accessibility: Math.round((mobileLighthouse?.categories?.accessibility?.score || 0) * 100),
    bestPractices: Math.round((mobileLighthouse?.categories?.['best-practices']?.score || 0) * 100),
    seo: Math.round((mobileLighthouse?.categories?.seo?.score || 0) * 100),
  };

  const desktopScores = {
    performance: performanceScores?.desktop || Math.round((desktopLighthouse?.categories?.performance?.score || 0) * 100),
    accessibility: Math.round((desktopLighthouse?.categories?.accessibility?.score || 0) * 100),
    bestPractices: Math.round((desktopLighthouse?.categories?.['best-practices']?.score || 0) * 100),
    seo: Math.round((desktopLighthouse?.categories?.seo?.score || 0) * 100),
  };

  // Fonctions d'aide pour le formatage
  const formatTime = (time: number) => {
    if (!time) return "N/A";
    if (time >= 1) {
      // Format avec une décimale comme "2,7 s" (avec virgule pour la locale française)
      return `${time.toFixed(1).replace('.', ',')} s`;
    } else {
      // Format en millisecondes entières comme "70 ms"
      return `${Math.round(time * 1000)} ms`;
    }
  };

  const formatCLS = (value: number) => {
    // Le CLS est généralement affiché tel quel, sans unité
    return value.toString();
  };

  const getScoreClass = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // Métriques importantes à afficher avec leurs valeurs
  const keyMetrics = [
    { 
      id: 'first-contentful-paint', 
      name: 'Premier affichage de contenu', 
      description: 'Temps nécessaire pour afficher le premier texte ou image',
      mobile: mainMetrics ? mainMetrics.firstContentfulPaint.mobile : 
        (performanceMetricsMobile['first-contentful-paint']?.numericValue || 0) / 1000,
      desktop: mainMetrics ? mainMetrics.firstContentfulPaint.desktop : 
        (performanceMetricsDesktop['first-contentful-paint']?.numericValue || 0) / 1000
    },
    { 
      id: 'speed-index', 
      name: 'Indice de vitesse', 
      description: 'À quelle vitesse le contenu est visuellement affiché',
      mobile: mainMetrics ? mainMetrics.speedIndex.mobile : 
        (performanceMetricsMobile['speed-index']?.numericValue || 0) / 1000,
      desktop: mainMetrics ? mainMetrics.speedIndex.desktop : 
        (performanceMetricsDesktop['speed-index']?.numericValue || 0) / 1000
    },
    { 
      id: 'largest-contentful-paint', 
      name: 'Plus grand élément affiché', 
      description: 'Temps nécessaire pour afficher le plus grand élément',
      mobile: mainMetrics ? mainMetrics.largestContentfulPaint.mobile : 
        (performanceMetricsMobile['largest-contentful-paint']?.numericValue || 0) / 1000,
      desktop: mainMetrics ? mainMetrics.largestContentfulPaint.desktop : 
        (performanceMetricsDesktop['largest-contentful-paint']?.numericValue || 0) / 1000
    },
    { 
      id: 'total-blocking-time', 
      name: 'Temps de blocage total', 
      description: 'Durée pendant laquelle la page est bloquée et non interactive',
      mobile: mainMetrics ? mainMetrics.totalBlockingTime.mobile : 
        performanceMetricsMobile['total-blocking-time']?.numericValue || 0,
      desktop: mainMetrics ? mainMetrics.totalBlockingTime.desktop : 
        performanceMetricsDesktop['total-blocking-time']?.numericValue || 0
    },
    { 
      id: 'cumulative-layout-shift', 
      name: 'Décalage cumulatif de mise en page', 
      description: 'Mesure de la stabilité visuelle',
      mobile: mainMetrics ? mainMetrics.cumulativeLayoutShift.mobile : 
        performanceMetricsMobile['cumulative-layout-shift']?.numericValue || 0,
      desktop: mainMetrics ? mainMetrics.cumulativeLayoutShift.desktop : 
        performanceMetricsDesktop['cumulative-layout-shift']?.numericValue || 0
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Rapport détaillé</h2>
      
      {/* Scores globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white flex items-center">
            <span className="material-icons-outlined mr-2 text-blue-600 dark:text-blue-400">smartphone</span>
            Mobile
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreClass(mobileScores.performance)}`}>
                {mobileScores.performance}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Performance</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreClass(mobileScores.accessibility)}`}>
                {mobileScores.accessibility}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Accessibilité</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreClass(mobileScores.bestPractices)}`}>
                {mobileScores.bestPractices}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Bonnes pratiques</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreClass(mobileScores.seo)}`}>
                {mobileScores.seo}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">SEO</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white flex items-center">
            <span className="material-icons-outlined mr-2 text-blue-600 dark:text-blue-400">desktop_windows</span>
            Desktop
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreClass(desktopScores.performance)}`}>
                {desktopScores.performance}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Performance</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreClass(desktopScores.accessibility)}`}>
                {desktopScores.accessibility}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Accessibilité</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreClass(desktopScores.bestPractices)}`}>
                {desktopScores.bestPractices}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Bonnes pratiques</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreClass(desktopScores.seo)}`}>
                {desktopScores.seo}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">SEO</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Métriques de performance clés */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Métriques de performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Métrique</th>
                <th className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">Mobile</th>
                <th className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">Desktop</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Description</th>
              </tr>
            </thead>
            <tbody>
              {keyMetrics.map((metric) => {
                const isTime = metric.id !== 'cumulative-layout-shift';
                const scoreClassMobile = getScoreClass(performanceMetricsMobile[metric.id]?.score * 100 || 0);
                const scoreClassDesktop = getScoreClass(performanceMetricsDesktop[metric.id]?.score * 100 || 0);
                
                return (
                  <tr key={metric.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-gray-800 dark:text-white font-medium">{metric.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={scoreClassMobile}>
                        {isTime ? formatTime(metric.mobile) : formatCLS(metric.mobile)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={scoreClassDesktop}>
                        {isTime ? formatTime(metric.desktop) : formatCLS(metric.desktop)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{metric.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DetailedReport; 