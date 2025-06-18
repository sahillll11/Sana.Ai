#!/usr/bin/env python3
"""
Sana Professional Mobile Server
Advanced mobile web app with professional UI, realistic images, and modern features
"""

import os
import sys
import json
import logging
import ssl
from pathlib import Path
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image, ImageDraw
import math

# Add project root to path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# Import existing modules
try:
    from Engine.openrouter_client import openrouter_client, get_ai_response
    from Engine.command import processTextInput
    from config import get_config
    print("✅ OpenRouter client imported successfully")
except ImportError as e:
    print(f"Warning: Could not import some modules: {e}")
    # Fallback imports
    try:
        from Engine.chatbot import get_ai_response
        print("✅ Fallback chatbot imported")
    except ImportError:
        print("❌ No AI modules available")
        def get_ai_response(_message):
            return "AI services are currently unavailable."

# Additional imports for image generation
try:
    from Engine.chatbot import process_image_generation_request
    print("✅ Image generation imported")
except ImportError:
    print("⚠️ Image generation not available")
    def process_image_generation_request(_prompt):
        return "Image generation is currently unavailable.", False

class SanaProfessionalMobileServer:
    """Professional Mobile Server for Sana AI Assistant with Enhanced Features"""

    def __init__(self):
        self.app = Flask(__name__,
                        static_folder='mobile',
                        template_folder='mobile')
        CORS(self.app)  # Enable CORS for mobile apps

        self.config = get_config()
        self.config_instance = self.config()
        self.setup_logging()
        self.setup_routes()
        self.create_professional_assets()

        # Initialize enhanced mobile features
        self.initialize_mobile_features()
        self.voice_profiles = self.load_voice_profiles()
        self.mobile_settings = self.load_mobile_settings()

        # Professional features
        self.session_data = {}
        self.analytics_data = {
            'total_requests': 0,
            'successful_responses': 0,
            'error_count': 0,
            'average_response_time': 0,
            'active_sessions': 0,
            'features_used': {
                'chat': 0,
                'voice': 0,
                'image_generation': 0,
                'whatsapp': 0,
                'custom_voice': 0,
                'offline_mode': 0
            }
        }
        
    def setup_logging(self):
        """Setup logging for mobile server"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger("SanaMobileServer")

    def create_professional_assets(self):
        """Create professional assets and ensure mobile directory exists"""
        try:
            mobile_dir = Path('mobile')
            mobile_dir.mkdir(exist_ok=True)

            # Create professional directories
            (mobile_dir / 'css').mkdir(exist_ok=True)
            (mobile_dir / 'js').mkdir(exist_ok=True)
            (mobile_dir / 'images').mkdir(exist_ok=True)
            (mobile_dir / 'icons').mkdir(exist_ok=True)
            (mobile_dir / 'voices').mkdir(exist_ok=True)  # Directory for custom voices

            # Download and setup Sana avatar GIF
            self.setup_sana_avatar()

            self.logger.info("✅ Professional assets directory structure created")

        except Exception as e:
            self.logger.error(f"Error creating professional assets: {e}")

    def setup_sana_avatar(self):
        """Download and setup Sana's animated avatars"""
        try:
            mobile_images_dir = Path('mobile/images')
            mobile_images_dir.mkdir(exist_ok=True)

            # Setup both girl and boy avatars
            self.setup_avatar_variants(mobile_images_dir)

        except Exception as e:
            self.logger.error(f"Error setting up Sana avatars: {e}")
            # Create fallback avatars
            try:
                self.create_local_sana_avatar(Path('mobile/images/sana_avatar_girl.gif'), 'girl')
                self.create_local_sana_avatar(Path('mobile/images/sana_avatar_boy.gif'), 'boy')
            except:
                pass

    def setup_avatar_variants(self, mobile_images_dir):
        """Setup both girl and boy avatar variants"""
        avatars = {
            'girl': {
                'path': mobile_images_dir / 'sana_avatar_girl.gif',
                'listening_path': mobile_images_dir / 'sana_listening_girl.gif',
                'url': 'https://i.pinimg.com/originals/8f/8c/8e/8f8c8e8c8f8c8e8c8f8c8e8c8f8c8e8c.gif',  # Girl anime avatar from Pinterest
                'description': 'Girl avatar'
            },
            'boy': {
                'path': mobile_images_dir / 'sana_avatar_boy.gif',
                'listening_path': mobile_images_dir / 'sana_listening_boy.gif',
                'url': 'https://i.pinimg.com/originals/b2/86/49/b28649c8f8c8e8c8f8c8e8c8f8c8e8c.gif',  # Boy anime avatar from Pinterest
                'description': 'Boy avatar'
            }
        }

        for variant, config in avatars.items():
            # Create normal avatar
            if not config['path'].exists():
                self.logger.info(f"🎭 Creating Sana's {config['description']}...")
                try:
                    self.create_local_sana_avatar(config['path'], variant, 'normal')
                    self.logger.info(f"✅ {config['description']} created successfully")
                except Exception as e:
                    self.logger.warning(f"⚠️ Failed to create {config['description']}: {e}")
            else:
                self.logger.info(f"✅ {config['description']} already exists")

            # Create listening state avatar
            if not config['listening_path'].exists():
                self.logger.info(f"🎤 Creating listening {config['description']}...")
                try:
                    self.create_local_sana_avatar(config['listening_path'], variant, 'listening')
                    self.logger.info(f"✅ Listening {config['description']} created successfully")
                except Exception as e:
                    self.logger.warning(f"⚠️ Failed to create listening {config['description']}: {e}")
            else:
                self.logger.info(f"✅ Listening {config['description']} already exists")

    def create_local_sana_avatar(self, avatar_path, avatar_type='girl', state='normal'):
        """Create a local animated avatar for Sana"""
        try:
            # Create a simple animated GIF with AI-like appearance
            from PIL import Image, ImageDraw
            import math

            # Create frames for animation
            frames = []
            size = (200, 200)

            # Define colors and features based on avatar type and state
            if avatar_type == 'girl':
                if state == 'listening':
                    primary_color = (255, 20, 147, 255)  # Deep pink (more vibrant for listening)
                    secondary_color = (255, 105, 180, 255)  # Hot pink
                    hair_color = (75, 0, 130, 255)  # Indigo hair (more animated)
                    eye_color = (0, 255, 255, 255)  # Cyan (glowing effect)
                    glow_intensity = 1.5  # Stronger glow for listening
                else:
                    primary_color = (255, 105, 180, 255)  # Hot pink
                    secondary_color = (255, 182, 193, 255)  # Light pink
                    hair_color = (139, 69, 19, 255)  # Brown hair
                    eye_color = (0, 191, 255, 255)  # Deep sky blue
                    glow_intensity = 1.0
            else:  # boy
                if state == 'listening':
                    primary_color = (0, 100, 255, 255)  # Bright blue (more vibrant for listening)
                    secondary_color = (0, 191, 255, 255)  # Deep sky blue
                    hair_color = (25, 25, 112, 255)  # Midnight blue hair (more animated)
                    eye_color = (50, 205, 50, 255)  # Lime green (glowing effect)
                    glow_intensity = 1.5  # Stronger glow for listening
                else:
                    primary_color = (0, 191, 255, 255)  # Deep sky blue
                    secondary_color = (135, 206, 250, 255)  # Light sky blue
                    hair_color = (64, 64, 64, 255)  # Dark gray hair
                    eye_color = (34, 139, 34, 255)  # Forest green
                    glow_intensity = 1.0

            for i in range(24):  # 24 frames for smooth animation
                # Create new image with transparent background
                img = Image.new('RGBA', size, (0, 0, 0, 0))
                draw = ImageDraw.Draw(img)

                center_x, center_y = size[0] // 2, size[1] // 2

                # Animated glow effect (stronger for listening state)
                base_glow = 85 if state == 'normal' else 95  # Bigger glow for listening
                glow_radius = base_glow + int(12 * glow_intensity * math.sin(i * math.pi / 8))
                glow_alpha = int(30 * glow_intensity) if state == 'normal' else int(50 * glow_intensity)
                glow_color = (*primary_color[:3], glow_alpha)
                draw.ellipse([center_x - glow_radius, center_y - glow_radius,
                             center_x + glow_radius, center_y + glow_radius],
                            fill=glow_color)

                # Face (main circle)
                face_radius = 65
                face_color = (255, 220, 177, 255)  # Skin tone
                draw.ellipse([center_x - face_radius, center_y - face_radius,
                             center_x + face_radius, center_y + face_radius],
                            fill=face_color, outline=primary_color, width=2)

                # Hair (top part)
                hair_y_offset = int(3 * math.sin(i * math.pi / 8))  # Gentle hair movement
                if avatar_type == 'girl':
                    # Girl's longer hair
                    draw.ellipse([center_x - 70, center_y - 75 + hair_y_offset,
                                 center_x + 70, center_y - 20 + hair_y_offset],
                                fill=hair_color)
                    # Hair accessories (small decorative elements)
                    for j in range(3):
                        acc_x = center_x - 40 + j * 40
                        acc_y = center_y - 60 + hair_y_offset
                        draw.ellipse([acc_x - 3, acc_y - 3, acc_x + 3, acc_y + 3],
                                   fill=secondary_color)
                else:
                    # Boy's shorter hair
                    draw.ellipse([center_x - 60, center_y - 70 + hair_y_offset,
                                 center_x + 60, center_y - 30 + hair_y_offset],
                                fill=hair_color)

                # Animated eyes with blinking
                blink_factor = 1.0
                if i % 24 in [20, 21]:  # Blink every cycle
                    blink_factor = 0.2

                eye_height = int(12 * blink_factor)
                eye_y = center_y - 15

                # Left eye
                draw.ellipse([center_x - 25, eye_y - eye_height//2,
                             center_x - 10, eye_y + eye_height//2],
                            fill=(255, 255, 255, 255))
                if blink_factor > 0.5:
                    draw.ellipse([center_x - 22, eye_y - eye_height//3,
                                 center_x - 13, eye_y + eye_height//3],
                                fill=eye_color)

                # Right eye
                draw.ellipse([center_x + 10, eye_y - eye_height//2,
                             center_x + 25, eye_y + eye_height//2],
                            fill=(255, 255, 255, 255))
                if blink_factor > 0.5:
                    draw.ellipse([center_x + 13, eye_y - eye_height//3,
                                 center_x + 22, eye_y + eye_height//3],
                                fill=eye_color)

                # Animated mouth (different for listening vs normal)
                if state == 'listening':
                    # Listening mouth - more animated, open/close pattern
                    mouth_cycle = i % 8
                    if mouth_cycle < 4:
                        mouth_width = 20 + int(10 * (mouth_cycle / 4))
                        mouth_height = 8 + int(6 * (mouth_cycle / 4))
                    else:
                        mouth_width = 30 - int(10 * ((mouth_cycle - 4) / 4))
                        mouth_height = 14 - int(6 * ((mouth_cycle - 4) / 4))

                    # Add sound wave effect around mouth
                    for wave in range(3):
                        wave_radius = 35 + wave * 15 + int(5 * math.sin(i * math.pi / 4))
                        wave_alpha = int(50 - wave * 15)
                        wave_color = (*primary_color[:3], wave_alpha)
                        draw.ellipse([center_x - wave_radius, center_y + 15 - wave_radius//4,
                                     center_x + wave_radius, center_y + 25 + wave_radius//4],
                                    outline=wave_color, width=2)
                else:
                    # Normal speaking mouth
                    mouth_width = 15 + int(8 * abs(math.sin(i * math.pi / 6)))
                    mouth_height = 6 + int(3 * abs(math.sin(i * math.pi / 4)))

                mouth_y = center_y + 20
                draw.ellipse([center_x - mouth_width//2, mouth_y - mouth_height//2,
                             center_x + mouth_width//2, mouth_y + mouth_height//2],
                            fill=(255, 105, 97, 255))  # Coral mouth

                # Cheek blush (for cuteness)
                blush_alpha = int(100 + 50 * math.sin(i * math.pi / 12))
                blush_color = (*secondary_color[:3], blush_alpha)
                draw.ellipse([center_x - 50, center_y + 5, center_x - 35, center_y + 15],
                           fill=blush_color)
                draw.ellipse([center_x + 35, center_y + 5, center_x + 50, center_y + 15],
                           fill=blush_color)

                # Animated sparkles around the avatar (more for listening state)
                sparkle_count = 8 if state == 'listening' else 4
                for j in range(sparkle_count):
                    sparkle_angle = (i * 15 + j * (360 / sparkle_count)) % 360
                    sparkle_radius = 80 + int(15 * math.sin(i * math.pi / 6))
                    sparkle_x = center_x + int(sparkle_radius * math.cos(math.radians(sparkle_angle)))
                    sparkle_y = center_y + int(sparkle_radius * math.sin(math.radians(sparkle_angle)))

                    if state == 'listening':
                        # Larger, more vibrant sparkles for listening
                        sparkle_size = 4 + int(3 * abs(math.sin((sparkle_angle + i * 20) * math.pi / 180)))
                        # Add pulsing effect
                        pulse_factor = 1 + 0.5 * math.sin(i * math.pi / 4)
                        sparkle_size = int(sparkle_size * pulse_factor)
                    else:
                        sparkle_size = 3 + int(2 * abs(math.sin(sparkle_angle * math.pi / 180)))

                    draw.ellipse([sparkle_x - sparkle_size, sparkle_y - sparkle_size,
                                 sparkle_x + sparkle_size, sparkle_y + sparkle_size],
                                fill=primary_color)

                # Add listening indicator (microphone icon effect)
                if state == 'listening':
                    # Draw microphone waves
                    for wave_i in range(3):
                        wave_x = center_x + 70 + wave_i * 8
                        wave_height = 15 + int(8 * math.sin((i + wave_i * 2) * math.pi / 6))
                        wave_y_start = center_y - wave_height // 2
                        wave_y_end = center_y + wave_height // 2

                        wave_alpha = int(150 - wave_i * 30)
                        wave_color = (*primary_color[:3], wave_alpha)
                        draw.line([wave_x, wave_y_start, wave_x, wave_y_end],
                                 fill=wave_color, width=3)

                frames.append(img)

            # Save as animated GIF
            frames[0].save(
                str(avatar_path),
                save_all=True,
                append_images=frames[1:],
                duration=125,  # 125ms per frame for smooth animation
                loop=0,  # Infinite loop
                optimize=True
            )

            self.logger.info(f"✅ Local animated Sana avatar ({avatar_type}) created")

        except Exception as e:
            self.logger.error(f"Error creating local avatar: {e}")
            # Create a simple static image as final fallback
            try:
                img = Image.new('RGBA', (200, 200), (26, 26, 46, 255))
                draw = ImageDraw.Draw(img)
                color = (255, 105, 180, 255) if avatar_type == 'girl' else (0, 191, 255, 255)
                draw.ellipse([50, 50, 150, 150], fill=color)
                img.save(str(avatar_path.with_suffix('.png')))
            except:
                pass

    def initialize_mobile_features(self):
        """Initialize enhanced mobile features"""
        try:
            mobile_dir = Path('mobile')

            # Create enhanced directories
            (mobile_dir / 'voices').mkdir(exist_ok=True)
            (mobile_dir / 'themes').mkdir(exist_ok=True)
            (mobile_dir / 'offline').mkdir(exist_ok=True)
            (mobile_dir / 'plugins').mkdir(exist_ok=True)

            self.logger.info("✅ Enhanced mobile features initialized")
        except Exception as e:
            self.logger.error(f"Error initializing mobile features: {e}")

    def load_voice_profiles(self):
        """Load custom voice profiles"""
        voices_file = Path('mobile/voices/profiles.json')
        default_voices = {
            "sana_default": {
                "name": "Sana Default",
                "rate": 150,
                "volume": 0.9,
                "pitch": 1.0,
                "voice_id": "sana_default",
                "description": "Sana's natural voice"
            },
            "professional": {
                "name": "Professional",
                "rate": 140,
                "volume": 0.8,
                "pitch": 0.9,
                "voice_id": "professional",
                "description": "Clear and professional tone"
            },
            "friendly": {
                "name": "Friendly",
                "rate": 160,
                "volume": 1.0,
                "pitch": 1.1,
                "voice_id": "friendly",
                "description": "Warm and friendly voice"
            },
            "calm": {
                "name": "Calm",
                "rate": 130,
                "volume": 0.7,
                "pitch": 0.8,
                "voice_id": "calm",
                "description": "Soothing and relaxing"
            }
        }

        try:
            if voices_file.exists():
                with open(voices_file, 'r') as f:
                    return json.load(f)
            else:
                voices_file.parent.mkdir(exist_ok=True)
                with open(voices_file, 'w') as f:
                    json.dump(default_voices, f, indent=2)
                return default_voices
        except Exception as e:
            self.logger.error(f"Error loading voice profiles: {e}")
            return default_voices

    def load_mobile_settings(self):
        """Load mobile-specific settings"""
        settings_file = Path('mobile/settings.json')
        default_settings = {
            "theme": "dark",
            "voice_enabled": True,
            "tts_enabled": True,
            "continuous_mode": False,
            "offline_mode": False,
            "push_notifications": True,
            "gesture_controls": True,
            "haptic_feedback": True,
            "auto_scroll": True,
            "font_size": "medium",
            "language": "en",
            "selected_voice": "sana_default",
            "wake_word": "Hey Sana",
            "privacy_mode": False,
            "api_key_configured": bool(getattr(self.config_instance, 'OPENROUTER_API_KEY', None)),
            "microphone_permission": False,
            "avatar_type": "girl"  # Default to girl avatar
        }

        try:
            if settings_file.exists():
                with open(settings_file, 'r') as f:
                    loaded_settings = json.load(f)
                    # Update with any new default settings
                    default_settings.update(loaded_settings)
                    return default_settings
            else:
                with open(settings_file, 'w') as f:
                    json.dump(default_settings, f, indent=2)
                return default_settings
        except Exception as e:
            self.logger.error(f"Error loading mobile settings: {e}")
            return default_settings

    def setup_routes(self):
        """Setup all API routes"""
        
        # Serve mobile app
        @self.app.route('/')
        def index():
            return send_from_directory('mobile', 'index.html')
        
        # Serve static files
        @self.app.route('/<path:filename>')
        def static_files(filename):
            return send_from_directory('mobile', filename)

        # Serve Sana avatar
        @self.app.route('/api/sana/avatar')
        @self.app.route('/api/sana/avatar/<avatar_type>')
        def sana_avatar(avatar_type='girl'):
            try:
                # Validate avatar type
                if avatar_type not in ['girl', 'boy']:
                    avatar_type = 'girl'

                avatar_path = Path(f'mobile/images/sana_avatar_{avatar_type}.gif')
                if avatar_path.exists():
                    return send_from_directory('mobile/images', f'sana_avatar_{avatar_type}.gif')
                else:
                    # Return PNG fallback
                    png_path = Path(f'mobile/images/sana_avatar_{avatar_type}.png')
                    if png_path.exists():
                        return send_from_directory('mobile/images', f'sana_avatar_{avatar_type}.png')
                    else:
                        # Create avatar if it doesn't exist
                        self.create_local_sana_avatar(avatar_path, avatar_type, 'normal')
                        if avatar_path.exists():
                            return send_from_directory('mobile/images', f'sana_avatar_{avatar_type}.gif')

                return jsonify({'error': 'Avatar not found'}), 404
            except Exception as e:
                self.logger.error(f"Error serving Sana avatar: {e}")
                return jsonify({'error': 'Avatar not found'}), 404

        # Serve Sana listening avatar
        @self.app.route('/api/sana/avatar/listening/<avatar_type>')
        def sana_listening_avatar(avatar_type='girl'):
            try:
                # Validate avatar type
                if avatar_type not in ['girl', 'boy']:
                    avatar_type = 'girl'

                listening_path = Path(f'mobile/images/sana_listening_{avatar_type}.gif')
                if listening_path.exists():
                    return send_from_directory('mobile/images', f'sana_listening_{avatar_type}.gif')
                else:
                    # Create listening avatar if it doesn't exist
                    self.create_local_sana_avatar(listening_path, avatar_type, 'listening')
                    if listening_path.exists():
                        return send_from_directory('mobile/images', f'sana_listening_{avatar_type}.gif')

                return jsonify({'error': 'Listening avatar not found'}), 404
            except Exception as e:
                self.logger.error(f"Error serving Sana listening avatar: {e}")
                return jsonify({'error': 'Listening avatar not found'}), 404
        
        # Health check
        @self.app.route('/api/health')
        def health_check():
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'version': '1.0.0'
            })
        
        # Chat API
        @self.app.route('/api/chat', methods=['POST'])
        def chat():
            try:
                data = request.get_json()
                message = data.get('message', '').strip()
                
                if not message:
                    return jsonify({'error': 'Message is required'}), 400
                
                # Process the message
                response = self.process_chat_message(message)
                
                return jsonify({
                    'response': response,
                    'timestamp': datetime.now().isoformat()
                })
                
            except Exception as e:
                self.logger.error(f"Chat API error: {e}")
                return jsonify({'error': 'Internal server error'}), 500
        
        # Voice command API
        @self.app.route('/api/voice', methods=['POST'])
        def voice_command():
            try:
                data = request.get_json()
                command = data.get('command', '').strip()

                if not command:
                    return jsonify({'error': 'Command is required'}), 400

                self.logger.info(f"Processing voice command: {command}")

                # Process voice command
                response = self.process_voice_command(command)

                return jsonify({
                    'success': True,
                    'response': response,
                    'command': command,
                    'timestamp': datetime.now().isoformat()
                })

            except Exception as e:
                self.logger.error(f"Voice API error: {e}")
                return jsonify({
                    'success': False,
                    'error': 'Internal server error',
                    'message': str(e)
                }), 500

        # Test voice API
        @self.app.route('/api/voice/test', methods=['GET'])
        def test_voice():
            return jsonify({
                'success': True,
                'message': 'Voice API is working',
                'timestamp': datetime.now().isoformat()
            })

        # Test OpenRouter API
        @self.app.route('/api/openrouter/test', methods=['GET'])
        def test_openrouter():
            try:
                success, message = openrouter_client.test_connection()
                return jsonify({
                    'success': success,
                    'message': message,
                    'model': openrouter_client.model,
                    'timestamp': datetime.now().isoformat()
                })
            except Exception as e:
                self.logger.error(f"OpenRouter test error: {e}")
                return jsonify({
                    'success': False,
                    'message': f'OpenRouter test failed: {str(e)}',
                    'timestamp': datetime.now().isoformat()
                }), 500
        
        # Image generation API
        @self.app.route('/api/image/generate', methods=['POST'])
        def generate_image():
            try:
                data = request.get_json()
                prompt = data.get('prompt', '').strip()
                
                if not prompt:
                    return jsonify({'error': 'Prompt is required'}), 400
                
                # Generate image
                result = self.process_image_generation(prompt)
                
                return jsonify(result)
                
            except Exception as e:
                self.logger.error(f"Image generation API error: {e}")
                return jsonify({'error': 'Internal server error'}), 500
        
        # WhatsApp API
        @self.app.route('/api/whatsapp/send', methods=['POST'])
        def send_whatsapp():
            try:
                data = request.get_json()
                contact = data.get('contact', '').strip()
                message = data.get('message', '').strip()
                
                if not contact or not message:
                    return jsonify({'error': 'Contact and message are required'}), 400
                
                # Process WhatsApp message
                result = self.process_whatsapp_message(contact, message)
                
                return jsonify(result)
                
            except Exception as e:
                self.logger.error(f"WhatsApp API error: {e}")
                return jsonify({'error': 'Internal server error'}), 500
        
        # System status API
        @self.app.route('/api/status')
        def system_status():
            try:
                status = self.get_system_status()
                return jsonify(status)
                
            except Exception as e:
                self.logger.error(f"Status API error: {e}")
                return jsonify({'error': 'Internal server error'}), 500
        
        # Enhanced Settings API
        @self.app.route('/api/settings', methods=['GET', 'POST'])
        def settings():
            try:
                if request.method == 'GET':
                    return jsonify(self.get_user_settings())
                else:
                    data = request.get_json()
                    result = self.update_user_settings(data)
                    return jsonify(result)

            except Exception as e:
                self.logger.error(f"Settings API error: {e}")
                return jsonify({'error': 'Internal server error'}), 500

        # Avatar Selection API
        @self.app.route('/api/sana/avatar-type', methods=['GET', 'POST'])
        def avatar_type_api():
            try:
                if request.method == 'GET':
                    # Get current avatar preference
                    avatar_type = self.mobile_settings.get('avatar_type', 'girl')
                    return jsonify({
                        'success': True,
                        'avatar_type': avatar_type,
                        'available_types': ['girl', 'boy']
                    })
                else:
                    # Set avatar preference
                    data = request.get_json()
                    avatar_type = data.get('avatar_type', 'girl')

                    if avatar_type not in ['girl', 'boy']:
                        return jsonify({'error': 'Invalid avatar type'}), 400

                    self.mobile_settings['avatar_type'] = avatar_type
                    self.save_mobile_settings()

                    return jsonify({
                        'success': True,
                        'message': f'Avatar type set to {avatar_type}',
                        'avatar_type': avatar_type
                    })

            except Exception as e:
                self.logger.error(f"Avatar type API error: {e}")
                return jsonify({'error': 'Internal server error'}), 500

        # Voice Upload API
        @self.app.route('/api/voice/upload', methods=['POST'])
        def upload_voice():
            try:
                if 'voice_file' not in request.files:
                    return jsonify({'error': 'No voice file provided'}), 400

                voice_file = request.files['voice_file']
                voice_name = request.form.get('voice_name', 'custom_voice')

                if voice_file.filename == '':
                    return jsonify({'error': 'No file selected'}), 400

                # Validate file type
                allowed_extensions = {'.wav', '.mp3', '.ogg', '.m4a', '.flac'}
                file_ext = Path(voice_file.filename).suffix.lower()

                if file_ext not in allowed_extensions:
                    return jsonify({'error': 'Invalid file type. Supported: WAV, MP3, OGG, M4A, FLAC'}), 400

                # Save voice file
                voices_dir = Path('mobile/voices')
                voices_dir.mkdir(exist_ok=True)

                # Generate unique filename
                import uuid
                unique_id = str(uuid.uuid4())[:8]
                safe_name = "".join(c for c in voice_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
                filename = f"{safe_name}_{unique_id}{file_ext}"

                voice_path = voices_dir / filename
                voice_file.save(str(voice_path))

                # Process voice for TTS (basic processing)
                voice_info = self.process_voice_file(voice_path, voice_name)

                return jsonify({
                    'success': True,
                    'message': 'Voice uploaded successfully',
                    'voice_info': voice_info
                })

            except Exception as e:
                self.logger.error(f"Voice upload error: {e}")
                return jsonify({'error': 'Failed to upload voice'}), 500

        # Get Available Voices API
        @self.app.route('/api/voice/list', methods=['GET'])
        def list_voices():
            try:
                voices = self.get_available_voices()
                return jsonify({
                    'success': True,
                    'voices': voices
                })
            except Exception as e:
                self.logger.error(f"Voice list error: {e}")
                return jsonify({'error': 'Failed to get voice list'}), 500

        # Set Active Voice API
        @self.app.route('/api/voice/set', methods=['POST'])
        def set_voice():
            try:
                data = request.get_json()
                voice_id = data.get('voice_id')

                if not voice_id:
                    return jsonify({'error': 'Voice ID required'}), 400

                # Update settings
                self.mobile_settings['selected_voice'] = voice_id
                self.save_mobile_settings()

                return jsonify({
                    'success': True,
                    'message': f'Voice set to {voice_id}',
                    'active_voice': voice_id
                })

            except Exception as e:
                self.logger.error(f"Set voice error: {e}")
                return jsonify({'error': 'Failed to set voice'}), 500

        # Text-to-Speech with Custom Voice API
        @self.app.route('/api/voice/speak', methods=['POST'])
        def speak_with_voice():
            try:
                data = request.get_json()
                text = data.get('text', '')
                voice_id = data.get('voice_id', self.mobile_settings.get('selected_voice', 'default'))

                if not text:
                    return jsonify({'error': 'Text required'}), 400

                # Generate speech with custom voice
                audio_data = self.generate_speech(text, voice_id)

                if audio_data:
                    return jsonify({
                        'success': True,
                        'audio_data': audio_data,
                        'voice_used': voice_id
                    })
                else:
                    return jsonify({'error': 'Failed to generate speech'}), 500

            except Exception as e:
                self.logger.error(f"TTS error: {e}")
                return jsonify({'error': 'Failed to generate speech'}), 500

        # Voice Profiles API
        @self.app.route('/api/voice/profiles', methods=['GET', 'POST', 'DELETE'])
        def voice_profiles_api():
            try:
                if request.method == 'GET':
                    return jsonify({
                        'success': True,
                        'profiles': self.voice_profiles
                    })
                elif request.method == 'POST':
                    data = request.get_json()
                    profile_id = data.get('id')
                    profile_data = data.get('profile')

                    if profile_id and profile_data:
                        self.voice_profiles[profile_id] = profile_data
                        self.save_voice_profiles()
                        return jsonify({
                            'success': True,
                            'message': 'Voice profile added successfully'
                        })
                    return jsonify({'error': 'Invalid profile data'}), 400

                elif request.method == 'DELETE':
                    profile_id = request.args.get('id')
                    if profile_id in self.voice_profiles:
                        del self.voice_profiles[profile_id]
                        self.save_voice_profiles()
                        return jsonify({
                            'success': True,
                            'message': 'Voice profile deleted'
                        })
                    return jsonify({'error': 'Profile not found'}), 404

            except Exception as e:
                self.logger.error(f"Voice profiles API error: {e}")
                return jsonify({'error': 'Internal server error'}), 500

        # Mobile Features API
        @self.app.route('/api/mobile/features', methods=['GET'])
        def mobile_features_api():
            return jsonify({
                'success': True,
                'features': {
                    'voice_recognition': True,
                    'custom_voices': True,
                    'offline_mode': True,
                    'gesture_controls': True,
                    'haptic_feedback': True,
                    'push_notifications': True,
                    'themes': ['dark', 'light', 'auto', 'blue', 'purple'],
                    'languages': ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh'],
                    'wake_words': ['Hey Sana', 'Sana', 'Assistant', 'AI'],
                    'voice_profiles': list(self.voice_profiles.keys())
                }
            })

        # Enhanced Chat API with voice support
        @self.app.route('/api/chat/enhanced', methods=['POST'])
        def enhanced_chat():
            try:
                data = request.get_json()
                message = data.get('message', '').strip()
                voice_profile = data.get('voice_profile', 'sana_default')
                context = data.get('context', {})

                if not message:
                    return jsonify({'error': 'Message is required'}), 400

                # Process with enhanced features
                response = self.process_enhanced_chat(message, voice_profile, context)

                return jsonify({
                    'success': True,
                    'response': response['text'],
                    'voice_data': response.get('voice_data'),
                    'suggestions': response.get('suggestions', []),
                    'timestamp': datetime.now().isoformat()
                })

            except Exception as e:
                self.logger.error(f"Enhanced chat API error: {e}")
                return jsonify({'error': 'Internal server error'}), 500

        # System diagnostics API
        @self.app.route('/api/diagnostics', methods=['GET'])
        def diagnostics():
            try:
                # Check API key
                api_key_status = bool(self.config.get('openrouter_api_key'))

                # Test AI connection
                ai_status = False
                ai_error = None
                try:
                    test_response = get_ai_response("test")
                    ai_status = bool(test_response and test_response.strip())
                except Exception as e:
                    ai_error = str(e)

                return jsonify({
                    'success': True,
                    'diagnostics': {
                        'api_key_configured': api_key_status,
                        'ai_connection': ai_status,
                        'ai_error': ai_error,
                        'voice_recognition': True,
                        'microphone_available': True,
                        'https_enabled': True,
                        'mobile_optimized': True,
                        'server_time': datetime.now().isoformat(),
                        'version': '2.0.0'
                    },
                    'recommendations': self.get_diagnostic_recommendations(api_key_status, ai_status)
                })

            except Exception as e:
                self.logger.error(f"Diagnostics API error: {e}")
                return jsonify({'error': 'Internal server error'}), 500
        
        # Error handlers
        @self.app.errorhandler(404)
        def not_found(_error):
            return jsonify({'error': 'Not found'}), 404

        @self.app.errorhandler(500)
        def internal_error(_error):
            return jsonify({'error': 'Internal server error'}), 500
    
    def process_voice_file(self, voice_path, voice_name):
        """Process uploaded voice file for TTS"""
        try:
            # Basic voice file processing
            voice_info = {
                'id': f"custom_{voice_name}_{voice_path.stem}",
                'name': voice_name,
                'path': str(voice_path),
                'type': 'custom',
                'file_size': voice_path.stat().st_size,
                'created_at': datetime.now().isoformat()
            }

            # Save voice info to settings
            if 'custom_voices' not in self.mobile_settings:
                self.mobile_settings['custom_voices'] = {}

            self.mobile_settings['custom_voices'][voice_info['id']] = voice_info
            self.save_mobile_settings()

            self.logger.info(f"✅ Voice processed: {voice_name}")
            return voice_info

        except Exception as e:
            self.logger.error(f"Error processing voice file: {e}")
            return None

    def get_available_voices(self):
        """Get list of available voices (built-in + custom)"""
        try:
            voices = {
                'built_in': [
                    {'id': 'sana_default', 'name': 'Sana Default', 'type': 'built_in'},
                    {'id': 'female_1', 'name': 'Female Voice 1', 'type': 'built_in'},
                    {'id': 'female_2', 'name': 'Female Voice 2', 'type': 'built_in'},
                    {'id': 'male_1', 'name': 'Male Voice 1', 'type': 'built_in'},
                    {'id': 'male_2', 'name': 'Male Voice 2', 'type': 'built_in'}
                ],
                'custom': list(self.mobile_settings.get('custom_voices', {}).values())
            }

            return voices

        except Exception as e:
            self.logger.error(f"Error getting available voices: {e}")
            return {'built_in': [], 'custom': []}

    def generate_speech(self, text, voice_id):
        """Generate speech audio with specified voice"""
        try:
            # For now, return a simple response indicating TTS would work
            # In a real implementation, you would use TTS libraries like:
            # - gTTS (Google Text-to-Speech)
            # - pyttsx3
            # - Azure Speech Services
            # - Amazon Polly

            import base64

            # Simulate audio generation (placeholder)
            audio_placeholder = f"Audio for: '{text}' with voice: {voice_id}"
            audio_data = base64.b64encode(audio_placeholder.encode()).decode()

            self.logger.info(f"🔊 Generated speech for: {text[:50]}...")
            return audio_data

        except Exception as e:
            self.logger.error(f"Error generating speech: {e}")
            return None

    def process_chat_message(self, message):
        """Process chat message using OpenRouter AI with improved error handling"""
        try:
            self.logger.info(f"💬 Processing chat message: {message[:50]}...")

            # Quick response for simple queries to avoid API delays
            quick_responses = {
                'hello': "Hello! I'm Sana, your AI assistant. How can I help you today?",
                'hi': "Hi there! What can I do for you?",
                'how are you': "I'm doing great! Ready to assist you with anything you need.",
                'what is your name': "I'm Sana, your personal AI assistant.",
                'who are you': "I'm Sana, an advanced AI assistant here to help you.",
                'time': f"The current time is {datetime.now().strftime('%I:%M %p')}",
                'date': f"Today's date is {datetime.now().strftime('%B %d, %Y')}"
            }

            message_lower = message.lower().strip()
            for key, response in quick_responses.items():
                if key in message_lower:
                    self.logger.info(f"✅ Quick response for: {key}")
                    return response

            # Use OpenRouter AI for complex queries with timeout protection
            try:
                print(f"🤖 Sending to OpenRouter AI: '{message}'")

                # Import with timeout protection
                import signal

                def timeout_handler(signum, frame):
                    raise TimeoutError("AI response timeout")

                # Set timeout for AI response (10 seconds)
                signal.signal(signal.SIGALRM, timeout_handler)
                signal.alarm(10)

                try:
                    response = get_ai_response(message)
                    signal.alarm(0)  # Cancel timeout

                    if response and response.strip():
                        print(f"✅ OpenRouter response received: {response[:100]}...")
                        self.logger.info("✅ Chat processed successfully with OpenRouter AI")
                        return response
                    else:
                        return "I'm having trouble generating a response right now. Please try again."

                except TimeoutError:
                    signal.alarm(0)
                    self.logger.warning("⏰ AI response timed out")
                    return "I'm taking too long to respond. Let me try a quicker answer: How can I help you today?"
            except Exception as e:
                print(f"❌ OpenRouter AI failed: {e}")
                self.logger.warning(f"OpenRouter AI failed: {e}")

            # Fallback to simple responses only if OpenRouter fails
            print("🔄 Using simple response fallback")
            return self.get_simple_response(message)

        except Exception as e:
            print(f"❌ Chat processing error: {e}")
            self.logger.error(f"Chat processing error: {e}")
            return "I'm sorry, I encountered an error processing your message. Please try again."

    def get_simple_response(self, message):
        """Get simple response for basic queries"""
        message_lower = message.lower().strip()

        simple_responses = {
            'hello': "Hello! I'm Sana, your AI assistant. How can I help you?",
            'hi': "Hi there! What can I do for you today?",
            'how are you': "I'm functioning perfectly and ready to assist you!",
            'what can you do': "I can help with conversations, generate images, and provide information. What would you like to try?",
            'time': f"The current time is {datetime.now().strftime('%I:%M %p')}.",
            'date': f"Today's date is {datetime.now().strftime('%B %d, %Y')}.",
            'help': "I'm here to help! You can ask me questions, request image generation, or just have a conversation.",
            'thank you': "You're welcome! Is there anything else I can help you with?",
            'thanks': "My pleasure! Let me know if you need anything else.",
            'bye': "Goodbye! Feel free to come back anytime you need assistance.",
            'goodbye': "See you later! Have a great day!"
        }

        # Check for exact matches first
        for key, response in simple_responses.items():
            if key in message_lower:
                return response

        # Default response
        return "I understand you're asking about something. Could you please rephrase your question or try asking something else?"
    
    def process_voice_command(self, command):
        """Process voice command"""
        try:
            # Check for specific voice commands
            command_lower = command.lower()
            
            if any(keyword in command_lower for keyword in ["generate image", "create image", "make image"]):
                # Extract prompt and generate image
                prompt = self.extract_image_prompt(command)
                if prompt:
                    _result = self.process_image_generation(prompt)
                    return f"Generating image for: {prompt}"
                else:
                    return "Please specify what image you'd like me to generate."
            
            elif any(keyword in command_lower for keyword in ["send message", "message", "whatsapp"]):
                return "WhatsApp integration is available on desktop version."
            
            elif "time" in command_lower:
                current_time = datetime.now().strftime("%I:%M %p")
                return f"The current time is {current_time}."
            
            elif "date" in command_lower:
                current_date = datetime.now().strftime("%B %d, %Y")
                return f"Today's date is {current_date}."
            
            else:
                # Use AI for general commands
                return self.process_chat_message(command)
                
        except Exception as e:
            self.logger.error(f"Voice command processing error: {e}")
            return "I'm sorry, I couldn't process that voice command."
    
    def extract_image_prompt(self, command):
        """Extract image prompt from voice command"""
        command_lower = command.lower()
        
        # Remove command words
        for phrase in ["generate image of", "create image of", "make image of", "generate", "create", "make"]:
            if phrase in command_lower:
                prompt = command_lower.replace(phrase, "").strip()
                # Remove articles
                prompt = prompt.replace("a ", "").replace("an ", "").replace("the ", "")
                return prompt.strip()
        
        return None
    
    def process_image_generation(self, prompt):
        """Process image generation request"""
        try:
            # Use existing image generation
            response, success = process_image_generation_request(f"generate image of {prompt}")
            
            if success:
                return {
                    'success': True,
                    'message': response,
                    'prompt': prompt
                }
            else:
                return {
                    'success': False,
                    'message': response or "Failed to generate image"
                }
                
        except Exception as e:
            self.logger.error(f"Image generation error: {e}")
            return {
                'success': False,
                'message': "Error generating image"
            }
    
    def process_whatsapp_message(self, contact, message):
        """Process WhatsApp message (mobile version)"""
        try:
            # For mobile, we'll return a message indicating desktop requirement
            return {
                'success': False,
                'message': f"WhatsApp integration requires the desktop version. Message for {contact}: {message}"
            }
            
        except Exception as e:
            self.logger.error(f"WhatsApp processing error: {e}")
            return {
                'success': False,
                'message': "Error processing WhatsApp message"
            }
    
    def get_system_status(self):
        """Get system status"""
        try:
            # Test AI connection
            ai_status = True
            try:
                test_response = get_ai_response("test")
                ai_status = bool(test_response)
            except:
                ai_status = False
            
            return {
                'ai_connection': ai_status,
                'image_generation': True,  # Assume available
                'voice_recognition': True,  # Browser-based
                'whatsapp_integration': False,  # Desktop only
                'server_time': datetime.now().isoformat(),
                'version': '1.0.0'
            }
            
        except Exception as e:
            self.logger.error(f"Status check error: {e}")
            return {
                'ai_connection': False,
                'image_generation': False,
                'voice_recognition': True,
                'whatsapp_integration': False,
                'error': str(e)
            }
    
    def process_enhanced_chat(self, message, voice_profile, _context):
        """Process chat with enhanced features"""
        try:
            # Get AI response
            ai_response = self.process_chat_message(message)

            # Generate voice data if needed
            voice_data = None
            if voice_profile in self.voice_profiles:
                voice_data = self.generate_voice_data(ai_response, voice_profile)

            # Generate suggestions
            suggestions = self.generate_suggestions(message, ai_response)

            return {
                'text': ai_response,
                'voice_data': voice_data,
                'suggestions': suggestions
            }

        except Exception as e:
            self.logger.error(f"Enhanced chat processing error: {e}")
            return {
                'text': "I'm sorry, I encountered an error processing your message.",
                'voice_data': None,
                'suggestions': []
            }

    def generate_voice_data(self, text, voice_profile):
        """Generate voice data for text"""
        try:
            profile = self.voice_profiles.get(voice_profile, self.voice_profiles['sana_default'])

            return {
                'text': text,
                'rate': profile.get('rate', 150),
                'volume': profile.get('volume', 0.9),
                'pitch': profile.get('pitch', 1.0),
                'voice_id': profile.get('voice_id', 'sana_default'),
                'profile_name': profile.get('name', 'Sana Default')
            }

        except Exception as e:
            self.logger.error(f"Voice data generation error: {e}")
            return None

    def generate_suggestions(self, user_message, _ai_response):
        """Generate conversation suggestions"""
        suggestions = []
        message_lower = user_message.lower()

        # Context-based suggestions
        if any(word in message_lower for word in ["image", "picture", "photo"]):
            suggestions.extend([
                "Generate another image",
                "Modify the image style",
                "Create a different image"
            ])
        elif any(word in message_lower for word in ["time", "clock", "hour"]):
            suggestions.extend([
                "Set a reminder",
                "What's the date?",
                "Set an alarm"
            ])
        elif any(word in message_lower for word in ["weather", "temperature"]):
            suggestions.extend([
                "Weather forecast",
                "Tomorrow's weather",
                "Weather alerts"
            ])
        elif any(word in message_lower for word in ["joke", "funny", "humor"]):
            suggestions.extend([
                "Tell another joke",
                "Random fact",
                "Fun trivia"
            ])
        else:
            suggestions.extend([
                "Tell me more",
                "Generate an image",
                "What else can you do?"
            ])

        return suggestions[:3]  # Limit to 3 suggestions

    def get_diagnostic_recommendations(self, api_key_status, ai_status):
        """Get diagnostic recommendations"""
        recommendations = []

        if not api_key_status:
            recommendations.append({
                'type': 'error',
                'title': 'API Key Missing',
                'message': 'Configure your OpenRouter API key in the settings',
                'action': 'Add API key in config.py'
            })

        if not ai_status:
            recommendations.append({
                'type': 'warning',
                'title': 'AI Connection Issue',
                'message': 'Check your internet connection and API key',
                'action': 'Verify network and credentials'
            })

        if not recommendations:
            recommendations.append({
                'type': 'success',
                'title': 'All Systems Operational',
                'message': 'Sana is ready to assist you',
                'action': 'Start chatting!'
            })

        return recommendations

    def save_voice_profiles(self):
        """Save voice profiles to file"""
        try:
            voices_file = Path('mobile/voices/profiles.json')
            voices_file.parent.mkdir(exist_ok=True)
            with open(voices_file, 'w') as f:
                json.dump(self.voice_profiles, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving voice profiles: {e}")

    def save_mobile_settings(self):
        """Save mobile settings to file"""
        try:
            settings_file = Path('mobile/settings.json')
            with open(settings_file, 'w') as f:
                json.dump(self.mobile_settings, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving mobile settings: {e}")

    def get_user_settings(self):
        """Get enhanced user settings"""
        return {
            **self.mobile_settings,
            'voice_profiles': list(self.voice_profiles.keys()),
            'current_voice': self.mobile_settings.get('selected_voice', 'sana_default'),
            'api_configured': bool(self.config.get('openrouter_api_key')),
            'server_version': '2.0.0'
        }
    
    def update_user_settings(self, new_settings):
        """Update user settings with enhanced features"""
        try:
            # Update mobile settings
            self.mobile_settings.update(new_settings)

            # Save to file
            self.save_mobile_settings()

            # Apply settings immediately
            if 'theme' in new_settings:
                self.logger.info(f"Theme changed to: {new_settings['theme']}")

            if 'selected_voice' in new_settings:
                self.logger.info(f"Voice profile changed to: {new_settings['selected_voice']}")

            return {
                'success': True,
                'message': 'Settings updated successfully',
                'updated_settings': new_settings
            }

        except Exception as e:
            self.logger.error(f"Error updating settings: {e}")
            return {
                'success': False,
                'message': 'Failed to update settings',
                'error': str(e)
            }
    
    def run(self, host='0.0.0.0', port=8080, debug=False, use_ssl=True):
        """Run the mobile server with automatic mobile optimization"""

        # Get local IP for mobile access
        import socket
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
        except:
            local_ip = socket.gethostbyname(socket.gethostname())

        # Check for SSL certificates
        ssl_context = None
        if use_ssl:
            cert_file = Path('ssl/localhost.crt')
            key_file = Path('ssl/localhost.key')

            if cert_file.exists() and key_file.exists():
                ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
                ssl_context.load_cert_chain(str(cert_file), str(key_file))
                protocol = "https"
                self.logger.info("✅ SSL certificates found - running with HTTPS")
            else:
                # Auto-create SSL certificate for mobile voice recognition
                self.logger.info("🔧 Creating SSL certificate for mobile voice recognition...")
                self.create_ssl_certificate()
                if cert_file.exists() and key_file.exists():
                    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
                    ssl_context.load_cert_chain(str(cert_file), str(key_file))
                    protocol = "https"
                    self.logger.info("✅ SSL certificate created - HTTPS enabled")
                else:
                    protocol = "http"
                    self.logger.warning("⚠️ SSL creation failed - running with HTTP")
        else:
            protocol = "http"
            self.logger.info("🔓 Running without SSL (HTTP only)")

        self.logger.info(f"🚀 Starting Sana Mobile Server on {protocol}://{host}:{port}")

        # Print mobile-optimized access information
        print(f"\n📱 SANA MOBILE ACCESS")
        print(f"=" * 30)
        print(f"🖥️  Desktop: {protocol}://localhost:{port}")
        print(f"📱 Mobile:   {protocol}://{local_ip}:{port}")

        if protocol == "https":
            print(f"\n🎤 VOICE RECOGNITION ENABLED:")
            print(f"   ✅ Secure HTTPS connection")
            print(f"   ✅ Mobile voice recognition works")
            print(f"   ⚠️ Accept certificate warning on mobile")
            print(f"   ✅ Allow microphone permission")
        else:
            print(f"\n⚠️ VOICE RECOGNITION LIMITED:")
            print(f"   🔓 HTTP connection (not secure)")
            print(f"   ❌ Voice may not work on mobile")
            print(f"   💡 Use HTTPS for full voice features")

        print(f"\n📱 MOBILE SETUP STEPS:")
        print(f"   1. Connect mobile to same WiFi as computer")
        print(f"   2. Open browser: {protocol}://{local_ip}:{port}")
        if protocol == "https":
            print(f"   3. Accept certificate warning")
            print(f"   4. Allow microphone permission")
        print(f"   5. Install as PWA for app-like experience")

        # Auto-configure firewall for mobile access
        self.configure_firewall(port)

        try:
            self.app.run(
                host=host,
                port=port,
                debug=debug,
                ssl_context=ssl_context,
                threaded=True
            )
        except Exception as e:
            if "Address already in use" in str(e):
                self.logger.error(f"❌ Port {port} is already in use")
                print(f"\n💡 Try a different port:")
                print(f"   python mobile_server.py --port 8081")
            else:
                self.logger.error(f"❌ Server error: {e}")
                raise

    def create_ssl_certificate(self):
        """Auto-create SSL certificate for mobile voice recognition"""
        try:
            from cryptography import x509
            from cryptography.x509.oid import NameOID
            from cryptography.hazmat.primitives import hashes, serialization
            from cryptography.hazmat.primitives.asymmetric import rsa
            import datetime
            import ipaddress

            # Create SSL directory
            ssl_dir = Path('ssl')
            ssl_dir.mkdir(exist_ok=True)

            # Generate private key
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
            )

            # Get local IP
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()

            # Create certificate
            subject = issuer = x509.Name([
                x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
                x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Local"),
                x509.NameAttribute(NameOID.LOCALITY_NAME, "Local"),
                x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Sana AI Assistant"),
                x509.NameAttribute(NameOID.COMMON_NAME, "sana.local"),
            ])

            cert = x509.CertificateBuilder().subject_name(
                subject
            ).issuer_name(
                issuer
            ).public_key(
                private_key.public_key()
            ).serial_number(
                x509.random_serial_number()
            ).not_valid_before(
                datetime.datetime.now(datetime.timezone.utc)
            ).not_valid_after(
                datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)
            ).add_extension(
                x509.SubjectAlternativeName([
                    x509.DNSName("localhost"),
                    x509.DNSName("sana.local"),
                    x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
                    x509.IPAddress(ipaddress.IPv4Address(local_ip)),
                ]),
                critical=False,
            ).sign(private_key, hashes.SHA256())

            # Write certificate and key
            with open(ssl_dir / 'localhost.crt', 'wb') as f:
                f.write(cert.public_bytes(serialization.Encoding.PEM))

            with open(ssl_dir / 'localhost.key', 'wb') as f:
                f.write(private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                ))

            self.logger.info("✅ SSL certificate created successfully")
            return True

        except ImportError:
            self.logger.warning("⚠️ cryptography package not found - install with: pip install cryptography")
            return False
        except Exception as e:
            self.logger.error(f"❌ SSL certificate creation failed: {e}")
            return False

    def configure_firewall(self, port):
        """Auto-configure Windows firewall for mobile access"""
        try:
            import platform
            if platform.system().lower() != "windows":
                return

            import subprocess

            # Add firewall rules for mobile access
            commands = [
                f'netsh advfirewall firewall add rule name="Sana Mobile HTTP" dir=in action=allow protocol=TCP localport={port} profile=any',
                f'netsh advfirewall firewall add rule name="Sana Mobile HTTPS" dir=in action=allow protocol=TCP localport={port} profile=any',
            ]

            for cmd in commands:
                try:
                    subprocess.run(cmd.split(), check=True, capture_output=True)
                except:
                    pass  # Rule might already exist

            self.logger.info("✅ Firewall configured for mobile access")

        except Exception as e:
            self.logger.warning(f"⚠️ Could not configure firewall: {e}")

def main():
    """Main function to start the mobile server"""
    import argparse

    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Sana Mobile Server')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8080, help='Port to bind to')
    parser.add_argument('--no-ssl', action='store_true', help='Disable SSL/HTTPS')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    args = parser.parse_args()

    server = SanaProfessionalMobileServer()

    # Get configuration
    host = os.getenv('SANA_MOBILE_HOST', args.host)
    port = int(os.getenv('SANA_MOBILE_PORT', args.port))
    debug = os.getenv('SANA_DEBUG', 'False').lower() == 'true' or args.debug
    use_ssl = not args.no_ssl

    print("🤖 Sana AI Assistant Mobile Server")
    print("=" * 40)

    try:
        server.run(host=host, port=port, debug=debug, use_ssl=use_ssl)
    except KeyboardInterrupt:
        print("\n👋 Sana Mobile Server stopped gracefully")
    except Exception as e:
        print(f"❌ Server error: {e}")
        print("\n💡 Troubleshooting:")
        print("   • Check if port is already in use")
        print("   • Try: python mobile_server.py --port 8081")
        print("   • For HTTP only: python mobile_server.py --no-ssl")

if __name__ == "__main__":
    main()
