const API_KEY = 'AIzaSyCktUGIO7BtL5CbX9-SQVGnIRkbmTz6CUE';
const BASE_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

export interface PageSpeedResult {
  loadingSpeed: {
    score: number;
    value: number;
    message: string;
  };
  isResponsive: boolean;
  hasLegalMentions: boolean;
  hasHttps: boolean;
  performanceScores: {
    mobile: number;
    desktop: number;
  };
  detailedReport: any;
  mainMetrics: {
    firstContentfulPaint: { mobile: number; desktop: number; };
    largestContentfulPaint: { mobile: number; desktop: number; };
    totalBlockingTime: { mobile: number; desktop: number; };
    cumulativeLayoutShift: { mobile: number; desktop: number; };
    speedIndex: { mobile: number; desktop: number; };
  };
}

export async function analyzeWebsite(url: string): Promise<PageSpeedResult> {
  try {
    // Vérifier le format de l'URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Normaliser l'URL pour obtenir le domaine de base
    const baseUrl = new URL(url).origin;

    // Paramètres étendus pour correspondre au comportement de l'interface web
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('key', API_KEY);
    params.append('locale', 'fr');
    params.append('category', 'performance');
    params.append('category', 'accessibility');
    params.append('category', 'best-practices');
    params.append('category', 'seo');
    params.append('utm_source', 'web_guardian');

    // Appel à l'API PageSpeed avec les stratégies mobile et desktop et paramètres identiques à l'interface web
    const responses = await Promise.all([
      fetch(`${BASE_URL}?${params.toString()}&strategy=mobile`),
      fetch(`${BASE_URL}?${params.toString()}&strategy=desktop`)
    ]);

    const [mobileData, desktopData] = await Promise.all([
      responses[0].json(),
      responses[1].json()
    ]);

    // Vérification des erreurs
    if (mobileData.error || desktopData.error) {
      throw new Error(mobileData.error?.message || desktopData.error?.message || 'Erreur lors de l\'analyse');
    }

    // Extraire les métriques importantes
    const mobileLighthouse = mobileData.lighthouseResult;
    const desktopLighthouse = desktopData.lighthouseResult;
    
    // Extraire les scores exacts
    const mobilePerformanceScore = Math.round((mobileLighthouse?.categories?.performance?.score || 0) * 100);
    const desktopPerformanceScore = Math.round((desktopLighthouse?.categories?.performance?.score || 0) * 100);
    
    // Vérifier si le site est responsive
    const isResponsive = mobileLighthouse?.audits?.['viewport']?.score === 1;
    
    // Vérifier si le site utilise HTTPS
    const hasHttps = mobileLighthouse?.audits?.['is-on-https']?.score === 1;
    
    // Vérification des mentions légales
    const hasLegalMentions = await checkForLegalMentions(baseUrl, mobileData);

    // Extraire les métriques clés pour mobile et desktop de façon plus précise
    const getMetricValue = (audit: any, isTime = true) => {
      if (!audit) return 0;
      const value = audit.numericValue || 0;
      // Pour correspondre à l'affichage du site, on arrondit différemment
      return isTime ? Math.round(value) / 1000 : value;
    };

    const mainMetrics = {
      firstContentfulPaint: {
        mobile: getMetricValue(mobileLighthouse?.audits?.['first-contentful-paint']),
        desktop: getMetricValue(desktopLighthouse?.audits?.['first-contentful-paint'])
      },
      largestContentfulPaint: {
        mobile: getMetricValue(mobileLighthouse?.audits?.['largest-contentful-paint']),
        desktop: getMetricValue(desktopLighthouse?.audits?.['largest-contentful-paint'])
      },
      totalBlockingTime: {
        mobile: Math.round(getMetricValue(mobileLighthouse?.audits?.['total-blocking-time'], false)),
        desktop: Math.round(getMetricValue(desktopLighthouse?.audits?.['total-blocking-time'], false))
      },
      cumulativeLayoutShift: {
        mobile: getMetricValue(mobileLighthouse?.audits?.['cumulative-layout-shift'], false),
        desktop: getMetricValue(desktopLighthouse?.audits?.['cumulative-layout-shift'], false)
      },
      speedIndex: {
        mobile: getMetricValue(mobileLighthouse?.audits?.['speed-index']),
        desktop: getMetricValue(desktopLighthouse?.audits?.['speed-index'])
      }
    };

    return {
      loadingSpeed: {
        score: mobilePerformanceScore,
        value: mainMetrics.speedIndex.mobile,
        message: getSpeedMessage(mobilePerformanceScore / 100)
      },
      isResponsive,
      hasLegalMentions,
      hasHttps,
      performanceScores: {
        mobile: mobilePerformanceScore,
        desktop: desktopPerformanceScore
      },
      mainMetrics,
      detailedReport: {
        mobile: mobileData,
        desktop: desktopData
      }
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
    throw error;
  }
}

// Fonction améliorée pour vérifier l'existence des mentions légales
async function checkForLegalMentions(baseUrl: string, data: any): Promise<boolean> {
  try {
    // 1. Vérifier le contenu HTML pour des mentions
    const html = data?.lighthouseResult?.audits?.['full-page-screenshot']?.details?.screenshot?.data || '';
    const legalTerms = ['mentions légales', 'cgv', 'cgu', 'conditions générales', 'privacy policy', 'rgpd', 'gdpr'];
    
    // Si on trouve ces termes dans le HTML, on considère que les mentions sont présentes
    const hasTermsInHtml = legalTerms.some(term => html.toLowerCase().includes(term));
    if (hasTermsInHtml) return true;
    
    // 2. Vérifier les URLs courantes pour les pages de mentions légales
    const commonLegalPaths = [
      '/mentions-legales',
      '/mentions_legales',
      '/legal',
      '/legal-notice',
      '/cgv',
      '/cgu',
      '/privacy',
      '/privacy-policy',
      '/conditions-generales',
      '/rgpd',
      '/politique-confidentialite'
    ];
    
    // Vérifier si au moins une de ces pages existe en utilisant notre API locale
    const checkUrlPromises = commonLegalPaths.map(async (path) => {
      try {
        const response = await fetch(`/api/check-url?url=${encodeURIComponent(`${baseUrl}${path}`)}`);
        const data = await response.json();
        return data.exists;
      } catch (error) {
        return false;
      }
    });
    
    const results = await Promise.all(checkUrlPromises);
    return results.some(exists => exists);
  } catch (error) {
    console.error('Erreur lors de la vérification des mentions légales:', error);
    return false; // En cas d'erreur, on considère que les mentions ne sont pas détectées
  }
}

// Fonction utilitaire pour obtenir un message sur la vitesse
function getSpeedMessage(score: number): string {
  if (score >= 0.9) return 'Excellente vitesse de chargement';
  if (score >= 0.7) return 'Bonne vitesse de chargement';
  if (score >= 0.5) return 'Vitesse de chargement moyenne';
  if (score >= 0.3) return 'Site lent à charger';
  return 'Site très lent à charger';
} 