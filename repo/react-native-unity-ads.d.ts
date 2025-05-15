declare module 'react-native-unity-ads' {
  type UnityAdsResult = 'completed' | 'skipped' | 'error';
  interface UnityAdsEvent {
    placementId: string;
    result: UnityAdsResult;
  }

  /** Initialize Unity Ads with the given Game ID. */
  export function initialize(gameId: string, testMode: boolean): void;
  /** Load a placement by ID. */
  export function load(placementId: string): Promise<void>;
  /** Show a loaded placement. */
  export function show(placementId: string): void;
  /** Subscribe to Unity Ads events. */
  export function addListener(
    eventName: 'onUnityAdsStart' | 'onUnityAdsFinish' | 'onUnityAdsError',
    callback: (event: UnityAdsEvent) => void
  ): void;
  /** Remove all Unity Ads event listeners. */
  export function removeAllListeners(): void;
}
