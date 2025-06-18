import pyttsx3
import speech_recognition as sr
import eel

def speak(text):
    """Enhanced text-to-speech function with better voice settings"""
    try:
        engine = pyttsx3.init('sapi5')
        voices = engine.getProperty('voices')

        # Use the first available voice (usually Microsoft David)
        if voices:
            engine.setProperty('voice', voices[0].id)
            print(f"🔊 Speaking: {text}")
            print(f"Using voice: {voices[0].name}")

        # Set speech rate and volume
        engine.setProperty('rate', 174)  # Speed of speech
        engine.setProperty('volume', 1.0)  # Volume level (0.0 to 1.0)

        print(f"Voice settings - Rate: 174, Volume: 1.0")

        engine.say(text)
        engine.runAndWait()
        print("✅ Speech completed")

    except Exception as e:
        print(f"Speech error: {e}")

def takecommand():
    """Enhanced voice recognition function"""
    r = sr.Recognizer()

    with sr.Microphone() as source:
        print("Listening...")
        eel.DisplayMessage('Listening....')
        r.pause_threshold = 1
        r.energy_threshold = 300
        audio = r.listen(source, timeout=6, phrase_time_limit=5)

    try:
        print("Recognizing...")
        eel.DisplayMessage('Recognizing....')
        query = r.recognize_google(audio, language="en-in")
        print(f"user said:{query}")

        # Display what user said
        eel.DisplayUserInput(query)

        return query.lower()

    except Exception as e:
        print("error during recognition :",e)
        eel.DisplayMessage("Sorry, I didn't catch that. Please try again.")
        return ""

@eel.expose
def allCommands():
    query = takecommand()
    print(f"🎤 Voice command received: '{query}'")

    if not query:
        response = "I didn't catch that. Could you please repeat?"
        speak(response)
        eel.DisplaySanaResponse(response)
        return

    query = query.lower()
    print(f"🔄 Processing voice command: '{query}'")
    try:
          # Stop continuous listening
        if any(keyword in query for keyword in ["stop listening", "stop sana", "exit", "close", "stop"]):
            response = "Stopping continuous mode. Click the microphone to start again."
            speak(response)
            eel.DisplaySanaResponse(response)
            eel.stopContinuousMode()
            return
  
        # WhatsApp/Communication commands - Enhanced
        elif any(keyword in query for keyword in ["send message", "message", "text", "whatsapp", "phone call", "call", "video call"]):
            from Engine.features import findContact, whatsApp, list_similar_contacts

            # Extract contact name from query
            contact_query = extract_contact_from_query(query)
            print(f"🎤 Voice command: '{query}'")
            print(f"🔍 Extracted contact: '{contact_query}'")

            contact_no, name = findContact(contact_query)

            if contact_no != 0:
                # Determine action type
                if any(keyword in query for keyword in ["send message", "message", "text", "whatsapp"]):
                    action = 'message'
                    # Extract message from query if provided
                    message_text = extract_message_from_query(query)

                    if message_text:
                        # Message was provided in the same command
                        response = f"Sending message '{message_text}' to {name}"
                        speak(response)
                        eel.DisplaySanaResponse(response)
                        whatsApp(contact_no, message_text, action, name)
                    else:
                        # Ask for message
                        response = f"What message would you like to send to {name}?"
                        speak(response)
                        eel.DisplaySanaResponse(response)
                        message_text = takecommand()
                        if message_text and message_text.lower() not in ['none', 'cancel', 'stop']:
                            whatsApp(contact_no, message_text, action, name)
                        else:
                            speak("Message cancelled")
                            eel.DisplaySanaResponse("Message cancelled")
  
                elif any(keyword in query for keyword in ["phone call", "call"]) and "video" not in query:
                    action = 'call'
                    response = f"Calling {name}"
                    speak(response)
                    eel.DisplaySanaResponse(response)
                    whatsApp(contact_no, "", action, name)

                else:  # video call
                    action = 'video call'
                    response = f"Starting video call with {name}"
                    speak(response)
                    eel.DisplaySanaResponse(response)
                    whatsApp(contact_no, "", action, name)
            else:
                # Contact not found - suggest similar contacts
                similar_contacts = list_similar_contacts(contact_query)
                if similar_contacts:
                    response = f"I couldn't find '{contact_query}' exactly, but found similar contacts. Please try again with the exact name."
                else:
                    response = f"Sorry, I couldn't find '{contact_query}' in your contacts. Please check the name and try again."
                speak(response)
                eel.DisplaySanaResponse(response)
  
        # Open applications
        elif "open" in query:
            handle_open_commands(query)

        # Image generation commands
        elif any(keyword in query for keyword in ["generate image", "create image", "make image", "draw image", "generate picture", "create picture", "text to image"]):
            from Engine.chatbot import process_image_generation_request
            response, success = process_image_generation_request(query)
            if success:
                eel.DisplaySanaResponse(response)
            else:
                eel.DisplaySanaResponse(response)
  
        # Clear conversation history
        elif any(keyword in query for keyword in ["clear chat", "clear conversation", "reset chat"]):
            try:
                from Engine.chatbot import clear_conversation
                clear_conversation()
                response = "Conversation history cleared."
                speak(response)
                eel.DisplaySanaResponse(response)
            except ImportError:
                response = "Chatbot module not available. Feature disabled."
                speak(response)
                eel.DisplaySanaResponse(response)
  
        # Reset personality
        elif any(keyword in query for keyword in ["reset personality", "reset sana", "forget tony stark"]):
            try:
                from Engine.chatbot import reset_sana_personality
                response = reset_sana_personality()
                speak(response)
                eel.DisplaySanaResponse(response)
            except ImportError:
                response = "Chatbot module not available. Feature disabled."
                speak(response)
                eel.DisplaySanaResponse(response)

        # For everything else, use OpenRouter AI
        else:
            print(f"🤖 No specific command matched, using AI for: '{query}'")
            try:
                # Try OpenRouter first
                try:
                    from Engine.openrouter_client import get_ai_response
                    print(f"🤖 Sending to OpenRouter AI: '{query}'")
                    ai_response = get_ai_response(query)
                    print(f"✅ OpenRouter response received: '{ai_response[:100]}...'")
                    speak(ai_response)
                    eel.DisplaySanaResponse(ai_response)
                    print(f"✅ Response displayed and spoken successfully")
                except ImportError as e:
                    # Fallback to original chatbot
                    print(f"⚠️ OpenRouter import failed: {e}")
                    print("🔄 Using fallback chatbot...")
                    try:
                        from Engine.chatbot import get_ai_response_with_display
                        print("🤖 Using get_ai_response_with_display")
                        get_ai_response_with_display(query)
                    except ImportError as e2:
                        print(f"⚠️ get_ai_response_with_display failed: {e2}")
                        print("🔄 Using basic get_ai_response...")
                        from Engine.chatbot import get_ai_response
                        ai_response = get_ai_response(query)
                        print(f"✅ Fallback response: '{ai_response[:100]}...'")
                        speak(ai_response)
                        eel.DisplaySanaResponse(ai_response)
            except Exception as e:
                print(f"❌ AI response error: {e}")
                response = f"I heard you say '{query}', but I'm having trouble processing it right now. Please try again."
                speak(response)
                eel.DisplaySanaResponse(response)

    except Exception as e:
        print(f"Command processing error: {e}")
        response = "I encountered an error processing your request. Please try again."
        speak(response)
        eel.DisplaySanaResponse(response)
  
