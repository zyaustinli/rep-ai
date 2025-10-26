"""
Integration test for RAG feature

Tests the complete flow:
1. ChromaDB connection
2. Text chunking
3. Document processing
4. Vector operations (add, query, delete)

Run with: python test_rag_integration.py
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database.chroma_client import is_chromadb_available, get_product_collection
from app.services.document_processor import DocumentProcessor
from app.services.vector_service import VectorService
from app.schemas.product import ContentSection
from app.utils.text_chunker import count_tokens, chunk_text_semantic


def test_chromadb_connection():
    """Test 1: Verify ChromaDB is accessible"""
    print("\n=== Test 1: ChromaDB Connection ===")

    if not is_chromadb_available():
        print("❌ FAIL: ChromaDB is not available")
        return False

    print("✅ PASS: ChromaDB is available")

    try:
        collection = get_product_collection()
        print(f"✅ PASS: Got collection '{collection.name}'")
        count = collection.count()
        print(f"   Current vector count: {count}")
        return True
    except Exception as e:
        print(f"❌ FAIL: Could not get collection: {e}")
        return False


def test_text_chunking():
    """Test 2: Verify text chunking works"""
    print("\n=== Test 2: Text Chunking ===")

    sample_text = """
    Product Overview

    Our SaaS platform is the leading solution for sales teams. We offer comprehensive
    features including CRM integration, analytics dashboards, and AI-powered insights.

    Pricing

    We have three pricing tiers:
    - Starter: $29/month for up to 5 users
    - Professional: $99/month for up to 20 users
    - Enterprise: Custom pricing for unlimited users

    Features

    Key features include real-time collaboration, advanced reporting, mobile apps for
    iOS and Android, and seamless integration with Salesforce, HubSpot, and other
    popular tools.
    """

    try:
        # Test token counting
        token_count = count_tokens(sample_text)
        print(f"✅ PASS: Token counting works ({token_count} tokens)")

        # Test chunking
        chunks = chunk_text_semantic(sample_text, chunk_size=150, overlap_tokens=20)
        print(f"✅ PASS: Text chunking works ({len(chunks)} chunks created)")

        for i, chunk in enumerate(chunks):
            print(f"   Chunk {i}: {chunk['token_count']} tokens, chars {chunk['start_char']}-{chunk['end_char']}")

        return True
    except Exception as e:
        print(f"❌ FAIL: Text chunking failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_document_processing():
    """Test 3: Verify document processing (TXT only for now)"""
    print("\n=== Test 3: Document Processing ===")

    # Create a temporary TXT file
    import tempfile
    import os

    sample_content = """
    Technical Specifications

    Our API supports RESTful endpoints with JSON payloads. Authentication uses OAuth 2.0
    with JWT tokens. Rate limiting is set at 1000 requests per hour for standard plans.

    Supported Integrations

    - Salesforce CRM
    - HubSpot Marketing
    - Slack for notifications
    - Zapier for automation
    """

    try:
        # Create temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(sample_content)
            temp_path = f.name

        # Process document
        processor = DocumentProcessor(chunk_size=100, overlap_tokens=15)
        result = processor.process_document(temp_path, 'txt')

        # Cleanup
        os.remove(temp_path)

        print(f"✅ PASS: Document processing works")
        print(f"   Extracted {len(result['text'])} characters")
        print(f"   Created {result['total_chunks']} chunks")
        print(f"   Total tokens: {result['total_tokens']}")

        return True
    except Exception as e:
        print(f"❌ FAIL: Document processing failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_vector_operations():
    """Test 4: Verify vector add, query, delete operations"""
    print("\n=== Test 4: Vector Operations ===")

    test_product_id = "test_product_12345"
    test_user_id = "test_user_12345"

    try:
        vector_service = VectorService()

        # Test 1: Add product sections
        print("\n[4.1] Testing add_product_sections...")
        sections = [
            ContentSection(
                name="Pricing",
                content="We offer three tiers: Starter at $29/month, Pro at $99/month, and Enterprise with custom pricing."
            ),
            ContentSection(
                name="Features",
                content="Key features include real-time analytics, CRM integration, mobile apps, and AI-powered insights."
            )
        ]

        result = await vector_service.add_product_sections(
            product_id=test_product_id,
            user_id=test_user_id,
            sections=sections
        )

        print(f"✅ PASS: Added {result['sections_processed']} sections ({result['total_chunks']} chunks)")

        # Test 2: Query product knowledge
        print("\n[4.2] Testing query_product_knowledge...")
        queries = [
            "What is the pricing?",
            "What features are available?",
            "Tell me about mobile apps"
        ]

        for query in queries:
            results = await vector_service.query_product_knowledge(
                product_id=test_product_id,
                query=query,
                top_k=2
            )
            print(f"   Query: '{query}'")
            print(f"   Found {len(results)} results")
            if results:
                print(f"   Top result similarity: {results[0]['similarity']:.3f}")
                print(f"   Source: {results[0]['source_name']}")

        print(f"✅ PASS: Query operations work")

        # Test 3: Delete vectors
        print("\n[4.3] Testing delete_product_vectors...")
        deleted_count = vector_service.delete_product_vectors(test_product_id)
        print(f"✅ PASS: Deleted {deleted_count} vectors")

        # Verify deletion
        results = await vector_service.query_product_knowledge(
            product_id=test_product_id,
            query="anything",
            top_k=5
        )

        if len(results) == 0:
            print(f"✅ PASS: Vectors successfully deleted (query returned 0 results)")
        else:
            print(f"⚠️  WARNING: Found {len(results)} results after deletion")

        return True

    except Exception as e:
        print(f"❌ FAIL: Vector operations failed: {e}")
        import traceback
        traceback.print_exc()

        # Cleanup on failure
        try:
            vector_service.delete_product_vectors(test_product_id)
        except:
            pass

        return False


async def run_all_tests():
    """Run all integration tests"""
    print("=" * 60)
    print("RAG Integration Tests")
    print("=" * 60)

    results = {
        "ChromaDB Connection": test_chromadb_connection(),
        "Text Chunking": test_text_chunking(),
        "Document Processing": test_document_processing(),
        "Vector Operations": await test_vector_operations()
    }

    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! RAG feature is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review errors above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(run_all_tests())
    sys.exit(exit_code)
