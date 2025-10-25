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
            model="claude-sonnet-4-5",
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

    async def generate_scenario_simplified(
        self,
        product_name: str,
        product_description: str,
        persona_description: str,
        difficulty: str,
        call_type: str,
        duration: int = 15
    ) -> Dict[str, Any]:
        """
        Generate a scenario using simplified inputs from frontend
        """
        prompt = self._build_simplified_prompt(
            product_name,
            product_description,
            persona_description,
            difficulty,
            call_type,
            duration
        )

        message = self.client.messages.create(
            model="claude-sonnet-4-5",
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

    def _build_simplified_prompt(
        self,
        product_name: str,
        product_description: str,
        persona_description: str,
        difficulty: str,
        call_type: str,
        duration: int
    ) -> str:
        """
        Build the prompt for simplified scenario generation
        """
        return f"""You are a sales training expert. Generate a realistic sales call scenario based on the following inputs:

PRODUCT INFORMATION:
Product Name: {product_name}
Description: {product_description}

TARGET PERSONA/PROSPECT:
{persona_description}

CALL SETTINGS:
- Difficulty Level: {difficulty}
- Call Type: {call_type}
- Expected Duration: {duration} minutes

Your task is to create a comprehensive, realistic sales call scenario. Based on the persona description provided, intelligently infer and create:

1. **Persona Details** (expand from the description provided):
   - Create a realistic full name
   - Determine specific role and company name
   - Define personality traits and communication style
   - Set decision-making authority level
   - Identify who they report to

2. **Context & Situation**:
   - Describe their current business situation related to the product
   - List 3-5 specific pain points they're experiencing
   - Set a realistic budget range based on their role/company
   - Define a timeline for making a decision
   - List 2-3 competitors they might be considering

3. **Objections** (create 3-5 realistic objections based on difficulty level):
   - For "easy": 1-2 soft objections that are easy to overcome
   - For "medium": 3 moderate objections requiring good technique
   - For "hard": 4-5 challenging objections including price, timing, and competition
   - For "expert": 5+ tough objections with hidden agendas and complex buying dynamics

   For each objection include:
   - Type (price, timing, competition, authority, need, trust, etc.)
   - Exact wording they'll use
   - Ideal response approach

4. **Success Criteria**:
   - Must-achieve goals (minimum to not fail)
   - Should-achieve goals (expected outcomes)
   - Bonus achievements (exceptional performance)

5. **Conversation Goals**:
   - What outcome the prospect is looking for
   - Their hidden concerns or unstated needs
   - Buying signals the salesperson should watch for

Return the scenario as a valid JSON object with this exact structure:
{{
  "persona": {{
    "name": "First Last",
    "role": "Job Title",
    "company": "Company Name",
    "personality": "Brief personality description",
    "communicationStyle": "How they communicate",
    "decisionAuthority": "decision-maker/influencer/recommender/gatekeeper",
    "reportingTo": "Who they report to"
  }},
  "context": {{
    "currentSituation": "Detailed description of their current situation",
    "painPoints": ["Pain point 1", "Pain point 2", "Pain point 3"],
    "budget": "$X-Y or budget description",
    "timeline": "When they need to decide",
    "competitorsConsidering": ["Competitor 1", "Competitor 2"]
  }},
  "objectives": {{
    "scenarioGoal": "What the salesperson should achieve",
    "challengeLevel": "{difficulty}",
    "expectedDuration": "{duration} minutes"
  }},
  "objections": [
    {{
      "type": "price/timing/competition/authority/need/trust",
      "objection": "Exact words they'll say",
      "idealResponse": "How to best handle this"
    }}
  ],
  "successCriteria": {{
    "must": ["Must achieve 1", "Must achieve 2"],
    "should": ["Should achieve 1", "Should achieve 2"],
    "bonus": ["Bonus achievement 1"]
  }},
  "conversationGoals": {{
    "prospectOutcome": "What the prospect wants from this call",
    "hiddenConcerns": ["Hidden concern 1", "Hidden concern 2"],
    "buyingSignals": ["Signal 1", "Signal 2"]
  }}
}}

IMPORTANT INSTRUCTIONS:
- Make the persona feel authentic and three-dimensional based on the description
- Ensure objections match the difficulty level ({difficulty})
- For {call_type} calls, set appropriate context (cold = no prior relationship, warm = some awareness, follow-up = continuing conversation, closing = ready to make decision)
- Make the scenario challenging but realistic
- Include specific details that make the scenario feel real
- Return ONLY valid JSON, no additional text before or after"""
