@echo off
if exist "%~dp0serve.py" (
    python "%~dp0serve.py" 3000
) else (
    python -m http.server 3000 --bind 127.0.0.1
)
