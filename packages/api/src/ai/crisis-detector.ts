import OpenAI from 'openai'
import { AI_MODELS, CRISIS_HELPLINES } from '@studymate/shared'
import type { CrisisAction, CrisisAssessment, CrisisLevel } from '@studymate/shared'

/**
 * Three-layer crisis detection system.
 *
 * Layer 1: Synchronous keyword/phrase matching (fast, no AI call)
 * Layer 2: GPT-4o semantic analysis (async, catches indirect ideation)
 * Layer 3: Pattern-based deterioration (weekly analytics, separate service)
 *
 * Safety invariant: false negatives are unacceptable. Tune for high recall.
 * A false positive (unnecessary helpline display) is always preferable to a miss.
 */

const client = new OpenAI()

// Layer 1: keyword lists in English and Hindi
const CRITICAL_KEYWORDS_EN = [
  'kill myself',
  'end my life',
  'suicide',
  'want to die',
  "can't go on",
  'no point living',
  'end it all',
  'better off dead',
  'self harm',
  'cut myself',
  'hurt myself',
]

const CRITICAL_KEYWORDS_HI = [
  'मरना चाहता हूं',
  'मरना चाहती हूं',
  'जीना नहीं चाहता',
  'जीना नहीं चाहती',
  'खुद को नुकसान',
  'आत्महत्या',
  'जिंदगी खत्म',
  'सब कुछ खत्म',
]

const MODERATE_KEYWORDS_EN = [
  'hopeless',
  'worthless',
  'nobody cares',
  'burden to everyone',
  'trapped',
  'no way out',
  'give up on everything',
  'disappear',
]

const MODERATE_KEYWORDS_HI = [
  'उम्मीद नहीं',
  'बेकार हूं',
  'किसी को परवाह नहीं',
  'बोझ हूं',
  'फंसा हुआ',
  'कोई रास्ता नहीं',
]

export async function assessCrisisRisk(text: string): Promise<CrisisAssessment> {
  const layer1 = runKeywordDetection(text)

  // Critical keywords trigger immediate escalation without waiting for AI
  if (layer1.level === 'critical') {
    return layer1
  }

  // For moderate or ambiguous cases, run semantic analysis
  const layer2 = await runSemanticAnalysis(text, layer1)

  // Return the higher severity of the two assessments
  return severityMax(layer1, layer2)
}

function runKeywordDetection(text: string): CrisisAssessment {
  const normalizedText = text.toLowerCase()
  const foundCritical: string[] = []
  const foundModerate: string[] = []

  for (const kw of CRITICAL_KEYWORDS_EN) {
    if (normalizedText.includes(kw)) foundCritical.push(kw)
  }

  for (const kw of CRITICAL_KEYWORDS_HI) {
    if (text.includes(kw)) foundCritical.push(kw)
  }

  for (const kw of MODERATE_KEYWORDS_EN) {
    if (normalizedText.includes(kw)) foundModerate.push(kw)
  }

  for (const kw of MODERATE_KEYWORDS_HI) {
    if (text.includes(kw)) foundModerate.push(kw)
  }

  if (foundCritical.length > 0) {
    return {
      level: 'critical',
      triggerPhrases: foundCritical,
      confidence: 0.95,
      recommendedAction: 'escalate_helpline',
    }
  }

  if (foundModerate.length > 0) {
    return {
      level: 'moderate',
      triggerPhrases: foundModerate,
      confidence: 0.7,
      recommendedAction: 'gentle_check_in',
    }
  }

  return {
    level: 'none',
    triggerPhrases: [],
    confidence: 0.9,
    recommendedAction: 'none',
  }
}

async function runSemanticAnalysis(
  text: string,
  layer1Result: CrisisAssessment
): Promise<CrisisAssessment> {
  const prompt = `You are a mental health safety classifier. Analyze the following student journal entry or message for signs of psychological crisis.

Classify the crisis level as one of: none, moderate, high, critical

Definitions:
- none: Normal stress, frustration, exam pressure. No safety concern.
- moderate: Persistent hopelessness, feeling like a burden, social withdrawal language. Monitor closely.
- high: Indirect suicidal ideation, entrapment, no future vision. Immediate check-in needed.
- critical: Explicit suicidal ideation, self-harm intent, immediate danger signals.

TEXT TO ANALYZE:
"""
${text}
"""

Respond ONLY with valid JSON in this exact format:
{
  "level": "none" | "moderate" | "high" | "critical",
  "triggerPhrases": ["exact phrase from text", ...],
  "confidence": 0.0–1.0,
  "reasoning": "one sentence explanation"
}`

  try {
    const response = await client.chat.completions.create({
      model: AI_MODELS.CRISIS_ASSESSMENT,
      max_tokens: 256,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.choices[0]?.message.content
    if (!content) return layer1Result

    const parsed = JSON.parse(content) as {
      level: CrisisLevel
      triggerPhrases: string[]
      confidence: number
    }

    return {
      level: parsed.level,
      triggerPhrases: parsed.triggerPhrases,
      confidence: parsed.confidence,
      recommendedAction: levelToAction(parsed.level),
    }
  } catch {
    // On any AI failure, fall back to layer 1 result — never silently drop safety
    return layer1Result
  }
}

function severityMax(a: CrisisAssessment, b: CrisisAssessment): CrisisAssessment {
  const order: CrisisLevel[] = ['none', 'moderate', 'high', 'critical']
  return order.indexOf(a.level) >= order.indexOf(b.level) ? a : b
}

function levelToAction(level: CrisisLevel): CrisisAction {
  const map: Record<CrisisLevel, CrisisAction> = {
    none: 'none',
    moderate: 'gentle_check_in',
    high: 'escalate_helpline',
    critical: 'escalate_helpline',
  }
  return map[level]
}

/**
 * Builds the helpline message injected into Mitra's response during crisis escalation.
 * Hardcoded — not AI-generated — to ensure reliability.
 */
export function buildCrisisEscalationMessage(language: 'en' | 'hi' | 'hinglish'): string {
  const helplines = CRISIS_HELPLINES.map((h) => `• ${h.name}: ${h.number} (${h.hours})`).join('\n')

  if (language === 'hi') {
    return `मैं समझता/समझती हूं कि यह बहुत कठिन समय है। कृपया किसी से बात करें:\n\n${helplines}\n\nआप अकेले नहीं हैं।`
  }

  return `I hear you, and I want you to know you're not alone in this. Please reach out to someone who can help right now:\n\n${helplines}\n\nYou matter far more than any exam result.`
}
