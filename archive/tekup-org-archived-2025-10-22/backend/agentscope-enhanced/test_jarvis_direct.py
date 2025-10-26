#!/usr/bin/env python3
"""
Test JarvisFoundationModelWrapper direkte uden AgentScope
"""

import asyncio
import os
from dotenv import load_dotenv
import google.generativeai as genai
import sys
sys.path.append('.')

# Import from main.py
from main import JarvisFoundationModelWrapper, JarvisModelConfig

async def test_jarvis_direct():
    """Test JarvisFoundationModelWrapper direkte"""
    print("🧪 Testing JarvisFoundationModelWrapper directly...")
    
    # Load environment variables
    load_dotenv()
    
    try:
        # Create config and wrapper
        config = JarvisModelConfig()
        jarvis_model = JarvisFoundationModelWrapper(config)
        
        print("✅ JarvisFoundationModelWrapper initialized successfully")
        
        # Test chat head
        print("\n🗣️  Testing chat head...")
        response = await jarvis_model.generate(
            prompt="Hej Jarvis! Kan du hjælpe mig med at analysere mine leads?",
            task_type="chat",
            danish_context=True
        )
        print(f"✅ Chat response: {response[:200]}...")
        
        # Test business analysis head
        print("\n💼 Testing business analysis head...")
        response = await jarvis_model.generate(
            prompt="Analyser dette lead: Navn: Lars Nielsen, Email: lars@teknisk-løsning.dk, Budget: 50.000 DKK",
            task_type="business_analysis", 
            danish_context=True
        )
        print(f"✅ Business analysis: {response[:200]}...")
        
        # Test reasoning head
        print("\n🧠 Testing reasoning head...")
        response = await jarvis_model.generate(
            prompt="Hvordan kan jeg optimere min lead konvertering?",
            task_type="reasoning",
            danish_context=True
        )
        print(f"✅ Reasoning: {response[:200]}...")
        
        print("\n🎉 All JarvisFoundationModelWrapper tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_jarvis_direct())
    sys.exit(0 if success else 1)
