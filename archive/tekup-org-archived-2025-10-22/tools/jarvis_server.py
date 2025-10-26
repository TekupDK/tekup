#!/usr/bin/env python3
import argparse, os, subprocess, sys, signal, time, logging
from pathlib import Path

BASE = Path(__file__).resolve().parent
RUN_DIR = BASE / ".run"
LOG_DIR = BASE / "logs"
PID_FILE = RUN_DIR / "jarvis.pid"
LOG_FILE = LOG_DIR / "jarvis.log"

def ensure_dirs():
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

def is_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False

def read_pid():
    if PID_FILE.exists():
        try:
            return int(PID_FILE.read_text().strip())
        except Exception:
            return None
    return None

def start():
    ensure_dirs()
    if PID_FILE.exists():
        pid = read_pid()
        if pid and is_running(pid):
            print(f"Jarvis backend already running (PID {pid})")
            return 0
        else:
            PID_FILE.unlink(missing_ok=True)

    cmd = os.getenv("JARVIS_CMD", "uvicorn agentscope_enhanced.api:app --host 0.0.0.0 --port 8080")
    env = os.environ.copy()
    with open(LOG_FILE, "a", encoding="utf-8") as logf:
        logf.write(f"\n=== START {time.asctime()} ===\n")
        proc = subprocess.Popen(cmd, shell=True, stdout=logf, stderr=logf, env=env)
        PID_FILE.write_text(str(proc.pid))
        print(f"Started Jarvis backend PID {proc.pid} with command: {cmd}")
    time.sleep(1)
    return 0

def stop():
    pid = read_pid()
    if not pid:
        print("No PID file; Jarvis backend not running?")
        return 0
    try:
        if os.name == "nt":
            subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], check=False)
        else:
            os.kill(pid, signal.SIGTERM)
        time.sleep(1)
    except Exception as e:
        print(f"Error stopping process: {e}")
    finally:
        PID_FILE.unlink(missing_ok=True)
        print("Stopped Jarvis backend (if it was running).")
    return 0

def status():
    pid = read_pid()
    if pid and is_running(pid):
        print(f"Jarvis backend is running (PID {pid})")
        return 0
    print("Jarvis backend is not running")
    return 1

def restart():
    stop()
    return start()

def main():
    parser = argparse.ArgumentParser(description="Manage AgentScope Enhanced backend server for Jarvis FM")
    parser.add_argument("action", choices=["start", "stop", "restart", "status"])
    args = parser.parse_args()
    if args.action == "start": sys.exit(start())
    if args.action == "stop": sys.exit(stop())
    if args.action == "restart": sys.exit(restart())
    if args.action == "status": sys.exit(status())

if __name__ == "__main__":
    main()
