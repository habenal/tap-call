@echo off
echo Starting Ngrok for TapCall...
cd /d C:\tap-call
ngrok http 3000
pause