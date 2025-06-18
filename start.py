#!/usr/bin/env python3
"""
Sana AI Assistant - Render Deployment Startup Script
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# Import and run the mobile server
from mobile_server import SanaProfessionalMobileServer

def main():
    """Main function to start the server for Render deployment"""
    
    # Get port from environment (Render sets this)
    port = int(os.environ.get('PORT', 8080))
    host = '0.0.0.0'  # Bind to all interfaces for Render
    
    print(f"🚀 Starting Sana AI Assistant on {host}:{port}")
    print("🌐 Optimized for Render deployment")
    
    # Create and run server
    server = SanaProfessionalMobileServer()
    
    try:
        # Run without SSL for Render (Render handles SSL termination)
        server.run(host=host, port=port, debug=False, use_ssl=False)
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
