import type { VoiceAnswers, ConfidenceResult, CalibrationRoundData } from '../types';

export function calculateConfidence(
  answers: VoiceAnswers,
  calibrationRounds: CalibrationRoundData[]
): ConfidenceResult {
  let score = 0;

  // 1. Sample Message (Most critical signal) - up to 40 points
  const sampleWords = answers.sample_message.trim().split(/\s+/).filter(Boolean).length;
  if (sampleWords >= 15) score += 40;
  else if (sampleWords > 0) score += 20;

  // 2. Depth of Business Description & No-Gos - up to 20 points
  const contextWords = (answers.business_description + ' ' + answers.hard_no_gos)
    .split(/\s+/).filter(Boolean).length;
  if (contextWords >= 30) score += 20;
  else if (contextWords >= 10) score += 10;

  // 3. Depth of Style Answers - up to 20 points
  const styleWords = (
    answers.client_relationship + ' ' +
    answers.natural_style + ' ' +
    answers.late_payment_approach
  ).split(/\s+/).filter(Boolean).length;
  
  if (styleWords >= 40) score += 20;
  else if (styleWords >= 20) score += 10;

  // 4. Calibration Rounds - up to 20 points
  const completedRounds = calibrationRounds.filter((r) => r.selected).length;
  score += Math.min(completedRounds * 4, 20);

  score = Math.min(score, 100);

  let flag: string;
  let suggestion: string;

  if (score < 40) {
    flag = 'Voice Constitution needs more detail';
    suggestion = 'Your answers are very brief. Please provide a real sample message and more detailed descriptions for a better voice match.';
  } else if (score < 70) {
    flag = 'Moderate confidence — monitor first 5 messages';
    suggestion = 'Good baseline, but review the first few auto-sent messages to ensure the tone is exactly right.';
  } else {
    flag = 'High confidence — ready for autonomous sending';
    suggestion = 'Constitution is highly reliable based on your detailed inputs. Ready for auto-send pipeline.';
  }

  return { score, flag, suggestion };
}
