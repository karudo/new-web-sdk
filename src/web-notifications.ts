import {getGlobal, getBrowserVersion} from './functions';

//const global = getGlobal();

//import a from './createDoApiFetch';

console.log(getBrowserVersion());

async function qwe() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    console.log(registration);
  }
  catch (e) {
    console.log(e);
  }
}

qwe();


// navigator.serviceWorker.getRegistration().then(reg => reg.pushManager.getSubscription()).then(subs => console.log(subs.toJSON()))