def extract_contact_from_query(query):
    """Extract contact name from voice query"""
    query = query.lower().strip()

    # Remove common command words
    patterns = [
        r'send message to (.+)',
        r'message (.+)',
        r'text (.+)',
        r'whatsapp (.+)',
        r'call (.+)',
        r'phone call (.+)',
        r'video call (.+)',
        r'make a call to (.+)',
        r'send a message to (.+)'
    ]

    for pattern in patterns:
        import re
        match = re.search(pattern, query)
        if match:
            contact = match.group(1).strip()
            # Remove trailing words like "saying" or message content
            if ' saying ' in contact:
                contact = contact.split(' saying ')[0].strip()
            if ' that ' in contact:
                contact = contact.split(' that ')[0].strip()
            return contact

    # Fallback: remove common words and return remaining
    words_to_remove = ['send', 'message', 'to', 'call', 'phone', 'video', 'whatsapp', 'make', 'a', 'sana', 'please']
    words = query.split()
    filtered_words = [word for word in words if word not in words_to_remove]
    return ' '.join(filtered_words[:2])  # Take first 2 words as contact name
def extract_message_from_query(query):
    """Extract message content from voice query"""
    query = query.lower().strip()

    # Look for message content after keywords
    patterns = [
        r'send message to .+ saying (.+)',
        r'message .+ saying (.+)',
        r'text .+ saying (.+)',
        r'whatsapp .+ saying (.+)',
        r'send message to .+ that (.+)',
        r'message .+ that (.+)'
    ]

    for pattern in patterns:
        import re
        match = re.search(pattern, query)
        if match:
            return match.group(1).strip()

    return None

