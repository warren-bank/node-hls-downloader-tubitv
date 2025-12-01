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
rem :: download a movie
rem :: =================================

call tubidl -q -mc 5 -u "https://tubitv.com/movies/300443/1984"

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: download an episode
rem :: =================================

call tubidl -q -mc 5 -u "https://tubitv.com/tv-shows/200255733/s01-e01-where-is-everybody"

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: download a series
rem :: =================================

call tubidl -mc 5 -u "https://tubitv.com/series/300017350/the-twilight-zone"

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: print a trace of the operations
rem :: that would occur IF a series
rem :: were to be downloaded
rem :: =================================

call tubidl -dr -ll 1 -u "https://tubitv.com/series/300017350/the-twilight-zone"
call tubidl -dr -ll 2 -u "https://tubitv.com/series/300017350/the-twilight-zone"
call tubidl -dr -ll 3 -u "https://tubitv.com/series/300017350/the-twilight-zone"

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: download a series (advanced)
rem :: =================================

call tubidl -dr -ll 1 -u "https://tubitv.com/series/300017350/the-twilight-zone" >"episode_urls.txt"
call tubidl -dr -ll 2 -u "https://tubitv.com/series/300017350/the-twilight-zone" >"convert_mp4s.bat"

call tubidl -nm -mc 5 -i "episode_urls.txt" >"log.txt" 2>&1

call "convert_mp4s.bat"

rem :: -------------------------------------------------------------------------

echo.
pause
