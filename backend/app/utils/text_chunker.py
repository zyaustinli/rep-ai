"""
Text chunking utilities for semantic RAG
Implements semantic chunking with overlap for better context preservation
"""
import tiktoken
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


def count_tokens(text: str, model: str = "cl100k_base") -> int:
    """
    Count tokens in text using tiktoken

    Args:
        text: Text to count tokens for
        model: Encoding model (cl100k_base for GPT-3.5/4, p50k_base for older models)

    Returns:
        Number of tokens
    """
    try:
        encoding = tiktoken.get_encoding(model)
        return len(encoding.encode(text))
    except Exception as e:
        logger.warning(f"Failed to count tokens with tiktoken: {e}. Using word count estimate.")
        # Fallback: estimate 1 token ≈ 0.75 words
        return int(len(text.split()) * 1.33)


def split_by_paragraphs(text: str) -> List[str]:
    """
    Split text by paragraphs (double newlines)

    Args:
        text: Input text

    Returns:
        List of paragraphs
    """
    # Split by double newlines, filter empty
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    return paragraphs


def split_by_sentences(text: str) -> List[str]:
    """
    Simple sentence splitter (splits on . ! ?)

    Args:
        text: Input text

    Returns:
        List of sentences
    """
    import re
    # Split on sentence endings followed by space or end of string
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]


def chunk_text_semantic(
    text: str,
    chunk_size: int = 800,
    overlap_tokens: int = 120,
    encoding_model: str = "cl100k_base"
) -> List[Dict[str, any]]:
    """
    Chunk text semantically with overlap

    Strategy:
    1. Split by paragraphs first (preserve semantic units)
    2. If paragraph > chunk_size, split by sentences
    3. If sentence > chunk_size, split by character count
    4. Add overlap: include last overlap_tokens of previous chunk

    Args:
        text: Input text to chunk
        chunk_size: Target chunk size in tokens (default 800)
        overlap_tokens: Number of tokens to overlap between chunks (default 120 = 15%)
        encoding_model: Tiktoken encoding model

    Returns:
        List of chunks with metadata:
        [
            {
                "text": "chunk text...",
                "chunk_index": 0,
                "token_count": 785,
                "start_char": 0,
                "end_char": 1234
            },
            ...
        ]
    """
    if not text or not text.strip():
        return []

    chunks = []
    current_chunk = ""
    current_tokens = 0
    chunk_index = 0
    char_position = 0
    overlap_text = ""

    # Split into paragraphs
    paragraphs = split_by_paragraphs(text)

    for paragraph in paragraphs:
        para_tokens = count_tokens(paragraph, encoding_model)

        # If paragraph fits in current chunk, add it
        if current_tokens + para_tokens <= chunk_size:
            if current_chunk:
                current_chunk += "\n\n" + paragraph
                current_tokens += para_tokens + 2  # +2 for newlines
            else:
                current_chunk = paragraph
                current_tokens = para_tokens

        # If paragraph is too large, need to handle it
        else:
            # Save current chunk if not empty
            if current_chunk:
                chunk_start = char_position
                char_position += len(current_chunk)

                chunks.append({
                    "text": current_chunk,
                    "chunk_index": chunk_index,
                    "token_count": current_tokens,
                    "start_char": chunk_start,
                    "end_char": char_position
                })

                # Prepare overlap for next chunk
                chunk_words = current_chunk.split()
                overlap_word_count = int(len(chunk_words) * 0.15)  # 15% overlap
                overlap_text = " ".join(chunk_words[-overlap_word_count:]) if overlap_word_count > 0 else ""

                chunk_index += 1

            # If paragraph itself is larger than chunk_size, split by sentences
            if para_tokens > chunk_size:
                sentences = split_by_sentences(paragraph)

                # Start new chunk with overlap
                current_chunk = overlap_text
                current_tokens = count_tokens(overlap_text, encoding_model) if overlap_text else 0

                for sentence in sentences:
                    sent_tokens = count_tokens(sentence, encoding_model)

                    # If sentence fits, add it
                    if current_tokens + sent_tokens <= chunk_size:
                        if current_chunk:
                            current_chunk += " " + sentence
                            current_tokens += sent_tokens + 1
                        else:
                            current_chunk = sentence
                            current_tokens = sent_tokens

                    # If sentence is too large or chunk is full
                    else:
                        # Save current chunk
                        if current_chunk:
                            chunk_start = char_position
                            char_position += len(current_chunk)

                            chunks.append({
                                "text": current_chunk,
                                "chunk_index": chunk_index,
                                "token_count": current_tokens,
                                "start_char": chunk_start,
                                "end_char": char_position
                            })

                            # Prepare overlap
                            chunk_words = current_chunk.split()
                            overlap_word_count = int(len(chunk_words) * 0.15)
                            overlap_text = " ".join(chunk_words[-overlap_word_count:]) if overlap_word_count > 0 else ""

                            chunk_index += 1

                        # Start new chunk with overlap + current sentence
                        current_chunk = overlap_text + (" " if overlap_text else "") + sentence
                        current_tokens = count_tokens(current_chunk, encoding_model)

            # Paragraph fits in one chunk but not in current, start new chunk
            else:
                current_chunk = overlap_text + ("\n\n" if overlap_text else "") + paragraph
                current_tokens = count_tokens(current_chunk, encoding_model)

    # Add final chunk if exists
    if current_chunk and current_chunk.strip():
        chunks.append({
            "text": current_chunk,
            "chunk_index": chunk_index,
            "token_count": current_tokens,
            "start_char": char_position,
            "end_char": char_position + len(current_chunk)
        })

    logger.info(f"Chunked text into {len(chunks)} chunks (target size: {chunk_size} tokens)")

    return chunks


def chunk_text_simple(text: str, chunk_size: int = 1000, overlap: int = 150) -> List[Dict[str, any]]:
    """
    Simple character-based chunking with overlap (fallback method)

    Args:
        text: Input text
        chunk_size: Characters per chunk
        overlap: Character overlap between chunks

    Returns:
        List of chunks with metadata
    """
    if not text or not text.strip():
        return []

    chunks = []
    start = 0
    chunk_index = 0

    while start < len(text):
        end = start + chunk_size
        chunk_text = text[start:end]

        chunks.append({
            "text": chunk_text,
            "chunk_index": chunk_index,
            "token_count": count_tokens(chunk_text),
            "start_char": start,
            "end_char": end
        })

        start += (chunk_size - overlap)
        chunk_index += 1

    return chunks
