module.exports = {
  ci: {
    collect: {
      url: [
        "http://127.0.0.1:3100/",
        "http://127.0.0.1:3100/pricing",
        "http://127.0.0.1:3100/projects",
        "http://127.0.0.1:3100/faq",
        "http://127.0.0.1:3100/start",
      ],
      numberOfRuns: 3,
      startServerCommand: "npm run start -- --hostname 127.0.0.1 --port 3100",
      startServerReadyTimeout: 30000,
      settings: {
        formFactor: "mobile",
        chromeFlags: "--no-sandbox",
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "output/lighthouse",
    },
  },
};
