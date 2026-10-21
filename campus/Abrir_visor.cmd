@echo off
cd /d "%~dp0"
start "Visor UAM" /min node server.mjs
start "" "http://127.0.0.1:8768"
