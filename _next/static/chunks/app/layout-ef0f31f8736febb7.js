(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[185],{5112:function(e,t,n){Promise.resolve().then(n.bind(n,346)),Promise.resolve().then(n.t.bind(n,911,23)),Promise.resolve().then(n.t.bind(n,7960,23))},346:function(e,t,n){"use strict";n.d(t,{ThemeProvider:function(){return b}});var r=n(7437),o=n(2265),s=(e,t,n,r,o,s,a,l)=>{let i=document.documentElement,c=["light","dark"];function m(t){(Array.isArray(e)?e:[e]).forEach(e=>{let n="class"===e,r=n&&s?o.map(e=>s[e]||e):o;n?(i.classList.remove(...r),i.classList.add(t)):i.setAttribute(e,t)}),l&&c.includes(t)&&(i.style.colorScheme=t)}if(r)m(r);else try{let e=localStorage.getItem(t)||n,r=a&&"system"===e?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":e;m(r)}catch(e){}},a=["light","dark"],l="(prefers-color-scheme: dark)",i="undefined"==typeof window,c=o.createContext(void 0),m=e=>o.useContext(c)?o.createElement(o.Fragment,null,e.children):o.createElement(u,{...e}),d=["light","dark"],u=e=>{let{forcedTheme:t,disableTransitionOnChange:n=!1,enableSystem:r=!0,enableColorScheme:s=!0,storageKey:i="theme",themes:m=d,defaultTheme:u=r?"system":"light",attribute:b="data-theme",value:g,children:v,nonce:w,scriptProps:E}=e,[S,_]=o.useState(()=>f(i,u)),[k,C]=o.useState(()=>f(i)),T=g?Object.values(g):m,L=o.useCallback(e=>{let t=e;if(!t)return;"system"===e&&r&&(t=p());let o=g?g[t]:t,l=n?y(w):null,i=document.documentElement,c=e=>{"class"===e?(i.classList.remove(...T),o&&i.classList.add(o)):e.startsWith("data-")&&(o?i.setAttribute(e,o):i.removeAttribute(e))};if(Array.isArray(b)?b.forEach(c):c(b),s){let e=a.includes(u)?u:null,n=a.includes(t)?t:e;i.style.colorScheme=n}null==l||l()},[w]),A=o.useCallback(e=>{let t="function"==typeof e?e(S):e;_(t);try{localStorage.setItem(i,t)}catch(e){}},[S]),P=o.useCallback(e=>{C(p(e)),"system"===S&&r&&!t&&L("system")},[S,t]);o.useEffect(()=>{let e=window.matchMedia(l);return e.addListener(P),P(e),()=>e.removeListener(P)},[P]),o.useEffect(()=>{let e=e=>{e.key===i&&(e.newValue?_(e.newValue):A(u))};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)},[A]),o.useEffect(()=>{L(null!=t?t:S)},[t,S]);let N=o.useMemo(()=>({theme:S,setTheme:A,forcedTheme:t,resolvedTheme:"system"===S?k:S,themes:r?[...m,"system"]:m,systemTheme:r?k:void 0}),[S,A,t,k,r,m]);return o.createElement(c.Provider,{value:N},o.createElement(h,{forcedTheme:t,storageKey:i,attribute:b,enableSystem:r,enableColorScheme:s,defaultTheme:u,value:g,themes:m,nonce:w,scriptProps:E}),v)},h=o.memo(e=>{let{forcedTheme:t,storageKey:n,attribute:r,enableSystem:a,enableColorScheme:l,defaultTheme:i,value:c,themes:m,nonce:d,scriptProps:u}=e,h=JSON.stringify([r,n,i,t,m,c,a,l]).slice(1,-1);return o.createElement("script",{...u,suppressHydrationWarning:!0,nonce:"undefined"==typeof window?d:"",dangerouslySetInnerHTML:{__html:"(".concat(s.toString(),")(").concat(h,")")}})}),f=(e,t)=>{let n;if(!i){try{n=localStorage.getItem(e)||void 0}catch(e){}return n||t}},y=e=>{let t=document.createElement("style");return e&&t.setAttribute("nonce",e),t.appendChild(document.createTextNode("*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}")),document.head.appendChild(t),()=>{window.getComputedStyle(document.body),setTimeout(()=>{document.head.removeChild(t)},1)}},p=e=>(e||(e=window.matchMedia(l)),e.matches?"dark":"light");function b(e){let{children:t,...n}=e;return(0,r.jsx)(m,{...n,children:t})}},7960:function(){},911:function(e){e.exports={style:{fontFamily:"'__Inter_c28062', '__Inter_Fallback_c28062'",fontStyle:"normal"},className:"__className_c28062"}}},function(e){e.O(0,[944,971,117,744],function(){return e(e.s=5112)}),_N_E=e.O()}]);