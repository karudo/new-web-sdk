import EventEmitter from './EventEmitter';
import API from './API';
import {isSafariBrowser, getDeviceName, canUseServiceWorkers, getPushwooshUrl} from './functions';
import {defaultWorkerUrl} from './constants';
import Logger from './logger'
import WorkerDriver from './drivers/worker';

type TInitParams = {
  applicationCode: string;
  safariWebsitePushID?: string;
  serviceWorkerUrl?: string;
  autoSubscribe?: boolean;
  pushwooshUrl?: string;
  logLevel?: string;
};

class Pushwoosh {
  private _params: TInitParams;
  private _ee: EventEmitter = new EventEmitter();
  private _onLoadPromise: Promise<any>;
  private api: API;

  public driver: IPWDriver;

  constructor() {
    this._onLoadPromise = new Promise(resolve => this._ee.once('event-onload', resolve));
  }

  init(params: TInitParams) {
    if (!((isSafariBrowser() && getDeviceName() === 'PC') || canUseServiceWorkers())) {
      Logger.info('This browser does not support pushes');
      return;
    }
    const {applicationCode} = params;
    if (!applicationCode) {
      throw new Error('no application code');
    }
    const {
      safariWebsitePushID,
      serviceWorkerUrl = '/sw.js',
      logLevel,
      pushwooshUrl = getPushwooshUrl(applicationCode),
      autoSubscribe = false
    } = params;
    this._params = params;
    //const pushwooshUrl = getPushwooshUrl(params.applicationCode);

    if (canUseServiceWorkers()) {
      this.driver = new WorkerDriver({serviceWorkerUrl});
    }

    this._ee.emit('event-onload');
console.log(autoSubscribe, params);
    if (autoSubscribe) {
      this.subscribeAndRegister();
    }
  }

  push(cmd: any) {
    if (typeof cmd === 'function') {
      this._runCmd(() => cmd());
    }
    else if (Array.isArray(cmd)) {
      switch (cmd[0]) {
        case 'init':
          this.init(cmd[1]);
          break;
        default:
          throw new Error('unknown command');
      }
    }
    else {
      throw new Error('invalid command');
    }
  }

  async subscribeAndRegister() {
    let permission = await this.driver.getPermission();

    if (permission === 'denied') {
      Logger.info('Permission denied');
      return;
    }

    try {
      await this.driver.subscribe();
      const driverApiParams = await this.driver.getAPIParams(this._params.applicationCode);
      console.log(driverApiParams);
    }
    catch (e) {
      Logger.error(e);
    }

  }

  private _runCmd(func: any) {
    return this._onLoadPromise.then(func);
  }
}

export default Pushwoosh;
