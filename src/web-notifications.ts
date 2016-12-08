import {getGlobal, getBrowserVersion} from './functions';

//const global = getGlobal();

//import a from './createDoApiFetch';

console.log(getBrowserVersion());

async function qwe() {
  const a = await Promise.resolve(1);
  if (a > 5) {
    throw new Error('sss');
  }
  const b = await Promise.resolve(5);
  return a + b;
}

qwe().catch(e => console.log(e));



// navigator.serviceWorker.getRegistration().then(reg => reg.pushManager.getSubscription()).then(subs => console.log(subs.toJSON()))
