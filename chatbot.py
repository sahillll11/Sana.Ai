"""
Advanced chatbot module for S.A.N.A. AI Assistant
Integrates with OpenRouter API using DeepSeek model
"""
import eel
import requests
import json
import os
import base64
from datetime import datetime
from Engine.command import speak

# OpenRouter API Configuration
OPENROUTER_API_KEY = "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"
OPENROUTER_MODEL = "deepseek/deepseek-r1-0528:free"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Conversation history for context
conversation_history = []

# System prompt for S.A.N.A. personality
SANA_SYSTEM_PROMPT = """You are S.A.N.A. (Smart A.N.A. Assistant), a highly advanced AI assistant. You are helpful, intelligent, and professional. You assist users with various tasks and provide informative responses. Keep your responses concise but informative. You have a sophisticated but friendly personality."""

def get_ai_response(user_input):
    """Get AI response using OpenRouter API with DeepSeek model"""
    try:
        print(f"🤖 Processing AI request: {user_input}")

        # Check if this is an image generation request first
        image_response, is_image_request = process_image_generation_request(user_input)
        if is_image_request:
            return image_response

        # Add user input to history
        conversation_history.append({"role": "user", "content": user_input})

        # Prepare messages for API (include system prompt and recent history)
        messages = [{"role": "system", "content": SANA_SYSTEM_PROMPT}]

        # Add recent conversation history (last 10 messages to avoid token limits)
        recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
        messages.extend(recent_history)

        # Make API request to OpenRouter
        response = requests.post(
            url=OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",  # Your site URL
                "X-Title": "S.A.N.A. AI Assistant",  # Your site name
            },
            data=json.dumps({
                "model": OPENROUTER_MODEL,
                "messages": messages,
                "max_tokens": 500,  # Limit response length
                "temperature": 0.7,  # Control creativity
            }),
            timeout=30  # 30 second timeout
        )

        print(f"📡 API Response Status: {response.status_code}")

        if response.status_code == 200:
            response_data = response.json()
            ai_response = response_data['choices'][0]['message']['content'].strip()

            # Add AI response to history
            conversation_history.append({"role": "assistant", "content": ai_response})

            print(f"✅ AI Response: {ai_response}")
            return ai_response

        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            return get_fallback_response(user_input)

    except requests.exceptions.Timeout:
        print("⏰ API request timed out")
        return "I'm sorry, my response is taking longer than expected. Please try again."

    except requests.exceptions.ConnectionError:
        print("🌐 Connection error to AI service")
        return get_fallback_response(user_input)

    except Exception as e:
        print(f"❌ Chatbot error: {e}")
        return get_fallback_response(user_input)

def get_fallback_response(user_input):
    """Provide fallback responses when API is unavailable"""
    user_input = user_input.lower().strip()

    # Time and date queries (always work offline)
    if "time" in user_input:
        import datetime
        current_time = datetime.datetime.now().strftime("%I:%M %p")
        return f"The current time is {current_time}."
    elif "date" in user_input:
        import datetime
        current_date = datetime.datetime.now().strftime("%B %d, %Y")
        return f"Today's date is {current_date}."

    # Basic responses
    elif any(greeting in user_input for greeting in ["hello", "hi", "hey", "good morning", "good evening"]):
        return "Hello! How can I assist you today?"
    elif any(question in user_input for question in ["how are you", "how do you do"]):
        return "I'm doing well, thank you for asking! How can I help you?"
    elif any(thanks in user_input for thanks in ["thank you", "thanks", "appreciate"]):
        return "You're welcome! Is there anything else I can help you with?"
    elif "help" in user_input:
        return "I can help you with various tasks like sending messages, making calls, opening applications, and having conversations. What would you like me to do?"
    else:
        return "I'm currently having trouble connecting to my AI service, but I can still help with basic tasks like opening applications, sending messages, or making calls. What would you like me to do?"

