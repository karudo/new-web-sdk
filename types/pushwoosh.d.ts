type PushwooshApiResponce = {
  status_code: number,
  status_message: string,
  response?: any
}

type TNotificationPermission = 'denied' | 'granted' | 'default';

interface IPushDriver {
  getPermission(): TNotificationPermission;
}
