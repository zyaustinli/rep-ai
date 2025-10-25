import anthropic
import json
from typing import Dict, Any, List


class AnalysisService:
    """
    Analyzes completed practice sessions using Claude API
    """

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)

    async def analyze_session(
        self,
        scenario: Dict[str, Any],
        transcript: List[Dict[str, Any]],
        session_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Comprehensive analysis of a practice session
        """
        prompt = self._build_analysis_prompt(scenario, transcript, session_metadata)

        message = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=8000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Parse the analysis response
        analysis_text = message.content[0].text

        try:
            # Extract JSON from response
            start_idx = analysis_text.find('{')
            end_idx = analysis_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                analysis = json.loads(analysis_text[start_idx:end_idx])
                return analysis
            else:
                return {"raw_analysis": analysis_text}
        except json.JSONDecodeError:
            return {"raw_analysis": analysis_text}

    def _build_analysis_prompt(
        self,
        scenario: Dict[str, Any],
        transcript: List[Dict[str, Any]],
        metadata: Dict[str, Any]
    ) -> str:
        """
        Build comprehensive analysis prompt
        """
        transcript_text = "\n".join([
            f"[{entry['timestamp']}s] {entry['speaker'].upper()}: {entry['text']}"
            for entry in transcript
        ])

        return f"""You are a sales coaching expert. Analyze this sales call practice session and provide detailed feedback.

ORIGINAL SCENARIO:
{json.dumps(scenario, indent=2)}

CALL TRANSCRIPT:
{transcript_text}

SESSION METADATA:
- Duration: {metadata.get('duration_seconds', 0)} seconds
- Difficulty: {metadata.get('difficulty', 'unknown')}
- Call Type: {metadata.get('call_type', 'unknown')}

Analyze the call across these 7 dimensions and provide scores (0-100) for each:

1. **Discovery & Qualification**: Questions asked, understanding of prospect's situation, budget/timeline identification
2. **Product Knowledge**: Accuracy of information, connecting features to benefits, confidence
3. **Objection Handling**: Recognition and response to objections, techniques used, moving past concerns
4. **Rapport Building**: Active listening, personalization, empathy, conversation flow
5. **Value Communication**: ROI articulation, tailoring to needs, use of stories/proof
6. **Closing & Next Steps**: Clear CTA, handling resistance, creating urgency
7. **Communication Skills**: Clarity, pace, professional language, filler words

For each category, provide:
- Score (0-100)
- 2-3 specific strengths with examples from transcript
- 2-3 specific weaknesses with examples from transcript

Also identify:
- 3-5 key moments in the call (with timestamps) and evaluate them
- 5-7 specific recommendations for improvement
- Overall grade (A+, A, A-, B+, B, B-, C+, C, C-, D, F)
- Overall score (average of category scores)

Return as JSON with this structure:
{{
  "overallScore": 85,
  "overallGrade": "A-",
  "categories": {{
    "discovery": {{
      "score": 85,
      "strengths": ["...", "..."],
      "weaknesses": ["...", "..."],
      "examples": [
        {{"timestamp": 120, "quote": "...", "feedback": "..."}}
      ]
    }},
    "productKnowledge": {{"score": 80, "strengths": [], "weaknesses": [], "examples": []}},
    "objectionHandling": {{"score": 75, "strengths": [], "weaknesses": [], "examples": []}},
    "rapportBuilding": {{"score": 90, "strengths": [], "weaknesses": [], "examples": []}},
    "valueCommunication": {{"score": 82, "strengths": [], "weaknesses": [], "examples": []}},
    "closing": {{"score": 70, "strengths": [], "weaknesses": [], "examples": []}},
    "communication": {{"score": 88, "strengths": [], "weaknesses": [], "examples": []}}
  }},
  "keyMoments": [
    {{
      "timestamp": 180,
      "title": "Price Objection Handling",
      "description": "...",
      "evaluation": "...",
      "rating": "good"
    }}
  ],
  "recommendations": [
    {{
      "priority": "high",
      "category": "discovery",
      "suggestion": "...",
      "reasoning": "...",
      "practiceExercise": "..."
    }}
  ],
  "detailedFeedback": "Overall narrative feedback here..."
}}
"""

    def _calculate_metrics(self, transcript: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate talk time ratio, questions asked, etc.
        """
        user_words = 0
        ai_words = 0
        questions_asked = 0

        for entry in transcript:
            words = len(entry["text"].split())
            if entry["speaker"] == "user":
                user_words += words
                if "?" in entry["text"]:
                    questions_asked += 1
            else:
                ai_words += words

        total_words = user_words + ai_words
        talk_ratio = user_words / total_words if total_words > 0 else 0

        return {
            "talkTimeRatio": talk_ratio,
            "userWords": user_words,
            "aiWords": ai_words,
            "questionsAsked": questions_asked,
        }
