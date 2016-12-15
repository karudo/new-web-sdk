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
  private _successInit: Promise<any>;
  private api: API;

  public readonly driver: IPWDriver;

  constructor() {
    this._successInit = new Promise((resolve) => {
      this._ee.once('init-success', resolve);
    });
    this._successInit.then(() => this._commands.forEach(cmd => this._runCmd(cmd)));
  }

  init(params: TInitParams) {
    this._ee.emit('init-success');
  }

  _runCmd(func: any) {
    return this._successInit.then(func);
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

}

export default Pushwoosh;
