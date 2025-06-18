"""
S.A.N.A. AI Assistant - Configuration File
Centralized configuration for all application settings
"""
import os
from pathlib import Path

class Config:
    """Application Configuration"""

    # Application Info
    APP_NAME = "S.A.N.A. AI Assistant"
    APP_VERSION = "1.0.0"
    APP_AUTHOR = "Your Name"
    APP_DESCRIPTION = "Advanced AI Assistant with Voice Control, Image Generation, and WhatsApp Integration"
    
    # Directories
    BASE_DIR = Path(__file__).parent
    WWW_DIR = BASE_DIR / "www"
    ENGINE_DIR = BASE_DIR / "Engine"
    GENERATED_IMAGES_DIR = BASE_DIR / "generated_images"
    LOGS_DIR = BASE_DIR / "logs"
    DATA_DIR = BASE_DIR / "data"
    EXPORTS_DIR = BASE_DIR / "exports"
    BACKUPS_DIR = BASE_DIR / "backups"
    
    # Server Settings
    HOST = "localhost"
    PORT = 8000
    DEBUG = True
    
    # OpenRouter AI Configuration
    OPENROUTER_API_KEY = "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"
    OPENROUTER_MODEL = "deepseek/deepseek-r1-0528:free"
    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
    OPENROUTER_MAX_TOKENS = 500
    OPENROUTER_TEMPERATURE = 0.7
    OPENROUTER_TIMEOUT = 30
    
    # Image Generation Settings
    IMAGE_GENERATION_APIS = [
        {
            "name": "Pollinations AI (Ultra Fast)",
            "timeout": 3,
            "size": "256x256"
        },
        {
            "name": "Pollinations AI (Fast)", 
            "timeout": 5,
            "size": "400x400"
        },
        {
            "name": "Pollinations AI (Standard)",
            "timeout": 8,
            "size": "512x512"
        },
        {
            "name": "Pollinations AI (Enhanced)",
            "timeout": 12,
            "size": "512x512"
        }
    ]
    
    # Voice Recognition Settings
    VOICE_RECOGNITION_TIMEOUT = 6
    VOICE_PHRASE_TIME_LIMIT = 5
    VOICE_ENERGY_THRESHOLD = 300
    VOICE_PAUSE_THRESHOLD = 1
    
    # Text-to-Speech Settings
    TTS_RATE = 174
    TTS_VOLUME = 1.0
    TTS_VOICE_INDEX = 0  # 0 for first available voice
    
    # WhatsApp Integration
    WHATSAPP_ENABLED = True
    WHATSAPP_TIMEOUT = 10
    
    # Continuous Mode Settings
    CONTINUOUS_MODE_ENABLED = True
    AUTO_LISTENING_DELAY = 1  # seconds
    
    # Logging Configuration
    LOG_LEVEL = "INFO"
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE_MAX_SIZE = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 5

    # Database Settings
    DATABASE_PATH = BASE_DIR / "sana.db"

    # Security Settings
    ALLOWED_HOSTS = ["localhost", "127.0.0.1"]
    
    # Feature Flags
    FEATURES = {
        "voice_recognition": True,
        "text_to_speech": True,
        "ai_chat": True,
        "image_generation": True,
        "whatsapp_integration": True,
        "continuous_mode": True,
        "application_control": True,
        "contact_management": True,
        "conversation_history": True,
        "system_monitoring": True
    }
    
    # UI Settings
    UI_THEME = "dark"
    UI_ANIMATIONS = True
    UI_SOUND_EFFECTS = True
    
    # Performance Settings
    MAX_CONVERSATION_HISTORY = 50
    IMAGE_CACHE_SIZE = 100
    RESPONSE_TIMEOUT = 30
    
    # Error Handling
    MAX_RETRIES = 3
    RETRY_DELAY = 1  # seconds
    
    # Supported Commands
    VOICE_COMMANDS = {
        "image_generation": [
            "generate image", "create image", "make image", "draw image",
            "generate picture", "create picture", "make picture", "draw picture",
            "text to image", "image of", "picture of"
        ],
        "whatsapp": [
            "send message", "phone call", "video call", "call", "message"
        ],
        "applications": [
            "open notepad", "open calculator", "open chrome", "open browser",
            "open file manager", "open explorer"
        ],
        "system": [
            "stop listening", "stop sana", "exit", "close", "stop",
            "clear chat", "clear conversation", "reset chat",
            "reset personality", "reset sana"
        ]
    }

    # File Extensions
    SUPPORTED_IMAGE_FORMATS = [".png", ".jpg", ".jpeg", ".gif", ".bmp"]
    SUPPORTED_AUDIO_FORMATS = [".wav", ".mp3", ".ogg"]
    
    # API Rate Limits
    API_RATE_LIMITS = {
        "openrouter": 60,  # requests per minute
        "image_generation": 30,  # requests per minute
    }
    
    @classmethod
    def get_env_var(cls, key, default=None):
        """Get environment variable with fallback"""
        return os.getenv(key, default)
    
    @classmethod
    def is_feature_enabled(cls, feature_name):
        """Check if a feature is enabled"""
        return cls.FEATURES.get(feature_name, False)
    
    @classmethod
    def get_log_file_path(cls):
        """Get current log file path"""
        from datetime import datetime
        date_str = datetime.now().strftime("%Y%m%d")
        return cls.LOGS_DIR / f"sana_{date_str}.log"

# Development Configuration
class DevelopmentConfig(Config):
    DEBUG = True
    LOG_LEVEL = "DEBUG"

# Production Configuration  
class ProductionConfig(Config):
    DEBUG = False
    LOG_LEVEL = "WARNING"
    
# Testing Configuration
class TestingConfig(Config):
    DEBUG = True
    LOG_LEVEL = "DEBUG"
    DATABASE_PATH = Config.BASE_DIR / "test_sana.db"

# Configuration selector
def get_config():
    """Get configuration based on environment"""
    env = os.getenv('SANA_ENV', 'development').lower()

    if env == 'production':
        return ProductionConfig
    elif env == 'testing':
        return TestingConfig
    else:
        return DevelopmentConfig

