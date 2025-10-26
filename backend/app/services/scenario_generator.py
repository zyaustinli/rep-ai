import anthropic
import json
import os 
import asyncio
from typing import Dict, Any



class ScenarioGenerator:
    def __init__(self, api_key: str):
        api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY is required (env var or constructor).")
        self.client = anthropic.Anthropic(api_key=api_key)
        self.max_web_search_uses = 4
        
    async def generate_scenario(
        self,
        product_data: Dict[str, Any],
        persona_data: Dict[str, Any],
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive scenario using Claude API with web search
        """
        prompt = self._build_scenario_prompt(product_data, persona_data, preferences)

        message = await asyncio.to_thread(
            self.client.messages.create,
            model="claude-sonnet-4-5",
            max_tokens=4000,
            messages=[
                {"role": "user", "content": prompt}
            ],
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": self.max_web_search_uses
            }]
        )

        # Parse the response - extract text blocks only (skip web search tool blocks)
        scenario_text = ""
        for block in message.content:
            if hasattr(block, 'text'):
                scenario_text += block.text

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
        Generate a scenario using simplified inputs from frontend with web search
        """
        prompt = self._build_simplified_prompt(
            product_name,
            product_description,
            persona_description,
            difficulty,
            call_type,
            duration
        )

        message = await asyncio.to_thread(
            self.client.messages.create,
            model="claude-sonnet-4-5",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": self.max_web_search_uses
            }]
        )

        # Parse the response - extract text blocks only (skip web search tool blocks)
        scenario_text = ""
        for block in message.content:
            if hasattr(block, 'text'):
                scenario_text += block.text

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
        return f"""You are a sales training expert with web search capabilities. Generate an ultra-realistic sales call scenario based on the following inputs:

PRODUCT INFORMATION:
{json.dumps(product_data, indent=2)}

TARGET PERSONA:
{json.dumps(persona_data, indent=2)}

PREFERENCES:
- Difficulty: {preferences['difficulty']}
- Call Type: {preferences['call_type']}
- Expected Duration: {preferences['duration']} minutes
- Focus Areas: {preferences.get('focus_areas', [])}

🔍 WEB SEARCH INSTRUCTIONS:
You have web search access. Use it to enhance realism:
- Search for competitor pricing, features, and customer complaints
- Find current industry challenges and pain points
- Look up typical budgets and KPIs for the persona's role
- Discover real objection patterns for this type of sale
- Get current market trends and statistics

Incorporate search findings naturally throughout the scenario - use real competitor names, actual pricing, current industry data, and specific pain points you discover.

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

**IMPORTANT**: Use web search to find real competitors, actual pricing, current industry challenges, and specific data points. The more specific and current your scenario, the better the training value.
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
        return f"""You are a sales training expert with web search capabilities. Generate an ultra-realistic sales call scenario based on the following inputs:

PRODUCT INFORMATION:
Product Name: {product_name}
Description: {product_description}

TARGET PERSONA/PROSPECT:
{persona_description}

CALL SETTINGS:
- Difficulty Level: {difficulty}
- Call Type: {call_type}
- Expected Duration: {duration} minutes

═══════════════════════════════════════════════════════════
🔍 WEB SEARCH INSTRUCTIONS - USE THESE TO ENHANCE REALISM
═══════════════════════════════════════════════════════════

You have access to web search. Use it strategically to make this scenario incredibly realistic and current. Here's when and what to search:

**REQUIRED SEARCHES (Use 2-4 of these based on available information):**

1. **Competitor Intelligence** (if product category is clear):
   - Search: "top competitors for [product type] 2025"
   - Search: "[identified competitor] pricing and features"
   - Search: "[competitor] customer complaints and reviews"
   → Use this to create realistic competitive objections

2. **Industry-Specific Pain Points** (if industry is mentioned in persona):
   - Search: "biggest challenges facing [industry] in 2025"
   - Search: "[job title] pain points and frustrations [industry]"
   - Search: "common problems with [current solution type]"
   → Use this to create authentic, current pain points

3. **Role-Specific Context** (if job title is clear):
   - Search: "[job title] responsibilities and KPIs"
   - Search: "typical budget for [job title] [solution type]"
   - Search: "what metrics does a [job title] care about"
   → Use this to set realistic budget, authority, and concerns

