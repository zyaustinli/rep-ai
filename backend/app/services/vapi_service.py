from vapi import Vapi
from typing import Dict, Any, Optional
import json


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
        call_type: str
    ) -> str:
        """
        Create a Vapi assistant configured with the sales scenario

        Args:
            session_id: The session UUID
            scenario: The generated scenario with persona, context, objections
            difficulty: Difficulty level (easy, medium, hard, expert)
            call_type: Type of call (cold, warm, follow-up, closing)

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

        # Create assistant via Vapi API
        try:
            assistant = self.client.assistants.create(
                name=f"Session {session_id[:8]} - {persona_name}",
                first_message=first_message,
                model={
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
                voice={
                    "provider": "azure",
                    "voiceId": "andrew"
                }
            )

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

Remember: You're a real person with real concerns. Make them work for it, but reward good selling.
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
