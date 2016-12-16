import PushwooshSingleton from './Pushwoosh';
import {getGlobal} from './functions';

function main() {
  const global = getGlobal();

  let {Pushwoosh} = global;
  let predefinedCommands;

  if (Pushwoosh) {
    predefinedCommands = Pushwoosh;
  }

  Pushwoosh = new PushwooshSingleton();
  if (Array.isArray(predefinedCommands)) {
    predefinedCommands.forEach(c => Pushwoosh.push(c));
  }

  global.Pushwoosh = Pushwoosh;
}

if (document.readyState === 'complete') {
  main();
}
else {
  window.addEventListener('load', main);
}

/*
import {getGlobal, getBrowserVersion, urlB64ToUint8Array} from './functions';

import Pushwoosh from './Pushwoosh';

var pw = new Pushwoosh;


const applicationServerPublicKey = 'BCW6JPG-T7Jx0bYKMhAbL6j3DL3VTTib7dwvBjQ' +
  'C_496a12auzzKFnjgFjCsys_YtWkeMLhogfSlyM0CaIktx7o';
const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
//const global = getGlobal();

//import a from './createDoApiFetch';

console.log(getBrowserVersion());

async function qwe() {
  try {
    const opts = {
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    };

    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js');
    }
    let serviceWorkerRegistration = await navigator.serviceWorker.ready;
    let x = await serviceWorkerRegistration.pushManager.permissionState(opts);
    console.log(x);
    let subs = await serviceWorkerRegistration.pushManager.getSubscription();
    if (!subs) {
      subs = await serviceWorkerRegistration.pushManager.subscribe(opts);
    }
    console.log(serviceWorkerRegistration, registration, subs, 2);

  }
  catch (e) {
    console.log(e);
  }
}
 navigator.serviceWorker.getRegistration().then(reg => reg.pushManager.getSubscription()).then(subs => console.log(subs.toJSON()))
qwe();

*/
// navigator.serviceWorker.getRegistration().then(reg => reg.pushManager.getSubscription()).then(subs => console.log(subs.toJSON()))
