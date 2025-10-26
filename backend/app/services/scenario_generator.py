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

   **DIFFICULTY LEVEL SPECIFICATIONS:**

   🟢 **EASY** - Friendly & Receptive Prospect:
   - Only 1-2 soft, superficial objections (e.g., "Just want to understand the pricing" or "When can we get started?")
   - Objections are more like questions than real concerns
   - Should be overcome with simple, straightforward answers
   - Prospect is already somewhat sold on the idea
   - Example: "I'm interested, but can you help me understand the implementation timeline?"

   🟡 **MEDIUM** - Moderately Skeptical Prospect:
   - 2-3 moderate objections that require proper sales technique
   - Mix of price, timing, or mild competitive concerns
   - One objection might require a follow-up question or two
   - Prospect is genuinely interested but needs convincing
   - Example: "Your pricing seems a bit higher than [Competitor]. What makes you worth the premium?"

   🟠 **HARD** - Skeptical & Challenging Prospect:
   - 3-4 challenging objections including price, competition, and authority/timing
   - Requires strong value proposition and multiple back-and-forth exchanges
   - May ask 2-3 follow-up questions per objection before being satisfied
   - Mentions specific competitor advantages they've researched
   - Example: "I've been talking to [Competitor] and they offer [specific feature] at [lower price]. Plus, I'm not sure my team would adopt this. How do you address that?"

   🔴 **EXPERT** - Highly Skeptical with Complex Concerns:
   - 4-5+ tough objections with layered concerns and hidden agendas
   - Multiple stakeholders mentioned, complex buying dynamics
   - Will ask 4-5 deep follow-up questions and challenge responses
   - Brings up specific competitive research, pricing details, implementation concerns
   - May have budget constraints, political concerns, past bad experiences
   - Example: "Look, I've implemented 3 solutions like this before and they all failed. Your competitor offers 90% of your features at half the cost, plus they have better integration with our existing stack. Our CFO is pushing hard for cost reduction. Why should I risk my reputation on this?"

   For each objection include:
   - Type (price, timing, competition, authority, need, trust, etc.)
   - Exact wording they'll use (reference REAL competitors, actual pricing you found, specific features)
   - Ideal response approach
   - **For harder difficulties:** Expected follow-up questions they'll ask after the initial response

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
DIFFICULTY LEVEL EXAMPLES (CRITICAL - FOLLOW THESE PATTERNS):
═══════════════════════════════════════════════════════════

🟢 **EASY EXAMPLE - Friendly CRM Buyer:**
```json
{{
  "persona": {{
    "name": "Sarah Mitchell",
    "role": "Sales Manager",
    "company": "TechStart Inc",
    "personality": "Friendly, enthusiastic, solution-oriented",
    "communicationStyle": "Warm and conversational, asks clarifying questions",
    "decisionAuthority": "decision-maker",
    "reportingTo": "VP of Sales"
  }},
  "objections": [
    {{
      "type": "clarification",
      "objection": "Can you help me understand how the implementation process works? I want to make sure it's smooth for my team.",
      "idealResponse": "Walk through implementation timeline and support provided"
    }},
    {{
      "type": "timing",
      "objection": "This sounds great! When could we realistically get started?",
      "idealResponse": "Provide specific timeline and next steps"
    }}
  ]
}}
```
**Note:** Objections are really questions. Prospect WANTS to buy and just needs basic info.

🟡 **MEDIUM EXAMPLE - Cautious Marketing Director:**
```json
{{
  "persona": {{
    "name": "Michael Chen",
    "role": "Marketing Director",
    "company": "GrowthCo",
    "personality": "Professional, data-driven, somewhat skeptical",
    "communicationStyle": "Direct and business-focused, wants specifics",
    "decisionAuthority": "influencer",
    "reportingTo": "CMO"
  }},
  "objections": [
    {{
      "type": "price",
      "objection": "Your pricing is about 30% higher than HubSpot's similar tier. What justifies that premium?",
      "idealResponse": "Explain specific differentiators, ROI data, and unique features that justify cost"
    }},
    {{
      "type": "competition",
      "objection": "We've been using MailChimp for years. Why should we switch now?",
      "idealResponse": "Acknowledge their current solution, then highlight specific gaps and switching benefits"
    }},
    {{
      "type": "need",
      "objection": "I'm not sure we need all these advanced features. Can you help me understand which ones would actually impact our bottom line?",
      "idealResponse": "Ask discovery questions about their goals, then map specific features to their needs"
    }}
  ]
}}
```
**Note:** Real concerns that need proper answers with examples and data. Not hostile, but won't accept vague responses.

