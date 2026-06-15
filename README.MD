README
Požadavky
Node.js 20 nebo vyšší
npm 14.0 nebo vyšší
Pro Android build: Android Studio + JDK 17

1) Vytvoření projektu
ionic start <název> blank --type=angular
	- zvolit Standalone
2) cd do složky
	cd <název>
3) Instalace závislostí
	npm install
	npm install leaflet
	npm install -D @types/leaflet
	npm install @capacitor/geolocation @capacitor/app-launcher
4) Vložení všech souborů


Android build (Capacitor)
1) ionic build
2) npx cap add android
3) npx cap sync

4) V android/app/src/main/AndroidManifest.xml přidat do <manifest> oprávnění:
	<uses-permission android:name="android.permission.INTERNET" />
	<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
	<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

5) otevření v Android Studiu
	npx cap open android