def get_ai_response_with_display(user_input):
    """Get AI response and display it on web interface"""
    try:
        # Get the response
        response = get_ai_response(user_input)

        # Display the response on web interface
        eel.DisplaySanaResponse(response)

        # Speak the response
        speak(response)
        
        return response
        
    except Exception as e:
        print(f"Error in get_ai_response_with_display: {e}")
        error_response = "I encountered an error while processing your request."
        try:
            eel.DisplaySanaResponse(error_response)
        except:
            pass
        speak(error_response)
        return error_response

def clear_conversation():
    """Clear conversation history"""
    global conversation_history
    conversation_history = []
    print("🗑️ Conversation history cleared")
    return "Conversation history cleared. Starting fresh!"

def reset_sana_personality():
    """Reset S.A.N.A. personality and conversation"""
    global conversation_history
    conversation_history = []
    print("🔄 S.A.N.A. personality reset")
    return "S.A.N.A. personality reset. I'm ready to assist you with a fresh start!"

def get_conversation_history():
    """Get conversation history"""
    return conversation_history

def get_conversation_summary():
    """Get a summary of the conversation"""
    if not conversation_history:
        return "No conversation history available."

    total_messages = len(conversation_history)
    user_messages = len([msg for msg in conversation_history if msg.get('role') == 'user'])
    assistant_messages = len([msg for msg in conversation_history if msg.get('role') == 'assistant'])

    return f"Conversation summary: {total_messages} total messages ({user_messages} from you, {assistant_messages} from me)"

def test_api_connection():
    """Test the OpenRouter API connection"""
    try:
        print("🔍 Testing OpenRouter API connection...")

        response = requests.post(
            url=OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "S.A.N.A. AI Assistant",
            },
            data=json.dumps({
                "model": OPENROUTER_MODEL,
                  "messages": [
                      {"role": "system", "content": SANA_SYSTEM_PROMPT},
                      {"role": "user", "content": "Hello, this is a test message."}
                  ],
                  "max_tokens": 50,
            }),
            timeout=10
        )

        if response.status_code == 200:
            print("✅ OpenRouter API connection successful!")
            return True
        else:
            print(f"❌ API connection failed: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ API connection test failed: {e}")
        return False

# Text-to-Image Generation Functions
def generate_image_from_text(prompt, filename=None):
    """Generate image from text prompt using optimized fast API"""
    try:
        print(f"🎨 Generating image for: {prompt}")

        # Create images directory if it doesn't exist
        images_dir = "generated_images"
        if not os.path.exists(images_dir):
            os.makedirs(images_dir)

        # Try multiple fast APIs for better speed and reliability
        clean_prompt = prompt.replace(' ', '%20').replace(',', '%2C').replace('&', '%26')

        apis = [
            {
                "name": "Pollinations AI (Ultra Fast)",
                "url": f"https://image.pollinations.ai/prompt/{clean_prompt}?width=256&height=256&nologo=true&seed=42",
                "timeout": 3
            },
            {
                "name": "Pollinations AI (Fast)",
                "url": f"https://image.pollinations.ai/prompt/{clean_prompt}?width=400&height=400&nologo=true",
                "timeout": 5
            },
            {
                "name": "Pollinations AI (Standard)",
                "url": f"https://image.pollinations.ai/prompt/{clean_prompt}?width=512&height=512&nologo=true",
                "timeout": 8
            },
            {
                "name": "Pollinations AI (Enhanced)",
                "url": f"https://image.pollinations.ai/prompt/{clean_prompt}?width=512&height=512&nologo=true&enhance=true",
                "timeout": 12
            }
        ]

        # Try each API until one works
        for api in apis:
            try:
                print(f"🔗 Trying {api['name']}...")

                # Download the image with shorter timeout
                response = requests.get(api['url'], timeout=api['timeout'])

                if response.status_code == 200:
                    # Generate filename if not provided
                    if not filename:
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"sana_image_{timestamp}.png"

                    # Save the image
                    image_path = os.path.join(images_dir, filename)
                    with open(image_path, 'wb') as f:
                        f.write(response.content)

                    # Convert image to base64 for web display
                    image_base64 = base64.b64encode(response.content).decode('utf-8')

                    print(f"✅ Image generated successfully with {api['name']}")
                    return image_path, image_base64, True
                else:
                    print(f"❌ {api['name']} failed: {response.status_code}")
                    continue

            except requests.exceptions.Timeout:
                print(f"⏰ {api['name']} timed out, trying next...")
                continue
            except Exception as e:
                print(f"❌ {api['name']} error: {e}")
                continue

        # If all APIs failed
        print(f"❌ All image generation APIs failed")
        return None, None, False

    except Exception as e:
        print(f"❌ Image generation error: {e}")
        return None, None, False