🟠 **HARD EXAMPLE - Skeptical IT Director:**
```json
{{
  "persona": {{
    "name": "Jennifer Torres",
    "role": "IT Director",
    "company": "Enterprise Systems Corp",
    "personality": "Skeptical, analytical, risk-averse due to past failures",
    "communicationStyle": "Challenging, asks tough follow-ups, compares to competitors",
    "decisionAuthority": "recommender",
    "reportingTo": "CTO"
  }},
  "objections": [
    {{
      "type": "trust",
      "objection": "We implemented a similar tool 18 months ago and it was a disaster. Cost us $200K and my team spent 6 months on it before we scrapped it. Why would this be any different?",
      "idealResponse": "Acknowledge concern, ask what went wrong, explain specific safeguards and differentiation"
    }},
    {{
      "type": "competition",
      "objection": "I've been talking to ServiceNow and they offer enterprise-grade security, SOC 2 Type II compliance, and their integration with our existing stack is seamless. You're also $80K more expensive annually. Make your case.",
      "idealResponse": "Don't bash competitor, acknowledge their strengths, then differentiate on specific capabilities, ease of use, or implementation speed with proof"
    }},
    {{
      "type": "price",
      "objection": "Even if I was sold on this - which I'm not yet - our CFO has mandated a 20% budget cut across all departments. How am I supposed to justify adding $150K in new spend?",
      "idealResponse": "Shift to ROI and cost savings, quantify value, explore phased rollout or different package options"
    }},
    {{
      "type": "authority",
      "objection": "I report to a CTO who's extremely cautious about new vendors after our last integration nightmare. He'll want to see proof this won't disrupt our operations. What do you have?",
      "idealResponse": "Provide case studies, reference customers, pilot program options, implementation plan"
    }}
  ]
}}
```
**Note:** Multiple tough objections with context. Past pain points. Competitor research. Budget constraints. Requires excellent objection handling.

🔴 **EXPERT EXAMPLE - Highly Skeptical CFO:**
```json
{{
  "persona": {{
    "name": "David Nakamura",
    "role": "Chief Financial Officer",
    "company": "Global Finance Holdings",
    "personality": "Extremely skeptical, numbers-focused, burned by vendors before, under board pressure",
    "communicationStyle": "Blunt, challenging, wants hard ROI data, mentions multiple stakeholders",
    "decisionAuthority": "decision-maker with complex approval process",
    "reportingTo": "Board of Directors"
  }},
  "objections": [
    {{
      "type": "trust",
      "objection": "I've been pitched by 6 vendors this month alone. Everyone claims to save money and improve efficiency. Our last 3 software implementations went over budget and under-delivered. Two vendors we worked with went out of business mid-contract. Why should I believe you're different?",
      "idealResponse": "Acknowledge pattern, provide financial stability proof, show risk mitigation, offer references from similar situations"
    }},
    {{
      "type": "competition",
      "objection": "I'm literally in final negotiations with Oracle and SAP. Oracle is offering a 35% discount if we sign this quarter, and SAP is throwing in their analytics suite for free. You're a startup asking for $500K. The board will laugh me out of the room. And by the way, what happens to my investment if you get acquired or shut down?",
      "idealResponse": "Don't compete head-to-head with enterprise giants, differentiate on agility/innovation/ROI timeline, address vendor risk with contractual protections"
    }},
    {{
      "type": "price",
      "objection": "Let's talk numbers. Your price is $500K annually. We're under a mandate to cut costs by 15% across the board. The board is breathing down my neck about every dollar. I have 3 departments fighting for budget. You need to tell me, specifically, how I'm getting $750K in value year one to justify this. And I'll fact-check your math.",
      "idealResponse": "Present detailed ROI model with conservative assumptions, quantify current costs/inefficiencies, show payback period, offer staged implementation"
    }},
    {{
      "type": "authority",
      "objection": "Even if I was sold - and I'm not - I need buy-in from our CEO, CTO, and COO. The CEO cares about growth metrics. The CTO is risk-averse after our last security incident. The COO is worried about operational disruption. They all have veto power. How do you address all three?",
      "idealResponse": "Address each stakeholder's concern specifically, offer stakeholder-specific materials, suggest multi-party demo"
    }},
    {{
      "type": "implementation",
      "objection": "Our IT team is already running 3 major projects this quarter. They're stretched thin. We have a hiring freeze so I can't add headcount. Your implementation requires 200 hours of our team's time according to your own docs. We don't have it. Plus, if this disrupts operations in Q4 - our biggest quarter - that's my head. What's your answer?",
      "idealResponse": "Offer professional services to reduce customer burden, phased rollout to minimize disruption, implementation timeline flexibility"
    }}
  ]
}}
```
**Note:** Extremely complex with layered concerns, multiple stakeholders, past failures, competitive pressure, budget constraints, and political dynamics. Requires masterful selling.

═══════════════════════════════════════════════════════════

Return ONLY valid JSON, no additional text before or after"""
