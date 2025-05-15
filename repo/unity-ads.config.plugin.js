const { withPlugins, withSettingsGradle, withAppBuildGradle, withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

// Unity Ads identifiers
const gameIdAndroid = '5838973';
const gameIdIos = '5838972';

const ANDROID_SETTINGS = `
include ':react-native-unity-ads'
project(':react-native-unity-ads').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-unity-ads/android')
`;
const ANDROID_DEPENDENCY = `implementation project(':react-native-unity-ads')`;

const withUnityAds = (config) => {
  return withPlugins(config, [
    // Link Android library in settings.gradle
    (conf) => withSettingsGradle(conf, async newConfig => {
      newConfig.modResults.contents += ANDROID_SETTINGS;
      return newConfig;
    }),
    // Add dependency in app/build.gradle
    (conf) => withAppBuildGradle(conf, async newConfig => {
      newConfig.modResults.contents = newConfig.modResults.contents.replace(/dependencies \{/, match => `${match}\n    ${ANDROID_DEPENDENCY}`);
      return newConfig;
    }),
    // Add meta-data and activity to AndroidManifest.xml
    (conf) => withAndroidManifest(conf, async newConfig => {
      const application = newConfig.modResults.manifest.application[0];
      // meta-data entry
      application['meta-data'] = application['meta-data'] || [];
      if (!application['meta-data'].some(item => item.$['android:name'] === 'unityAdsGameId')) {
        application['meta-data'].push({ $: { 'android:name': 'unityAdsGameId', 'android:value': gameIdAndroid } });
      }
      // AdUnitActivity
      application.activity = application.activity || [];
      if (!application.activity.some(item => item.$['android:name'] === 'com.unity3d.ads.adunit.AdUnitActivity')) {
        application.activity.push({ $: { 'android:name': 'com.unity3d.ads.adunit.AdUnitActivity' } });
      }
      // Add organization ID meta-data
      application['meta-data'].push({ $: { 'android:name': 'unityAdsOrganizationId', 'android:value': '13469817245709' } });
      application['meta-data'].push({ $: { 'android:name': 'unityAdsApiKey', 'android:value': 'c166c0a5b4d119df06c37efa1499e14c882726a73589c31d16cce707bc1a17d0' } });
      return newConfig;
    }),
    // Add UnityAdsGameID to Info.plist
    (conf) => withInfoPlist(conf, async newConfig => {
      newConfig.modResults['UnityAdsGameID'] = gameIdIos;
      // Add organization ID and API key
      newConfig.modResults['UnityAdsOrganizationID'] = '13469817245709';
      newConfig.modResults['UnityAdsApiKey'] = 'c166c0a5b4d119df06c37efa1499e14c882726a73589c31d16cce707bc1a17d0';
      return newConfig;
    }),
  ]);
};

module.exports = withUnityAds;
