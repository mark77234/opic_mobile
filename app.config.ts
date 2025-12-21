import { ConfigContext, ExpoConfig } from "expo/config";

const ICONS = {
  iosLight: "./assets/icons/ios-light.png",
  iosDark: "./assets/icons/ios-dark.png",
  iosTinted: "./assets/icons/ios-tinted.png",

  adaptive: "./assets/icons/adaptive-icon.png",

  splashLight: "./assets/icons/splash-icon-light.png",
  splashDark: "./assets/icons/splash-icon-dark.png",
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  name: "Daily Opic",
  slug: "opic_mobile",
  version: "1.0.0",

  extra: {
    eas: {
      projectId: "750ea314-bec3-4af3-98d7-b92b7ac97282",
    },
  },
  orientation: "portrait",
  scheme: "opicmobile",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  /**
   * iOS App Icon (Light / Dark / Tinted)
   * iOS 18+ 에서 홈화면 스타일에 따라 자동 적용
   */
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.mark.opicmobile",
    icon: {
      light: ICONS.iosLight,
      dark: ICONS.iosDark,
      tinted: ICONS.iosTinted,
    },
  },

  /**
   * Android Adaptive Icon
   */
  android: {
    adaptiveIcon: {
      foregroundImage: ICONS.adaptive,
      backgroundColor: "#E6F4FE",
      monochromeImage: ICONS.iosTinted,
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.mark.opicmobile",
  },

  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",

    /**
     * Splash Screen (Light / Dark)
     */
    [
      "expo-splash-screen",
      {
        image: ICONS.splashLight,
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          image: ICONS.splashDark,
          backgroundColor: "#000000",
        },
      },
    ],

    [
      "expo-speech-recognition",
      {
        microphonePermission: "Allow OpicMobile to use the microphone.",
        speechRecognitionPermission:
          "Allow OpicMobile to use speech recognition.",
        androidSpeechServicePackages: [
          "com.google.android.googlequicksearchbox",
        ],
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: false,
  },
});
