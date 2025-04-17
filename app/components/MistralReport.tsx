import React, { useState } from 'react';

interface MistralReportProps {
  report: string;
  isLoading: boolean;
  error?: string;
}

export default function MistralReport({ report, isLoading, error }: MistralReportProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Analyse IA en cours...
          </h2>
          <div className="text-purple-600 dark:text-purple-400">
            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Mistral AI analyse vos résultats et génère un rapport détaillé...
        </p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          Erreur d'analyse IA
        </h2>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      </div>
    );
  }
  
  if (!report) {
    return null;
  }

  // Afficher un aperçu du rapport si non étendu
  const previewLength = 300;
  const reportPreview = report.length > previewLength 
    ? report.substring(0, previewLength) + '...' 
    : report;
  
  // Fonction pour convertir le texte markdown en HTML basique
  const formatMarkdown = (text: string) => {
    // Convertir les titres
    let formatted = text
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2 text-gray-800 dark:text-white">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-3 mb-2 text-gray-800 dark:text-white">$1</h3>')
      // Convertir les listes
      .replace(/^\s*-\s(.*)$/gm, '<li class="ml-4">$1</li>')
      // Convertir le gras
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convertir l'italique
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convertir les sauts de ligne
      .replace(/\n/g, '<br>');
    
    return formatted;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-purple-600 dark:text-purple-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          Analyse par Mistral AI
        </h2>
      </div>
      
      <div className="prose prose-blue dark:prose-invert prose-sm max-w-none mb-4">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: expanded ? formatMarkdown(report) : formatMarkdown(reportPreview) 
          }} 
          className="text-gray-700 dark:text-gray-300"
        />
      </div>
      
      {report.length > previewLength && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center"
        >
          {expanded ? 'Masquer le rapport complet' : 'Voir le rapport complet'}
          <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
} 