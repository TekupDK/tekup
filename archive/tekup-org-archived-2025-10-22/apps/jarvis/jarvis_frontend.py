#!/usr/bin/env python3
"""
Jarvis Frontend Manager
=======================

Advanced Python terminal script for managing the Jarvis Next.js frontend application
with comprehensive development workflow, build management, and deployment features.

Features:
- Interactive terminal interface for Next.js management
- Development server lifecycle management
- Production build and deployment handling  
- Real-time monitoring and health checks
- AgentScope backend integration testing
- Environment configuration management
- Performance analysis and optimization
- Dependency management and updates

Usage:
    python jarvis_frontend.py [command] [options]

Commands:
    dev      - Start development server
    build    - Build for production
    start    - Start production server
    deploy   - Deploy to production
    status   - Show application status
    test     - Run tests and health checks
    lint     - Run linting and type checking
    deps     - Manage dependencies
    config   - Show configuration
    monitor  - Live monitoring mode
    logs     - Show application logs
    clean    - Clean build artifacts
    interactive - Enter interactive mode
"""

import asyncio
import argparse
import signal
import sys
import os
import json
import time
import threading
import subprocess
import shutil
import webbrowser
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path
import logging
from logging.handlers import RotatingFileHandler
import requests
import psutil
import re

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

