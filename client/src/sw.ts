export type {};
declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", (e) => {
  console.log("[ServiceWorker] Install");
});
self.addEventListener("activate", function (e) {
  console.log("[ServiceWorker] Activate");

  return self.clients.claim();
});

self.addEventListener("message", (event) => {
  console.log(event);
  self.clients.matchAll().then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage("oh hai");
    });
  });
});
