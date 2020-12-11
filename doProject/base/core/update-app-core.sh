echo ""
echo "=========================================="
echo "Updating 'app-core' repository"
echo "------------------------------------------"

echo "Deleting folder 'src/app/core'..."
echo "  rm -Rf src/app/core"
rm -Rf src/app/core

echo "Cloning git repository 'http://gitlab.codi.ovh/tools/app-core.git'"
echo "  git clone http://gitlab.codi.ovh/tools/app-core src/app/core"
git clone http://gitlab.codi.ovh/tools/app-core src/app/core

echo "Deleting '.git' folder..."
echo "  rm -Rf src/app/core/.git"
rm -Rf src/app/core/.git

echo "Deleting 'app-core.*' icon files..."
echo "  rm src/app/core/.gitattributes"
rm src/app/core/.gitattributes

echo "Deleting 'app-core.*' icon files..."
echo "  rm src/app/core/app-core.png"
rm src/app/core/app-core.png

echo "Deleting 'app-core.*' icon files..."
echo "  rm src/app/core/app-core.svg"
rm src/app/core/app-core.svg

echo "Coping script files..."
echo "  cp src/app/core/update-app-core.bat update-app-core.bat"
cp src/app/core/update-app-core.bat update-app-core.bat
echo "  chmod +x update-app-core.bat"
chmod +x update-app-core.bat
echo "  cp src/app/core/update-app-core.sh update-app-core.sh"
cp src/app/core/update-app-core.sh update-app-core.sh
echo "  chmod +x update-app-core.sh"
chmod +x update-app-core.sh

echo "------------------------------------------"
echo "Repository 'app-core' updated successful!"
echo "=========================================="
