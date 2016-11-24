"use strict";

const {app, session, net, BrowserWindow} = require("electron");

const httpProxy = process.env.http_proxy;
const testUrl = "https://itch.io/country"

init();

function init () {
  console.log("electron version: ", process.versions.electron);

  process.on("uncaughtException", (e) => {
    console.log("< uncaught exception: ", e);
  });

  app.on("certificate-error", (ev, wc, url, error) => {
    console.log("< certificate error: ", error);
  });

  if (!httpProxy) {
    console.log("Please set the http_proxy environment variable. Example: http_proxy=localhost:8888");
    process.exit(1);
  }

  app.on("ready", appReady);
}

function makeRequest (cb) {
  const req = net.request({
    method: "get",
    url: testUrl
  })

  let response;
  let body = "";

  req.on("response", function (res) {
    response = res;

    res.setEncoding("utf-8");
    res.on("data", (chunk) => {
      body += chunk;
    });
  })

  let timedOut = false;
  let timeoutHandle = setTimeout(function () {
    timedOut = true;
    cb("<timed out>")
  }, 3 * 1000)

  req.on("close", function () {
    clearTimeout(timeoutHandle);
    if (timedOut) {
      return
    }

    if (body === "") {
      cb("<empty>");
    } else {
      cb(body);
    }
  });
  req.end();
}

function appReady () {
  console.log("✓ app ready!")
  console.log("> making proxyless request...");
  makeRequest(proxylessRequestDone);
}

function proxylessRequestDone (body) {
  console.log(`< proxyless request gave: ${body}`)

  session.defaultSession.setProxy({
    proxyRules: httpProxy
  }, proxySet);
}

function proxySet () {
  console.log("✓ proxy set!");
  console.log("> making proxyfull request...");
  makeRequest(proxyfullRequestDone);
}

function proxyfullRequestDone (body) {
  console.log(`< proxyfull request gave: ${body}`)
  console.log(`> opening BrowserWindow...`)

  const win = new BrowserWindow({
    width: 400, height: 400,
    show: true,
  });
  win.loadURL(testUrl);
}

