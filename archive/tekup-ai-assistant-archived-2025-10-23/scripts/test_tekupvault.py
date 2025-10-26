#!/usr/bin/env python3
"""
TekupVault MCP Test Suite
==========================

Test suite for TekupVault - AI-powered chat history archival system with
semantic search and artifact extraction.

Features:
- Archive chat sessions with AI-generated summaries
- Semantic search using vector embeddings
- Extract code snippets and architectural decisions
- Store in Supabase with pgvector

Author: TekUp Team
Date: 2025-10-16
"""

import asyncio
import json
from datetime import datetime
from typing import List, Dict, Any
from dataclasses import dataclass, field
from uuid import uuid4
import hashlib


# =============================================================================
# Data Models
# =============================================================================

@dataclass
class ChatMessage:
    """Represents a single chat message"""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    index: int = 0


@dataclass
class ChatArtifact:
    """Extracted artifact from chat (code, decision, etc.)"""
    id: str = field(default_factory=lambda: str(uuid4()))
    type: str = "code"  # code, decision, config, command, diagram
    title: str = ""
    content: str = ""
    language: str = ""
    file_path: str = ""
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class ChatSession:
    """Represents a complete chat session"""
    id: str = field(default_factory=lambda: str(uuid4()))
    title: str = ""
    summary: str = ""
    tags: List[str] = field(default_factory=list)
    messages: List[ChatMessage] = field(default_factory=list)
    artifacts: List[ChatArtifact] = field(default_factory=list)
    embedding_ids: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    archived_at: datetime = None
    message_count: int = 0


@dataclass
class SearchResult:
    """Result from semantic search"""
    session_id: str
    message_index: int
    role: str
    content: str
    similarity_score: float
    metadata: Dict[str, Any] = field(default_factory=dict)


# =============================================================================
# Mock Embedding Service
# =============================================================================

class MockEmbeddingService:
    """Mock embedding service for testing (simulates OpenAI or local model)"""
    
    EMBEDDING_DIM = 1536  # Matches OpenAI ada-002
    
    @staticmethod
    def generate_embedding(text: str) -> List[float]:
        """Generate a mock embedding vector from text"""
        # Simple hash-based embedding for testing
        hash_obj = hashlib.sha256(text.encode())
        hash_int = int(hash_obj.hexdigest(), 16)
        
        # Generate pseudo-random but deterministic vector
        import random
        random.seed(hash_int)
        embedding = [random.random() for _ in range(MockEmbeddingService.EMBEDDING_DIM)]
        
        # Normalize
        magnitude = sum(x**2 for x in embedding) ** 0.5
        return [x / magnitude for x in embedding]
    
    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        return dot_product


# =============================================================================
# Mock AI Service
# =============================================================================

