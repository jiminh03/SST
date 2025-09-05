@echo off
cls

echo.===================================================
echo.      Setting Up Git Commit Template
echo.===================================================
echo.

echo.[1/1] Setting up project commit template...
git config commit.template .gitlab/.gitmessage.txt
echo.[SUCCESS] Commit template has been set to '.gitlab/.gitmessage.txt'.

echo.
echo.===================================================
echo.      Configuration is complete.
echo.===================================================
echo.
pause