@echo off

set DIR=%~dp0.
set workspace=%DIR%\workspace

if exist "%workspace%" rmdir /Q /S "%workspace%"
mkdir "%workspace%"
cd "%workspace%"

call npm init -y
call npm install --save "%DIR%\.."
cls

set PATH=%workspace%\node_modules\.bin;%PATH%

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: a movie
rem :: =================================

call tubidl -mc 5 -u "https://tubitv.com/movies/465487/citizenfour"

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: an episode
rem :: =================================

call tubidl -mc 5 -u "https://tubitv.com/tv-shows/498780/s01_e02_the_grand_deception_part_2"

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: a series
rem :: =================================

call tubidl -mc 5 -u "https://tubitv.com/series/4068/the_greatest_american_hero"

rem :: -------------------------------------------------------------------------

echo.
pause
