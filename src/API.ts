import {
  getBrowserVersion,
  getDeviceName,
  getBrowserType,
  getPushToken,
  generateHwid,
  getPublicKey,
  getAuthToken
} from './functions';


type TAPIRegisterTags = {
  timezone?: number;
  language?: string;
  device_model?: string;
  device_name?: string;
  device_type?: number;
}

export default class PushwooshAPI {
  private timezone: number = -(new Date).getTimezoneOffset() * 60;

  constructor(private params: TPWAPIParams, private tags?: TAPIRegisterTags) {}

  doPushwooshApiMethod(a: any, b: any): Promise<any> {
    return Promise.resolve();
  }

  callAPI(methodName: string, methodParams?: any) {
    const {params} = this;
    return this.doPushwooshApiMethod(methodName, {
      ...methodParams,
      application: params.applicationCode,
      hwid: params.hwid
    });
  }

  registerDevice() {
    const {params} = this;
    return this.callAPI('registerDevice', {
      timezone: this.timezone,
      device_model: getBrowserVersion(),
      device_name: getDeviceName(),
      device_type: getBrowserType(),
      ...this.tags,
      push_token: params.pushToken,
      public_key: params.publicKey,
      auth_token: params.authToken,
    });
  }

  unregisterDevice() {
    return this.callAPI('unregisterDevice');
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