def handle_open_commands(query):
    """Handle application opening commands"""
    try:
        import subprocess

        if "notepad" in query:
            subprocess.run("notepad.exe")
            response = "Opening Notepad"
            speak(response)
            eel.DisplaySanaResponse(response)
        elif "calculator" in query:
            subprocess.run("calc.exe")
            response = "Opening Calculator"
            speak(response)
            eel.DisplaySanaResponse(response)
        elif "browser" in query or "chrome" in query:
            subprocess.run("start chrome", shell=True)
            response = "Opening Chrome browser"
            speak(response)
            eel.DisplaySanaResponse(response)
        elif "file manager" in query or "explorer" in query:
            subprocess.run("explorer.exe")
            response = "Opening File Explorer"
            speak(response)
            eel.DisplaySanaResponse(response)
        else:
            response = "I'm not sure which application you want to open."
            speak(response)
            eel.DisplaySanaResponse(response)
    except Exception as e:
        print(f"Error opening application: {e}")
        response = "Sorry, I couldn't open that application."
        speak(response)
        eel.DisplaySanaResponse(response)
  
@eel.expose
def startContinuousMode():
    """Start continuous listening mode"""
    try:
        print("Starting continuous mode...")
        return True
    except Exception as e:
        print(f"Error starting continuous mode: {e}")
        return False

@eel.expose
def stopContinuousMode():
    """Stop continuous listening mode"""
    try:
        print("Stopping continuous mode...")
        return True
    except Exception as e:
        print(f"Error stopping continuous mode: {e}")
        return False

@eel.expose
def processTextInput(text_input):
    """Process text input from the web interface"""
    try:
        if not text_input or not text_input.strip():
            return "Please enter a message."

        print(f"Text input received: {text_input}")

        # Process the text input similar to voice commands
        query = text_input.lower().strip()

        # WhatsApp/Communication commands
        if any(keyword in query for keyword in ["send message", "phone call", "video call"]):
            from Engine.features import findContact, whatsApp
            message = ""
            contact_no, name = findContact(query)
            if contact_no != 0:
                if "send message" in query:
                    message = 'message'
                    speak("What message would you like to send?")
                    return "What message would you like to send?"
                elif "phone call" in query:
                    message = 'call'
                else:
                    message = 'video call'

                whatsApp(contact_no, query, message, name)
                return f"Initiating {message} with {name}"
            else:
                response = "Contact not found. Please try again."
                speak(response)
                return response

        # Open applications
        elif "open" in query:
            handle_open_commands(query)
            return "Opening application..."

        # Image generation commands
        elif any(keyword in query for keyword in ["generate image", "create image", "make image", "draw image", "generate picture", "create picture", "text to image"]):
            from Engine.chatbot import process_image_generation_request
            response, success = process_image_generation_request(query)
            return response

        # Clear conversation history
        elif any(keyword in query for keyword in ["clear chat", "clear conversation", "reset chat"]):
            try:
                from Engine.chatbot import clear_conversation
                clear_conversation()
                response = "Conversation history cleared."
                speak(response)
                return response
            except ImportError:
                response = "Chatbot module not available. Feature disabled."
                speak(response)
                return response
  
        # Reset personality
        elif any(keyword in query for keyword in ["reset personality", "reset sana", "forget tony stark"]):
            try:
                from Engine.chatbot import reset_sana_personality
                response = reset_sana_personality()
                speak(response)
                return response
            except ImportError:
                response = "Chatbot module not available. Feature disabled."
                speak(response)
                return response

        # For everything else, use OpenRouter AI
        else:
            print(f"🤖 No specific text command matched, using AI for: '{text_input}'")
            try:
                # Try OpenRouter first
                try:
                    from Engine.openrouter_client import get_ai_response
                    print(f"🤖 Sending text to OpenRouter AI: '{text_input}'")
                    ai_response = get_ai_response(text_input)
                    print(f"✅ OpenRouter text response received: '{ai_response[:100]}...'")
                    return ai_response
                except ImportError as e:
                    # Fallback to original chatbot
                    print(f"⚠️ OpenRouter import failed for text: {e}")
                    print("🔄 Using fallback chatbot for text...")
                    from Engine.chatbot import get_ai_response
                    ai_response = get_ai_response(text_input)
                    print(f"✅ Fallback text response: '{ai_response[:100]}...'")
                    return ai_response
            except Exception as e:
                print(f"❌ Text AI response error: {e}")
                response = f"I understand you said '{text_input}', but I'm having trouble processing it right now."
                speak(response)
                return response

    except Exception as e:
        print(f"Text input processing error: {e}")
        error_response = "I encountered an error processing your message. Please try again."
        speak(error_response)
        return error_response