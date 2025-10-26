#!/usr/bin/env python3
"""
Test Gemini AI integration direkte - ingen server
"""

import asyncio
import os
import sys
from dotenv import load_dotenv
import google.generativeai as genai

def test_gemini_direct():
    """Test Gemini AI direkte"""
    print("🧪 Testing Gemini AI Direct Integration...")
    
    # Load environment variables
    load_dotenv()
    
    # Check API key
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        print("❌ GEMINI_API_KEY environment variable not found")
        return False
        
    print(f"✅ Gemini API Key found: {gemini_api_key[:20]}...")
    
    # Configure Gemini
    try:
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        print("✅ Gemini AI configured successfully")
    except Exception as e:
        print(f"❌ Gemini configuration failed: {e}")
        return False
    
    # Test basic chat
    try:
        print("\n🗣️  Testing basic chat...")
        response = model.generate_content("Hej Gemini! Kan du svare på dansk?")
        print(f"Response: {response.text}")
        print("✅ Basic chat test passed")
    except Exception as e:
        print(f"❌ Basic chat test failed: {e}")
        return False
    
    # Test Danish business context
    try:
        print("\n💼 Testing Danish business context...")
        business_prompt = """
        Du er en dansk AI-assistent til TekUp platformen. 
        Hjælp mig med at analysere følgende lead:
        
        Navn: Lars Nielsen
        Email: lars@teknisk-løsning.dk
        Interesseret i: CRM system
        Budget: 50.000 DKK
        
        Giv mig en kort analyse og anbefalinger på dansk.
        """
        
        response = model.generate_content(business_prompt)
        print(f"Business Analysis: {response.text}")
        print("✅ Danish business context test passed")
    except Exception as e:
        print(f"❌ Danish business context test failed: {e}")
        return False
    
    # Test async functionality
    async def test_async():
        try:
            print("\n⚡ Testing async functionality...")
            response = await asyncio.to_thread(
                model.generate_content, 
                "Kan du forklare asyncio i Python på dansk?"
            )
            print(f"Async Response: {response.text}")
            print("✅ Async functionality test passed")
            return True
        except Exception as e:
            print(f"❌ Async functionality test failed: {e}")
            return False
    
    # Run async test
    async_result = asyncio.run(test_async())
    
    if async_result:
        print("\n🎉 All Gemini AI tests passed! Integration is working correctly.")
        return True
    else:
        print("\n💥 Some tests failed.")
        return False

if __name__ == "__main__":
    success = test_gemini_direct()
    sys.exit(0 if success else 1)
