import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests',testMatch:'*.spec.js',fullyParallel:true,forbidOnly:!!process.env.CI,retries:process.env.CI?1:0,
  reporter:process.env.CI?'github':'list',
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
  webServer:{command:'npm start',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},
  projects:[{name:'desktop',use:{browserName:'chromium',viewport:{width:1440,height:900}}},{name:'mobile',use:{browserName:'chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true}}]
});