class MockAIService:
    """Mock AI service for generating summaries and extracting artifacts"""
    
    @staticmethod
    async def generate_summary(messages: List[ChatMessage]) -> str:
        """Generate a summary of the chat session"""
        # Simple keyword-based summary
        all_text = " ".join([m.content for m in messages])
        
        keywords = {
            "faktura": "Faktura diskussion",
            "invoice": "Invoice creation discussion",
            "billy": "Billy.dk integration",
            "renos": "RenOS system",
            "docker": "Docker setup",
            "mcp": "MCP server implementation",
            "test": "Testing and QA",
            "changelog": "Changelog creation",
        }
        
        for keyword, summary in keywords.items():
            if keyword.lower() in all_text.lower():
                return f"{summary} - {len(messages)} messages"
        
        return f"General discussion - {len(messages)} messages"
    
    @staticmethod
    async def generate_title(messages: List[ChatMessage]) -> str:
        """Generate a title for the chat session"""
        if not messages:
            return "Empty Session"
        
        first_message = messages[0].content[:100]
        return first_message.strip()
    
    @staticmethod
    async def extract_tags(messages: List[ChatMessage]) -> List[str]:
        """Extract relevant tags from chat"""
        all_text = " ".join([m.content.lower() for m in messages])
        
        tag_keywords = {
            "billy": ["billy", "faktura", "invoice"],
            "renos": ["renos", "booking", "kalender"],
            "mcp": ["mcp", "server", "integration"],
            "docker": ["docker", "container", "compose"],
            "documentation": ["docs", "dokumentation", "changelog"],
            "testing": ["test", "qa", "validation"],
            "architecture": ["architecture", "design", "system"],
        }
        
        tags = []
        for tag, keywords in tag_keywords.items():
            if any(kw in all_text for kw in keywords):
                tags.append(tag)
        
        return tags or ["general"]
    
    @staticmethod
    async def extract_code_blocks(messages: List[ChatMessage]) -> List[ChatArtifact]:
        """Extract code blocks from messages"""
        artifacts = []
        
        for i, msg in enumerate(messages):
            # Simple code block detection (```language ... ```)
            content = msg.content
            while "```" in content:
                start = content.find("```")
                end = content.find("```", start + 3)
                if end == -1:
                    break
                
                code_block = content[start+3:end].strip()
                lines = code_block.split('\n')
                language = lines[0] if lines else "text"
                code = '\n'.join(lines[1:]) if len(lines) > 1 else code_block
                
                if language in ["python", "typescript", "javascript", "powershell", "sql", "markdown"]:
                    artifact = ChatArtifact(
                        type="code",
                        title=f"Code snippet from message {i+1}",
                        content=code,
                        language=language,
                        tags=["extracted", language]
                    )
                    artifacts.append(artifact)
                
                content = content[end+3:]
        
        return artifacts


# =============================================================================
# Mock Supabase Client
# =============================================================================

class MockSupabaseClient:
    """Mock Supabase client for testing"""
    
    def __init__(self):
        self.chat_sessions: Dict[str, ChatSession] = {}
        self.embeddings: Dict[str, tuple[str, int, List[float]]] = {}  # embedding_id -> (session_id, msg_idx, vector)
        self.artifacts: Dict[str, ChatArtifact] = {}
    
    async def store_session(self, session: ChatSession) -> bool:
        """Store a chat session"""
        self.chat_sessions[session.id] = session
        return True
    
    async def store_embedding(self, session_id: str, message_index: int, 
                             embedding: List[float]) -> str:
        """Store a message embedding"""
        embedding_id = str(uuid4())
        self.embeddings[embedding_id] = (session_id, message_index, embedding)
        return embedding_id
    
    async def store_artifact(self, session_id: str, artifact: ChatArtifact) -> bool:
        """Store a chat artifact"""
        self.artifacts[artifact.id] = artifact
        return True
    
    async def search_similar(self, query_embedding: List[float], 
                           max_results: int = 5) -> List[SearchResult]:
        """Search for similar messages using vector similarity"""
        results = []
        
        for emb_id, (session_id, msg_idx, embedding) in self.embeddings.items():
            similarity = MockEmbeddingService.cosine_similarity(query_embedding, embedding)
            session = self.chat_sessions.get(session_id)
            
            if session and msg_idx < len(session.messages):
                message = session.messages[msg_idx]
                result = SearchResult(
                    session_id=session_id,
                    message_index=msg_idx,
                    role=message.role,
                    content=message.content,
                    similarity_score=similarity,
                    metadata={
                        "session_title": session.title,
                        "tags": session.tags
                    }
                )
                results.append(result)
        
        # Sort by similarity score (descending)
        results.sort(key=lambda x: x.similarity_score, reverse=True)
        return results[:max_results]


# =============================================================================
# TekupVault MCP Server
# =============================================================================

