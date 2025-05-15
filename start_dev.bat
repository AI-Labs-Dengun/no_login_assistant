@echo off
REM Change directory to the script's location (my-chat-app)
cd /d "%~dp0"

REM Start the Next.js development server
echo Starting Next.js development server...
npx next dev 