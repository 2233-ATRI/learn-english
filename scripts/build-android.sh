#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
ANDROID_SDK="${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}"
BUILD_TOOLS="$ANDROID_SDK/build-tools/35.0.0"
ANDROID_JAR="$ANDROID_SDK/platforms/android-35/android.jar"
TASK_JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 21)}"
export JAVA_HOME="$TASK_JAVA_HOME"
export PATH="$TASK_JAVA_HOME/bin:$PATH"
node scripts/build.mjs
mkdir -p build/android/classes build/android/dex build/android/assets build/android/generated releases .signing
chmod 700 .signing
cp dist/index.html build/android/assets/index.html
cp dist/THIRD_PARTY_NOTICES.txt build/android/assets/THIRD_PARTY_NOTICES.txt
"$BUILD_TOOLS/aapt2" compile --dir native/android/res -o build/android/resources.zip
"$BUILD_TOOLS/aapt2" link -o build/android/base.apk -I "$ANDROID_JAR" --manifest native/android/AndroidManifest.xml --min-sdk-version 26 --target-sdk-version 35 --java build/android/generated -A build/android/assets build/android/resources.zip
"$TASK_JAVA_HOME/bin/javac" -encoding UTF-8 -source 11 -target 11 -classpath "$ANDROID_JAR" -d build/android/classes native/android/src/app/shici/english2/MainActivity.java
"$BUILD_TOOLS/d8" --release --min-api 26 --lib "$ANDROID_JAR" --output build/android/dex build/android/classes/app/shici/english2/*.class
cp build/android/base.apk build/android/unsigned.apk
(cd build/android/dex && /usr/bin/zip -q -j ../unsigned.apk classes*.dex)
"$BUILD_TOOLS/zipalign" -f -p 4 build/android/unsigned.apk build/android/aligned.apk
if ! test -f .signing/shici-release.p12; then
  node -e "const fs=require('fs'),crypto=require('crypto');fs.writeFileSync('.signing/password.txt',crypto.randomBytes(32).toString('base64'),{mode:0o600});"
  "$TASK_JAVA_HOME/bin/keytool" -genkeypair -keystore .signing/shici-release.p12 -storetype PKCS12 -storepass:file .signing/password.txt -alias shici -keyalg RSA -keysize 3072 -validity 10000 -dname "CN=Shici Local Release, O=Shici, C=CN" -noprompt
  chmod 600 .signing/shici-release.p12
fi
"$BUILD_TOOLS/apksigner" sign --ks .signing/shici-release.p12 --ks-key-alias shici --ks-pass file:.signing/password.txt --out "releases/拾词英语二-1.2.0-Android.apk" build/android/aligned.apk
"$BUILD_TOOLS/apksigner" verify --verbose "releases/拾词英语二-1.2.0-Android.apk"
"$BUILD_TOOLS/aapt" dump badging "releases/拾词英语二-1.2.0-Android.apk" > build/android/apk-info.txt
echo "Built and verified Android APK. Keep the signing key for future updates."
