import type {
  VoiceAnswers,
  AIDimensionAnalysis,
  DimensionResults,
  ProcessedAnswers,
  VoiceConstitution,
  ConfidenceResult,
  CalibrationRoundData,
} from '../types';
import { preprocessAnswers } from './preprocessor';
import { runFullScoring } from './scoring';
import { calculateConfidence } from './confidence';
import { generateJson } from '@/features/ai/openrouter-client';
import {
  DIMENSION_EXTRACTOR_SYSTEM,
  buildDimensionExtractorPrompt,
} from '@/features/ai/prompts/dimension-extractor';
import {
  CONSTITUTION_ASSEMBLY_SYSTEM,
  buildConstitutionAssemblyPrompt,
} from '@/features/ai/prompts/constitution-assembly';
import {
  buildCalibrationGeneratorPrompt,
  CALIBRATION_GENERATOR_SYSTEM,
} from '@/features/ai/prompts/calibration-generator';
import {
  QUALITY_GATE_SYSTEM,
  buildQualityGatePrompt,
} from '@/features/ai/prompts/quality-gate-checker';

export async function runExtractionPipeline(
  answers: VoiceAnswers
): Promise<{
  processed: ProcessedAnswers;
  dimensions: DimensionResults;
}> {
  const processed = preprocessAnswers(answers);

  const aiAnalysis = await generateJson<AIDimensionAnalysis>(
    buildDimensionExtractorPrompt(answers, processed),
    DIMENSION_EXTRACTOR_SYSTEM
  );

  const dimensions = runFullScoring(answers, processed, aiAnalysis);

  return { processed, dimensions };
}

export async function runAssemblyPipeline(
  answers: VoiceAnswers,
  dimensions: DimensionResults,
  calibrationRounds: CalibrationRoundData[]
): Promise<VoiceConstitution> {
  const confidence = calculateConfidence(answers, calibrationRounds);

  const constitution = await generateJson<VoiceConstitution>(
    buildConstitutionAssemblyPrompt(answers, dimensions, confidence),
    CONSTITUTION_ASSEMBLY_SYSTEM
  );

  constitution.version = calibrationRounds.some((r) => r.selected)
    ? '1.5'
    : '1.0';
  constitution.created_at = new Date().toISOString();

  return constitution;
}

export async function generateCalibrationRound(
  dimension: string,
  calibrationType: 'numeric' | 'categorical',
  context: string,
  dimensions: DimensionResults,
  answers: VoiceAnswers,
  roundNumber: number
): Promise<CalibrationRoundData> {
  const result = await generateJson<{ message_a: string; message_b: string }>(
    buildCalibrationGeneratorPrompt(
      dimension,
      calibrationType,
      dimensions.final,
      context,
      answers
    ),
    CALIBRATION_GENERATOR_SYSTEM
  );

  return {
    round: roundNumber,
    dimension,
    calibration_type: calibrationType,
    context,
    message_a: result.message_a,
    message_b: result.message_b,
  };
}

export async function runQualityGate(
  message: string,
  constitution: VoiceConstitution
): Promise<{ passed: boolean; violations: string[] }> {
  const aiCheck = await generateJson<{ passed: boolean; violations: string[] }>(
    buildQualityGatePrompt(message, constitution),
    QUALITY_GATE_SYSTEM
  );

  return aiCheck;
}

export { preprocessAnswers, calculateConfidence };