def generate_image_with_stability_ai(prompt, filename=None):
    """Alternative image generation using Stability AI (requires API key)"""
    try:
        # This is a placeholder for Stability AI integration
        # You would need to sign up for Stability AI API key
        print("🎨 Stability AI integration not configured")
        return generate_image_from_text(prompt, filename)

    except Exception as e:
        print(f"❌ Stability AI error: {e}")
        return generate_image_from_text(prompt, filename)

def open_generated_image(image_path):
    """Open the generated image in default image viewer"""
    try:
        import subprocess
        import platform

        if platform.system() == "Windows":
            subprocess.run(f'start "" "{image_path}"', shell=True)
        elif platform.system() == "Darwin":  # macOS
            subprocess.run(["open", image_path])
        else:  # Linux
            subprocess.run(["xdg-open", image_path])

        print(f"📖 Opened image: {image_path}")
        return True

    except Exception as e:
        print(f"❌ Error opening image: {e}")
        return False

def process_image_generation_request(user_input):
    """Process text-to-image generation requests"""
    try:
        # Extract the prompt from user input
        user_input = user_input.lower().strip()

        # Common patterns for image generation requests
        image_keywords = [
            "generate image of", "create image of", "make image of", "draw image of",
            "generate picture of", "create picture of", "make picture of", "draw picture of",
            "generate image", "create image", "make image", "draw image",
            "generate picture", "create picture", "make picture", "draw picture",
            "text to image:", "text to image", "image of", "picture of",
            "generate a", "create a", "make a", "draw a",
            "generate an", "create an", "make an", "draw an"
        ]

        # Check if this is an image generation request
        is_image_request = any(keyword in user_input for keyword in image_keywords)

        if is_image_request:
            # Extract the prompt by finding the longest matching keyword and removing it
            prompt = user_input.lower().strip()

            # Find and remove the command phrase
            for keyword in sorted(image_keywords, key=len, reverse=True):  # Start with longest keywords
                if keyword in prompt:
                    prompt = prompt.replace(keyword, "", 1).strip()  # Replace only first occurrence
                    break

            # Clean up common connecting words and extra spaces
            prompt = prompt.lstrip(": ").strip()  # Remove leading colon and spaces
            prompt = prompt.replace("of a ", "").replace("of an ", "").replace("of ", "")

            # Remove leading articles if they exist
            if prompt.startswith("a "):
                prompt = prompt[2:]
            elif prompt.startswith("an "):
                prompt = prompt[3:]

            prompt = " ".join(prompt.split())  # Remove extra spaces
            prompt = prompt.strip()

            if prompt:
                print(f"🎨 Image generation request detected: '{prompt}'")
                # Show immediate feedback
                try:
                    eel.DisplaySanaResponse(f"🎨 Creating image for '{prompt}'... Please wait a moment.")
                except:
                    pass
                # Generate the image
                image_path, image_base64, success = generate_image_from_text(prompt)

                if success and image_path and image_base64:
                    # Display the image in web interface
                    try:
                        eel.displayGeneratedImage(image_base64, prompt)
                    except:
                        pass  # Fallback if eel function not available

                    response = f"I've generated an image for '{prompt}'. Here it is!"
                    return response, True
                else:
                    response = "I'm sorry, I couldn't generate the image. Please try again with a different prompt."
                    return response, False
            else:
                response = "Please provide a description of what image you'd like me to generate."
                return response, False

        return None, False  # Not an image generation request

    except Exception as e:
        print(f"❌ Image processing error: {e}")
        response = "I encountered an error while trying to generate the image."
        return response, False

