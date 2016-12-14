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
  permissionState(options: TSubsOptions): Promise<'prompt' | 'denied' | 'granted'>
}