4. **Current Market Trends**:
   - Search: "[industry] trends 2025"
   - Search: "emerging challenges in [industry sector]"
   → Use this to make the scenario feel current and relevant

5. **Real Objection Patterns**:
   - Search: "common objections when selling [solution type]"
   - Search: "why companies hesitate to buy [product category]"
   → Use this to create realistic, difficult-to-handle objections

6. **Pricing & Budget Intelligence**:
   - Search: "average cost of [solution type] for [company size]"
   - Search: "[similar product] pricing models"
   → Use this to set realistic budget constraints

**HOW TO USE SEARCH RESULTS:**
- Extract specific, current facts and data points
- Use actual competitor names, pricing, and features you find
- Incorporate real industry statistics and trends
- Reference actual pain points mentioned in forums, reviews, or articles
- Make objections based on real competitive advantages you discover
- Set budgets based on actual market pricing you find

**SEARCH STRATEGY:**
- Prioritize searches that will most impact scenario realism
- Use specific, targeted queries
- Combine multiple search results to create a cohesive story
- Don't just list facts - weave them naturally into the scenario

═══════════════════════════════════════════════════════════

Your task is to create a comprehensive, realistic sales call scenario. Based on the persona description provided AND your web search findings, intelligently create:

1. **Persona Details** (expand from the description provided):
   - Create a realistic full name
   - Determine specific role and company name
   - Define personality traits and communication style
   - Set decision-making authority level
   - Identify who they report to

2. **Context & Situation** (USE WEB SEARCH RESULTS HERE):
   - Describe their current business situation related to the product (incorporate current industry trends you found)
   - List 3-5 specific pain points they're experiencing (use actual pain points from your searches - be specific!)
   - Set a realistic budget range based on their role/company (use actual pricing data from competitor searches)
   - Define a timeline for making a decision (consider industry buying cycles you discovered)
   - List 2-3 competitors they might be considering (use REAL competitor names from your searches)

3. **Objections** (USE WEB SEARCH - create realistic objections based on actual competitive intelligence and market data):
   - For "easy": 1-2 soft objections that are easy to overcome
   - For "medium": 3 moderate objections requiring good technique
   - For "hard": 4-5 challenging objections including price, timing, and competition
   - For "expert": 5+ tough objections with hidden agendas and complex buying dynamics

   For each objection include:
   - Type (price, timing, competition, authority, need, trust, etc.)
   - Exact wording they'll use (reference REAL competitors, actual pricing you found, specific features)
   - Ideal response approach

   **Make objections realistic by:**
   - Using actual competitor names and their real advantages you discovered
   - Citing actual price points from your searches ("Your competitor charges $X...")
   - Mentioning real industry concerns or trends you found
   - Including specific features/capabilities that real alternatives offer

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
- **USE WEB SEARCH EXTENSIVELY** - The more current, real data you incorporate, the better
- Make the persona feel authentic and three-dimensional based on the description
- Ensure objections match the difficulty level ({difficulty})
- For {call_type} calls, set appropriate context (cold = no prior relationship, warm = some awareness, follow-up = continuing conversation, closing = ready to make decision)
- Make the scenario challenging but realistic
- Include specific details that make the scenario feel real
- **CRITICAL**: Weave web search findings naturally throughout - don't just add them as afterthoughts

═══════════════════════════════════════════════════════════
EXAMPLES OF GOOD VS. BAD USE OF WEB SEARCH:
═══════════════════════════════════════════════════════════

❌ BAD (Generic, no web search):
"Pain Point: Current CRM is slow and hard to use"
"Competitor: Some other CRM tool"
"Budget: Around $10,000"

✅ GOOD (Specific, using web search):
"Pain Point: Current Salesforce instance has adoption rate of only 40% (typical for implementations without proper training per 2025 Gartner research), causing $50K in lost productivity annually"
"Competitor: Considering HubSpot Sales Hub ($450/user/month for Professional tier) which offers better UI but lacks advanced forecasting"
"Budget: $45,000-$60,000 annually (aligned with industry standard of $500-700/user for mid-market sales teams of 100 people)"

**The difference:** Specificity, current data, real numbers, actual competitors, and industry context.

═══════════════════════════════════════════════════════════

Return ONLY valid JSON, no additional text before or after"""
