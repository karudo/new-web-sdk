type PushwooshApiResponce = {
  status_code: number,
  status_message: string,
  response?: any
}

type TPWPermission = 'denied' | 'granted' | 'prompt';

type TPWAPIParams = {
  applicationCode: string;
  hwid: string;
  pushToken: string;
  publicKey?: string;
  authToken?: string;
};


type TSubsOptions = {userVisibleOnly?: boolean, applicationServerKey?: Uint8Array};

interface PushManager {
  permissionState(options: TSubsOptions): Promise<TPWPermission>
}

interface IPWDriver {
  checkPermission(): Promise<TPWPermission>;
  trySubscribe(): Promise<undefined>;
  getAPIParams(): Promise<TPWAPIParams>;
}
