#!/usr/bin/env python3
"""
OpenRouter API Client for J.A.R.V.I.S
Integrates with OpenRouter API using DeepSeek R1 model
"""

import requests
import json
import logging
import time
from typing import Dict, List, Optional, Tuple

class OpenRouterClient:
    """OpenRouter API client for J.A.R.V.I.S chatbot functionality"""
    
    def __init__(self):
        self.api_key = "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"
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "deepseek/deepseek-r1-0528:free"
        self.site_url = "http://localhost:8080"
        self.site_name = "J.A.R.V.I.S AI Assistant"
        
        # Setup logging
        self.logger = logging.getLogger("OpenRouterClient")
        
        # Conversation history
        self.conversation_history = []
        self.max_history = 10  # Keep last 10 messages
        
        # Rate limiting
        self.last_request_time = 0
        self.min_request_interval = 1.0  # Minimum 1 second between requests
        
        self.logger.info("✅ OpenRouter client initialized")
    
    def get_ai_response(self, user_message: str, system_prompt: Optional[str] = None) -> Tuple[str, bool]:
        """
        Get AI response from OpenRouter API
        
        Args:
            user_message (str): User's message
            system_prompt (str, optional): System prompt to set AI behavior
            
        Returns:
            Tuple[str, bool]: (response_text, success)
        """
        try:
            self.logger.info(f"🤖 Getting AI response for: {user_message[:50]}...")
            
            # Rate limiting
            self._enforce_rate_limit()
            
            # Prepare messages
            messages = self._prepare_messages(user_message, system_prompt)
            
            # Make API request
            response = self._make_api_request(messages)
            
            if response:
                # Extract response text
                response_text = self._extract_response_text(response)
                
                # Update conversation history
                self._update_conversation_history(user_message, response_text)
                
                self.logger.info("✅ AI response generated successfully")
                return response_text, True
            else:
                self.logger.error("❌ Failed to get AI response")
                return self._get_fallback_response(user_message), False
                
        except Exception as e:
            self.logger.error(f"❌ OpenRouter API error: {e}")
            return self._get_fallback_response(user_message), False
    
    def _prepare_messages(self, user_message: str, system_prompt: Optional[str] = None) -> List[Dict]:
        """Prepare messages for API request"""
        messages = []
        
        # Add system prompt if provided
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        else:
            # Default J.A.R.V.I.S system prompt
            messages.append({
                "role": "system",
                "content": self._get_default_system_prompt()
            })
        
        # Add conversation history (last few messages)
        for msg in self.conversation_history[-6:]:  # Last 3 exchanges
            messages.append(msg)
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        return messages
    
    def _get_default_system_prompt(self) -> str:
        """Get default system prompt for J.A.R.V.I.S"""
        return """You are J.A.R.V.I.S (Just A Rather Very Intelligent System), an advanced AI assistant. 

Your characteristics:
- Professional, helpful, and intelligent
- Concise but informative responses
- Friendly and approachable tone
- Capable of handling various tasks including conversations, questions, and assistance
- You can help with image generation, information lookup, and general assistance

Guidelines:
- Keep responses clear and helpful
- Be conversational but professional
- If asked about capabilities, mention you can help with conversations, answer questions, and assist with various tasks
- For image generation requests, acknowledge them and explain the process
- Always be helpful and positive

Respond naturally as J.A.R.V.I.S would."""
    
    def _make_api_request(self, messages: List[Dict]) -> Optional[Dict]:
        """Make API request to OpenRouter"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": self.site_url,
                "X-Title": self.site_name,
            }
            
            data = {
                "model": self.model,
                "messages": messages,
                "max_tokens": 1000,
                "temperature": 0.7,
                "top_p": 0.9,
                "frequency_penalty": 0.1,
                "presence_penalty": 0.1
            }
            
            self.logger.debug(f"🌐 Making API request to OpenRouter...")
            
            response = requests.post(
                url=self.base_url,
                headers=headers,
                data=json.dumps(data),
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                self.logger.error(f"❌ API request failed: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.Timeout:
            self.logger.error("❌ API request timed out")
            return None
        except requests.exceptions.RequestException as e:
            self.logger.error(f"❌ API request error: {e}")
            return None
        except Exception as e:
            self.logger.error(f"❌ Unexpected error in API request: {e}")
            return None
    
    def _extract_response_text(self, response: Dict) -> str:
        """Extract response text from API response"""
        try:
            if "choices" in response and len(response["choices"]) > 0:
                choice = response["choices"][0]
                if "message" in choice and "content" in choice["message"]:
                    return choice["message"]["content"].strip()
            
            self.logger.error("❌ Invalid response format from API")
            return "I apologize, but I received an invalid response format. Please try again."
            
        except Exception as e:
            self.logger.error(f"❌ Error extracting response text: {e}")
            return "I encountered an error processing the response. Please try again."
    
    def _update_conversation_history(self, user_message: str, ai_response: str):
        """Update conversation history"""
        try:
            # Add user message
            self.conversation_history.append({
                "role": "user",
                "content": user_message
            })
            
            # Add AI response
            self.conversation_history.append({
                "role": "assistant",
                "content": ai_response
            })
            
            # Trim history if too long
            if len(self.conversation_history) > self.max_history * 2:
                self.conversation_history = self.conversation_history[-self.max_history * 2:]
                
        except Exception as e:
            self.logger.error(f"❌ Error updating conversation history: {e}")
    
    def _enforce_rate_limit(self):
        """Enforce rate limiting between requests"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last_request
            self.logger.debug(f"⏳ Rate limiting: sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def _get_fallback_response(self, user_message: str) -> str:
        """Get fallback response when API fails"""
        user_lower = user_message.lower().strip()
        
        fallback_responses = {
            'hello': "Hello! I'm J.A.R.V.I.S. I'm currently experiencing some connectivity issues, but I'm here to help!",
            'hi': "Hi there! I'm J.A.R.V.I.S, your AI assistant. How can I help you today?",
            'how are you': "I'm functioning well, thank you! Though I'm currently running in offline mode.",
            'what can you do': "I'm J.A.R.V.I.S, and I can help with conversations, answer questions, and assist with various tasks. What would you like to try?",
            'time': f"I can help with time-related queries, though I'm currently in offline mode.",
            'help': "I'm here to help! I'm J.A.R.V.I.S, your AI assistant. You can ask me questions or request assistance with various tasks.",
            'thank you': "You're welcome! Is there anything else I can help you with?",
            'thanks': "My pleasure! Let me know if you need anything else.",
        }
        
        # Check for keyword matches
        for keyword, response in fallback_responses.items():
            if keyword in user_lower:
                return response
        
        # Default fallback
        return f"I understand you said: '{user_message}'. I'm currently experiencing connectivity issues with my AI services, but I'm still here to help as best I can. Please try again in a moment, or feel free to ask me something else!"
    
    def clear_conversation_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        self.logger.info("🗑️ Conversation history cleared")
    
    def get_conversation_summary(self) -> str:
        """Get a summary of the current conversation"""
        if not self.conversation_history:
            return "No conversation history available."
        
        summary = f"Conversation history ({len(self.conversation_history)//2} exchanges):\n"
        for i, msg in enumerate(self.conversation_history[-6:]):  # Last 3 exchanges
            role = "You" if msg["role"] == "user" else "J.A.R.V.I.S"
            content = msg["content"][:100] + "..." if len(msg["content"]) > 100 else msg["content"]
            summary += f"{role}: {content}\n"
        
        return summary
    
    def test_connection(self) -> Tuple[bool, str]:
        """Test connection to OpenRouter API"""
        try:
            self.logger.info("🧪 Testing OpenRouter API connection...")
            
            test_messages = [{
                "role": "user",
                "content": "Hello, this is a connection test. Please respond with 'Connection successful'."
            }]
            
            response = self._make_api_request(test_messages)
            
            if response:
                response_text = self._extract_response_text(response)
                self.logger.info("✅ OpenRouter API connection test successful")
                return True, f"Connection successful! Response: {response_text}"
            else:
                self.logger.error("❌ OpenRouter API connection test failed")
                return False, "Connection test failed - no response received"
                
        except Exception as e:
            self.logger.error(f"❌ Connection test error: {e}")
            return False, f"Connection test error: {str(e)}"

# Global instance
openrouter_client = OpenRouterClient()

# Convenience functions for backward compatibility
def get_ai_response(message: str) -> str:
    """Get AI response (backward compatible)"""
    response, success = openrouter_client.get_ai_response(message)
    return response

def get_openrouter_response(message: str, system_prompt: str = None) -> Tuple[str, bool]:
    """Get OpenRouter response with success status"""
    return openrouter_client.get_ai_response(message, system_prompt)
