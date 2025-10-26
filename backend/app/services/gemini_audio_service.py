from google import genai
from typing import Dict, Any
import json
import requests
import os
import tempfile


class GeminiAudioService:
    """
    Service for analyzing call recordings using Gemini API
    Analyzes vocal delivery using comprehensive sales call rubric
    """

    def __init__(self, api_key: str):
        """Initialize Gemini client with API key"""
        self.client = genai.Client(api_key=api_key)

    def _download_audio_from_url(self, url: str, session_id: str = None) -> str:
        """
        Download audio file from URL to temporary location

        Args:
            url: URL to download audio from (Vapi recording URL)
            session_id: Optional session ID for naming temp file

        Returns:
            Path to temporary audio file

        Raises:
            Exception: If download fails
        """
        try:
            # Generate temp file path
            if session_id:
                temp_filename = f"session_{session_id}_audio.mp3"
            else:
                temp_filename = f"audio_{os.urandom(8).hex()}.mp3"

            temp_path = os.path.join(tempfile.gettempdir(), temp_filename)

            # Download audio file
            print(f"Downloading audio from URL: {url}")
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()

            # Save to temp file
            with open(temp_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            print(f"Audio downloaded to: {temp_path}")
            return temp_path

        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to download audio from URL: {str(e)}")
        except Exception as e:
            raise Exception(f"Error downloading audio file: {str(e)}")

    async def analyze_call_audio(
        self,
        audio_file_path: str,
        session_context: Dict[str, Any],
        session_id: str = None
    ) -> Dict[str, Any]:
        """
        Analyze audio file for vocal delivery and sales performance

        Args:
            audio_file_path: Local file path OR URL to audio file
            session_context: Session metadata (scenario, difficulty, etc.)
            session_id: Optional session ID for temp file naming

        Returns:
            Structured analysis based on sales call rubric
        """
        temp_file_path = None
        is_url = audio_file_path.startswith('http://') or audio_file_path.startswith('https://')

        try:
            # If URL, download to temp location first
            if is_url:
                print(f"Detected URL input, downloading audio...")
                temp_file_path = self._download_audio_from_url(audio_file_path, session_id)
                file_to_upload = temp_file_path
            else:
                file_to_upload = audio_file_path

            # Upload audio file to Gemini
            print(f"Uploading audio file to Gemini: {file_to_upload}")
            audio_file = self.client.files.upload(file=file_to_upload)

            # Build analysis prompt
            prompt = self._build_analysis_prompt(session_context)

            # Generate analysis using gemini-2.5-flash
            print("Generating audio analysis with Gemini...")
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[prompt, audio_file]
            )

            # Parse response to structured JSON
            analysis = self._parse_analysis_response(response.text)

            return analysis

        finally:
            # Clean up temporary file if it was downloaded
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    print(f"Cleaned up temporary file: {temp_file_path}")
                except Exception as e:
                    print(f"Warning: Failed to delete temp file {temp_file_path}: {e}")

    def _build_analysis_prompt(self, context: Dict[str, Any]) -> str:
        """Build comprehensive sales call rubric analysis prompt"""

        difficulty = context.get('difficulty', 'medium')
        call_type = context.get('call_type', 'cold')
        duration = context.get('duration_seconds', 900) / 60  # Convert to minutes

        prompt = f"""You are an expert sales coach analyzing a practice sales call recording.

**CALL CONTEXT:**
- Call Type: {call_type}
- Difficulty Level: {difficulty}
- Duration: {duration:.1f} minutes
- Purpose: Sales role-play practice session

**YOUR TASK:**
Analyze the SALESPERSON's performance (not the prospect) using the comprehensive Sales Call Rubric below. Focus on vocal delivery, communication skills, and sales technique as demonstrated through audio.

═══════════════════════════════════════════════════════════
SALES CALL RUBRIC
═══════════════════════════════════════════════════════════

**CATEGORY 1: Call Structure & Process**

1. Opening & Introduction
   • Professionalism: Clear introduction of self and company
   • Rapport Building: Built genuine, unscripted rapport
   • Purpose & Agenda: Clearly stated call purpose and set brief agenda

2. Needs Discovery & Qualification
   • Questioning Skills: Asked effective, open-ended questions
   • Active Listening: Listened more than talked; acknowledged prospect statements
   • Qualification: Determined prospect fit (budget, authority, need, timeline)

3. Pitch & Value Proposition
   • Clarity: Clear and easy-to-understand explanation
   • Tailoring: Customized pitch to identified needs
   • Benefit-Focus: Sold benefits/outcomes, not just features

4. Objection Handling
   • Composure: Remained calm, confident, professional with objections
   • Technique: Understood objection before resolving
   • Effectiveness: Provided confident, persuasive answers

5. Closing & Next Steps
   • The 'Ask': Clearly and confidently asked for next step
   • Clarity of Action: Both parties understood next steps and timing
   • Urgency: Created polite, reasonable urgency if appropriate

**CATEGORY 2: Communication & Soft Skills**

1. Clarity & Conciseness
   • Language free of jargon and rambling
   • Avoided filler words ('um', 'uh', 'like')

2. Tone & Pacing (Smoothness)
   • Sounded confident, enthusiastic, positive
   • Natural pacing—not rushed or hesitant
   • Avoided sounding scripted or robotic

3. Empathy & Rapport
   • Showed genuine empathy for prospect's challenges
   • Appeared likable and trustworthy

4. Active Listening
   • Used verbal cues ('I see', 'That makes sense')
   • Paraphrased prospect's points to confirm understanding

5. Talk-to-Listen Ratio
   • Appropriate balance (prospect should speak more than rep)

**CATEGORY 3: Sales Technique & Persuasiveness**

1. Persuasiveness
   • Compelling, logical argument for product
   • Used storytelling, social proof, or data effectively

2. Product Knowledge
   • Demonstrated deep understanding of product/service
   • Confidently answered product-related questions

3. Adaptability
   • Adjusted approach based on prospect's responses
   • Handled unexpected questions well

4. Control of the Call
   • Guided conversation without being pushy
   • Kept call on track with agenda

5. Confidence
   • Sounded like trusted expert and advisor
   • Remained poised throughout entire call

**CATEGORY 4: Preparation & Professionalism**

1. Preparation
   • Demonstrated research on prospect/company
   • Referenced relevant details

2. Call Goal
   • Clear defined 'win' for the call

3. Follow-Through
   • Mentioned/committed to timely follow-up

4. Compliance & Ethics
   • Honest, did not over-promise or mislead

═══════════════════════════════════════════════════════════
ANALYSIS INSTRUCTIONS
═══════════════════════════════════════════════════════════

For EACH criterion in EACH category:
1. **Score** (0-100): Rate the salesperson's performance
2. **Evidence**: Cite specific audio examples (with approximate timestamps MM:SS)
3. **Strengths**: What they did well
4. **Areas for Improvement**: Specific, actionable feedback

**AUDIO ANALYSIS FOCUS:**
Since this is audio analysis, pay special attention to:
- Tone of voice (confident, nervous, enthusiastic, monotone)
- Speaking pace and rhythm
- Filler words and hesitations
- Vocal energy and engagement
- Clarity of speech
- Pauses and silence management
- Emotional authenticity
- Listening cues (how they respond to prospect)

**OUTPUT FORMAT:**
Return your analysis as a valid JSON object with this EXACT structure:

{{
  "categories": [
    {{
      "category": "1. Call Structure & Process",
      "overallScore": 0-100,
      "criteria": [
        {{
          "area": "Opening & Introduction",
          "score": 0-100,
          "keyFactors": [
            {{
              "factor": "Professionalism",
              "score": 0-100,
              "evidence": "At 00:45, salesperson introduced themselves clearly...",
              "strengths": ["Clear introduction", "Professional tone"],
              "improvements": ["Could have stated company value proposition"]
            }}
          ]
        }}
      ]
    }}
  ],
  "overallScore": 0-100,
  "overallGrade": "A/B/C/D/F",
  "keyStrengths": [
    "Strong opening with confident tone",
    "Excellent listening demonstrated by thoughtful pauses"
  ],
  "criticalWeaknesses": [
    "Too many filler words (counted 15+ 'um's)",
    "Rushed through value proposition at 03:20"
  ],
  "audioSpecificInsights": {{
    "toneAnalysis": "Overall confident with slight nervousness during pricing discussion",
    "pacingAnalysis": "Good natural pace, averaged ~150 wpm",
    "fillerWordCount": 15,
    "energyLevel": "Medium-High, maintained engagement throughout",
    "clarityScore": 85
  }},
  "actionableRecommendations": [
    "Practice pausing instead of using filler words",
    "Slow down when presenting pricing (rushed at 03:20)",
    "Build more rapport before transitioning to pitch"
  ]
}}

**IMPORTANT:**
- Return ONLY valid JSON, no markdown or additional text
- Be specific with timestamps (MM:SS format)
- Focus on OBSERVABLE vocal characteristics from audio
- Be constructive but honest in feedback
- Scores should reflect {difficulty} difficulty level expectations"""

        return prompt

    def _parse_analysis_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini response to structured JSON"""
        try:
            # Extract JSON from response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1

            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                analysis = json.loads(json_str)
                return analysis
            else:
                print("WARNING: Could not find JSON in Gemini response")
                return self._get_empty_analysis()

        except json.JSONDecodeError as e:
            print(f"ERROR: Failed to parse Gemini JSON response: {e}")
            return self._get_empty_analysis()

    def _get_empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis structure if parsing fails"""
        return {
            "categories": [],
            "overallScore": 0,
            "overallGrade": "N/A",
            "keyStrengths": [],
            "criticalWeaknesses": ["Analysis failed to generate"],
            "audioSpecificInsights": {
                "toneAnalysis": "Unable to analyze",
                "pacingAnalysis": "Unable to analyze",
                "fillerWordCount": 0,
                "energyLevel": "Unknown",
                "clarityScore": 0
            },
            "actionableRecommendations": ["Please try analysis again"]
        }
