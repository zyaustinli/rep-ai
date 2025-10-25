import anthropic
import json
from typing import Dict, Any


class ScenarioGenerator:
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)

    async def generate_scenario(
        self,
        product_data: Dict[str, Any],
        persona_data: Dict[str, Any],
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive scenario using Claude API
        """
        prompt = self._build_scenario_prompt(product_data, persona_data, preferences)

        message = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Parse the response
        scenario_text = message.content[0].text

        # Try to extract JSON from the response
        try:
            # Look for JSON in the response
            start_idx = scenario_text.find('{')
            end_idx = scenario_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                scenario_json = json.loads(scenario_text[start_idx:end_idx])
                return scenario_json
            else:
                # If no JSON found, return a structured response
                return {"raw_scenario": scenario_text}
        except json.JSONDecodeError:
            return {"raw_scenario": scenario_text}

    def _build_scenario_prompt(
        self,
        product_data: Dict[str, Any],
        persona_data: Dict[str, Any],
        preferences: Dict[str, Any]
    ) -> str:
        """
        Build the prompt for scenario generation
        """
        return f"""You are a sales training expert. Generate a realistic sales call scenario based on the following inputs:

PRODUCT INFORMATION:
{json.dumps(product_data, indent=2)}

TARGET PERSONA:
{json.dumps(persona_data, indent=2)}

PREFERENCES:
- Difficulty: {preferences['difficulty']}
- Call Type: {preferences['call_type']}
- Expected Duration: {preferences['duration']} minutes
- Focus Areas: {preferences.get('focus_areas', [])}

Generate a comprehensive scenario that includes:

1. **Persona Details** (if not fully provided, create them):
   - Full name, role, company
   - Personality traits and communication style
   - Decision-making authority
   - Who they report to

2. **Context & Situation**:
   - Current business situation
   - Specific pain points (3-5)
   - Budget range
   - Timeline for decision
   - Competitors they're considering

3. **Objections** (3-5 realistic objections they'll raise):
   - Type of objection (price, timing, competition, etc.)
   - Exact objection they'll voice
   - Ideal response approach

4. **Success Criteria**:
   - Must-achieve goals
   - Should-achieve goals
   - Bonus achievements

5. **Conversation Goals**:
   - What outcome the prospect is looking for
   - Their hidden concerns
   - Buying signals to watch for

Return the scenario as a valid JSON object with this structure:
{{
  "persona": {{
    "name": "...",
    "role": "...",
    "company": "...",
    "personality": "...",
    "communicationStyle": "...",
    "decisionAuthority": "...",
    "reportingTo": "..."
  }},
  "context": {{
    "currentSituation": "...",
    "painPoints": ["...", "..."],
    "budget": "...",
    "timeline": "...",
    "competitorsConsidering": ["...", "..."]
  }},
  "objectives": {{
    "scenarioGoal": "...",
    "challengeLevel": "{preferences['difficulty']}",
    "expectedDuration": "{preferences['duration']} minutes"
  }},
  "objections": [
    {{
      "type": "...",
      "objection": "...",
      "idealResponse": "..."
    }}
  ],
  "successCriteria": {{
    "must": ["...", "..."],
    "should": ["...", "..."],
    "bonus": ["...", "..."]
  }}
}}

Make the scenario realistic and appropriate for the {preferences['difficulty']} difficulty level.
"""