class JarvisFrontendManager:
    """Advanced frontend management for Jarvis Next.js application"""
    
    def __init__(self):
        self.project_dir = Path.cwd()
        self.package_json = self._load_package_json()
        self.config = self._load_config()
        self.logger = self._setup_logging()
        
        # Server processes
        self.dev_process = None
        self.build_process = None
        self.start_process = None
        self.dev_pid = None
        self.start_pid = None
        
        # Configuration
        self.dev_port = 3005
        self.prod_port = 3002
        self.package_manager = self._detect_package_manager()
        self.monitoring = False
        
        # AgentScope integration
        self.agentscope_url = self.config.get("AGENTSCOPE_API_URL", "http://localhost:8001")
        self.agentscope_ws_url = self.config.get("NEXT_PUBLIC_AGENTSCOPE_WS_URL", "ws://localhost:8001")
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        self.logger.info("JarvisFrontendManager initialized")
    
    def _load_package_json(self) -> Dict[str, Any]:
        """Load and parse package.json"""
        package_file = self.project_dir / "package.json"
        if not package_file.exists():
            raise FileNotFoundError("package.json not found. Are you in the correct directory?")
        
        try:
            with open(package_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid package.json: {str(e)}")
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from .env files"""
        config = {}
        env_files = [".env.local", ".env.development", ".env"]
        
        for env_file in env_files:
            env_path = self.project_dir / env_file
            if env_path.exists():
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            key, value = line.split('=', 1)
                            config[key.strip()] = value.strip().strip('"')
                            os.environ[key.strip()] = value.strip().strip('"')
        
        return config
    
    def _detect_package_manager(self) -> str:
        """Detect which package manager is being used"""
        if (self.project_dir / "pnpm-lock.yaml").exists():
            return "pnpm"
        elif (self.project_dir / "yarn.lock").exists():
            return "yarn"
        elif (self.project_dir / "package-lock.json").exists():
            return "npm"
        else:
            # Default to npm if no lock file is found
            return "npm"
    
    def _setup_logging(self) -> logging.Logger:
        """Setup comprehensive logging"""
        logger = logging.getLogger("JarvisFrontendManager")
        logger.setLevel(logging.INFO)
        
        # Clear existing handlers
        logger.handlers.clear()
        
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
        log_dir = self.project_dir / "logs"
        log_dir.mkdir(exist_ok=True)
        
        file_handler = RotatingFileHandler(
            log_dir / "jarvis_frontend.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
        
        return logger
    
    def _signal_handler(self, signum, frame):
        """Handle graceful shutdown signals"""
        self.logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self.stop_all_servers()
        sys.exit(0)
    
    def _print_banner(self):
        """Print application banner"""
        app_name = self.package_json.get("name", "Jarvis Frontend")
        app_version = self.package_json.get("version", "unknown")
        
        banner = f"""
{Colors.HEADER}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════════════════════╗
║                          Jarvis Frontend Manager                             ║
║                                                                              ║
║  🚀 Next.js Development & Production Management                              ║
║  🤖 AgentScope Integration & Real-time Features                              ║
║  🇩🇰 Danish Language & Voice Support                                        ║
║                                                                              ║
║  App: {app_name:<25} Version: {app_version:<25}     ║
║  Package Manager: {self.package_manager:<53}             ║
╚══════════════════════════════════════════════════════════════════════════════╝
{Colors.ENDC}"""
        print(banner)
    
    def _print_status(self, status: str, message: str, color: str = Colors.OKGREEN):
        """Print formatted status message"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"{Colors.OKCYAN}[{timestamp}]{Colors.ENDC} {color}[{status}]{Colors.ENDC} {message}")
    
    def _run_command(self, cmd: List[str], cwd: Optional[Path] = None, capture_output: bool = False, timeout: Optional[int] = None) -> subprocess.CompletedProcess:
        """Run a command with proper error handling"""
        cwd = cwd or self.project_dir
        
        try:
            self.logger.info(f"Running command: {' '.join(cmd)} in {cwd}")
            
            if capture_output:
                result = subprocess.run(
                    cmd,
                    cwd=cwd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    encoding='utf-8'
                )
            else:
                result = subprocess.run(
                    cmd,
                    cwd=cwd,
                    timeout=timeout
                )
            
            return result
        
        except subprocess.TimeoutExpired:
            self._print_status("TIMEOUT", f"Command timed out: {' '.join(cmd)}", Colors.WARNING)
            raise
        except Exception as e:
            self._print_status("ERROR", f"Command failed: {str(e)}", Colors.FAIL)
            raise
    
    def _start_process_background(self, cmd: List[str], process_name: str) -> subprocess.Popen:
        """Start a background process"""
        self.logger.info(f"Starting {process_name}: {' '.join(cmd)}")
        
        process = subprocess.Popen(
            cmd,
            cwd=self.project_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
        )
        
        self._print_status("SUCCESS", f"{process_name} started (PID: {process.pid})")
        return process
    
    def _stream_process_output(self, process: subprocess.Popen, process_name: str):
        """Stream process output in real-time"""
        def stream_output():
            if process and process.stdout:
                for line in iter(process.stdout.readline, ''):
                    if line:
                        line = line.strip()
                        
                        # Colorize based on content
                        if any(keyword in line.lower() for keyword in ['error', 'failed', 'exception']):
                            print(f"{Colors.FAIL}[{process_name}] {line}{Colors.ENDC}")
                        elif any(keyword in line.lower() for keyword in ['warning', 'warn']):
                            print(f"{Colors.WARNING}[{process_name}] {line}{Colors.ENDC}")
                        elif any(keyword in line.lower() for keyword in ['ready', 'compiled', 'started', 'server']):
                            print(f"{Colors.OKGREEN}[{process_name}] {line}{Colors.ENDC}")
                        else:
                            print(f"[{process_name}] {line}")
                        
                        # Log to file
                        self.logger.info(f"{process_name}: {line}")
        
        output_thread = threading.Thread(target=stream_output, daemon=True)
        output_thread.start()
        return output_thread
    
    def _wait_for_server_ready(self, port: int, timeout: int = 60, check_path: str = "/") -> bool:
        """Wait for server to be ready"""
        start_time = time.time()
        url = f"http://localhost:{port}{check_path}"
        
        while time.time() - start_time < timeout:
            try:
                response = requests.get(url, timeout=2)
                if response.status_code in [200, 404]:  # 404 is OK for Next.js dev server
                    return True
            except requests.RequestException:
                pass
            
            time.sleep(1)
            if time.time() - start_time > 10:  # Show waiting message after 10 seconds
                self._print_status("WAITING", f"Waiting for server on port {port}...")
        
        return False
    
    def _kill_process_by_port(self, port: int) -> bool:
        """Kill process using the specified port"""
        try:
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    connections = proc.net_connections()
                    for conn in connections:
                        if hasattr(conn, 'laddr') and conn.laddr and conn.laddr.port == port:
                            proc.terminate()
                            self._print_status("SUCCESS", f"Killed process {proc.pid} using port {port}")
                            return True
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            
            self._print_status("INFO", f"No process found using port {port}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error killing process by port: {str(e)}")
            return False
    
    def dev_server(self, open_browser: bool = True, background: bool = False) -> bool:
        """Start the development server"""
        if self.is_dev_server_running():
            self._print_status("INFO", "Development server is already running", Colors.WARNING)
            if open_browser:
                webbrowser.open(f"http://localhost:{self.dev_port}")
            return True
        
        self._print_status("STARTING", "Starting Next.js development server...")
        
        try:
            # Check dependencies
            if not self._check_dependencies():
                return False
            
            # Start dev server
            cmd = [self.package_manager, "run", "dev"]
            
            if background:
                self.dev_process = self._start_process_background(cmd, "Dev Server")
                self.dev_pid = self.dev_process.pid
                
                # Wait for server to be ready
                if self._wait_for_server_ready(self.dev_port):
                    self._print_status("READY", f"Development server ready at http://localhost:{self.dev_port}")
                    if open_browser:
                        time.sleep(1)  # Brief delay before opening browser
                        webbrowser.open(f"http://localhost:{self.dev_port}")
                    return True
                else:
                    self._print_status("ERROR", "Development server failed to start", Colors.FAIL)
                    return False
            else:
                # Start in foreground with real-time output
                self.dev_process = self._start_process_background(cmd, "Dev Server")
                self.dev_pid = self.dev_process.pid
                
                # Stream output
                output_thread = self._stream_process_output(self.dev_process, "Dev Server")
                
                # Wait for server to be ready and open browser
                if self._wait_for_server_ready(self.dev_port):
                    self._print_status("READY", f"Development server ready at http://localhost:{self.dev_port}")
                    if open_browser:
                        time.sleep(1)
                        webbrowser.open(f"http://localhost:{self.dev_port}")
                
                # Keep running
                try:
                    self.dev_process.wait()
                except KeyboardInterrupt:
                    self._print_status("STOPPING", "Stopping development server...")
                    self.stop_dev_server()
                
                return True
                
        except Exception as e:
            self.logger.error(f"Error starting development server: {str(e)}")
            self._print_status("ERROR", f"Failed to start development server: {str(e)}", Colors.FAIL)
            return False
    
    def stop_dev_server(self) -> bool:
        """Stop the development server"""
        if not self.is_dev_server_running():
            self._print_status("INFO", "Development server is not running", Colors.WARNING)
            return True
        
        self._print_status("STOPPING", "Stopping development server...")
        
        try:
            if self.dev_process:
                self.dev_process.terminate()
                try:
                    self.dev_process.wait(timeout=10)
                    self._print_status("SUCCESS", "Development server stopped gracefully")
                except subprocess.TimeoutExpired:
                    self.dev_process.kill()
                    self._print_status("WARNING", "Development server force-killed")
                
                self.dev_process = None
                self.dev_pid = None
            
            # Also kill any process using the dev port
            self._kill_process_by_port(self.dev_port)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error stopping development server: {str(e)}")
            self._print_status("ERROR", f"Failed to stop development server: {str(e)}", Colors.FAIL)
            return False
    
    def build_app(self, analyze: bool = False) -> bool:
        """Build the application for production"""
        self._print_status("BUILDING", "Building Next.js application for production...")
        
        try:
            # Check dependencies
            if not self._check_dependencies():
                return False
            
            # Clean previous build
            self._clean_build_artifacts()
            
            # Build command
            cmd = [self.package_manager, "run", "build"]
            
            # Run build
            start_time = time.time()
            result = self._run_command(cmd, timeout=300)  # 5 minute timeout
            build_time = time.time() - start_time
            
            if result.returncode == 0:
                self._print_status("SUCCESS", f"Build completed successfully in {build_time:.1f}s")
                
                # Show build info
                self._show_build_info()
                
                if analyze:
                    self._analyze_bundle()
                
                return True
            else:
                self._print_status("ERROR", "Build failed", Colors.FAIL)
                return False
                
        except Exception as e:
            self.logger.error(f"Error building application: {str(e)}")
            self._print_status("ERROR", f"Build failed: {str(e)}", Colors.FAIL)
            return False
    
    def start_production_server(self, background: bool = False) -> bool:
        """Start the production server"""
        if not self._check_build_exists():
            self._print_status("ERROR", "No production build found. Run 'build' first.", Colors.FAIL)
            return False
        
        if self.is_production_server_running():
            self._print_status("INFO", "Production server is already running", Colors.WARNING)
            return True
        
        self._print_status("STARTING", "Starting Next.js production server...")
        
        try:
            cmd = [self.package_manager, "run", "start"]
            
            if background:
                self.start_process = self._start_process_background(cmd, "Production Server")
                self.start_pid = self.start_process.pid
                
                # Wait for server to be ready
                if self._wait_for_server_ready(self.prod_port):
                    self._print_status("READY", f"Production server ready at http://localhost:{self.prod_port}")
                    return True
                else:
                    self._print_status("ERROR", "Production server failed to start", Colors.FAIL)
                    return False
            else:
                # Start in foreground
                self.start_process = self._start_process_background(cmd, "Production Server")
                self.start_pid = self.start_process.pid
                
                # Stream output
                output_thread = self._stream_process_output(self.start_process, "Production Server")
                
                if self._wait_for_server_ready(self.prod_port):
                    self._print_status("READY", f"Production server ready at http://localhost:{self.prod_port}")
                
                # Keep running
                try:
                    self.start_process.wait()
                except KeyboardInterrupt:
                    self._print_status("STOPPING", "Stopping production server...")
                    self.stop_production_server()
                
                return True
                
        except Exception as e:
            self.logger.error(f"Error starting production server: {str(e)}")
            self._print_status("ERROR", f"Failed to start production server: {str(e)}", Colors.FAIL)
            return False
    
    def stop_production_server(self) -> bool:
        """Stop the production server"""
        if not self.is_production_server_running():
            self._print_status("INFO", "Production server is not running", Colors.WARNING)
            return True
        
        self._print_status("STOPPING", "Stopping production server...")
        
        try:
            if self.start_process:
                self.start_process.terminate()
                try:
                    self.start_process.wait(timeout=10)
                    self._print_status("SUCCESS", "Production server stopped gracefully")
                except subprocess.TimeoutExpired:
                    self.start_process.kill()
                    self._print_status("WARNING", "Production server force-killed")
                
                self.start_process = None
                self.start_pid = None
            
            # Also kill any process using the prod port
            self._kill_process_by_port(self.prod_port)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error stopping production server: {str(e)}")
            self._print_status("ERROR", f"Failed to stop production server: {str(e)}", Colors.FAIL)
            return False
    
    def stop_all_servers(self) -> bool:
        """Stop all running servers"""
        self._print_status("STOPPING", "Stopping all servers...")
        
        success = True
        if self.is_dev_server_running():
            success &= self.stop_dev_server()
        
        if self.is_production_server_running():
            success &= self.stop_production_server()
        
        return success
    
    def is_dev_server_running(self) -> bool:
        """Check if development server is running"""
        try:
            response = requests.get(f"http://localhost:{self.dev_port}", timeout=2)
            return True
        except requests.RequestException:
            return False
    
    def is_production_server_running(self) -> bool:
        """Check if production server is running"""
        try:
            response = requests.get(f"http://localhost:{self.prod_port}", timeout=2)
            return True
        except requests.RequestException:
            return False
    
    def _check_node_installation(self) -> bool:
        """Check if Node.js and package manager are installed"""
        # Check Node.js
        try:
            result = subprocess.run(["node", "--version"], capture_output=True, text=True, timeout=5)
            if result.returncode != 0:
                self._print_status("ERROR", "Node.js is not installed or not in PATH", Colors.FAIL)
                return False
            else:
                node_version = result.stdout.strip()
                self._print_status("SUCCESS", f"Node.js found: {node_version}")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            self._print_status("ERROR", "Node.js is not installed or not in PATH", Colors.FAIL)
            self._print_status("INFO", "Please install Node.js from https://nodejs.org/")
            return False
        
        # Check package manager
        try:
            result = subprocess.run([self.package_manager, "--version"], capture_output=True, text=True, timeout=5)
            if result.returncode != 0:
                self._print_status("ERROR", f"{self.package_manager} is not available", Colors.FAIL)
                return False
            else:
                pm_version = result.stdout.strip()
                self._print_status("SUCCESS", f"Package manager found: {self.package_manager} {pm_version}")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            self._print_status("ERROR", f"{self.package_manager} is not installed or not in PATH", Colors.FAIL)
            if self.package_manager == "pnpm":
                self._print_status("INFO", "Install pnpm with: npm install -g pnpm")
            elif self.package_manager == "yarn":
                self._print_status("INFO", "Install yarn with: npm install -g yarn")
            else:
                self._print_status("INFO", "npm should be included with Node.js installation")
            return False
        
        return True
    
    def _check_dependencies(self) -> bool:
        """Check if dependencies are installed"""
        # First check if Node.js and package manager are available
        if not self._check_node_installation():
            return False
        
        node_modules = self.project_dir / "node_modules"
        
        if not node_modules.exists():
            self._print_status("ERROR", "node_modules not found. Installing dependencies...", Colors.WARNING)
            return self._install_dependencies()
        
        # Check if package.json is newer than node_modules
        package_json_time = (self.project_dir / "package.json").stat().st_mtime
        node_modules_time = node_modules.stat().st_mtime
        
        if package_json_time > node_modules_time:
            self._print_status("WARNING", "package.json is newer than node_modules. Consider reinstalling dependencies.", Colors.WARNING)
        
        return True
    
    def _install_dependencies(self) -> bool:
        """Install project dependencies"""
        self._print_status("INSTALLING", "Installing dependencies...")
        
        try:
            cmd = [self.package_manager, "install"]
            result = self._run_command(cmd, timeout=300)  # 5 minute timeout
            
            if result.returncode == 0:
                self._print_status("SUCCESS", "Dependencies installed successfully")
                return True
            else:
                self._print_status("ERROR", "Failed to install dependencies", Colors.FAIL)
                return False
                
        except Exception as e:
            self.logger.error(f"Error installing dependencies: {str(e)}")
            self._print_status("ERROR", f"Failed to install dependencies: {str(e)}", Colors.FAIL)
            return False
    
    def _check_build_exists(self) -> bool:
        """Check if production build exists"""
        build_dir = self.project_dir / ".next"
        return build_dir.exists()
    
    def _clean_build_artifacts(self):
        """Clean build artifacts"""
        self._print_status("CLEANING", "Cleaning build artifacts...")
        
        artifacts = [".next", "out", "dist"]
        
        for artifact in artifacts:
            artifact_path = self.project_dir / artifact
            if artifact_path.exists():
                shutil.rmtree(artifact_path)
                self._print_status("CLEANED", f"Removed {artifact}")
    
    def _show_build_info(self):
        """Show build information"""
        build_dir = self.project_dir / ".next"
        
        if not build_dir.exists():
            return
        
        # Calculate build size
        total_size = 0
        for root, dirs, files in os.walk(build_dir):
            for file in files:
                file_path = os.path.join(root, file)
                total_size += os.path.getsize(file_path)
        
        size_mb = total_size / (1024 * 1024)
        
        print(f"\n{Colors.BOLD}Build Information:{Colors.ENDC}")
        print("=" * 30)
        print(f"Build size: {size_mb:.1f} MB")
        print(f"Build directory: {build_dir}")
        
        # Check for build output file
        build_output = build_dir / "build-output.json"
        if build_output.exists():
            try:
                with open(build_output, 'r') as f:
                    output_data = json.load(f)
                    if 'pages' in output_data:
                        print(f"Pages built: {len(output_data['pages'])}")
            except:
                pass
    
    def _analyze_bundle(self):
        """Analyze bundle if analyzer is available"""
        analyzer_script = self.package_json.get("scripts", {}).get("analyze")
        
        if analyzer_script:
            self._print_status("ANALYZING", "Running bundle analyzer...")
            try:
                cmd = [self.package_manager, "run", "analyze"]
                self._run_command(cmd, timeout=60)
            except Exception as e:
                self._print_status("WARNING", f"Bundle analysis failed: {str(e)}", Colors.WARNING)
    
    def run_tests(self) -> bool:
        """Run tests"""
        self._print_status("TESTING", "Running tests...")
        
        try:
            cmd = [self.package_manager, "run", "test"]
            result = self._run_command(cmd, timeout=120)
            
            if result.returncode == 0:
                self._print_status("SUCCESS", "All tests passed")
                return True
            else:
                self._print_status("ERROR", "Some tests failed", Colors.FAIL)
                return False
                
        except Exception as e:
            self.logger.error(f"Error running tests: {str(e)}")
            self._print_status("ERROR", f"Test execution failed: {str(e)}", Colors.FAIL)
            return False
    
    def run_lint(self) -> bool:
        """Run linting and type checking"""
        self._print_status("LINTING", "Running ESLint and TypeScript checks...")
        
        success = True
        
        # Run ESLint
        try:
            cmd = [self.package_manager, "run", "lint"]
            result = self._run_command(cmd, timeout=60)
            
            if result.returncode == 0:
                self._print_status("SUCCESS", "ESLint checks passed")
            else:
                self._print_status("WARNING", "ESLint found issues", Colors.WARNING)
                success = False
        except Exception as e:
            self._print_status("ERROR", f"ESLint failed: {str(e)}", Colors.FAIL)
            success = False
        
        # Run TypeScript check
        try:
            cmd = [self.package_manager, "run", "typecheck"]
            result = self._run_command(cmd, timeout=60)
            
            if result.returncode == 0:
                self._print_status("SUCCESS", "TypeScript checks passed")
            else:
                self._print_status("WARNING", "TypeScript found issues", Colors.WARNING)
                success = False
        except Exception as e:
            self._print_status("ERROR", f"TypeScript check failed: {str(e)}", Colors.FAIL)
            success = False
        
        return success
    
    def test_agentscope_integration(self) -> bool:
        """Test integration with AgentScope backend"""
        self._print_status("TESTING", "Testing AgentScope backend integration...")
        
        success = True
        
        # Test HTTP API
        try:
            response = requests.get(f"{self.agentscope_url}/health", timeout=5)
            if response.status_code == 200:
                self._print_status("✓", "AgentScope HTTP API connection working", Colors.OKGREEN)
                
                # Check response data
                data = response.json()
                if 'jarvis_model' in data:
                    self._print_status("INFO", f"Jarvis model: {data['jarvis_model']}")
                if 'active_sessions' in data:
                    self._print_status("INFO", f"Active sessions: {data['active_sessions']}")
            else:
                self._print_status("✗", f"AgentScope API returned {response.status_code}", Colors.WARNING)
                success = False
        except requests.RequestException as e:
            self._print_status("✗", f"AgentScope API connection failed: {str(e)}", Colors.FAIL)
            success = False
        
        # Test WebSocket (basic connectivity)
        try:
            import websocket
            
            def on_open(ws):
                self._print_status("✓", "AgentScope WebSocket connection working", Colors.OKGREEN)
                ws.close()
            
            def on_error(ws, error):
                self._print_status("✗", f"AgentScope WebSocket error: {str(error)}", Colors.FAIL)
            
            ws_url = self.agentscope_ws_url.replace('ws://', 'ws://').replace('https://', 'wss://') + "/agent/status"
            ws = websocket.WebSocketApp(
                ws_url,
                on_open=on_open,
                on_error=on_error
            )
            ws.run_forever(timeout=5)
            
        except Exception as e:
            self._print_status("✗", f"WebSocket test failed: {str(e)}", Colors.WARNING)
            success = False
        
        return success
    
    def manage_dependencies(self, action: str = "check") -> bool:
        """Manage project dependencies"""
        if action == "check":
            self._print_status("CHECKING", "Checking dependencies...")
            
            try:
                cmd = [self.package_manager, "outdated"]
                result = self._run_command(cmd, capture_output=True)
                
                if result.stdout:
                    print(f"\n{Colors.BOLD}Outdated Dependencies:{Colors.ENDC}")
                    print(result.stdout)
                else:
                    self._print_status("SUCCESS", "All dependencies are up to date")
                
                return True
            except Exception as e:
                self._print_status("ERROR", f"Dependency check failed: {str(e)}", Colors.FAIL)
                return False
        
        elif action == "update":
            self._print_status("UPDATING", "Updating dependencies...")
            
            try:
                cmd = [self.package_manager, "update"]
                result = self._run_command(cmd, timeout=300)
                
                if result.returncode == 0:
                    self._print_status("SUCCESS", "Dependencies updated successfully")
                    return True
                else:
                    self._print_status("ERROR", "Failed to update dependencies", Colors.FAIL)
                    return False
            except Exception as e:
                self._print_status("ERROR", f"Dependency update failed: {str(e)}", Colors.FAIL)
                return False
        
        elif action == "install":
            return self._install_dependencies()
        
        else:
            self._print_status("ERROR", f"Unknown dependency action: {action}", Colors.FAIL)
            return False
    
    def show_status(self):
        """Show detailed application status"""
        self._print_banner()
        
        print(f"\n{Colors.BOLD}Application Status:{Colors.ENDC}")
        print("=" * 50)
        
        # Basic info
        print(f"Project: {self.package_json.get('name', 'Unknown')}")
        print(f"Version: {self.package_json.get('version', 'Unknown')}")
        print(f"Description: {self.package_json.get('description', 'No description')}")
        print(f"Package Manager: {self.package_manager}")
        
        # Server status
        dev_running = self.is_dev_server_running()
        prod_running = self.is_production_server_running()
        
        dev_color = Colors.OKGREEN if dev_running else Colors.FAIL
        prod_color = Colors.OKGREEN if prod_running else Colors.FAIL
        
        print(f"\n{Colors.BOLD}Server Status:{Colors.ENDC}")
        print(f"Development Server: {dev_color}{'RUNNING' if dev_running else 'STOPPED'}{Colors.ENDC} (Port {self.dev_port})")
        print(f"Production Server: {prod_color}{'RUNNING' if prod_running else 'STOPPED'}{Colors.ENDC} (Port {self.prod_port})")
        
        if dev_running:
            print(f"  └─ URL: http://localhost:{self.dev_port}")
        if prod_running:
            print(f"  └─ URL: http://localhost:{self.prod_port}")
        
        # Build status
        build_exists = self._check_build_exists()
        build_color = Colors.OKGREEN if build_exists else Colors.WARNING
        
        print(f"\n{Colors.BOLD}Build Status:{Colors.ENDC}")
        print(f"Production Build: {build_color}{'EXISTS' if build_exists else 'NOT BUILT'}{Colors.ENDC}")
        
        if build_exists:
            self._show_build_info()
        
        # Dependencies status
        node_modules_exists = (self.project_dir / "node_modules").exists()
        deps_color = Colors.OKGREEN if node_modules_exists else Colors.FAIL
        
        print(f"\n{Colors.BOLD}Dependencies:{Colors.ENDC}")
        print(f"node_modules: {deps_color}{'INSTALLED' if node_modules_exists else 'NOT INSTALLED'}{Colors.ENDC}")
        
        # Process information
        if self.dev_pid or self.start_pid:
            print(f"\n{Colors.BOLD}Process Information:{Colors.ENDC}")
            
            if self.dev_pid:
                try:
                    proc = psutil.Process(self.dev_pid)
                    print(f"Dev Server PID: {self.dev_pid}")
                    print(f"  └─ CPU: {proc.cpu_percent()}%")
                    print(f"  └─ Memory: {proc.memory_info().rss / 1024 / 1024:.1f} MB")
                except psutil.NoSuchProcess:
                    print(f"Dev Server PID: {self.dev_pid} (process not found)")
            
            if self.start_pid:
                try:
                    proc = psutil.Process(self.start_pid)
                    print(f"Production Server PID: {self.start_pid}")
                    print(f"  └─ CPU: {proc.cpu_percent()}%")
                    print(f"  └─ Memory: {proc.memory_info().rss / 1024 / 1024:.1f} MB")
                except psutil.NoSuchProcess:
                    print(f"Production Server PID: {self.start_pid} (process not found)")
        
        # Configuration
        print(f"\n{Colors.BOLD}Configuration:{Colors.ENDC}")
        print(f"AgentScope API: {self.agentscope_url}")
        print(f"WebSocket URL: {self.agentscope_ws_url}")
        
        # Environment variables (masked)
        env_vars = ["OPENAI_API_KEY", "NODE_ENV", "NEXT_PUBLIC_DEBUG"]
        for var in env_vars:
            value = self.config.get(var, "Not set")
            if "KEY" in var and value != "Not set":
                value = value[:8] + "*" * (len(value) - 16) + value[-8:] if len(value) > 16 else "*" * len(value)
            print(f"{var}: {value}")
        
        print()
    
    def show_config(self):
        """Show configuration details"""
        print(f"\n{Colors.BOLD}Configuration Details:{Colors.ENDC}")
        print("=" * 40)
        
        # Package.json scripts
        scripts = self.package_json.get("scripts", {})
        if scripts:
            print(f"\n{Colors.BOLD}Available Scripts:{Colors.ENDC}")
            for script, command in scripts.items():
                print(f"  {script}: {command}")
        
        # Environment configuration
        if self.config:
            print(f"\n{Colors.BOLD}Environment Variables:{Colors.ENDC}")
            for key, value in sorted(self.config.items()):
                if "KEY" in key.upper() or "SECRET" in key.upper():
                    value = value[:8] + "*" * (len(value) - 16) + value[-8:] if len(value) > 16 else "*" * len(value)
                print(f"  {key}: {value}")
        
        # Dependencies
        deps = self.package_json.get("dependencies", {})
        dev_deps = self.package_json.get("devDependencies", {})
        
        if deps:
            print(f"\n{Colors.BOLD}Dependencies ({len(deps)}):{Colors.ENDC}")
            for dep, version in list(deps.items())[:10]:  # Show first 10
                print(f"  {dep}: {version}")
            if len(deps) > 10:
                print(f"  ... and {len(deps) - 10} more")
        
        if dev_deps:
            print(f"\n{Colors.BOLD}Dev Dependencies ({len(dev_deps)}):{Colors.ENDC}")
            for dep, version in list(dev_deps.items())[:10]:  # Show first 10
                print(f"  {dep}: {version}")
            if len(dev_deps) > 10:
                print(f"  ... and {len(dev_deps) - 10} more")
    
    def monitor_application(self):
        """Live monitoring mode"""
        self._print_status("MONITORING", "Starting live monitoring mode. Press Ctrl+C to exit.")
        self.monitoring = True
        
        try:
            while self.monitoring:
                os.system('cls' if os.name == 'nt' else 'clear')  # Clear screen
                
                print(f"{Colors.HEADER}Live Application Monitoring{Colors.ENDC}")
                print("=" * 60)
                print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Server status
                dev_running = self.is_dev_server_running()
                prod_running = self.is_production_server_running()
                
                dev_color = Colors.OKGREEN if dev_running else Colors.FAIL
                prod_color = Colors.OKGREEN if prod_running else Colors.FAIL
                
                print(f"\nDev Server: {dev_color}{'ONLINE' if dev_running else 'OFFLINE'}{Colors.ENDC} (:{self.dev_port})")
                print(f"Prod Server: {prod_color}{'ONLINE' if prod_running else 'OFFLINE'}{Colors.ENDC} (:{self.prod_port})")
                
                # AgentScope connectivity
                try:
                    response = requests.get(f"{self.agentscope_url}/health", timeout=2)
                    backend_status = "CONNECTED" if response.status_code == 200 else "ERROR"
                    backend_color = Colors.OKGREEN if response.status_code == 200 else Colors.WARNING
                except:
                    backend_status = "DISCONNECTED"
                    backend_color = Colors.FAIL
                
                print(f"AgentScope Backend: {backend_color}{backend_status}{Colors.ENDC}")
                
                # Process info
                if self.dev_pid:
                    try:
                        proc = psutil.Process(self.dev_pid)
                        print(f"Dev Process: PID {self.dev_pid} | CPU {proc.cpu_percent()}% | Memory {proc.memory_info().rss / 1024 / 1024:.1f} MB")
                    except psutil.NoSuchProcess:
                        print(f"Dev Process: PID {self.dev_pid} (not found)")
                
                if self.start_pid:
                    try:
                        proc = psutil.Process(self.start_pid)
                        print(f"Prod Process: PID {self.start_pid} | CPU {proc.cpu_percent()}% | Memory {proc.memory_info().rss / 1024 / 1024:.1f} MB")
                    except psutil.NoSuchProcess:
                        print(f"Prod Process: PID {self.start_pid} (not found)")
                
                print(f"\n{Colors.OKCYAN}Press Ctrl+C to exit monitoring{Colors.ENDC}")
                time.sleep(3)  # Update every 3 seconds
                
        except KeyboardInterrupt:
            self.monitoring = False
            self._print_status("INFO", "Monitoring stopped")
    
    def show_logs(self, lines: int = 50):
        """Show recent logs"""
        log_file = self.project_dir / "logs" / "jarvis_frontend.log"
        
        if not log_file.exists():
            self._print_status("WARNING", "Log file not found", Colors.WARNING)
            return
        
        print(f"\n{Colors.BOLD}Recent Logs (last {lines} lines):{Colors.ENDC}")
        print("=" * 60)
        
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
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
    
    def clean_project(self):
        """Clean project artifacts"""
        self._print_status("CLEANING", "Cleaning project artifacts...")
        
        # Stop servers first
        self.stop_all_servers()
        
        # Clean build artifacts
        self._clean_build_artifacts()
        
        # Clean node_modules if requested
        response = input(f"\n{Colors.WARNING}Remove node_modules? (y/N): {Colors.ENDC}")
        if response.lower() == 'y':
            node_modules = self.project_dir / "node_modules"
            if node_modules.exists():
                shutil.rmtree(node_modules)
                self._print_status("CLEANED", "Removed node_modules")
        
        # Clean logs
        logs_dir = self.project_dir / "logs"
        if logs_dir.exists():
            for log_file in logs_dir.glob("*.log*"):
                log_file.unlink()
            self._print_status("CLEANED", "Cleared log files")
        
        self._print_status("SUCCESS", "Project cleaned successfully")
    
    def interactive_mode(self):
        """Interactive terminal mode"""
        self._print_banner()
        self._print_status("INTERACTIVE", "Entering interactive mode. Type 'help' for commands.")
        
        while True:
            try:
                command = input(f"\n{Colors.OKCYAN}jarvis-frontend>{Colors.ENDC} ").strip().lower()
                
                if command == "help":
                    self._show_help()
                elif command == "dev":
                    self.dev_server(background=True)
                elif command == "build":
                    self.build_app()
                elif command == "start":
                    self.start_production_server(background=True)
                elif command == "stop":
                    self.stop_all_servers()
                elif command == "status":
                    self.show_status()
                elif command == "config":
                    self.show_config()
                elif command == "test":
                    self.run_tests()
                elif command == "lint":
                    self.run_lint()
                elif command == "deps":
                    self.manage_dependencies("check")
                elif command == "monitor":
                    self.monitor_application()
                elif command == "logs":
                    self.show_logs()
                elif command == "clean":
                    self.clean_project()
                elif command == "backend":
                    self.test_agentscope_integration()
                elif command in ["exit", "quit"]:
                    self._print_status("GOODBYE", "Shutting down Jarvis Frontend Manager...")
                    self.stop_all_servers()
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

{Colors.OKGREEN}Development:{Colors.ENDC}
  dev       - Start development server
  build     - Build for production
  start     - Start production server
  stop      - Stop all servers
  
{Colors.OKGREEN}Quality:{Colors.ENDC}
  test      - Run tests
  lint      - Run ESLint and TypeScript checks
  
{Colors.OKGREEN}Management:{Colors.ENDC}
  deps      - Check dependencies
  clean     - Clean project artifacts
  
{Colors.OKGREEN}Monitoring:{Colors.ENDC}
  status    - Show application status
  config    - Show configuration
  monitor   - Live monitoring mode (Ctrl+C to exit)
  logs      - Show recent logs
  backend   - Test AgentScope integration
  
{Colors.OKGREEN}General:{Colors.ENDC}
  help      - Show this help
  exit      - Exit interactive mode

{Colors.BOLD}Frontend Features:{Colors.ENDC}
  • Next.js development and production servers
  • Real-time build monitoring and optimization
  • AgentScope backend integration testing
  • Danish language and voice support
  • Tailwind CSS 4.1 with glassmorphism effects
  • WebSocket real-time features
  • Comprehensive dependency management
"""
        print(help_text)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Jarvis Frontend Manager - Advanced Next.js Management",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        "command",
        nargs="?",
        choices=["dev", "build", "start", "stop", "test", "lint", "deps", "status", "config", "monitor", "logs", "clean", "deploy", "interactive"],
        default="interactive",
        help="Command to execute"
    )
    
    parser.add_argument("--dev-port", type=int, default=3005, help="Development server port")
    parser.add_argument("--prod-port", type=int, default=3002, help="Production server port")
    parser.add_argument("--no-browser", action="store_true", help="Don't open browser automatically")
    parser.add_argument("--background", action="store_true", help="Run in background")
    parser.add_argument("--analyze", action="store_true", help="Run bundle analyzer after build")
    
    args = parser.parse_args()
    
    try:
        # Create frontend manager
        manager = JarvisFrontendManager()
        
        # Apply CLI arguments
        manager.dev_port = args.dev_port
        manager.prod_port = args.prod_port
        
        # Execute command
        if args.command == "dev":
            manager.dev_server(open_browser=not args.no_browser, background=args.background)
        
        elif args.command == "build":
            manager.build_app(analyze=args.analyze)
        
        elif args.command == "start":
            manager.start_production_server(background=args.background)
        
        elif args.command == "stop":
            manager.stop_all_servers()
        
        elif args.command == "test":
            manager.run_tests()
            manager.test_agentscope_integration()
        
        elif args.command == "lint":
            manager.run_lint()
        
        elif args.command == "deps":
            action = input("Choose action (check/update/install) [check]: ").strip().lower() or "check"
            manager.manage_dependencies(action)
        
        elif args.command == "status":
            manager.show_status()
        
        elif args.command == "config":
            manager.show_config()
        
        elif args.command == "monitor":
            manager.monitor_application()
        
        elif args.command == "logs":
            manager.show_logs()
        
        elif args.command == "clean":
            manager.clean_project()
        
        elif args.command == "deploy":
            # Build and start production server
            if manager.build_app():
                manager.start_production_server()
        
        elif args.command == "interactive":
            manager.interactive_mode()
    
    except KeyboardInterrupt:
        if 'manager' in locals():
            manager.logger.info("Interrupted by user")
            manager.stop_all_servers()
    
    except Exception as e:
        print(f"{Colors.FAIL}Error: {str(e)}{Colors.ENDC}")
        if 'manager' in locals():
            manager.logger.error(f"Unexpected error: {str(e)}")

if __name__ == "__main__":
    main()
