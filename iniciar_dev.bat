@echo off
cd /d "%~dp0"
title Neon Zenith: Tower of Light - Dev Server
echo [*] Iniciando servidor Vite para testes em http://localhost:3012...
call npm run dev
pause
