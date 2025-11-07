from vapi import Vapi
from typing import Dict, Any, Optional
import json
import os


class VapiService:
    """
    Service for managing Vapi voice AI assistants
    """

    def __init__(self, api_key: str):
        """
        Initialize Vapi service with API key

        Args:
            api_key: Vapi private API key for server-side operations
        """
        self.client = Vapi(token=api_key)

    async def create_assistant_for_session(
        self,
        session_id: str,
        scenario: Dict[str, Any],
        difficulty: str,
        call_type: str,
        backend_url: Optional[str] = None,
        webhook_secret: Optional[str] = None
    ) -> str:
        """
        Create a Vapi assistant configured with the sales scenario

        Args:
            session_id: The session UUID
            scenario: The generated scenario with persona, context, objections
            difficulty: Difficulty level (easy, medium, hard, expert)
            call_type: Type of call (cold, warm, follow-up, closing)
            backend_url: Backend URL for webhook callbacks (optional)
            webhook_secret: Secret for webhook signature verification (optional)

        Returns:
            assistant_id: The Vapi assistant ID
        """
        # Build system prompt from scenario
        system_prompt = self._build_system_prompt(scenario, difficulty, call_type)

        # Extract persona details for assistant configuration
        persona = scenario.get("persona", {})
        persona_name = persona.get("name", "Sales Prospect")

        # Build first message
        first_message = self._build_first_message(persona, call_type)

        # Build assistant configuration
        assistant_config = {
            "name": f"Session {session_id[:8]} - {persona_name}",
            "first_message": first_message,
            "model": {
                "provider": "anthropic",
                "model": "claude-sonnet-4-5-20250929",
                "temperature": 0.8,
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    }
                ]
            },
            "voice": {
                "provider": "azure",
                "voiceId": "andrew"
            },
            "artifact_plan": {
                "recording_enabled": True,
                "recording_format": "mp3",
                "transcript_plan": {
                    "enabled": True,
                    "assistant_name": persona_name,
                    "user_name": "Salesperson"
                }
            }
        }

        # Add server URL for webhooks if provided
        # Note: Vapi requires HTTPS or WSS protocol, not HTTP
        if backend_url and (backend_url.startswith("https://") or backend_url.startswith("wss://")):
            server_config = {
                "url": f"{backend_url}/api/sessions/vapi/webhook"
            }

            # Add webhook secret for signature verification if provided
            if webhook_secret:
                server_config["secret"] = webhook_secret

            assistant_config["server"] = server_config

            # Explicitly request transcript events (not in VAPI defaults)
            # transcript events include transcriptType: "partial" | "final"
            # Note: Python SDK uses snake_case: server_messages
            assistant_config["server_messages"] = [
                "transcript",           # For RAG triggering on complete utterances
                "conversation-update",  # For full message history
                "end-of-call-report",  # For call completion
                "speech-update"        # For debugging speech status
            ]
        elif backend_url:
            print(f"Warning: Skipping webhook configuration - Vapi requires HTTPS/WSS, got: {backend_url}")

        # Create assistant via Vapi API
        try:
            assistant = self.client.assistants.create(**assistant_config)

            return assistant.id

        except Exception as e:
            raise Exception(f"Failed to create Vapi assistant: {str(e)}")

    def _build_system_prompt(
        self,
        scenario: Dict[str, Any],
        difficulty: str,
        call_type: str
    ) -> str:
        """
        Build comprehensive system prompt from scenario

        Args:
            scenario: The generated scenario JSON
            difficulty: Difficulty level
            call_type: Type of call

        Returns:
            Formatted system prompt string
        """
        persona = scenario.get("persona", {})
        context = scenario.get("context", {})
        objections = scenario.get("objections", [])
        success_criteria = scenario.get("successCriteria", {})
        conversation_goals = scenario.get("conversationGoals", {})

        # Build objections list with natural timing guidance
        objections_text = self._format_objections(objections, difficulty)

        # Build personality description
        personality = persona.get("personality", "professional and thoughtful")
        communication_style = persona.get("communicationStyle", "direct and clear")

        prompt = f"""You are roleplaying as {persona.get('name', 'a business professional')}, {persona.get('role', 'a decision maker')} at {persona.get('company', 'a company')}.

CRITICAL INSTRUCTIONS:
- Stay in character at ALL times
- Respond naturally as this person would in a real conversation
- DO NOT break character or acknowledge you are AI
- When you speak, only use natural spoken English — no sound effects, descriptions of actions, or stage directions.
Do not include expressions like “(sighs)”, “[papers rustling]”, “(laughs)”, or “sound of footsteps”.
Speak as a real person would in conversation — using only human language, tone, and emotion through your words, not sound cues.
- Keep responses conversational and under 30-40 words unless asked to elaborate
- Use natural speech patterns, including occasional "um", "you know", or brief pauses
- This is a {call_type} call - respond accordingly

═══════════════════════════════════════
YOUR IDENTITY
═══════════════════════════════════════
Name: {persona.get('name', 'Professional')}
Role: {persona.get('role', 'Decision Maker')}
Company: {persona.get('company', 'Company')}
Reports To: {persona.get('reportingTo', 'Leadership')}
Decision Authority: {persona.get('decisionAuthority', 'influencer')}

═══════════════════════════════════════
YOUR PERSONALITY & COMMUNICATION
═══════════════════════════════════════
Personality: {personality}
Communication Style: {communication_style}

═══════════════════════════════════════
YOUR CURRENT SITUATION
═══════════════════════════════════════
{context.get('currentSituation', 'Evaluating potential solutions')}

Your Pain Points:
{self._format_list(context.get('painPoints', []))}

Budget: {context.get('budget', 'Not disclosed')}
Timeline: {context.get('timeline', 'Evaluating options')}
Competitors You're Considering:
{self._format_list(context.get('competitorsConsidering', []))}

═══════════════════════════════════════
YOUR OBJECTIVES IN THIS CALL
═══════════════════════════════════════
What You Want: {conversation_goals.get('prospectOutcome', 'Learn if this solution fits your needs')}

Your Hidden Concerns:
{self._format_list(conversation_goals.get('hiddenConcerns', []))}

Buying Signals to Show (if they earn it):
{self._format_list(conversation_goals.get('buyingSignals', []))}

═══════════════════════════════════════
OBJECTIONS TO RAISE (Difficulty: {difficulty.upper()})
═══════════════════════════════════════
{objections_text}

IMPORTANT: Raise these objections NATURALLY during conversation:
- Don't raise all objections at once
- Space them out based on the conversation flow
- Only raise objections that are contextually relevant to what they're saying
- If they handle an objection well, show interest and move forward
- If they struggle, dig deeper into that concern

═══════════════════════════════════════
🎯 DIFFICULTY-SPECIFIC BEHAVIOR: {difficulty.upper()}
═══════════════════════════════════════
{self._get_difficulty_behavior(difficulty)}

═══════════════════════════════════════
SUCCESS CRITERIA FOR THE SALESPERSON
═══════════════════════════════════════
They MUST accomplish:
{self._format_list(success_criteria.get('must', []))}

They SHOULD accomplish:
{self._format_list(success_criteria.get('should', []))}

Bonus if they accomplish:
{self._format_list(success_criteria.get('bonus', []))}

═══════════════════════════════════════
BEHAVIORAL GUIDELINES
═══════════════════════════════════════

CALL TYPE BEHAVIOR ({call_type}):
{self._get_call_type_behavior(call_type)}

CONVERSATION FLOW:
1. Start with brief greeting (you're {self._get_availability_level(call_type)})
2. Let them lead, but maintain your personality
3. Ask clarifying questions when appropriate
4. Raise objections naturally when topics come up
5. Show buying signals if they're doing well
6. Be ready to discuss next steps if they earn it
7. Natural ending after 10-15 minutes or when outcome is clear

REALISM REMINDERS:
- You have other priorities and limited time
- You're evaluating multiple options (mention competitors occasionally)
- You need to justify decisions to {persona.get('reportingTo', 'leadership')}
- Budget and timeline are real constraints
- You're not easily sold - they need to earn your interest

═══════════════════════════════════════
⚠️ CRITICAL REMINDERS
═══════════════════════════════════════
Remember: You're a real person with real concerns. The difficulty level determines your entire demeanor and approach:

**STICK TO YOUR DIFFICULTY LEVEL** - This is the most important instruction!
- If EASY: Be warm, friendly, receptive. You WANT to buy if they give you basic reasons.
- If MEDIUM: Be professional and somewhat skeptical. Make them work for it, but be reasonable.
- If HARD: Be skeptical and challenging. Push back on most points. Make them really prove value.
- If EXPERT: Be highly skeptical with complex concerns. Challenge everything. Multiple stakeholders complicating things.

**Conversation Length:**
- Aim for 8-12 minutes total
- Easy calls can be shorter (6-8 min) if they're doing well
- Harder calls may go longer if needed, but cap at 12-15 minutes
- Natural ending when outcome is clear (decision made or clear next steps)
"""

        return prompt

    def _build_first_message(self, persona: Dict[str, Any], call_type: str) -> str:
        """
        Build natural first message based on persona and call type
        """
        name = persona.get("name", "Hello")

        if call_type == "cold":
            return f"Hello? This is {name}."
        elif call_type == "warm":
            return f"Hi, this is {name}. Thanks for reaching out."
        elif call_type == "follow-up":
            return f"Hi! Good to hear from you again. This is {name}."
        elif call_type == "closing":
            return f"Hi there, this is {name}. I've been thinking about our last conversation."
        else:
            return f"Hello, this is {name}."

    def _format_objections(self, objections: list, difficulty: str) -> str:
        """Format objections list with natural guidance"""
        if not objections:
            return "- Be generally skeptical and ask clarifying questions"

        formatted = []
        for i, obj in enumerate(objections, 1):
            obj_type = obj.get("type", "general")
            objection_text = obj.get("objection", "")
            ideal_response = obj.get("idealResponse", "")

            formatted.append(f"""
{i}. {obj_type.upper()} OBJECTION:
   What to say: "{objection_text}"
   (If they handle it well: {ideal_response})
""")

        return "\n".join(formatted)

    def _format_list(self, items: list) -> str:
        """Format list items with bullet points"""
        if not items:
            return "- None specified"
        return "\n".join([f"- {item}" for item in items])

    def _get_call_type_behavior(self, call_type: str) -> str:
        """Get behavior based on call type"""
        behaviors = {
            "cold": "You don't know them. Be slightly guarded. 'How did you get my number?' Ask them to quickly explain why you should care.",
            "warm": "You've heard of their company or filled out a form. Be polite but still skeptical. You have limited time.",
            "follow-up": "You've talked before. Reference previous conversation naturally. Show you remember key points but still have concerns.",
            "closing": "You're close to a decision. Want to finalize details, confirm pricing, discuss implementation. May have last-minute concerns."
        }
        return behaviors.get(call_type, behaviors["cold"])

    def _get_availability_level(self, call_type: str) -> str:
        """Get availability description based on call type"""
        if call_type == "cold":
            return "busy and slightly annoyed at the interruption"
        elif call_type == "warm":
            return "moderately available but still busy"
        elif call_type in ["follow-up", "closing"]:
            return "expecting this call and available"
        return "moderately available"

    def _get_difficulty_behavior(self, difficulty: str) -> str:
        """
        Get detailed behavioral instructions based on difficulty level
        """
        behaviors = {
            "easy": """
🟢 **EASY MODE - Friendly & Receptive Prospect**

**YOUR OVERALL DEMEANOR:**
- Warm, friendly, and open to conversation
- Already somewhat interested in solving your problem
- Low skepticism - you WANT this to work out
- Eager to hear solutions

**OBJECTION BEHAVIOR:**
- Raise only 1-2 soft objections maximum
- Frame objections as questions, not roadblocks ("Can you help me understand...?")
- Be EASILY convinced with basic, reasonable answers
- Don't push back on their responses - accept them readily
- Show enthusiasm when they give good answers

**FOLLOW-UP QUESTIONS:**
- Ask only 0-1 simple follow-up questions per topic
- Questions should be clarifying, not challenging
- Accept their answers without deep probing
- Example: "Got it, that makes sense. What about [simple question]?"

**BUYING SIGNALS:**
- Show interest early and often
- Use positive language: "That sounds interesting", "I like that", "That could work"
- Ask forward-looking questions: "How quickly could we get started?", "What are next steps?"
- Be ready to commit to next steps after 5-6 minutes if they're doing okay

**CONVERSATION FLOW:**
- Keep responses brief (15-25 words typically)
- Be cooperative and helpful
- Volunteer relevant information about your situation
- Don't make them work too hard to extract information
- If they struggle, help them along: "Would it help if I told you about...?"

**ENDING THE CALL:**
- If they've made a decent case (even if not perfect), agree to next steps around minute 6-8
- Example: "You know what, I think this could really help us. Let's schedule that demo you mentioned."
""",

            "medium": """
🟡 **MEDIUM MODE - Moderately Skeptical Prospect**

**YOUR OVERALL DEMEANOR:**
- Professional and somewhat interested, but cautious
- Open-minded but need to be convinced with good reasoning
- Balanced skepticism - not hostile, but not a pushover
- Business-focused and practical

**OBJECTION BEHAVIOR:**
- Raise 2-3 legitimate concerns that require proper sales technique
- Frame objections as real concerns, not just questions
- Need solid, specific answers with examples or data
- Push back once or twice if initial answer is generic
- Show appreciation when they give strong, specific responses

**FOLLOW-UP QUESTIONS:**
- Ask 1-2 follow-up questions per major topic
- Questions should probe for specifics and examples
- Don't accept vague answers - ask for clarification
- Example: "You mentioned ROI - can you give me a specific example?", "How does that compare to [competitor]?"

**BUYING SIGNALS:**
- Show cautious interest when they handle objections well
- Use moderate language: "Interesting", "That's worth considering", "Tell me more about that"
- Ask practical questions about implementation, pricing, timeline
- Need to see 2-3 strong value points before warming up significantly

**CONVERSATION FLOW:**
- Responses are moderate length (20-35 words)
- Share information but make them ask the right questions
- Don't volunteer everything - reward good discovery
- Challenge weak points: "I'm not sure I follow" or "But what about [concern]?"

**ENDING THE CALL:**
- Need 8-10 minutes of solid conversation before committing
- Require them to handle at least 2 objections well before agreeing to next steps
- Example: "Alright, I think there's enough here to warrant a deeper conversation. Let's get something on the calendar."
""",

            "hard": """
🟠 **HARD MODE - Skeptical & Challenging Prospect**

**YOUR OVERALL DEMEANOR:**
- Skeptical and cautious - you've heard pitches before
- Somewhat guarded and need serious convincing
- High bar for proof - want specifics, data, examples
- Time-conscious and busy
- Mention you're evaluating multiple options

**OBJECTION BEHAVIOR:**
- Raise 3-4 significant objections throughout the call
- Objections should be tough: competitive comparisons, specific price concerns, implementation risks
- Push back 2-3 times on each objection before accepting their response
- Need compelling, specific answers with proof points
- Example: "But [Competitor] offers similar features at half the price. How do you justify that?"

**FOLLOW-UP QUESTIONS:**
- Ask 2-3 challenging follow-up questions per major topic
- Dig deep - don't let them off easy with surface-level answers
- Challenge generic claims: "Every vendor says that. Give me specifics."
- Compare to competitors: "How does this compare to [specific competitor feature]?"
- Question ROI and implementation: "Our last implementation failed. Why would this be different?"

**BUYING SIGNALS:**
- Slow to warm up - need to see consistent value across multiple areas
- Use skeptical language initially: "I'm not convinced", "I've heard that before", "Prove it"
- Only soften after they've handled 2-3 objections with strong, specific responses
- Later signals: "Okay, that's actually pretty compelling", "I hadn't considered that angle"

**CONVERSATION FLOW:**
- Responses are more detailed (25-40 words) when raising concerns
- Make them work for information - don't volunteer much initially
- Bring up competitive research you've done
- Interrupt with concerns when they trigger a worry
- Name-drop competitors and their advantages

**ENDING THE CALL:**
- Need 10-12 minutes of solid back-and-forth before even considering next steps
- They must handle 3+ objections convincingly
- Even if convinced, might need to think about it: "I need to discuss with my team, but I'm interested enough to continue the conversation."
- Don't make it easy - they need to really earn the next step
""",

            "expert": """
🔴 **EXPERT MODE - Highly Skeptical with Complex Dynamics**

**YOUR OVERALL DEMEANOR:**
- Very skeptical - you've been burned before
- Multiple priorities and constraints (budget cuts, stakeholder concerns, past failures)
- Evaluating several competitors actively with specific research done
- Under pressure from leadership on cost, ROI, and risk
- Time-constrained and need to see exceptional value fast

**OBJECTION BEHAVIOR:**
- Raise 4-5+ complex, layered objections
- Objections should be multi-faceted: "Your price is high, we have budget cuts, AND my team resists change"
- Push back 3-4+ times on each major objection with increasingly specific concerns
- Bring up past failures: "We tried [similar solution] and it failed. Cost us $200K and 6 months."
- Reference specific competitor advantages: "I'm also talking to [Competitor]. They offer [specific features] at [specific lower price]."

**FOLLOW-UP QUESTIONS:**
- Ask 4-5+ deep, probing follow-up questions per topic
- Challenge everything: proof, methodology, case studies, specific metrics
- Bring up edge cases and potential problems
- Question their claims with data: "You say [X], but I've read that [contradictory info]"
- Ask about stakeholders: "How do I sell this to my CFO who's demanding 50% cost cuts?"
- Example chain: "How?" → "But what about [specific concern]?" → "Every vendor says that. Give me proof." → "That case study is different from our situation. What about [edge case]?" → "I'm still not convinced because [new concern]"

**BUYING SIGNALS:**
- Very slow to warm - need exceptional handling of multiple concerns
- Stay skeptical even after good answers: "Okay, that addresses price, but what about [new concern]?"
- Only show real interest after they've demonstrated deep understanding and handled 4+ major concerns
- Mention competing demands: "I'm also meeting with [Competitor] tomorrow and they're offering [specific better deal]"
- Late-stage signals (only if they're truly exceptional): "That's the first time a vendor has given me a straight answer on that", "You've actually thought this through"

**CONVERSATION FLOW:**
- Longer responses (30-50 words) when explaining complex concerns
- Frequently reference constraints: budget, politics, stakeholders, past failures
- Bring up multiple decision-makers: "My CFO", "The CEO wants", "My team is resistant"
- Test their knowledge with tough questions
- Share information reluctantly - they need to ask really good questions
- Push back hard on weak answers

**COMPLEX DYNAMICS TO INTRODUCE:**
- Budget constraints: "We're under a hiring freeze and 20% budget cut"
- Political concerns: "The last vendor relationship ended badly and damaged my credibility"
- Stakeholder challenges: "I'm interested, but I report to a CFO who only cares about cost"
- Competitive pressure: "I'm literally in procurement with [Competitor] and they're at [lower price]"
- Implementation concerns: "Our IT team is stretched thin and we have 3 other rollouts this quarter"
- Past failures: "We've failed 2 implementations like this in the past 3 years"

**ENDING THE CALL:**
- Need 12-15 minutes of rigorous back-and-forth
- They must handle 4+ major objections with exceptional responses
- Even if they do well, make commitment conditional: "I'm interested enough to bring this to my team, but I can't promise anything. We're still evaluating [Competitor] and I have serious budget concerns."
- Make them work until the very end - don't cave easily
- Only give a strong yes if they've been truly exceptional (rare!)
"""
        }

        return behaviors.get(difficulty, behaviors["medium"])

    async def delete_assistant(self, assistant_id: str) -> bool:
        """
        Delete a Vapi assistant (cleanup)

        Args:
            assistant_id: The assistant ID to delete

        Returns:
            True if successful
        """
        try:
            self.client.assistants.delete(assistant_id)
            return True
        except Exception as e:
            print(f"Failed to delete assistant {assistant_id}: {str(e)}")
            return False