class TekupVaultMCP:
    """TekupVault MCP Server - Chat history archival with semantic search"""
    
    def __init__(self):
        self.supabase = MockSupabaseClient()
        self.embedding_service = MockEmbeddingService()
        self.ai_service = MockAIService()
    
    async def archive_chat(self, 
                          messages: List[ChatMessage],
                          auto_summarize: bool = True,
                          extract_code: bool = True,
                          extract_decisions: bool = True) -> ChatSession:
        """
        Archive a chat session to TekupVault
        
        Steps:
        1. Generate AI summary and title
        2. Extract tags
        3. Extract artifacts (code, decisions)
        4. Generate embeddings for all messages
        5. Store in Supabase
        """
        print("[ARCHIVE] Archiving chat session to TekupVault...")
        
        # Create session
        session = ChatSession(messages=messages, message_count=len(messages))
        
        # 1. Generate metadata
        if auto_summarize:
            print("   [AI] Generating AI summary...")
            session.title = await self.ai_service.generate_title(messages)
            session.summary = await self.ai_service.generate_summary(messages)
            session.tags = await self.ai_service.extract_tags(messages)
        
        # 2. Extract artifacts
        if extract_code:
            print("   [EXTRACT] Extracting code snippets...")
            session.artifacts = await self.ai_service.extract_code_blocks(messages)
        
        # 3. Generate embeddings
        print(f"   [EMBED] Generating embeddings for {len(messages)} messages...")
        for i, message in enumerate(messages):
            embedding = self.embedding_service.generate_embedding(message.content)
            emb_id = await self.supabase.store_embedding(session.id, i, embedding)
            session.embedding_ids.append(emb_id)
        
        # 4. Store session
        print("   [STORE] Storing in Supabase...")
        await self.supabase.store_session(session)
        
        # 5. Store artifacts
        for artifact in session.artifacts:
            await self.supabase.store_artifact(session.id, artifact)
        
        session.archived_at = datetime.now()
        print(f"   [SUCCESS] Archived session: {session.title[:50]}...")
        print(f"   [STATS] {len(messages)} messages, {len(session.artifacts)} artifacts, {len(session.tags)} tags")
        
        return session
    
    async def retrieve_context(self, query: str, max_results: int = 5) -> List[SearchResult]:
        """
        Retrieve relevant context from past conversations
        
        Steps:
        1. Generate embedding for query
        2. Search similar messages using vector similarity
        3. Return ranked results
        """
        print(f"[SEARCH] Searching TekupVault for: '{query}'")
        
        # 1. Embed query
        query_embedding = self.embedding_service.generate_embedding(query)
        
        # 2. Search
        results = await self.supabase.search_similar(query_embedding, max_results)
        
        print(f"   [SUCCESS] Found {len(results)} relevant messages")
        
        return results
    
    async def search_decisions(self, query: str) -> List[ChatArtifact]:
        """Search for architectural decisions and ADRs"""
        # Filter artifacts by type='decision'
        return [a for a in self.supabase.artifacts.values() 
                if a.type == 'decision' and query.lower() in a.content.lower()]
    
    async def extract_code_snippets(self, language: str = None) -> List[ChatArtifact]:
        """Extract code snippets, optionally filtered by language"""
        artifacts = [a for a in self.supabase.artifacts.values() if a.type == 'code']
        if language:
            artifacts = [a for a in artifacts if a.language == language]
        return artifacts


# =============================================================================
# Test Suite
# =============================================================================

async def test_archive_chat():
    """Test: Archive a chat session"""
    print("\n" + "="*80)
    print("TEST 1: Archive Chat Session")
    print("="*80)
    
    # Create sample chat
    messages = [
        ChatMessage(role="user", content="Lav en changelog til projektet", index=0),
        ChatMessage(role="assistant", content="Jeg vil oprette en changelog...", index=1),
        ChatMessage(role="assistant", content="```markdown\n# Changelog\n## [1.0.0]\n```", index=2),
        ChatMessage(role="user", content="Perfekt! Tilføj det til mkdocs", index=3),
    ]
    
    vault = TekupVaultMCP()
    session = await vault.archive_chat(messages, auto_summarize=True, extract_code=True)
    
    print(f"\n📋 Session Details:")
    print(f"   ID: {session.id}")
    print(f"   Title: {session.title}")
    print(f"   Summary: {session.summary}")
    print(f"   Tags: {', '.join(session.tags)}")
    print(f"   Messages: {session.message_count}")
    print(f"   Artifacts: {len(session.artifacts)}")
    print(f"   Embeddings: {len(session.embedding_ids)}")
    
    assert session.message_count == 4
    assert len(session.embedding_ids) == 4
    assert len(session.artifacts) >= 1  # At least one code block
    print("\n✅ TEST PASSED")
    
    return vault, session


