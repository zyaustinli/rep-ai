"""
RAG Classifier Service
Determines if an AI question requires product knowledge (RAG) assistance
Uses Claude 3.5 Haiku for fast, accurate classification
"""
import asyncio
import logging
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class RAGClassifier:
    """
    Classify if AI's question requires product knowledge

    Product questions: pricing, features, specs, integrations, comparisons
    Conversational questions: greetings, discovery, relationship building
    """

    def __init__(self, anthropic_api_key: str):
        """
        Initialize classifier with Anthropic API key

        Args:
            anthropic_api_key: Anthropic API key for Claude access
        """
        self.client = Anthropic(api_key=anthropic_api_key)
        self.model = "claude-3-5-haiku-20241022"  # Fast and accurate

    async def classify(self, question: str, timeout: float = 3.0) -> bool:
        """
        Determine if question needs RAG assistance

        Args:
            question: The AI's question text
            timeout: Maximum time to wait for classification (seconds)

        Returns:
            True if question requires product knowledge
            False if conversational/non-product question

        Raises:
            asyncio.TimeoutError: If classification takes too long
            Exception: If API call fails
        """
        try:
            # Wrap classification in timeout
            result = await asyncio.wait_for(
                self._classify_internal(question),
                timeout=timeout
            )
            return result

        except asyncio.TimeoutError:
            logger.warning(f"Classifier timeout after {timeout}s for: {question}")
            # Err on side of showing hint when uncertain
            return True

        except Exception as e:
            logger.error(f"Classifier error: {e}")
            # Err on side of showing hint when uncertain
            return True

    async def _classify_internal(self, question: str) -> bool:
        """Internal classification logic using Claude"""

        prompt = self._build_classification_prompt(question)

        # Call Claude Haiku (fast, cheap, accurate)
        response = self.client.messages.create(
            model=self.model,
            max_tokens=50,  # Just need "PRODUCT" or "CONVERSATIONAL"
            temperature=0.0,  # Deterministic
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        # Extract response
        response_text = response.content[0].text.strip().upper()

        # Parse result
        needs_rag = "PRODUCT" in response_text

        logger.info(f"Classifier: '{question[:50]}...' → {response_text} → RAG={needs_rag}")

        return needs_rag

    def _build_classification_prompt(self, question: str) -> str:
        """Build classification prompt for Claude"""
        return f"""Determine if this sales call question requires PRODUCT KNOWLEDGE to answer.

PRODUCT KNOWLEDGE questions ask about:
- Pricing, costs, fees, subscription models
- Features, capabilities, functionality
- Technical specifications, requirements, compatibility
- Integrations with other tools/systems
- Comparisons with competitors
- Implementation, setup, onboarding
- Support, SLA, uptime guarantees
- Use cases, success stories, ROI

CONVERSATIONAL questions are:
- Greetings, pleasantries ("How are you?", "Nice to meet you")
- Discovery about prospect's needs ("What challenges are you facing?")
- Relationship building ("Tell me about your company")
- Process questions ("Can I ask you a few questions?")
- Clarifications about what was just said ("What do you mean by that?")

Question: "{question}"

Respond with ONLY one word:
- "PRODUCT" if it requires product knowledge
- "CONVERSATIONAL" if it doesn't

Answer:"""
