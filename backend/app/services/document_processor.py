"""
Document processing service for extracting text and chunking
Supports PDF and TXT files
"""
import PyPDF2
import os
import logging
from typing import Dict, List
from app.utils.text_chunker import chunk_text_semantic, count_tokens

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """
    Process documents (PDF, TXT) for vectorization
    """

    def __init__(self, chunk_size: int = 800, overlap_tokens: int = 120):
        """
        Initialize document processor

        Args:
            chunk_size: Target chunk size in tokens
            overlap_tokens: Number of tokens to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.overlap_tokens = overlap_tokens

    def extract_text_from_pdf(self, file_path: str) -> str:
        """
        Extract text from PDF file using PyPDF2

        Args:
            file_path: Path to PDF file

        Returns:
            Extracted text

        Raises:
            Exception: If PDF cannot be read
        """
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                num_pages = len(pdf_reader.pages)

                logger.info(f"Processing PDF with {num_pages} pages")

                for page_num in range(num_pages):
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()

                    if page_text:
                        text += page_text + "\n\n"  # Add double newline between pages

            logger.info(f"Extracted {len(text)} characters from PDF")
            return text.strip()

        except Exception as e:
            logger.error(f"Failed to extract text from PDF {file_path}: {str(e)}")
            raise Exception(f"PDF extraction failed: {str(e)}")

    def extract_text_from_txt(self, file_path: str) -> str:
        """
        Extract text from TXT file

        Args:
            file_path: Path to TXT file

        Returns:
            File contents

        Raises:
            Exception: If file cannot be read
        """
        try:
            # Try UTF-8 first, fall back to latin-1
            encodings = ['utf-8', 'latin-1', 'cp1252']

            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as file:
                        text = file.read()
                    logger.info(f"Successfully read TXT file with {encoding} encoding ({len(text)} characters)")
                    return text.strip()
                except UnicodeDecodeError:
                    continue

            # If all encodings fail
            raise Exception("Could not decode text file with any supported encoding")

        except Exception as e:
            logger.error(f"Failed to read TXT file {file_path}: {str(e)}")
            raise Exception(f"TXT extraction failed: {str(e)}")

    def chunk_text(self, text: str) -> List[Dict]:
        """
        Chunk text using semantic chunking with overlap

        Args:
            text: Input text to chunk

        Returns:
            List of chunks with metadata
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for chunking")
            return []

        chunks = chunk_text_semantic(
            text=text,
            chunk_size=self.chunk_size,
            overlap_tokens=self.overlap_tokens
        )

        logger.info(f"Created {len(chunks)} chunks from text")
        return chunks

    def process_document(self, file_path: str, file_type: str) -> Dict:
        """
        Process a document: extract text and chunk it

        Args:
            file_path: Path to document file
            file_type: File type ('pdf' or 'txt')

        Returns:
            {
                "text": "full extracted text",
                "chunks": [...],
                "total_chunks": 10,
                "total_tokens": 8567,
                "file_type": "pdf"
            }

        Raises:
            Exception: If processing fails
        """
        # Validate file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        # Extract text based on file type
        if file_type.lower() == 'pdf':
            text = self.extract_text_from_pdf(file_path)
        elif file_type.lower() in ['txt', 'md']:
            text = self.extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

        # Validate extracted text
        if not text or not text.strip():
            raise Exception("No text could be extracted from document")

        # Chunk the text
        chunks = self.chunk_text(text)

        # Calculate total tokens
        total_tokens = sum(chunk['token_count'] for chunk in chunks)

        result = {
            "text": text,
            "chunks": chunks,
            "total_chunks": len(chunks),
            "total_tokens": total_tokens,
            "file_type": file_type
        }

        logger.info(
            f"Processed {file_type} document: {len(text)} chars, "
            f"{total_tokens} tokens, {len(chunks)} chunks"
        )

        return result

    def chunk_content_section(self, section_name: str, section_content: str) -> List[Dict]:
        """
        Chunk a custom content section (from product.content_sections)

        Args:
            section_name: Name of the section
            section_content: Content text

        Returns:
            List of chunks with section metadata
        """
        if not section_content or not section_content.strip():
            logger.warning(f"Empty content for section '{section_name}'")
            return []

        chunks = self.chunk_text(section_content)

        # Add section name to each chunk for context
        for chunk in chunks:
            chunk['section_name'] = section_name

        logger.info(f"Chunked section '{section_name}' into {len(chunks)} chunks")
        return chunks
