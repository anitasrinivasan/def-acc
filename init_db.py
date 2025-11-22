# init_db.py
#
# Simple SQLite schema + seed data for Slipstream.
# Run this once (python init_db.py) from the repo root to create slipstream.db.

import json
import sqlite3
from datetime import datetime

DB_PATH = "slipstream.db"  # SQLite file that will be created

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# 1) Hosts table (roughly matches HostState)
c.execute("""
CREATE TABLE IF NOT EXISTS hosts (
    ip TEXT PRIMARY KEY,
    label TEXT,
    tier TEXT,
    status TEXT,
    last_seen TEXT,
    state_json TEXT      -- raw JSON from agents/frontend perspective
);
""")

# 2) Suggestions table (roughly matches Suggestion)
c.execute("""
CREATE TABLE IF NOT EXISTS suggestions (
    id TEXT PRIMARY KEY,
    ip TEXT,
    title TEXT,
    description TEXT,
    severity INTEGER,
    suggested_command TEXT,
    created_at TEXT,
    status TEXT,
    dependencies_json TEXT,
    FOREIGN KEY (ip) REFERENCES hosts(ip)
);
""")

# 3) Chat messages table (roughly matches ChatMessage)
c.execute("""
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT,           -- 'user' | 'agent' | 'system'
    text TEXT,
    timestamp TEXT
);
""")

# --- Optional: seed some demo data so the UI has something to show ---

now = datetime.utcnow().isoformat()

hosts = [
    {
        "ip": "10.0.1.100",
        "label": "WEB01",
        "tier": "web",
        "status": "online",
        "last_seen": now,
        "state": {
            "services": {
                "IIS": {"version": "10.0"},
                "flask": {"debug": False, "port": 5000}
            },
            "users": {
                "admins": ["alice", "bob"],
                "regular": ["charlie"]
            }
        }
    },
    {
        "ip": "10.0.1.200",
        "label": "DB01",
        "tier": "db",
        "status": "online",
        "last_seen": now,
        "state": {}
    }
]

for h in hosts:
    c.execute(
        """
        INSERT OR REPLACE INTO hosts (ip, label, tier, status, last_seen, state_json)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (h["ip"], h["label"], h["tier"], h["status"], h["last_seen"], json.dumps(h["state"]))
    )

suggestions = [
    {
        "id": "s1",
        "ip": "10.0.1.100",
        "title": "Suspicious IIS configuration detected",
        "description": "Directory browsing enabled on IIS.",
        "severity": 7,
        "suggested_command": "Set-WebConfigurationProperty ...",
        "status": "open",
        "dependencies": []
    },
    {
        "id": "s2",
        "ip": "10.0.1.100",
        "title": "Flask debug mode enabled",
        "description": "Flask app is running with debug=True.",
        "severity": 10,
        "suggested_command": "set FLASK_DEBUG=0",
        "status": "open",
        "dependencies": [
            {"targetSuggestionId": "s1", "relation": "worsens"}
        ]
    }
]

for s in suggestions:
    c.execute(
        """
        INSERT OR REPLACE INTO suggestions
        (id, ip, title, description, severity, suggested_command, created_at, status, dependencies_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            s["id"],
            s["ip"],
            s["title"],
            s["description"],
            s["severity"],
