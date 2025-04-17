"use client";

import { useState, useEffect } from "react";
import React from "react";
import { analyzeWebsite, PageSpeedResult } from "./services/pagespeedService";
import { generateMistralReport } from "./services/mistralService";
import DetailedReport from "./components/DetailedReport";
import { generateActionItems } from "./components/ActionPlan";
import SimplifiedActionPlan from "./components/SimplifiedActionPlan";
import MistralReport from "./components/MistralReport";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<PageSpeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // État pour la popup de demande d'audit complet
  const [showAuditPopup, setShowAuditPopup] = useState(false);
  const [auditFormData, setAuditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    message: ""
  });
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);
  const [auditSubmitted, setAuditSubmitted] = useState(false);
  
  // État pour le rapport Mistral (conservé mais non utilisé automatiquement)
  const [mistralReport, setMistralReport] = useState("");
  const [isMistralLoading, setIsMistralLoading] = useState(false);
  const [mistralError, setMistralError] = useState<string | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (url) {
      try {
        setIsAnalyzing(true);
        setError(null);
        
        // Réinitialiser l'état de Mistral mais ne pas lancer l'analyse
        setMistralReport("");
        setMistralError(undefined);
        setIsMistralLoading(false);
        
        const analysisResults = await analyzeWebsite(url);
        setResults(analysisResults);
        
        // Ne plus appeler automatiquement Mistral
        // fetchMistralAnalysis(analysisResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur s'est produite pendant l'analyse");
        setResults(null);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const resetForm = () => {
    setUrl("");
    setResults(null);
    setError(null);
  };

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

  // Fonction pour appeler l'API Mistral manuellement plus tard
  const fetchMistralAnalysis = async () => {
    if (!results) return;
    
    try {
      setIsMistralLoading(true);
      
      const actionItems = generateActionItems(results.detailedReport);
      
      const mistralResponse = await generateMistralReport(
        results.detailedReport,
        actionItems,
        url,
        results.performanceScores
      );
      
      if (mistralResponse.success && mistralResponse.report) {
        setMistralReport(mistralResponse.report);
      } else {
        setMistralError(mistralResponse.error || "Erreur lors de la génération du rapport");
      }
    } catch (err) {
      setMistralError(err instanceof Error ? err.message : "Erreur de connexion à l'API Mistral");
    } finally {
      setIsMistralLoading(false);
    }
  };

  // Gestion du formulaire de demande d'audit
  const handleAuditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAuditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAuditFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAudit(true);
    
    // Simuler l'envoi du formulaire (à remplacer par votre propre logique d'envoi)
    setTimeout(() => {
      setIsSubmittingAudit(false);
      setAuditSubmitted(true);
      
      // Réinitialiser et fermer après quelques secondes
      setTimeout(() => {
        setAuditFormData({
          name: "",
          email: "",
          phone: "",
          website: url || "",
          message: ""
        });
        setAuditSubmitted(false);
        setShowAuditPopup(false);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-12 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/webguardian-logo.svg" 
              alt="WebGuardian" 
              width="220" 
              height="220" 
              className="mx-auto"
            />
          </div>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
            Ton site web ne convertit pas ? On te montre pourquoi.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            ✅ Découvre gratuitement ce qui cloche (et ce que tu peux faire pour corriger ça).
          </p>
        </header>

        {!results ? (
          <>
            {/* Section 1: URL et bouton d'audit */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-16">
              <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
                Analyse ton site web gratuitement
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="website-url" className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    URL de ton site web
                  </label>
                  <input
                    type="url"
                    id="website-url"
                    placeholder="https://exemple.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className={`w-full ${isAnalyzing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center`}
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyse en cours...
                    </>
                  ) : (
                    "Lancer l'audit gratuit"
                  )}
                </button>
              </form>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                  {error}
                </div>
              )}
            </div>

            {/* Section 2: Bénéfices */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-10">
              <h3 className="text-xl font-semibold text-center mb-8 text-gray-800 dark:text-white">Ce que tu obtiens gratuitement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Carte 1 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white">Une analyse simple et claire</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Pas de jargon technique. Des résultats faciles à comprendre, même si tu n'es pas développeur.
                  </p>
                </div>
                
                {/* Carte 2 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white">Les 3 erreurs critiques</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Identifie précisément les problèmes qui te font perdre des clients et des ventes.
                  </p>
                </div>
                
                {/* Carte 3 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white">Des conseils actionnables</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Des solutions concrètes que tu peux mettre en place dès aujourd'hui pour améliorer ton site.
                  </p>
                </div>
                
                {/* Carte 4 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white">Gratuit et sans engagement</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Aucune carte de crédit ni engagement. Un service vraiment gratuit pour t'aider à améliorer ton site.
                  </p>
                </div>
              </div>
        </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Résultats pour {url}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Tester un autre site
                </button>
              </div>
              
              <div className="space-y-4">
                <div className={`flex items-start gap-3 p-3 ${results.loadingSpeed.score < 70 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'} rounded-lg`}>
                  <div className={`${results.loadingSpeed.score < 70 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} shrink-0`}>
                    {results.loadingSpeed.score < 70 ? '❌' : '✅'}
                  </div>
                  <div className="w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {results.loadingSpeed.score < 70 ? 'Site lent à charger' : 'Vitesse de chargement correcte'}
                      </h3>
                      <div className="flex gap-2">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Mobile</span>
                          <span className={`font-bold ${results.performanceScores.mobile < 70 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {results.performanceScores.mobile}
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Desktop</span>
                          <span className={`font-bold ${results.performanceScores.desktop < 70 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {results.performanceScores.desktop}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {results.loadingSpeed.message} (Speed Index: {formatTime(results.mainMetrics.speedIndex.mobile)} mobile / {formatTime(results.mainMetrics.speedIndex.desktop)} desktop)
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-start gap-3 p-3 ${!results.isResponsive ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'} rounded-lg`}>
                  <div className={`${!results.isResponsive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} shrink-0`}>
                    {!results.isResponsive ? '❌' : '✅'}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {!results.isResponsive ? 'Pas responsive mobile' : 'Responsive mobile'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {!results.isResponsive 
                        ? 'Le site n\'est pas optimisé pour les mobiles (67% du trafic web)' 
                        : 'Le site s\'adapte bien aux appareils mobiles'}
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-start gap-3 p-3 ${!results.hasLegalMentions ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'} rounded-lg`}>
                  <div className={`${!results.hasLegalMentions ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} shrink-0`}>
                    {!results.hasLegalMentions ? '❌' : '✅'}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {!results.hasLegalMentions ? 'Pas de mentions légales' : 'Mentions légales détectées'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {!results.hasLegalMentions 
                        ? 'Élément obligatoire manquant (RGPD, CGV, etc.)' 
                        : 'Le site semble inclure les informations légales requises'}
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-start gap-3 p-3 ${!results.hasHttps ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'} rounded-lg`}>
                  <div className={`${!results.hasHttps ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} shrink-0`}>
                    {!results.hasHttps ? '❌' : '✅'}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {!results.hasHttps ? 'HTTPS inactif' : 'HTTPS actif'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {!results.hasHttps 
                        ? 'Votre site n\'est pas sécurisé (critère important pour le SEO)' 
                        : 'Votre site est correctement sécurisé'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* On garde conditionnellement l'affichage du rapport Mistral mais en masquant le bouton */}
              {(isMistralLoading || mistralReport || mistralError) && (
                <MistralReport
                  report={mistralReport}
                  isLoading={isMistralLoading}
                  error={mistralError}
                />
              )}
            </div>
            
            {/* Toujours afficher le rapport détaillé et le plan d'action, sans condition */}
            <>
              {/* Placer le rapport détaillé avant le plan d'action */}
              <DetailedReport 
                data={results.detailedReport} 
                mainMetrics={results.mainMetrics}
                performanceScores={results.performanceScores}
              />
              
              {/* Afficher uniquement la vue simplifiée */}
              <SimplifiedActionPlan actionItems={generateActionItems(results.detailedReport)} />
            </>
            
            {/* Tableau comparatif entre audit gratuit et premium */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
                Audit gratuit vs Premium
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne 1: Audit gratuit */}
                <div className="rounded-xl border border-blue-100 dark:border-blue-800 overflow-hidden">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-100 dark:border-blue-800">
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 text-center">Audit Gratuit</h3>
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-1">Ce que vous venez d'obtenir</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white flex items-center">
                        <span className="text-blue-500 mr-2">⚡</span> Analyse technique basique
                      </h4>
                      <ul className="mt-2 space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                        <li className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span> Score de performance PageSpeed
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span> Vérification responsive mobile
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span> Détection HTTPS
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span> Vérification des mentions légales
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white flex items-center">
                        <span className="text-blue-500 mr-2">📊</span> Analyse SEO limitée
                      </h4>
                      <ul className="mt-2 space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                        <li className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span> Principales recommandations techniques
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span> 3 priorités d'optimisation
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white flex items-center">
                        <span className="text-blue-500 mr-2">🚫</span> Non inclus
                      </h4>
                      <ul className="mt-2 space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                        <li className="flex items-center">
                          <span className="text-red-500 mr-2">✗</span> Analyse approfondie de la structure
                        </li>
                        <li className="flex items-center">
                          <span className="text-red-500 mr-2">✗</span> Benchmark concurrentiel
                        </li>
                        <li className="flex items-center">
                          <span className="text-red-500 mr-2">✗</span> Stratégie marketing personnalisée
                        </li>
                        <li className="flex items-center">
                          <span className="text-red-500 mr-2">✗</span> Accompagnement expert
                        </li>
                      </ul>
                    </div>
                    
                    <div className="pt-4 text-center">
                      <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-bold text-xl px-4 py-2 rounded-lg">
                        Gratuit
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Colonne 2: Audit premium */}
                <div className="rounded-xl border border-indigo-100 dark:border-indigo-800 overflow-hidden">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 border-b border-indigo-100 dark:border-indigo-800">
                    <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 text-center">Audit Premium</h3>
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-1">Analyse complète et personnalisée</p>
                  </div>
                  <div className="p-5 space-y-5">
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white flex items-center">
                        <span className="text-indigo-500 mr-2">🔍</span> Analyse de la santé du site web
                      </h4>
                      <div className="mt-3 space-y-3">
                        <div>
                          <h5 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            <span className="text-green-500 mr-2">✓</span> Performances techniques
                          </h5>
                          <ul className="mt-1 space-y-1 pl-8 text-sm text-gray-600 dark:text-gray-400">
                            <li>• Temps de chargement (Google PageSpeed, GTmetrix)</li>
                            <li>• Mobile-friendly (responsive, Core Web Vitals)</li>
                            <li>• Sécurité (HTTPS, certificat SSL, protection anti-spam)</li>
                            <li>• Poids des pages (images optimisées, lazy loading)</li>
                            <li>• Absence d'erreurs (404, 500, redirections, etc.)</li>
                            <li>• Disponibilité (surveillance de l'uptime)</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            <span className="text-green-500 mr-2">✓</span> Structure technique
                          </h5>
                          <ul className="mt-1 space-y-1 pl-8 text-sm text-gray-600 dark:text-gray-400">
                            <li>• Qualité du code (HTML, CSS, JS)</li>
                            <li>• Balises Hn bien hiérarchisées (H1, H2…)</li>
                            <li>• Sitemap.xml et robots.txt présents et à jour</li>
                            <li>• Canonicalisation correcte</li>
                            <li>• Liens internes cohérents et sans erreurs</li>
                            <li>• Aucune page orpheline</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            <span className="text-green-500 mr-2">✓</span> Accessibilité & UX
                          </h5>
                          <ul className="mt-1 space-y-1 pl-8 text-sm text-gray-600 dark:text-gray-400">
                            <li>• Expérience utilisateur fluide (navigation, menus)</li>
                            <li>• Temps d'interaction rapide</li>
                            <li>• Accessibilité (contrastes, alternatives aux images)</li>
                            <li>• Version mobile aussi performante que desktop</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white flex items-center">
                        <span className="text-indigo-500 mr-2">🌐</span> Analyse de la visibilité en ligne
                      </h4>
                      <div className="mt-3 space-y-3">
                        <div>
                          <h5 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            <span className="text-green-500 mr-2">✓</span> SEO (référencement naturel)
                          </h5>
                          <ul className="mt-1 space-y-1 pl-8 text-sm text-gray-600 dark:text-gray-400">
                            <li>• Audit des mots-clés (positionnement, volume)</li>
                            <li>• Optimisation On-page (balises title, meta)</li>
                            <li>• Contenu SEO (pertinent, structuré)</li>
                            <li>• Backlinks (nombre, qualité, domaines référents)</li>
                            <li>• Analyse de l'indexation (Google Search Console)</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            <span className="text-green-500 mr-2">✓</span> Local SEO & Réseaux sociaux
                          </h5>
                          <ul className="mt-1 space-y-1 pl-8 text-sm text-gray-600 dark:text-gray-400">
                            <li>• Google Business Profile et avis clients</li>
                            <li>• Présence sur les plateformes adaptées</li>
                            <li>• Analyse de l'engagement et de la notoriété</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white flex items-center">
                        <span className="text-indigo-500 mr-2">📊</span> Benchmark concurrentiel
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 pl-8">
                        Analyse de 3 à 5 concurrents (présence en ligne, positionnement SEO, offres commerciales, etc.)
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white flex items-center">
                        <span className="text-indigo-500 mr-2">🚀</span> Stratégie marketing personnalisée
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 pl-8">
                        Plan d'action concret avec objectifs définis et axes stratégiques (SEO, Content Marketing, réseaux sociaux)
                      </p>
                    </div>
                    
                    <div className="pt-4 text-center">
                      <span className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 font-bold text-xl px-4 py-2 rounded-lg">
                        À partir de 490€
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                Besoin d'une analyse complète ?
              </h2>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Nous pouvons identifier tous les obstacles qui empêchent tes clients de convertir.
              </p>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                onClick={() => setShowAuditPopup(true)}
              >
                Demander un audit complet
              </button>
            </div>
          </div>
        )}
        
        {/* Popup de demande d'audit */}
        {showAuditPopup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden">
              {/* Bouton de fermeture */}
              <button 
                onClick={() => setShowAuditPopup(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="p-6">
                {!auditSubmitted ? (
                  <>
                    <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-white">Demander un audit complet</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Laissez-nous vos coordonnées pour discuter de votre projet
                    </p>
                    
                    <form onSubmit={handleAuditFormSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nom complet
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={auditFormData.name}
                          onChange={handleAuditFormChange}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={auditFormData.email}
                          onChange={handleAuditFormChange}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={auditFormData.phone}
                          onChange={handleAuditFormChange}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Site web
                        </label>
                        <input
                          type="url"
                          id="website"
                          name="website"
                          required
                          value={auditFormData.website || url}
                          onChange={handleAuditFormChange}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Message (optionnel)
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={3}
                          value={auditFormData.message}
                          onChange={handleAuditFormChange}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmittingAudit}
                          className={`w-full ${isSubmittingAudit ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center`}
                        >
                          {isSubmittingAudit ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Envoi en cours...
                            </>
                          ) : "Demander mon audit"}
                        </button>
                      </div>
                    </form>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ou prenez directement rendez-vous avec un expert
                      </p>
                      <a 
                        href="https://calendly.com/webguardian/audit-web" 
          target="_blank"
          rel="noopener noreferrer"
                        className="mt-2 inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 font-medium px-4 py-2 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/30 transition-colors"
                      >
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Calendly
                        </span>
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-green-100 dark:bg-green-900/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                      Demande envoyée avec succès !
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Nous vous contacterons très rapidement pour discuter de votre projet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
