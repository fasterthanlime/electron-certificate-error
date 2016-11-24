"use strict";

const {app, session, net} = require("electron");

const httpProxy = process.env.HTTP_PROXY;

init();

function init () {
  console.log("electron version: ", process.versions.electron);

  if (!httpProxy) {
    console.log("Please set the HTTP_PROXY environment variable. Example: HTTP_PROXY=localhost:8888");
    process.exit(1);
  }

  app.on("ready", appReady);
}

function makeRequest (cb) {
  const req = net.request({
    method: "get",
    url: "https://itch.io/country"
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

  req.on("close", function () {
    cb(body);
  });
  req.end();
}

function appReady () {
  console.log("app ready! making proxyless request...");
  makeRequest(proxylessRequestDone);
}

function proxylessRequestDone (body) {
  console.log(`proxyless request gave: ${body}`)

  session.defaultSession.setProxy({
    proxyRules: httpProxy
  }, proxySet);
}

function proxySet () {
  console.log("proxy set! making proxyfull request...");
  makeRequest(proxyfullRequestDone);
}

function proxyfullRequestDone (body) {
  console.log(`proxyfull request gave: ${body}`)
}