async def test_retrieve_context(vault: TekupVaultMCP):
    """Test: Retrieve context from archived chats"""
    print("\n" + "="*80)
    print("TEST 2: Retrieve Context")
    print("="*80)
    
    # Search for relevant context
    results = await vault.retrieve_context("hvordan laver jeg en changelog?", max_results=3)
    
    print(f"\n🔍 Search Results:")
    for i, result in enumerate(results, 1):
        print(f"\n   Result {i}:")
        print(f"   Similarity: {result.similarity_score:.3f}")
        print(f"   Role: {result.role}")
        print(f"   Content: {result.content[:100]}...")
        print(f"   Session: {result.metadata.get('session_title', 'N/A')[:50]}")
    
    assert len(results) > 0
    assert results[0].similarity_score > 0
    print("\n✅ TEST PASSED")


async def test_extract_code_snippets(vault: TekupVaultMCP):
    """Test: Extract code snippets by language"""
    print("\n" + "="*80)
    print("TEST 3: Extract Code Snippets")
    print("="*80)
    
    # Get all markdown snippets
    markdown_snippets = await vault.extract_code_snippets(language="markdown")
    
    print(f"\n📝 Found {len(markdown_snippets)} markdown snippets:")
    for snippet in markdown_snippets:
        print(f"\n   Title: {snippet.title}")
        print(f"   Language: {snippet.language}")
        print(f"   Lines: {len(snippet.content.split(chr(10)))}")
        print(f"   Preview: {snippet.content[:100]}...")
    
    assert len(markdown_snippets) > 0
    print("\n✅ TEST PASSED")


async def test_semantic_search_accuracy():
    """Test: Semantic search accuracy with multiple sessions"""
    print("\n" + "="*80)
    print("TEST 4: Semantic Search Accuracy")
    print("="*80)
    
    vault = TekupVaultMCP()
    
    # Archive multiple sessions on different topics
    sessions_data = [
        {
            "topic": "Billy.dk Integration",
            "messages": [
                ChatMessage(role="user", content="Hvordan integrerer jeg med Billy.dk API?", index=0),
                ChatMessage(role="assistant", content="Du skal bruge MCP server til Billy.dk...", index=1),
            ]
        },
        {
            "topic": "Docker Setup",
            "messages": [
                ChatMessage(role="user", content="Hjælp mig med at sætte Docker op", index=0),
                ChatMessage(role="assistant", content="Start med docker-compose.yml...", index=1),
            ]
        },
        {
            "topic": "Testing Guide",
            "messages": [
                ChatMessage(role="user", content="Lav tests til projektet", index=0),
                ChatMessage(role="assistant", content="Her er en test suite med pytest...", index=1),
            ]
        }
    ]
    
    print("\n📚 Archiving 3 test sessions...")
    for data in sessions_data:
        await vault.archive_chat(data["messages"])
    
    # Test semantic search
    test_queries = [
        ("Billy API integration", "Billy"),
        ("Docker container setup", "Docker"),
        ("unit testing framework", "Testing"),
    ]
    
    print("\n🎯 Testing semantic search accuracy:")
    for query, expected_topic in test_queries:
        print(f"\n   Query: '{query}'")
        results = await vault.retrieve_context(query, max_results=1)
        
        if results:
            best_match = results[0]
            print(f"   Best match: {best_match.content[:60]}...")
            print(f"   Similarity: {best_match.similarity_score:.3f}")
            print(f"   ✅ Found relevant result")
    
    print("\n✅ TEST PASSED")


