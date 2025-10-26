#!/usr/bin/env python3
"""
Test client til AgentScope backend API
"""

import requests
import json

def test_backend():
    base_url = "http://localhost:8001"
    
    print("🧪 Testing AgentScope Backend API...")
    
    # Test health endpoint
    try:
        print("\n📊 Testing health endpoint...")
        response = requests.get(f"{base_url}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test Jarvis generation endpoint
    try:
        print("\n🧠 Testing Jarvis generation...")
        data = {
            "prompt": "Hej Jarvis! Kan du hjælpe mig med at analysere mine leads?",
            "task_type": "chat", 
            "danish_context": True,
            "max_tokens": 1000
        }
        
        response = requests.post(
            f"{base_url}/jarvis/generate",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response: {result.get('response', 'No response field')[:200]}...")
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Jarvis generation failed: {e}")
        return False
    
    # Test business analysis head
    try:
        print("\n💼 Testing business analysis...")
        data = {
            "prompt": "Analyser dette lead: Navn: Lars Nielsen, Email: lars@teknisk-løsning.dk, Budget: 50.000 DKK",
            "task_type": "business_analysis",
            "danish_context": True,
            "max_tokens": 500
        }
        
        response = requests.post(
            f"{base_url}/jarvis/generate", 
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Business analysis: {result.get('response', 'No response')[:200]}...")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Business analysis failed: {e}")
    
    print("\n🎉 Backend API test completed!")
    return True

if __name__ == "__main__":
    test_backend()
