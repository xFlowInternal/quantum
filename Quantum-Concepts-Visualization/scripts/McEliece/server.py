#!/usr/bin/env python3
"""
Simple HTTP server for Classic McEliece walkthrough
Serves index.html on your local LAN
"""

import http.server
import socketserver
import socket
import webbrowser
import os
import sys

PORT = 8080
HOST = '0.0.0.0'  # Listen on all network interfaces

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to set correct MIME type for HTML"""
    def end_headers(self):
        # Add CORS headers to allow access from other devices
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        super().end_headers()

def get_local_ip():
    """Get the local IP address of the machine"""
    try:
        # Connect to a remote address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        # Fallback: try to get from hostname
        try:
            return socket.gethostbyname(socket.gethostname())
        except:
            return '127.0.0.1'

def main():
    # Check if index.html exists
    if not os.path.exists('index.html'):
        print("❌ Error: index.html not found in current directory!")
        print("   Please make sure you're in the directory containing index.html")
        sys.exit(1)
    
    # Get local IP
    local_ip = get_local_ip()
    
    # Set up the server
    handler = MyHTTPRequestHandler
    handler.extensions_map.update({
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.svg': 'image/svg+xml',
    })
    
    try:
        with socketserver.TCPServer((HOST, PORT), handler) as httpd:
            print("=" * 60)
            print("🌐 Classic McEliece Server Started!")
            print("=" * 60)
            print(f"\n📱 Access from this computer:")
            print(f"   → http://localhost:{PORT}")
            print(f"   → http://127.0.0.1:{PORT}")
            print(f"\n📱 Access from other devices on your LAN:")
            print(f"   → http://{local_ip}:{PORT}")
            print("\n📋 To share with others, give them the IP above")
            print("   Make sure they're connected to the same network")
            print("\n⚙️  Press Ctrl+C to stop the server")
            print("=" * 60)
            
            # Try to open browser automatically
            try:
                webbrowser.open(f'http://localhost:{PORT}')
                print("✅ Browser opened automatically!")
            except:
                print("ℹ️  Open your browser manually using the URLs above")
            
            # Start the server
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
        sys.exit(0)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Error: Port {PORT} is already in use!")
            print("   Try changing the PORT variable to a different number (e.g., 8000, 8081)")
        else:
            print(f"❌ Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()