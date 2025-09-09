import { SERVER_SECRET, DEBUG } from './secretcontext';
import { generateRandomToken } from './tokengen';
let tokenVersion = 0;
export const getSessionObject = () => {
  return {
    token: generateRandomToken(SERVER_SECRET, DEBUG),
    tokenVersion: ++tokenVersion, //For testing
  };
};

// export const sessionObjectServer = { token: null, tokenVersion: 0 };
// setTimeout(() => {
//   const sessObj = getSessionObject();
//   sessionObjectServer.token = sessObj.token;
//   sessionObjectServer.tokenVersion = sessObj.tokenVersion;
//   DEBUG && console.log("Initialize sessionObject! Version", sessionObjectServer.tokenVersion);
// }, 0);
// setInterval(() => {
//   const sessObj = getSessionObject();
//   sessionObjectServer.token = sessObj.token;
//   sessionObjectServer.tokenVersion = sessObj.tokenVersion;
//   DEBUG && console.log("New sessionObject created! Version", sessionObjectServer.tokenVersion);
// }, 600000);
