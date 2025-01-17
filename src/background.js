import { spawnNode } from "lumina-node";

// popup -(runtime.connect)-> background -(MessageChannel)-> Worker
function handleConnect(port) {
  console.log("client connected");
  // we aren't allowed to transfer the runtime.Port we've received to worker
  // so we patch the connection through using MessageChannel
  const channel = new MessageChannel();
  port.onMessage.addListener((message) => {
    console.debug("forwarding to worker: ", message);
    channel.port1.postMessage(message);
  });
  channel.port1.onmessage = (originalMessage) => {
    // data field isn't considered own property of MessageEvent (but is inherited from Event),
    // so chrome's json clone will ommit this field. Hand craft the message with expected structure as a workaround.
    const message = { data: originalMessage.data };
    console.debug("forwarding from worker: ", message);
    port.postMessage(message);
  };

  self.lumina.addConnectionToWorker(channel.port2);
}

// keep it as variable in self, so that we can play around with it on the background page of the extension
self.lumina = await spawnNode();

self.chrome.runtime.onConnect.addListener(handleConnect);