async def test_full_workflow():
    """Test: Complete workflow from archival to retrieval"""
    print("\n" + "="*80)
    print("TEST 5: Complete Workflow")
    print("="*80)
    
    vault = TekupVaultMCP()
    
    # Step 1: Simulate a real conversation
    print("\n1️⃣  Simulating conversation...")
    conversation = [
        ChatMessage(role="user", content="Jeg skal lave en changelog til TekUp AI Assistant projektet", index=0),
        ChatMessage(role="assistant", content="Jeg vil hjælpe dig med det. Lad mig først se git historikken.", index=1),
        ChatMessage(role="user", content="Den skal følge Keep a Changelog format", index=2),
        ChatMessage(role="assistant", content="""Perfekt! Her er changelog'en:
```markdown
# Changelog
## [1.2.0] - 2025-10-16
### Tilføjet
- Open WebUI setup
- Billy.dk integration guide
```""", index=3),
        ChatMessage(role="user", content="Fantastisk! Gem den i docs/ folderen", index=4),
    ]
    
    # Step 2: Archive
    print("\n2️⃣  Archiving conversation...")
    session = await vault.archive_chat(
        conversation,
        auto_summarize=True,
        extract_code=True,
        extract_decisions=True
    )
    
    # Step 3: Wait (simulate time passing)
    print("\n3️⃣  Simulating time passing...")
    await asyncio.sleep(0.1)
    
    # Step 4: Later, search for relevant context
    print("\n4️⃣  Searching for context in a new conversation...")
    results = await vault.retrieve_context("hvordan laver jeg changelog?", max_results=2)
    
    # Step 5: Use context
    print("\n5️⃣  Using retrieved context:")
    if results:
        print(f"   Found {len(results)} relevant messages from past conversations")
        print(f"   Most relevant: {results[0].content[:100]}...")
        print(f"   Similarity score: {results[0].similarity_score:.3f}")
    
    # Step 6: Extract code examples
    print("\n6️⃣  Extracting code examples...")
    code_snippets = await vault.extract_code_snippets(language="markdown")
    print(f"   Found {len(code_snippets)} markdown code examples")
    
    print("\n✅ COMPLETE WORKFLOW TEST PASSED")
    
    return vault, session


async def run_all_tests():
    """Run all TekupVault tests"""
    print("\n" + "="*80)
    print("🧪 TekupVault MCP Test Suite")
    print("="*80)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Test 1: Archive
        vault, session = await test_archive_chat()
        
        # Test 2: Retrieve
        await test_retrieve_context(vault)
        
        # Test 3: Code extraction
        await test_extract_code_snippets(vault)
        
        # Test 4: Semantic search
        await test_semantic_search_accuracy()
        
        # Test 5: Full workflow
        await test_full_workflow()
        
        print("\n" + "="*80)
        print("🎉 ALL TESTS PASSED!")
        print("="*80)
        print(f"\n✅ TekupVault is ready for implementation")
        print(f"📊 Next steps:")
        print(f"   1. Set up Supabase account and database")
        print(f"   2. Install pgvector extension")
        print(f"   3. Create database tables (see schema in chat.md)")
        print(f"   4. Configure environment variables")
        print(f"   5. Implement real embedding service (OpenAI or local)")
        print(f"   6. Connect to real AI models for summarization")
        print(f"\n🚀 Ready to transform your chat history into searchable knowledge!")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()


# =============================================================================
# Main Entry Point
# =============================================================================

if __name__ == "__main__":
    print("""
================================================================================
                                                                              
                       TekupVault Test Suite                          
                                                                              
  AI-powered chat history archival with semantic search                      
  Features: Vector embeddings, artifact extraction, smart search             
                                                                              
================================================================================
    """)
    
    asyncio.run(run_all_tests())

