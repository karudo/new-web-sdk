type PushwooshApiResponce = {
  status_code: number,
  status_message: string,
  response?: any
}

type TPWPermission = 'denied' | 'granted' | 'prompt';

interface IPWDriverAPIParams {
  hwid: string;
  pushToken: string;
  publicKey?: string;
  authToken?: string;
}

interface TPWAPIParams extends IPWDriverAPIParams {
  applicationCode: string;
  language: string;
  userId?: string;
}

interface PushManager {
  permissionState(options: PushSubscriptionOptions): Promise<TPWPermission>
}

interface IPWDriver {
  getPermission(): Promise<TPWPermission>;
  isSubscribed(): Promise<boolean>;
  askSubscribe(): Promise<any>;
  getAPIParams(): Promise<IPWDriverAPIParams>;
  onApiReady?(api: any): void;
}
