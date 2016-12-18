import {
  getBrowserVersion,
  getDeviceName,
  getBrowserType
} from './functions';


type TDoPushwooshMethod = (type: string, params: any) => Promise<any>

export default class PushwooshAPI {
  private timezone: number = -(new Date).getTimezoneOffset() * 60;

  constructor(private doPushwooshApiMethod: TDoPushwooshMethod, private params: TPWAPIParams) {}

  callAPI(methodName: string, methodParams?: any) {
    const {params} = this;
    const mustBeParams: any = {
      application: params.applicationCode,
      hwid: params.hwid
    };
    if (params.userId) {
      mustBeParams.userId = params.userId;
    }
    return this.doPushwooshApiMethod(methodName, {
      ...methodParams,
      ...mustBeParams
    });
  }

  registerDevice() {
    const {params} = this;
    return this.callAPI('registerDevice', {
      push_token: params.pushToken,
      public_key: params.publicKey,
      auth_token: params.authToken,
      language: params.language,
      timezone: this.timezone,
      device_model: getBrowserVersion(),
      device_name: getDeviceName(),
      device_type: getBrowserType(),
    });
  }

  unregisterDevice() {
    return this.callAPI('unregisterDevice');
  }

  registerUser() {
    return this.callAPI('registerUser', {
      timezone: this.timezone,
      device_type: getBrowserType(),
    });
  }

  applicationOpen() {
    return this.callAPI('applicationOpen', {
      push_token: this.params.pushToken,
      timezone: this.timezone,
      device_type: getBrowserType()
    });
  }

  setTags(tags: {[k: string]: any}) {
    return this.callAPI('setTags', {tags});
  }

  getTags() {
    return this.callAPI('getTags');
  }

  pushStat(hash: string) {
    return this.callAPI('pushStat', {hash});
  }
}
