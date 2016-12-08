import {log as logStorage} from './storage';

type TWriteType = 'error' | 'apirequest';

const levels: {[key: string]: number} = {
  error: 1,
  info: 2,
  debug: 3
};

let numLevel = 2;

interface ILogger {
  setLevel(level: string): void;
  error(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
  write(type: TWriteType, message: any): Promise<void>;
  [key: string]: any;
}

const Logger: ILogger = {
  setLevel(level) {
    if (!levels[level]) {
      level = 'info';
    }
    numLevel = levels[level];
  },
  write(type: TWriteType, message: any) {
    if (type === 'error') {
      this.error(message);
    }
    else {
      this.info(message);
    }
    return logStorage.add(type, message);
  }
} as ILogger;

Object.keys(levels).forEach((k: string) => {
  const n = levels[k];
  Logger[k] = (...args: any[]) => {
    if (n <= numLevel) {
      console.info(k, ...args);
      console.trace('trace');
    }
  };
});

export function logAndThrowError(error: string) {
  const logText = new Error(error);
  Logger.write('error', logText);
  throw logText;
}

export function logAndRejectError(error: string, reject: (e: any) => void) {
  const logText = new Error(error);
  Logger.write('error', logText);
  reject(logText);
}

export default Logger;
