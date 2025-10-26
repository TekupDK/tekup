#!/usr/bin/env python3
"""
Jarvis AgentScope Enhanced Server Manager
=========================================

Advanced terminal script for managing the AgentScope Enhanced Backend server
with comprehensive logging, monitoring, and control features.

Features:
- Interactive terminal interface
- Server lifecycle management
- Real-time status monitoring
- Configuration management
- Graceful shutdown handling
- API testing capabilities
- WebSocket connection monitoring

Usage:
    python jarvis_server.py [options]

Commands:
    start    - Start the server
    stop     - Stop the server
    restart  - Restart the server  
    status   - Show server status
    config   - Show configuration
    test     - Test API endpoints
    monitor  - Live monitoring mode
    logs     - Show recent logs
    help     - Show this help
"""

import asyncio
import argparse
import signal
import sys
import os
import json
import time
import threading
from datetime import datetime
from typing import Optional, Dict, Any, List
import subprocess
import requests
import websocket
from pathlib import Path
import logging
from logging.handlers import RotatingFileHandler
import psutil

# ANSI color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

class JarvisServerManager:
    """Advanced server management for AgentScope Enhanced Backend"""
    
    def __init__(self):
        self.server_process = None
        self.server_pid = None
        self.config = self._load_config()
        self.logger = self._setup_logging()
        self.running = False
        self.monitoring = False
        
        # Server configuration
        self.host = "0.0.0.0"
        self.port = 8001
        self.log_level = "info"
        self.reload = True
        
        # API endpoints for testing - will be updated when port is set
        self.endpoints = {
            "health": "/health",
            "jarvis_generate": "/jarvis/generate",
            "agents_create": "/agents/create",
            "tasks_execute": "/tasks/execute"
        }
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        # Update API base after initialization
        self._update_api_base()
        
        self.logger.info("JarvisServerManager initialized")
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from .env file"""
        config = {}
        env_file = Path(".env.local")
        
        if env_file.exists():
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        key, value = line.split('=', 1)
                        config[key.strip()] = value.strip().strip('"')
                        os.environ[key.strip()] = value.strip().strip('"')
        
        return config
    
    def _setup_logging(self) -> logging.Logger:
        """Setup comprehensive logging"""
        logger = logging.getLogger("JarvisServerManager")
        logger.setLevel(logging.INFO)
        
        # Console handler with colors
        console_handler = logging.StreamHandler()
        console_formatter = logging.Formatter(
            f"{Colors.OKCYAN}%(asctime)s{Colors.ENDC} - "
            f"{Colors.BOLD}%(name)s{Colors.ENDC} - "
            f"%(levelname)s - %(message)s"
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
        
        # File handler with rotation
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        file_handler = RotatingFileHandler(
            log_dir / "jarvis_server.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
        
        return logger
    
    def _update_api_base(self):
        """Update API base URL when port changes"""
        self.api_base = f"http://localhost:{self.port}"
    
    def _signal_handler(self, signum, frame):
        """Handle graceful shutdown signals"""
        self.logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self.stop_server()
        sys.exit(0)
    
    def _print_banner(self):
        """Print application banner"""
        banner = f"""
{Colors.HEADER}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════════════════════╗
║                    Jarvis AgentScope Enhanced Server Manager                 ║
║                                                                              ║
║  🤖 Multi-Agent AI Platform with Real-time Steering                         ║
║  🧠 Jarvis Foundation Model Integration                                      ║
║  🚀 Danish Language & Business Intelligence Optimized                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
{Colors.ENDC}"""
        print(banner)
    
    def _print_status(self, status: str, message: str, color: str = Colors.OKGREEN):
        """Print formatted status message"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"{Colors.OKCYAN}[{timestamp}]{Colors.ENDC} {color}[{status}]{Colors.ENDC} {message}")
    
    def start_server(self, background: bool = False) -> bool:
        """Start the AgentScope Enhanced Backend server"""
        if self.is_server_running():
            self._print_status("INFO", "Server is already running", Colors.WARNING)
            return True
        
        self._print_status("STARTING", "Initializing AgentScope Enhanced Backend...")
        
        try:
            # Check if main.py exists
            if not Path("main.py").exists():
                self._print_status("ERROR", "main.py not found in current directory", Colors.FAIL)
                return False
            
            # Check Python environment and dependencies
            if not self._check_dependencies():
                return False
            
            # Start server process
            cmd = [
                sys.executable, "-m", "uvicorn",
                "main:app",
                "--host", self.host,
                "--port", str(self.port),
                "--log-level", self.log_level
            ]
            
            if self.reload:
                cmd.append("--reload")
            
            self.logger.info(f"Starting server with command: {' '.join(cmd)}")
            
            if background:
                # Start in background
                self.server_process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
                )
                self.server_pid = self.server_process.pid
                self._print_status("SUCCESS", f"Server started in background (PID: {self.server_pid})")
            else:
                # Start in foreground with real-time output
                self.server_process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    universal_newlines=True,
                    bufsize=1
                )
                self.server_pid = self.server_process.pid
                self._print_status("SUCCESS", f"Server starting (PID: {self.server_pid})")
                
                # Stream output in real-time
                self._stream_server_output()
            
            self.running = True
            
            # Wait for server to be ready
            if self._wait_for_server_ready():
                self._print_status("READY", f"Server is ready at {self.api_base}")
                return True
            else:
                self._print_status("ERROR", "Server failed to start properly", Colors.FAIL)
                return False
                
        except Exception as e:
            self.logger.error(f"Error starting server: {str(e)}")
            self._print_status("ERROR", f"Failed to start server: {str(e)}", Colors.FAIL)
            return False
    
    def _stream_server_output(self):
        """Stream server output in real-time"""
        def stream_output():
            if self.server_process and self.server_process.stdout:
                for line in iter(self.server_process.stdout.readline, ''):
                    if line:
                        # Parse and colorize log output
                        line = line.strip()
                        if "INFO" in line:
                            print(f"{Colors.OKGREEN}{line}{Colors.ENDC}")
                        elif "WARNING" in line:
                            print(f"{Colors.WARNING}{line}{Colors.ENDC}")
                        elif "ERROR" in line:
                            print(f"{Colors.FAIL}{line}{Colors.ENDC}")
                        else:
                            print(line)
                        
                        # Log to file
                        self.logger.info(f"Server: {line}")
        
        output_thread = threading.Thread(target=stream_output, daemon=True)
        output_thread.start()
    
    def _check_dependencies(self) -> bool:
        """Check if required dependencies are installed"""
        required_packages = [
            "fastapi", "uvicorn", "agentscope", "pydantic", "requests"
        ]
        
        missing_packages = []
        
        for package in required_packages:
            try:
                __import__(package)
            except ImportError:
                missing_packages.append(package)
        
        if missing_packages:
            self._print_status("ERROR", f"Missing packages: {', '.join(missing_packages)}", Colors.FAIL)
            self._print_status("INFO", "Install with: pip install " + " ".join(missing_packages))
            return False
        
        return True
    
    def _wait_for_server_ready(self, timeout: int = 30) -> bool:
        """Wait for server to be ready"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = requests.get(f"{self.api_base}/health", timeout=2)
                if response.status_code == 200:
                    return True
            except requests.RequestException:
                pass
            
            time.sleep(1)
            self._print_status("WAITING", "Waiting for server to be ready...")
        
        return False
    
    def stop_server(self) -> bool:
        """Stop the server gracefully"""
        if not self.is_server_running():
            self._print_status("INFO", "Server is not running", Colors.WARNING)
            return True
        
        self._print_status("STOPPING", "Shutting down AgentScope Enhanced Backend...")
        
        try:
            if self.server_process:
                # Graceful termination
                self.server_process.terminate()
                
                # Wait for process to terminate
                try:
                    self.server_process.wait(timeout=10)
                    self._print_status("SUCCESS", "Server stopped gracefully")
                except subprocess.TimeoutExpired:
                    # Force kill if not responding
                    self.server_process.kill()
                    self._print_status("WARNING", "Server force-killed (not responding to termination)")
                
                self.server_process = None
                self.server_pid = None
                self.running = False
                return True
            else:
                # Try to find and kill process by port
                return self._kill_process_by_port()
                
        except Exception as e:
            self.logger.error(f"Error stopping server: {str(e)}")
            self._print_status("ERROR", f"Failed to stop server: {str(e)}", Colors.FAIL)
            return False
    
    def _kill_process_by_port(self) -> bool:
        """Kill process using the server port"""
        try:
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    connections = proc.net_connections()
                    for conn in connections:
                        if hasattr(conn, 'laddr') and conn.laddr and conn.laddr.port == self.port:
                            proc.terminate()
                            self._print_status("SUCCESS", f"Killed process {proc.pid} using port {self.port}")
                            return True
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            
            self._print_status("WARNING", f"No process found using port {self.port}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error killing process by port: {str(e)}")
            return False
    
    def restart_server(self) -> bool:
        """Restart the server"""
        self._print_status("RESTARTING", "Restarting AgentScope Enhanced Backend...")
        
        if self.stop_server():
            time.sleep(2)  # Wait before restarting
            return self.start_server()
        
        return False
    
    def is_server_running(self) -> bool:
        """Check if server is running"""
        try:
            response = requests.get(f"{self.api_base}/health", timeout=2)
            return response.status_code == 200
        except requests.RequestException:
            return False
    
    def show_status(self):
        """Show detailed server status"""
        self._print_banner()
        
        print(f"\n{Colors.BOLD}Server Status:{Colors.ENDC}")
        print("=" * 50)
        
        # Basic status
        running = self.is_server_running()
        status_color = Colors.OKGREEN if running else Colors.FAIL
        status_text = "RUNNING" if running else "STOPPED"
        
        print(f"Status: {status_color}{status_text}{Colors.ENDC}")
        print(f"Host: {self.host}")
        print(f"Port: {self.port}")
        print(f"API Base: {self.api_base}")
        
        if running:
            try:
                # Get detailed health info
                response = requests.get(f"{self.api_base}/health", timeout=5)
                if response.status_code == 200:
                    health_data = response.json()
                    
                    print(f"\n{Colors.BOLD}Health Information:{Colors.ENDC}")
                    print(f"Version: {health_data.get('version', 'Unknown')}")
                    print(f"Jarvis Model: {health_data.get('jarvis_model', 'Unknown')}")
                    print(f"Active Sessions: {health_data.get('active_sessions', 0)}")
                    print(f"Active Tasks: {health_data.get('active_tasks', 0)}")
                    print(f"Timestamp: {health_data.get('timestamp', 'Unknown')}")
                
            except Exception as e:
                print(f"{Colors.WARNING}Could not retrieve detailed status: {str(e)}{Colors.ENDC}")
        
        # Process information
        if self.server_pid:
            try:
                proc = psutil.Process(self.server_pid)
                print(f"\n{Colors.BOLD}Process Information:{Colors.ENDC}")
                print(f"PID: {self.server_pid}")
                print(f"CPU Usage: {proc.cpu_percent()}%")
                print(f"Memory Usage: {proc.memory_info().rss / 1024 / 1024:.1f} MB")
                print(f"Started: {datetime.fromtimestamp(proc.create_time()).strftime('%Y-%m-%d %H:%M:%S')}")
            except psutil.NoSuchProcess:
                print(f"{Colors.WARNING}Process {self.server_pid} no longer exists{Colors.ENDC}")
        
        # Configuration
        print(f"\n{Colors.BOLD}Configuration:{Colors.ENDC}")
        print(f"Reload: {self.reload}")
        print(f"Log Level: {self.log_level}")
        
        # Environment variables
        api_key = os.getenv("OPENAI_API_KEY", "").replace(os.getenv("OPENAI_API_KEY", "")[8:-8], "*" * 8) if os.getenv("OPENAI_API_KEY") else "Not set"
        print(f"OpenAI API Key: {api_key}")
        
        print()
    
    def test_api(self):
        """Test API endpoints"""
        if not self.is_server_running():
            self._print_status("ERROR", "Server is not running. Start server first.", Colors.FAIL)
            return
        
        self._print_status("TESTING", "Testing API endpoints...")
        
        # Test health endpoint
        try:
            response = requests.get(f"{self.api_base}/health", timeout=5)
            if response.status_code == 200:
                self._print_status("✓", "Health endpoint working", Colors.OKGREEN)
            else:
                self._print_status("✗", f"Health endpoint failed: {response.status_code}", Colors.FAIL)
        except Exception as e:
            self._print_status("✗", f"Health endpoint error: {str(e)}", Colors.FAIL)
        
        # Test Jarvis generate endpoint
        try:
            test_data = {
                "prompt": "Test prompt for Jarvis",
                "task_type": "chat",
                "danish_context": False,
                "max_tokens": 100
            }
            
            response = requests.post(
                f"{self.api_base}/jarvis/generate",
                json=test_data,
                timeout=10
            )
            
            if response.status_code == 200:
                self._print_status("✓", "Jarvis generate endpoint working", Colors.OKGREEN)
            else:
                self._print_status("✗", f"Jarvis generate failed: {response.status_code}", Colors.WARNING)
                if response.status_code == 500:
                    self._print_status("INFO", "This might be due to API key configuration")
                    
        except Exception as e:
            self._print_status("✗", f"Jarvis generate error: {str(e)}", Colors.FAIL)
        
        # Test WebSocket endpoint
        self._test_websocket()
    
    def _test_websocket(self):
        """Test WebSocket connectivity"""
        try:
            ws_url = f"ws://localhost:{self.port}/agent/status"
            
            def on_message(ws, message):
                self._print_status("✓", "WebSocket connection working", Colors.OKGREEN)
                ws.close()
            
            def on_error(ws, error):
                self._print_status("✗", f"WebSocket error: {str(error)}", Colors.FAIL)
            
            def on_close(ws, close_status_code, close_msg):
                pass
            
            ws = websocket.WebSocketApp(
                ws_url,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close
            )
            
            # Run with timeout
            ws.run_forever()
            
        except Exception as e:
            self._print_status("✗", f"WebSocket test error: {str(e)}", Colors.FAIL)
    
    def show_config(self):
        """Show configuration"""
        print(f"\n{Colors.BOLD}Configuration:{Colors.ENDC}")
        print("=" * 30)
        
        print(f"Host: {self.host}")
        print(f"Port: {self.port}")
        print(f"Log Level: {self.log_level}")
        print(f"Reload: {self.reload}")
        
        print(f"\n{Colors.BOLD}Environment Variables:{Colors.ENDC}")
        env_vars = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "NODE_ENV"]
        
        for var in env_vars:
            value = os.getenv(var, "Not set")
            if "KEY" in var and value != "Not set":
                # Mask API keys
                value = value[:8] + "*" * (len(value) - 16) + value[-8:]
            print(f"{var}: {value}")
        
        if self.config:
            print(f"\n{Colors.BOLD}Loaded Configuration:{Colors.ENDC}")
            for key, value in self.config.items():
                if "KEY" in key.upper():
                    value = value[:8] + "*" * (len(value) - 16) + value[-8:] if len(value) > 16 else "*" * len(value)
                print(f"{key}: {value}")
    
    def monitor_server(self):
        """Live monitoring mode"""
        if not self.is_server_running():
            self._print_status("ERROR", "Server is not running. Start server first.", Colors.FAIL)
            return
        
        self._print_status("MONITORING", "Starting live monitoring mode. Press Ctrl+C to exit.")
        self.monitoring = True
        
        try:
            while self.monitoring:
                os.system('cls' if os.name == 'nt' else 'clear')  # Clear screen
                
                print(f"{Colors.HEADER}Live Server Monitoring{Colors.ENDC}")
                print("=" * 50)
                print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Server status
                running = self.is_server_running()
                status_color = Colors.OKGREEN if running else Colors.FAIL
                status_text = "ONLINE" if running else "OFFLINE"
                print(f"Status: {status_color}{status_text}{Colors.ENDC}")
                
                if running:
                    try:
                        # Get health info
                        response = requests.get(f"{self.api_base}/health", timeout=2)
                        if response.status_code == 200:
                            health_data = response.json()
                            print(f"Active Sessions: {health_data.get('active_sessions', 0)}")
                            print(f"Active Tasks: {health_data.get('active_tasks', 0)}")
                    except:
                        print("Could not retrieve health data")
                
                # Process info
                if self.server_pid:
                    try:
                        proc = psutil.Process(self.server_pid)
                        print(f"CPU: {proc.cpu_percent()}%")
                        print(f"Memory: {proc.memory_info().rss / 1024 / 1024:.1f} MB")
                        try:
                            connections = proc.net_connections()
                            print(f"Connections: {len(connections)}")
                        except (psutil.AccessDenied, psutil.NoSuchProcess):
                            print("Connections: Access denied")
                    except psutil.NoSuchProcess:
                        print("Process not found")
                
                print(f"\n{Colors.OKCYAN}Press Ctrl+C to exit monitoring{Colors.ENDC}")
                time.sleep(5)  # Update every 5 seconds
                
        except KeyboardInterrupt:
            self.monitoring = False
            self._print_status("INFO", "Monitoring stopped")
    
    def show_logs(self, lines: int = 50):
        """Show recent logs"""
        log_file = Path("logs/jarvis_server.log")
        
        if not log_file.exists():
            self._print_status("WARNING", "Log file not found", Colors.WARNING)
            return
        
        print(f"\n{Colors.BOLD}Recent Logs (last {lines} lines):{Colors.ENDC}")
        print("=" * 50)
        
        try:
            # Read last N lines
            with open(log_file, 'r') as f:
                log_lines = f.readlines()
                recent_lines = log_lines[-lines:]
                
                for line in recent_lines:
                    line = line.strip()
                    if "ERROR" in line:
                        print(f"{Colors.FAIL}{line}{Colors.ENDC}")
                    elif "WARNING" in line:
                        print(f"{Colors.WARNING}{line}{Colors.ENDC}")
                    elif "INFO" in line:
                        print(f"{Colors.OKGREEN}{line}{Colors.ENDC}")
                    else:
                        print(line)
        
        except Exception as e:
            self._print_status("ERROR", f"Could not read logs: {str(e)}", Colors.FAIL)
    
    def interactive_mode(self):
        """Interactive terminal mode"""
        self._print_banner()
        self._print_status("INTERACTIVE", "Entering interactive mode. Type 'help' for commands.")
        
        while True:
            try:
                command = input(f"\n{Colors.OKCYAN}jarvis-server>{Colors.ENDC} ").strip().lower()
                
                if command == "help":
                    self._show_help()
                elif command == "start":
                    self.start_server(background=True)
                elif command == "stop":
                    self.stop_server()
                elif command == "restart":
                    self.restart_server()
                elif command == "status":
                    self.show_status()
                elif command == "config":
                    self.show_config()
                elif command == "test":
                    self.test_api()
                elif command == "monitor":
                    self.monitor_server()
                elif command == "logs":
                    self.show_logs()
                elif command in ["exit", "quit"]:
                    self._print_status("GOODBYE", "Shutting down Jarvis Server Manager...")
                    if self.is_server_running():
                        self.stop_server()
                    break
                elif command == "":
                    continue
                else:
                    print(f"{Colors.FAIL}Unknown command: {command}. Type 'help' for available commands.{Colors.ENDC}")
            
            except KeyboardInterrupt:
                print(f"\n{Colors.WARNING}Use 'exit' to quit gracefully{Colors.ENDC}")
            except EOFError:
                break
    
    def _show_help(self):
        """Show help information"""
        help_text = f"""
{Colors.BOLD}Available Commands:{Colors.ENDC}

  {Colors.OKGREEN}start{Colors.ENDC}     - Start the AgentScope Enhanced Backend server
  {Colors.OKGREEN}stop{Colors.ENDC}      - Stop the server gracefully
  {Colors.OKGREEN}restart{Colors.ENDC}   - Restart the server
  {Colors.OKGREEN}status{Colors.ENDC}    - Show detailed server status
  {Colors.OKGREEN}config{Colors.ENDC}    - Show configuration and environment
  {Colors.OKGREEN}test{Colors.ENDC}      - Test API endpoints
  {Colors.OKGREEN}monitor{Colors.ENDC}   - Live monitoring mode (Ctrl+C to exit)
  {Colors.OKGREEN}logs{Colors.ENDC}      - Show recent logs
  {Colors.OKGREEN}help{Colors.ENDC}      - Show this help
  {Colors.OKGREEN}exit{Colors.ENDC}      - Exit interactive mode

