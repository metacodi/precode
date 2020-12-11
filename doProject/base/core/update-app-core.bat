@echo off
cls

@echo.
@echo ==========================================
@echo Updating 'app-core' repository
@echo ------------------------------------------

Set dir=src\app\core

@echo Deleting folder '%dir%'...
@echo   rmdir "%dir%" /s /q
rmdir "%dir%" /s /q

@echo Cloning git repository 'http://gitlab.codi.ovh/tools/app-core.git'
@echo   git clone http://gitlab.codi.ovh/tools/app-core  %dir%
git clone http://gitlab.codi.ovh/tools/app-core  %dir%

@echo Deleting '.git' folder...
@echo   rmdir /s /q "%dir%\.git"
rmdir /s /q "%dir%\.git"


@echo Deleting '.gitattributes' file...
@echo   del /f /q "%dir%\.gitattributes"
del /f /q "%dir%\.gitattributes"

@echo Deleting 'app-core.*' icon files...
@echo   del /f /q "%dir%\app-core.png"
del /f /q "%dir%\app-core.png"
@echo   del /f /q "%dir%\app-core.svg"
del /f /q "%dir%\app-core.svg"

@echo Coping script files...
xcopy "%dir%\update-app-core.bat" "update-app-core.bat" /K /H /Y
xcopy "%dir%\update-app-core.sh" "update-app-core.sh" /K /H /Y


@echo.
@echo ------------------------------------------
@echo Repository 'app-core' updated successful!
@echo ==========================================
@echo.
@echo.

