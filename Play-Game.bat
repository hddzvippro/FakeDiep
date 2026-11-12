@echo off
title Arras.io 2D Tank Arena
color 0b
echo ======================================================================
echo    ARRAS.IO 2D TANK ARENA - WINDOWS LAUNCHER
echo ======================================================================
echo Dang khoi chay game...
echo Trinh duyet se tu dong mo len http://localhost:3000
if exist "arras-io-tank-arena.exe" (
    start "" "arras-io-tank-arena.exe"
) else (
    start http://localhost:3000
    npm run dev
)
