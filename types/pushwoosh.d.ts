type PushwooshApiResponce = {
  status_code: number,
  status_message: string,
  response?: any
}

type TNotificationPermission = 'denied' | 'granted' | 'default';

interface IPushDriver {
  getPermission(): TNotificationPermission;
}

type TSubsOptions = {userVisibleOnly?: boolean, applicationServerKey?: Uint8Array};

interface PushManager {
  /**
   * Returns a promise that resolves to a PushSubscription with details of a
   * new push subscription.
   */
  subscribe(options: TSubsOptions): Promise<PushSubscription>;
  permissionState(options: TSubsOptions): Promise<'prompt' | 'denied' | 'granted'>
}
