if(!self.define){let e,s={};const n=(n,a)=>(n=new URL(n+".js",a).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(a,i)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(s[t])return;let c={};const r=e=>n(e,t),o={module:{uri:t},exports:c,require:r};s[t]=Promise.all(a.map((e=>o[e]||r(e)))).then((e=>(i(...e),c)))}}define(["./workbox-4754cb34"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/app-build-manifest.json",revision:"037b57c96882882154dd92a7c3b0d716"},{url:"/_next/static/QfhvYpFz5e4gh9rAW-7C7/_buildManifest.js",revision:"f096c6951279e8569127730e254d9d81"},{url:"/_next/static/QfhvYpFz5e4gh9rAW-7C7/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/215-0e17e3462f071bfc.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/4bd1b696-3b1e85d5990790fa.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/706-4b088304b21884a7.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/app/_not-found/page-402bfff33744857e.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/app/api/schedule/route-3f0c999f6d7ce67d.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/app/api/scraper/route-f646d62906f73dcc.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/app/api/teamData/route-a454ca794e548515.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/app/layout-11a7c1eb38ad63ef.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/app/page-ca1b916ab8435550.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/framework-00a8ba1a63cfdc9e.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/main-63f7d43f3cc04f6e.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/main-app-a22122ea18cf622f.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/pages/_app-037b5d058bd9a820.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/pages/_error-6ae619510b1539d6.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-275f15962008555c.js",revision:"QfhvYpFz5e4gh9rAW-7C7"},{url:"/_next/static/css/0bafe34037806c65.css",revision:"0bafe34037806c65"},{url:"/_next/static/media/4473ecc91f70f139-s.p.woff",revision:"78e6fc13ea317b55ab0bd6dc4849c110"},{url:"/_next/static/media/463dafcda517f24f-s.p.woff",revision:"cbeb6d2d96eaa268b4b5beb0b46d9632"},{url:"/favicon.ico",revision:"6d4580b89e2ac09527b8a1e68f249351"},{url:"/file.svg",revision:"d09f95206c3fa0bb9bd9fefabfd0ea71"},{url:"/globe.svg",revision:"2aaafa6a49b6563925fe440891e32717"},{url:"/icon.png",revision:"6d4580b89e2ac09527b8a1e68f249351"},{url:"/icons/icon-180x180.png",revision:"d34a0cf7005c663dcac606d281413708"},{url:"/icons/icon-192x192.png",revision:"02264847ac2810cc03db74b07e380d68"},{url:"/icons/icon-512x512.png",revision:"853d7ae022875e503cd77a31542e01b8"},{url:"/manifest.json",revision:"2da322be64837f6baf4132158a017104"},{url:"/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/vercel.svg",revision:"c0af2f507b369b085b35ef4bbe3bcf1e"},{url:"/window.svg",revision:"a2760511c65806022ad20adf74370ff3"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:n,state:a})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
