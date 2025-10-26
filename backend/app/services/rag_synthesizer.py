"""
RAG Response Synthesizer Service
Uses Claude Haiku to synthesize natural responses from retrieved product knowledge
"""
import logging
import time
from typing import List, Dict, Optional
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class RAGSynthesizer:
    """
    Synthesize natural, conversational hints from RAG retrieval results

    Takes raw ChromaDB chunks and creates concise, helpful responses
    for sales questions using Claude Haiku (fast and cheap)
    """

    def __init__(self, anthropic_api_key: str):
        """
        Initialize synthesizer with Anthropic API key

        Args:
            anthropic_api_key: Anthropic API key for Claude access
        """
        self.client = Anthropic(api_key=anthropic_api_key)
        self.model = "claude-3-5-haiku-20241022"  # Fast and cheap

    async def synthesize_hint(
        self,
        question: str,
        context_chunks: List[Dict],
        max_chunks: int = 3
    ) -> Optional[str]:
        """
        Synthesize a natural response from retrieved context

        Args:
            question: The original sales question from AI
            context_chunks: Top-k results from ChromaDB (with 'text', 'similarity', etc.)
            max_chunks: Maximum number of chunks to use (default: 3)

        Returns:
            Synthesized hint text (2-3 sentences)
            None if synthesis fails (caller should fallback to raw chunk)
        """
        start_time = time.time()

        try:
            # Validate inputs
            if not context_chunks:
                logger.warning("No context chunks provided for synthesis")
                return None

            # Use top chunks only
            top_chunks = context_chunks[:max_chunks]

            # Build context string from chunks
            context_text = self._format_context(top_chunks)

            logger.info(
                f"🔍 RAG Synthesis: Synthesizing response for '{question[:50]}...' "
                f"using {len(top_chunks)} chunks"
            )

            # Build synthesis prompt
            prompt = self._build_synthesis_prompt(question, context_text)

            # Call Claude Haiku
            response = self.client.messages.create(
                model=self.model,
                max_tokens=150,  # Keep hints concise
                temperature=0.3,  # Low variance for consistency
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Extract synthesized text
            synthesized_hint = response.content[0].text.strip()

            # Calculate synthesis time
            synthesis_time = time.time() - start_time

            logger.info(
                f"✅ RAG Synthesis: Generated hint in {synthesis_time:.2f}s: "
                f"'{synthesized_hint[:80]}...'"
            )

            return synthesized_hint

        except Exception as e:
            logger.error(f"❌ RAG Synthesis failed: {e}", exc_info=True)
            return None

    def _format_context(self, chunks: List[Dict]) -> str:
        """
        Format context chunks into readable text for LLM

        Args:
            chunks: List of chunk dicts with 'text', 'source_name', etc.

        Returns:
            Formatted context string
        """
        formatted_parts = []

        for i, chunk in enumerate(chunks, 1):
            source_name = chunk.get('source_name', 'Unknown Source')
            text = chunk.get('text', '').strip()
            similarity = chunk.get('similarity', 0)

            formatted_parts.append(
                f"[Source {i}: {source_name} (relevance: {similarity:.2f})]\n{text}"
            )

        return "\n\n".join(formatted_parts)

    def _build_synthesis_prompt(self, question: str, context: str) -> str:
        """
        Build prompt for Claude to synthesize a hint

        Args:
            question: Original sales question
            context: Formatted context chunks

        Returns:
            Synthesis prompt
        """
        return f"""You are helping a salesperson during a live call. They were just asked a question about their product, and you have relevant product knowledge to help them answer.

QUESTION ASKED:
"{question}"

RELEVANT PRODUCT KNOWLEDGE:
{context}

YOUR TASK:
Write a concise, natural hint (2-3 sentences max) that helps the salesperson answer this question. The hint should:
- Be conversational and easy to understand quickly
- Focus on the most relevant information
- Include specific details (prices, features, etc.) if available
- Sound like advice from a helpful colleague

Write ONLY the hint text, nothing else:"""
