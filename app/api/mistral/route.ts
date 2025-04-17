import { NextRequest, NextResponse } from 'next/server';
import { generateMistralReport } from '@/app/services/mistralService';
import { generateActionItems } from '@/app/components/ActionPlan';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageSpeedData, url } = body;
    
    if (!pageSpeedData || !url) {
      return NextResponse.json(
        { error: 'Données manquantes: pageSpeedData et url sont requis' },
        { status: 400 }
      );
    }
    
    // Générer les actions à partir des données PageSpeed
    const actionItems = generateActionItems(pageSpeedData);
    
    // Extraire les scores de performance
    const performanceScores = {
      mobile: pageSpeedData.mobile?.lighthouseResult?.categories?.performance?.score * 100 || 0,
      desktop: pageSpeedData.desktop?.lighthouseResult?.categories?.performance?.score * 100 || 0
    };
    
    // Appeler le service Mistral
    const mistralResponse = await generateMistralReport(
      pageSpeedData,
      actionItems,
      url,
      performanceScores
    );
    
    if (!mistralResponse.success) {
      return NextResponse.json(
        { error: mistralResponse.error || 'Erreur lors de la génération du rapport' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      report: mistralResponse.report
    });
  } catch (error) {
    console.error('Erreur lors de l\'analyse Mistral:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
} 