{Colors.BOLD}Server Features:{Colors.ENDC}
  • Jarvis Foundation Model integration
  • Multi-agent orchestration
  • Real-time steering capabilities
  • Danish language optimization
  • WebSocket support for live monitoring
  • Business intelligence integration
"""
        print(help_text)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Jarvis AgentScope Enhanced Server Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        "command",
        nargs="?",
        choices=["start", "stop", "restart", "status", "config", "test", "monitor", "logs", "interactive"],
        default="interactive",
        help="Command to execute"
    )
    
    parser.add_argument("--host", default="0.0.0.0", help="Server host")
    parser.add_argument("--port", type=int, default=8001, help="Server port")
    parser.add_argument("--log-level", default="info", help="Log level")
    parser.add_argument("--no-reload", action="store_true", help="Disable auto-reload")
    parser.add_argument("--background", action="store_true", help="Run server in background")
    
    args = parser.parse_args()
    
    # Create server manager
    manager = JarvisServerManager()
    
    # Apply CLI arguments
    manager.host = args.host
    manager.port = args.port
    manager.log_level = args.log_level
    manager.reload = not args.no_reload
    
    # Update API base URL with new port
    manager._update_api_base()
    
    # Execute command
    try:
        if args.command == "start":
            manager.start_server(background=args.background)
            if not args.background:
                # Keep running and show real-time output
                try:
                    while manager.running:
                        time.sleep(1)
                except KeyboardInterrupt:
                    manager.stop_server()
        
        elif args.command == "stop":
            manager.stop_server()
        
        elif args.command == "restart":
            manager.restart_server()
        
        elif args.command == "status":
            manager.show_status()
        
        elif args.command == "config":
            manager.show_config()
        
        elif args.command == "test":
            manager.test_api()
        
        elif args.command == "monitor":
            manager.monitor_server()
        
        elif args.command == "logs":
            manager.show_logs()
        
        elif args.command == "interactive":
            manager.interactive_mode()
    
    except KeyboardInterrupt:
        manager.logger.info("Interrupted by user")
        if manager.is_server_running():
            manager.stop_server()
    
    except Exception as e:
        manager.logger.error(f"Unexpected error: {str(e)}")
        print(f"{Colors.FAIL}Error: {str(e)}{Colors.ENDC}")

if __name__ == "__main__":
    main()
