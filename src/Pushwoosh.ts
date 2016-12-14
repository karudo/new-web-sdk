import EventEmitter from './EventEmitter';
import API from './API';

type TInitParams = {
  applicationCode: string;
  safariWebsitePushID?: string;
  autoSubscribe?: boolean;
  pushwooshUrl?: string;
};

class Pushwoosh {
  private _ee: EventEmitter = new EventEmitter();
  private _commands: any[] = [];
  private _successStart: Promise<any>;
  private api: API;

  init(params: TInitParams) {

  }

  _runCmd(func: any) {
    return this._successStart.then(func);
  }

  _cmdInit(params: TInitParams) {
    if (document.readyState === 'complete') {
      this.init(params);
    }
    else {
      window.addEventListener('load', () => this.init(params));
    }
  }

  _runOrPush(clb: any) {
    if (this._successStart) {
      this._runCmd(clb);
    }
    else {
      this._commands.push(clb);
    }
  }

  push(cmd: any) {
    if (typeof cmd === 'function') {
      this._runOrPush(() => cmd());
    }
    else if (Array.isArray(cmd)) {
      switch (cmd[0]) {
        case 'init':
          this._cmdInit(cmd[1]);
          break;
        default:
          throw new Error('unknown command');
      }
    }
    else {
      throw new Error('invalid command');
    }
  }

}

export default Pushwoosh;
