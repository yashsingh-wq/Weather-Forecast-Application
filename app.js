/* =========================================================
   AERIS WEATHER — app.js
   APIs: Open-Meteo (forecast + air-quality + geocoding), OpenStreetMap/Leaflet, OpenWeatherMap tile layers
   ========================================================= */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const state = {
  lat: 28.6139,
  lon: 77.2090,
  name: "New Delhi, India",
  data: null,
  aqi: null,
  isDay: true,
  tempUnit: "C",
  map: null,
  radarLayer: null,
  currentLayer: "temp_new",
};

/* ---------------- WEATHER CODE MAP (WMO) ---------------- */
const WMO = {
  0:  { label: "Clear sky", icon: "sun" },
  1:  { label: "Mainly clear", icon: "sun-cloud" },
  2:  { label: "Partly cloudy", icon: "sun-cloud" },
  3:  { label: "Overcast", icon: "cloud" },
  45: { label: "Fog", icon: "fog" },
  48: { label: "Depositing rime fog", icon: "fog" },
  51: { label: "Light drizzle", icon: "drizzle" },
  53: { label: "Drizzle", icon: "drizzle" },
  55: { label: "Dense drizzle", icon: "drizzle" },
  56: { label: "Freezing drizzle", icon: "drizzle" },
  57: { label: "Dense freezing drizzle", icon: "drizzle" },
  61: { label: "Light rain", icon: "rain" },
  63: { label: "Rain", icon: "rain" },
  65: { label: "Heavy rain", icon: "rain-heavy" },
  66: { label: "Freezing rain", icon: "rain" },
  67: { label: "Heavy freezing rain", icon: "rain-heavy" },
  71: { label: "Light snow", icon: "snow" },
  73: { label: "Snow", icon: "snow" },
  75: { label: "Heavy snow", icon: "snow" },
  77: { label: "Snow grains", icon: "snow" },
  80: { label: "Light showers", icon: "rain" },
  81: { label: "Showers", icon: "rain" },
  82: { label: "Violent showers", icon: "rain-heavy" },
  85: { label: "Snow showers", icon: "snow" },
  86: { label: "Heavy snow showers", icon: "snow" },
  95: { label: "Thunderstorm", icon: "storm" },
  96: { label: "Thunderstorm w/ hail", icon: "storm" },
  99: { label: "Severe thunderstorm", icon: "storm" },
};

function wmoInfo(code){ return WMO[code] || { label: "Unknown", icon: "cloud" }; }

/* ---------------- ICON SVGs ---------------- */
function iconSVG(kind, big=false){
  const s = big ? 76 : 28;
  const icons = {
    "sun": `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><circle cx="32" cy="32" r="13" fill="#FFD86B"/><g stroke="#FFD86B" stroke-width="3.5" stroke-linecap="round"><line x1="32" y1="4" x2="32" y2="12"/><line x1="32" y1="52" x2="32" y2="60"/><line x1="4" y1="32" x2="12" y2="32"/><line x1="52" y1="32" x2="60" y2="32"/><line x1="12.3" y1="12.3" x2="18" y2="18"/><line x1="46" y1="46" x2="51.7" y2="51.7"/><line x1="12.3" y1="51.7" x2="18" y2="46"/><line x1="46" y1="18" x2="51.7" y2="12.3"/></g></svg>`,
    "sun-cloud": `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><circle cx="24" cy="24" r="11" fill="#FFD86B"/><path d="M12 46a10 10 0 0 1 2-19.8A13 13 0 0 1 39 22a9 9 0 0 1-1 18H12Z" fill="#E9F1FB"/></svg>`,
    "cloud": `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><path d="M10 46a11 11 0 0 1 2-21.7A14 14 0 0 1 39 21a10 10 0 0 1-1 20H10Z" fill="#D7E4F5"/></svg>`,
    "fog": `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><path d="M10 26a11 11 0 0 1 2-1A14 14 0 0 1 39 20" stroke="none"/><g stroke="#CBDAEF" stroke-width="3.5" stroke-linecap="round"><line x1="10" y1="24" x2="54" y2="24"/><line x1="6" y1="32" x2="58" y2="32"/><line x1="10" y1="40" x2="54" y2="40"/><line x1="14" y1="48" x2="50" y2="48"/></g></svg>`,
    "drizzle": `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><path d="M10 34a11 11 0 0 1 2-21.7A14 14 0 0 1 39 9a10 10 0 0 1-1 20H10Z" fill="#D7E4F5"/><g stroke="#8fd3ff" stroke-width="3" stroke-linecap="round"><line x1="20" y1="42" x2="17" y2="50"/><line x1="32" y1="42" x2="29" y2="50"/><line x1="44" y1="42" x2="41" y2="50"/></g></svg>`,
    "rain": `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><path d="M10 32a11 11 0 0 1 2-21.7A14 14 0 0 1 39 7a10 10 0 0 1-1 20H10Z" fill="#C4D5EC"/><g stroke="#5aa9e6" stroke-width="3.5" stroke-linecap="round"><line x1="18" y1="40" x2="14" y2="52"/><line x1="30" y1="40" x2="26" y2="52"/><line x1="42" y1="40" x2="38" y2="52"/></g></svg>`,
    "rain-heavy": `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><path d="M10 30a11 11 0 0 1 2-21.7A14 14 0 0 1 39 5a10 10 0 0 1-1 20H10Z" fill="#AFC5E3"/><g stroke="#3f86c2" stroke-width="4" stroke-linecap="round"><line x1="16" y1="38" x2="11" y2="54"/><line x1="28" y1="38" x2="23" y2="54"/><line x1="40" y1="38" x2="35" y2="54"/><line x1="50" y1="38" x2="47" y2="50"/></g></svg>`,
    "snow": `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><path d="M10 30a11 11 0 0 1 2-21.7A14 14 0 0 1 39 5a10 10 0 0 1-1 20H10Z" fill="#D7E4F5"/><g fill="#fff"><circle cx="18" cy="46" r="3"/><circle cx="32" cy="52" r="3"/><circle cx="46" cy="46" r="3"/></g></svg>`,
    "storm": `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><path d="M10 28a11 11 0 0 1 2-21.7A14 14 0 0 1 39 3a10 10 0 0 1-1 20H10Z" fill="#98A9C4"/><polygon points="34,34 22,50 30,50 26,60 42,42 33,42" fill="#FFD86B"/></svg>`,
  };
  return icons[kind] || icons["cloud"];
}

/* =========================================================
   BACKGROUND ATMOSPHERE ENGINE
   ========================================================= */
function setupClouds(){
  const layer = $("#cloudLayer");
  layer.innerHTML = "";
  const count = 6;
  for(let i=0;i<count;i++){
    const c = document.createElement("div");
    c.className = "cloud-piece";
    const w = 120 + Math.random()*160;
    const h = w*0.4;
    const top = 5 + Math.random()*45;
    const dur = 60 + Math.random()*60;
    const delay = -Math.random()*dur;
    c.style.width = w+"px";
    c.style.height = h+"px";
    c.style.top = top+"%";
    c.style.left = "-20%";
    c.style.animation = `cloudFloat ${dur}s linear ${delay}s infinite`;
    layer.appendChild(c);
  }
  if(!document.getElementById("cloudKeyframes")){
    const style = document.createElement("style");
    style.id = "cloudKeyframes";
    style.textContent = `@keyframes cloudFloat{from{transform:translateX(0)}to{transform:translateX(140vw)}}`;
    document.head.appendChild(style);
  }
}

function setupRain(intensity=60){
  const layer = $("#rainLayer");
  layer.innerHTML = "";
  for(let i=0;i<intensity;i++){
    const d = document.createElement("div");
    d.className = "drop";
    d.style.left = Math.random()*100+"%";
    d.style.animationDuration = (0.5+Math.random()*0.5)+"s";
    d.style.animationDelay = (Math.random()*2)+"s";
    d.style.opacity = 0.3+Math.random()*0.5;
    layer.appendChild(d);
  }
}

function setupSnow(intensity=50){
  const layer = $("#snowLayer");
  layer.innerHTML = "";
  for(let i=0;i<intensity;i++){
    const f = document.createElement("div");
    f.className = "flake";
    const size = 2+Math.random()*4;
    f.style.width = size+"px";
    f.style.height = size+"px";
    f.style.left = Math.random()*100+"%";
    f.style.animationDuration = (5+Math.random()*6)+"s";
    f.style.animationDelay = (Math.random()*5)+"s";
    layer.appendChild(f);
  }
}

/* lightning canvas flashes */
let lightningInterval = null;
function setupLightning(active){
  const canvas = $("#lightningCanvas");
  const ctx = canvas.getContext("2d");
  function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
  resize();
  window.addEventListener("resize", resize);
  clearInterval(lightningInterval);
  if(!active) return;
  lightningInterval = setInterval(()=>{
    if(Math.random() > 0.6){
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      setTimeout(()=>ctx.clearRect(0,0,canvas.width,canvas.height), 90);
      setTimeout(()=>{
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        setTimeout(()=>ctx.clearRect(0,0,canvas.width,canvas.height), 60);
      }, 150);
    }
  }, 2600);
}

function applyAtmosphere(weatherCode, isDay){
  const sky = $("#sky");
  const stars = $("#stars");
  const sunGlow = $("#sunGlow");
  const moonGlow = $("#moonGlow");
  const rain = $("#rainLayer");
  const snow = $("#snowLayer");
  const info = wmoInfo(weatherCode);

  // base gradient by time/condition
  let top, mid, bot;
  if(isDay){
    if(["storm"].includes(info.icon)){ top="#3a4256"; mid="#4d5b73"; bot="#6b7c94"; }
    else if(["rain","rain-heavy","drizzle"].includes(info.icon)){ top="#33465e"; mid="#4a6580"; bot="#6b8aa3"; }
    else if(["cloud","fog"].includes(info.icon)){ top="#4b6688"; mid="#6483a5"; bot="#88a3bf"; }
    else { top="#1a5c9e"; mid="#3b84c4"; bot="#8fc3e8"; }
  } else {
    if(["storm","rain","rain-heavy","drizzle"].includes(info.icon)){ top="#050b16"; mid="#0e1a2c"; bot="#182a42"; }
    else { top="#050c1c"; mid="#0b2545"; bot="#13396e"; }
  }
  sky.style.background = `linear-gradient(180deg, ${top} 0%, ${mid} 45%, ${bot} 100%)`;

  stars.classList.toggle("on", !isDay);
  sunGlow.classList.toggle("on", isDay && ["sun","sun-cloud"].includes(info.icon));
  moonGlow.classList.toggle("on", !isDay && !["storm","rain","rain-heavy"].includes(info.icon));

  const showRain = ["rain","rain-heavy","drizzle","storm"].includes(info.icon);
  const showSnow = ["snow"].includes(info.icon);
  rain.classList.toggle("on", showRain);
  snow.classList.toggle("on", showSnow);
  if(showRain) setupRain(info.icon==="rain-heavy"?110:60);
  if(showSnow) setupSnow(60);

  setupLightning(info.icon === "storm");

  document.body.dataset.condition = info.icon;
}

/* =========================================================
   HERO CANVAS SCENE (sun / cloud / rain parallax)
   ========================================================= */
function initHeroScene(iconKind, isDay){
  const canvas = $("#heroScene");
  const ctx = canvas.getContext("2d");
  let w,h;
  function resize(){
    w = canvas.width = canvas.clientWidth * devicePixelRatio;
    h = canvas.height = canvas.clientHeight * devicePixelRatio;
  }
  resize();
  window.addEventListener("resize", resize);

  const drops = Array.from({length: 40}, ()=>({
    x: Math.random(), y: Math.random(), speed: 0.01+Math.random()*0.02, len: 10+Math.random()*20
  }));
  const puffs = Array.from({length:4}, (_,i)=>({
    x: 0.15+i*0.22, y: 0.35+Math.sin(i)*0.08, r: 30+i*8, drift: 0.0003*(i%2?1:-1)
  }));

  let raf;
  function draw(){
    ctx.clearRect(0,0,w,h);
    const rainy = ["rain","rain-heavy","drizzle","storm"].includes(iconKind);
    const cloudy = ["cloud","sun-cloud","fog","storm"].includes(iconKind) || rainy;
    const sunny = ["sun","sun-cloud"].includes(iconKind);

    if(sunny){
      const cx = w*0.7, cy = h*0.35, r = Math.min(w,h)*0.16;
      const grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r*2.6);
      grad.addColorStop(0, isDay? "rgba(255,216,120,0.9)":"rgba(220,230,255,0.7)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx,cy,r*2.6,0,7); ctx.fill();
      ctx.fillStyle = isDay? "#FFD86B":"#E8EFFB";
      ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill();
      const t = Date.now()/1000;
      ctx.strokeStyle = isDay? "rgba(255,216,120,0.55)":"rgba(220,230,255,0.4)";
      ctx.lineWidth = 3*devicePixelRatio;
      for(let i=0;i<8;i++){
        const ang = (i/8)*Math.PI*2 + t*0.3;
        ctx.beginPath();
        ctx.moveTo(cx+Math.cos(ang)*r*1.25, cy+Math.sin(ang)*r*1.25);
        ctx.lineTo(cx+Math.cos(ang)*r*1.5, cy+Math.sin(ang)*r*1.5);
        ctx.stroke();
      }
    }

    if(cloudy){
      puffs.forEach(p=>{
        p.x += p.drift;
        if(p.x>1.1) p.x=-0.1; if(p.x<-0.1) p.x=1.1;
        const cx = p.x*w, cy = p.y*h, r = p.r*devicePixelRatio;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.arc(cx,cy,r,0,7);
        ctx.arc(cx+r*0.7,cy+r*0.15,r*0.75,0,7);
        ctx.arc(cx-r*0.65,cy+r*0.2,r*0.65,0,7);
        ctx.arc(cx+r*0.15,cy-r*0.35,r*0.7,0,7);
        ctx.fill();
      });
    }

    if(rainy){
      ctx.strokeStyle = "rgba(180,210,255,0.55)";
      ctx.lineWidth = 1.5*devicePixelRatio;
      drops.forEach(d=>{
        d.y += d.speed;
        if(d.y>1) d.y=0;
        const x = d.x*w, y = d.y*h;
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x-4*devicePixelRatio, y+d.len*devicePixelRatio);
        ctx.stroke();
      });
    }

    raf = requestAnimationFrame(draw);
  }
  cancelAnimationFrame(raf);
  draw();
}

/* =========================================================
   DATA FETCHING — Open-Meteo
   ========================================================= */
async function fetchWeather(lat, lon){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,visibility` +
    `&hourly=temperature_2m,precipitation_probability,weather_code,uv_index,visibility` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max` +
    `&timezone=auto&forecast_days=8`;
  const res = await fetch(url);
  if(!res.ok) throw new Error("Weather fetch failed");
  return res.json();
}

async function fetchAQI(lat, lon){
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide&timezone=auto`;
  const res = await fetch(url);
  if(!res.ok) return null;
  return res.json();
}

async function geocodeSearch(query){
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  const res = await fetch(url);
  const json = await res.json();
  return json.results || [];
}

async function reverseGeocodeName(lat, lon){
  try{
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${lat}&longitude=${lon}`;
    // Open-Meteo has no reverse endpoint; use Nominatim as fallback
    const nres = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, {headers:{}});
    const j = await nres.json();
    const a = j.address || {};
    return [a.city||a.town||a.village||a.county||"Current location", a.country].filter(Boolean).join(", ");
  }catch(e){
    return "Current location";
  }
}

/* =========================================================
   MOON PHASE CALC
   ========================================================= */
function getMoonPhase(date){
  const lp = 2551443; // synodic month in seconds
  const newMoon = new Date(2000,0,6,18,14,0).getTime()/1000;
  const phase = ((date.getTime()/1000 - newMoon) % lp + lp) % lp;
  const index = Math.floor(phase / lp * 8 + 0.5) % 8;
  const illum = Math.round((1 - Math.cos(phase/lp*2*Math.PI))/2 * 100);
  const names = ["New Moon","Waxing Crescent","First Quarter","Waxing Gibbous","Full Moon","Waning Gibbous","Last Quarter","Waning Crescent"];
  return { name: names[index], illum, index };
}

function renderMoonIcon(phaseIndex){
  const el = $("#moonIcon");
  // 0 new -> full dark, 4 full -> full light
  const shadowMap = [
    "inset 6px 0 0 0 rgba(20,30,50,.9)",
    "inset 10px -2px 0 0 rgba(20,30,50,.75)",
    "inset 22px 0 0 0 rgba(20,30,50,.7)",
    "inset 30px -2px 0 0 rgba(20,30,50,.4)",
    "inset 60px 0 0 0 rgba(20,30,50,0)",
    "inset -30px -2px 0 0 rgba(20,30,50,.4)",
    "inset -22px 0 0 0 rgba(20,30,50,.7)",
    "inset -10px -2px 0 0 rgba(20,30,50,.75)",
  ];
  el.style.boxShadow = shadowMap[phaseIndex];
}

/* =========================================================
   RENDER FUNCTIONS
   ========================================================= */
function formatTime(iso, tz){
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
}
function formatHour(iso){
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US",{hour:"numeric"});
}
function dayLabel(iso, idx){
  if(idx===0) return "Today";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US",{weekday:"short"});
}

function uvLabel(uv){
  if(uv<3) return {t:"Low", c:"#8fd3ff"};
  if(uv<6) return {t:"Moderate", c:"#ffd86b"};
  if(uv<8) return {t:"High", c:"#ffb454"};
  if(uv<11) return {t:"Very High", c:"#ff7a56"};
  return {t:"Extreme", c:"#ff4d6d"};
}
function aqiLabel(aqi){
  if(aqi<=50) return {t:"Good", c:"#8fd88f"};
  if(aqi<=100) return {t:"Moderate", c:"#ffd86b"};
  if(aqi<=150) return {t:"Unhealthy (SG)", c:"#ffb454"};
  if(aqi<=200) return {t:"Unhealthy", c:"#ff7a56"};
  if(aqi<=300) return {t:"Very Unhealthy", c:"#c084fc"};
  return {t:"Hazardous", c:"#ff4d6d"};
}

function renderAll(){
  const d = state.data;
  if(!d) return;
  const cur = d.current;
  const info = wmoInfo(cur.weather_code);
  state.isDay = !!cur.is_day;

  // hero
  $("#cityName").textContent = state.name;
  $("#tempValue").textContent = Math.round(cur.temperature_2m);
  $("#heroDesc").textContent = info.label;
  $("#tempMax").textContent = Math.round(d.daily.temperature_2m_max[0])+"°";
  $("#tempMin").textContent = Math.round(d.daily.temperature_2m_min[0])+"°";
  $("#feelsLike").textContent = Math.round(cur.apparent_temperature)+"°";
  $("#heroIcon").innerHTML = iconSVG(info.icon, true);
  updateLocalTime();

  // metrics
  $("#windVal").textContent = Math.round(cur.wind_speed_10m);
  $("#windNeedle").style.transform = `translate(-50%,-100%) rotate(${cur.wind_direction_10m}deg)`;

  $("#humidVal").textContent = Math.round(cur.relative_humidity_2m);
  $("#humidBar").style.width = cur.relative_humidity_2m+"%";

  $("#pressVal").textContent = Math.round(cur.pressure_msl);
  const pressPct = Math.min(1, Math.max(0,(cur.pressure_msl-980)/(1040-980)));
  $("#pressArc").style.strokeDashoffset = 141 - pressPct*141;

  const visKm = (cur.visibility/1000).toFixed(1);
  $("#visVal").textContent = visKm;
  $("#visFill").style.width = Math.min(100,(visKm/20)*100)+"%";

  $("#cloudVal").textContent = Math.round(cur.cloud_cover);

  const uvNow = d.hourly.uv_index[ closestHourIndex() ] ?? 0;
  $("#uvVal").textContent = uvNow.toFixed(1);
  const uvL = uvLabel(uvNow);
  $("#uvLabel").textContent = uvL.t;
  $("#uvLabel").style.background = uvL.c+"33";
  $("#uvLabel").style.color = uvL.c;

  $("#precipVal").textContent = cur.precipitation.toFixed(1);
  $("#precipChance").textContent = (d.daily.precipitation_probability_max[0]||0)+"%";

  // AQI
  if(state.aqi && state.aqi.current){
    const aqi = Math.round(state.aqi.current.us_aqi);
    $("#aqiVal").textContent = aqi;
    const al = aqiLabel(aqi);
    $("#aqiLabel").textContent = al.t;
    $("#aqiLabel").style.background = al.c+"33";
    $("#aqiLabel").style.color = al.c;
  }

  // sun/moon
  const sunrise = new Date(d.daily.sunrise[0]);
  const sunset = new Date(d.daily.sunset[0]);
  $("#sunriseTime").textContent = formatTime(d.daily.sunrise[0]);
  $("#sunsetTime").textContent = formatTime(d.daily.sunset[0]);
  positionSunDot(sunrise, sunset);

  const moon = getMoonPhase(new Date());
  $("#moonPhaseName").textContent = moon.name;
  $("#moonIllum").textContent = moon.illum+"% illuminated";
  renderMoonIcon(moon.index);

  renderHourly();
  renderDaily();
  renderAlerts();
  updateMapPanel();

  applyAtmosphere(cur.weather_code, state.isDay);
  initHeroScene(info.icon, state.isDay);
  generateAIInsight();
}

function closestHourIndex(){
  const now = Date.now();
  const times = state.data.hourly.time;
  let best=0, diff=Infinity;
  times.forEach((t,i)=>{
    const dd = Math.abs(new Date(t).getTime()-now);
    if(dd<diff){diff=dd;best=i;}
  });
  return best;
}

function positionSunDot(sunrise,sunset){
  const now = new Date();
  const total = sunset-sunrise;
  let pct = (now-sunrise)/total;
  pct = Math.min(1, Math.max(0,pct));
  // arc path approx: from (20,120) to (380,120) via top (200,-60 control)
  const angle = Math.PI*(1-pct); // pi -> 0
  const cx=200, cy=120, rx=180, ry=180;
  const x = cx - rx*Math.cos(angle);
  const y = cy - ry*Math.sin(angle);
  const dot = $("#sunDot");
  dot.setAttribute("cx", x);
  dot.setAttribute("cy", y);
  dot.setAttribute("fill", (pct<=0||pct>=1) ? "#8fa6c9" : "#FFD86B");
}

function updateLocalTime(){
  const tz = state.data.timezone;
  try{
    const str = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:tz});
    const dateStr = new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric",timeZone:tz});
    $("#localTime").textContent = `${dateStr} · ${str} local time`;
  }catch(e){}
}

function renderHourly(){
  const el = $("#hourScroll");
  el.innerHTML = "";
  const idx0 = closestHourIndex();
  const h = state.data.hourly;
  for(let i=idx0;i<idx0+24 && i<h.time.length;i++){
    const info = wmoInfo(h.weather_code[i]);
    const div = document.createElement("div");
    div.className = "hour-item";
    div.innerHTML = `
      <span class="h-time">${i===idx0?"Now":formatHour(h.time[i])}</span>
      <span class="h-icon">${iconSVG(info.icon)}</span>
      <span class="h-temp">${Math.round(h.temperature_2m[i])}°</span>
      <span class="h-precip">${h.precipitation_probability[i]}%</span>
    `;
    el.appendChild(div);
  }
}

function renderDaily(){
  const el = $("#dayList");
  el.innerHTML = "";
  const d = state.data.daily;
  const allMax = Math.max(...d.temperature_2m_max);
  const allMin = Math.min(...d.temperature_2m_min);
  const range = allMax-allMin || 1;

  for(let i=0;i<d.time.length && i<7;i++){
    const info = wmoInfo(d.weather_code[i]);
    const lo = d.temperature_2m_min[i], hi = d.temperature_2m_max[i];
    const leftPct = ((lo-allMin)/range)*100;
    const widthPct = ((hi-lo)/range)*100;
    const row = document.createElement("div");
    row.className = "day-row";
    row.innerHTML = `
      <div class="day-name">${dayLabel(d.time[i],i)}<small>${new Date(d.time[i]).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</small></div>
      <div class="day-icon">${iconSVG(info.icon)}</div>
      <div class="day-precip">💧 ${d.precipitation_probability_max[i]||0}%</div>
      <div class="day-range">
        <span class="lo">${Math.round(lo)}°</span>
        <div class="track"><div class="fill" style="left:${leftPct}%;width:${widthPct}%"></div></div>
        <span class="hi">${Math.round(hi)}°</span>
      </div>
    `;
    el.appendChild(row);
  }
}

function renderAlerts(){
  const el = $("#alertsList");
  el.innerHTML = "";
  const alerts = [];
  const cur = state.data.current;
  const daily = state.data.daily;
  const info = wmoInfo(cur.weather_code);

  if(["storm"].includes(info.icon)){
    alerts.push({type:"warn", icon:"⛈️", title:"Thunderstorm Activity", desc:"Lightning and heavy rain detected in your area. Avoid open fields and unplug sensitive electronics."});
  }
  if(daily.uv_index_max[0] >= 8){
    alerts.push({type:"warn", icon:"☀️", title:"High UV Exposure", desc:`UV index reaching ${daily.uv_index_max[0].toFixed(1)} today. Use SPF 30+, sunglasses, and seek shade at midday.`});
  }
  if(cur.wind_speed_10m >= 40){
    alerts.push({type:"warn", icon:"💨", title:"Strong Wind Advisory", desc:`Sustained winds of ${Math.round(cur.wind_speed_10m)} km/h. Secure loose outdoor items.`});
  }
  if(state.aqi && state.aqi.current && state.aqi.current.us_aqi > 150){
    alerts.push({type:"warn", icon:"🌫️", title:"Poor Air Quality", desc:"AQI is in an unhealthy range. Sensitive groups should limit prolonged outdoor exertion."});
  }
  if((daily.precipitation_probability_max[0]||0) >= 70){
    alerts.push({type:"info", icon:"🌧️", title:"Rain Likely Today", desc:`${daily.precipitation_probability_max[0]}% chance of precipitation — carry an umbrella.`});
  }
  if(alerts.length===0){
    alerts.push({type:"info", icon:"✅", title:"No Active Alerts", desc:"Conditions look stable in your area. Enjoy your day!"});
  }
  alerts.push({type:"info", icon:"📰", title:"Seasonal Outlook", desc:"Forecast models suggest typical seasonal patterns for the coming week with no major systems tracked nearby."});

  alerts.forEach(a=>{
    const div = document.createElement("div");
    div.className = "alert-item "+a.type;
    div.innerHTML = `<div class="alert-icon">${a.icon}</div><div><h4>${a.title}</h4><p>${a.desc}</p></div>`;
    el.appendChild(div);
  });
}

/* =========================================================
   AI RECOMMENDATION ENGINE (rule-based, presented as AI)
   ========================================================= */
function buildInsight(question){
  const d = state.data;
  const cur = d.current;
  const info = wmoInfo(cur.weather_code);
  const aqi = state.aqi?.current?.us_aqi;
  const uv = d.hourly.uv_index[closestHourIndex()] ?? 0;
  const rainChance = d.daily.precipitation_probability_max[0] || 0;
  const temp = cur.temperature_2m;
  const feels = cur.apparent_temperature;
  const wind = cur.wind_speed_10m;

  const lines = [];

  // greeting / summary
  lines.push(`Right now it's <b>${Math.round(temp)}°C</b> and ${info.label.toLowerCase()} in ${state.name}, feeling like <b>${Math.round(feels)}°C</b>.`);

  // clothing
  if(feels <= 5) lines.push("Bundle up — heavy insulated layers, gloves, and a windproof outer shell are recommended.");
  else if(feels <= 15) lines.push("A warm jacket or hoodie is a good call today.");
  else if(feels <= 24) lines.push("Light layers work well — a t-shirt with a light jacket for the evening should be comfortable.");
  else if(feels <= 32) lines.push("Breathable, light-colored clothing is best — stay hydrated through the day.");
  else lines.push("It's quite hot — loose cotton clothing, sun protection, and frequent water breaks are important.");

  // umbrella / rain
  if(rainChance >= 60 || ["rain","rain-heavy","drizzle","storm"].includes(info.icon)){
    lines.push(`There's a <b>${rainChance}%</b> chance of rain — definitely carry an umbrella or waterproof jacket.`);
  } else if(rainChance >= 30){
    lines.push(`There's a moderate ${rainChance}% chance of rain later — a compact umbrella wouldn't hurt.`);
  }

  // UV
  if(uv >= 6){
    lines.push(`UV index is elevated at ${uv.toFixed(1)} — apply sunscreen and consider sunglasses if you're outdoors midday.`);
  }

  // AQI
  if(aqi != null){
    if(aqi > 150) lines.push(`Air quality is unhealthy (AQI ${Math.round(aqi)}) — consider a mask outdoors and limit strenuous activity.`);
    else if(aqi > 100) lines.push(`Air quality is moderate-to-poor (AQI ${Math.round(aqi)}) — sensitive individuals should take it easy outside.`);
  }

  // wind
  if(wind >= 35) lines.push(`Winds are strong at ${Math.round(wind)} km/h — secure loose items and be cautious cycling or biking.`);

  // activity suggestion
  if(["sun","sun-cloud"].includes(info.icon) && feels>=15 && feels<=28 && rainChance<30){
    lines.push("Great conditions for outdoor plans — a walk, run, or picnic would suit today nicely.");
  } else if(["rain","rain-heavy","storm"].includes(info.icon)){
    lines.push("This might be a good day to keep plans indoors.");
  }

  if(question){
    const q = question.toLowerCase();
    let answer = "";
    if(q.includes("umbrella") || q.includes("rain")){
      answer = rainChance>=50 ? `Yes — with a ${rainChance}% chance of rain, bring an umbrella.` : `Unlikely to be needed — only a ${rainChance}% chance of rain today.`;
    } else if(q.includes("jacket") || q.includes("wear") || q.includes("cloth")){
      answer = feels<=15 ? "Yes, a jacket is recommended given the cooler feels-like temperature." : "You probably won't need a heavy jacket — light layers should be fine.";
    } else if(q.includes("run") || q.includes("jog") || q.includes("exercise") || q.includes("gym") || q.includes("outdoor")){
      answer = (rainChance<30 && wind<30 && uv<8) ? "Conditions look favorable for outdoor exercise right now." : "Conditions are a bit challenging outdoors today — consider timing around rain/UV peaks or an indoor alternative.";
    } else if(q.includes("drive") || q.includes("travel") || q.includes("flight")){
      answer = (info.icon==="fog"||info.icon==="storm") ? "Visibility or storm conditions may affect travel — allow extra time and check live updates." : "No major weather disruptions expected for travel right now.";
    } else if(q.includes("air") || q.includes("aqi") || q.includes("pollution") || q.includes("breathe")){
      answer = aqi!=null ? `Current AQI is ${Math.round(aqi)} (${aqiLabel(aqi).t}). ${aqi>100?"Sensitive groups should limit outdoor exertion.":"Air quality is acceptable for most people."}` : "Air quality data isn't available right now.";
    } else {
      answer = "Based on current conditions: " + lines[0];
    }
    return `<p><b>You asked:</b> "${question}"</p><p>${answer}</p>`;
  }

  return lines.map(l=>`<p>${l}</p>`).join("");
}

function generateAIInsight(question){
  const body = $("#aiBody");
  body.innerHTML = `<div class="ai-typing"><span></span><span></span><span></span></div>`;
  setTimeout(()=>{
    body.innerHTML = buildInsight(question);
  }, question ? 700 : 900);
}

/* =========================================================
   MAP (Leaflet + OpenStreetMap + weather tile overlay)
   ========================================================= */
function initMap(){
  if(state.map){ state.map.remove(); }
  state.map = L.map('map', {zoomControl:true, attributionControl:true, minZoom:3}).setView([state.lat, state.lon], 7);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd', maxZoom: 19
  }).addTo(state.map);

  addRadarLayer(state.currentLayer || pickBestRadarLayer());

  const cityIcon = L.divIcon({
    className: 'city-marker',
    html: `<span class="city-pin"></span>`,
    iconSize: [18,18], iconAnchor: [9,9]
  });
  L.marker([state.lat, state.lon], {icon: cityIcon}).addTo(state.map).bindPopup(state.name).openPopup();
}

function addRadarLayer(layerKey){
  if(state.radarLayer){ state.map.removeLayer(state.radarLayer); }
  const owmKey = "dff120b7911e9421aab360d50d3175bc"; // 👈 apni OpenWeatherMap key yahan daalo
  state.radarLayer = L.tileLayer(`https://tile.openweathermap.org/map/${layerKey}/{z}/{x}/{y}.png?appid=${owmKey}`, {
    opacity: 0.7,
    maxZoom: 19,
  });
  state.radarLayer.addTo(state.map);
}

/* =========================================================
   SEARCH & GEOLOCATION
   ========================================================= */
let searchDebounce;
function setupSearch(){
  const input = $("#searchInput");
  const box = input.closest(".search-box");
  const suggEl = $("#suggestions");

  input.addEventListener("input", ()=>{
    box.classList.toggle("filled", input.value.length>0);
    clearTimeout(searchDebounce);
    const q = input.value.trim();
    if(q.length<2){ suggEl.classList.remove("show"); suggEl.innerHTML=""; return; }
    searchDebounce = setTimeout(async ()=>{
      const results = await geocodeSearch(q);
      renderSuggestions(results);
    }, 350);
  });

  $("#clearBtn").addEventListener("click", ()=>{
    input.value=""; box.classList.remove("filled");
    suggEl.classList.remove("show"); suggEl.innerHTML="";
    input.focus();
  });

  document.addEventListener("click",(e)=>{
    if(!e.target.closest(".search-wrap")) suggEl.classList.remove("show");
  });
}

function renderSuggestions(results){
  const suggEl = $("#suggestions");
  if(!results.length){ suggEl.classList.remove("show"); suggEl.innerHTML=""; return; }
  suggEl.innerHTML = results.map(r=>`
    <div class="suggestion-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}, ${r.admin1?r.admin1+', ':''}${r.country}">
      📍 ${r.name}${r.admin1?", "+r.admin1:""} <small>${r.country}</small>
    </div>
  `).join("");
  suggEl.classList.add("show");
  suggEl.querySelectorAll(".suggestion-item").forEach(item=>{
    item.addEventListener("click", ()=>{
      const lat = parseFloat(item.dataset.lat);
      const lon = parseFloat(item.dataset.lon);
      const name = item.dataset.name;
      suggEl.classList.remove("show");
      $("#searchInput").value = "";
      $("#searchInput").closest(".search-box").classList.remove("filled");
      loadLocation(lat, lon, name);
    });
  });
}

function setupGeolocation(){
  $("#locBtn").addEventListener("click", ()=>{
    const btn = $("#locBtn");
    if(!navigator.geolocation){
      alert("Geolocation isn't supported by your browser.");
      return;
    }
    btn.classList.add("locating");
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const {latitude, longitude} = pos.coords;
      const name = await reverseGeocodeName(latitude, longitude);
      btn.classList.remove("locating");
      loadLocation(latitude, longitude, name);
    }, (err)=>{
      btn.classList.remove("locating");
      alert("Unable to retrieve your location. Please allow location access or search manually.");
    }, {enableHighAccuracy:true, timeout:10000});
  });
}

/* =========================================================
   LOAD LOCATION (main orchestrator)
   ========================================================= */
async function loadLocation(lat, lon, name){
  showLoader(true);
  state.lat = lat; state.lon = lon; state.name = name;
  try{
    const [wx, aq] = await Promise.all([fetchWeather(lat,lon), fetchAQI(lat,lon)]);
    state.data = wx;
    state.aqi = aq;
    renderAll();
    if(state.map){
      state.map.setView([lat,lon], 7);
      state.map.eachLayer(l=>{ if(l instanceof L.Marker) state.map.removeLayer(l); });
      const cityIcon = L.divIcon({ className:'city-marker', html:`<span class="city-pin"></span>`, iconSize:[18,18], iconAnchor:[9,9] });
      L.marker([lat,lon], {icon: cityIcon}).addTo(state.map).bindPopup(name).openPopup();
      addRadarLayer(state.currentLayer);
    } else {
      initMap();
    }
  }catch(e){
    console.error(e);
    $("#heroDesc").textContent = "Couldn't load weather data — please try again.";
  }
  showLoader(false);
}

function showLoader(show){
  const loader = $("#loader");
  const app = $("#app");
  if(show){ loader.classList.remove("hide"); }
  else{
    loader.classList.add("hide");
    app.classList.add("ready");
  }
}

/* =========================================================
   AI ASK BOX
   ========================================================= */
function setupAIAsk(){
  const input = $("#aiInput");
  const btn = $("#aiAskBtn");
  function ask(){
    const q = input.value.trim();
    if(!q || !state.data) return;
    generateAIInsight(q);
    input.value = "";
  }
  btn.addEventListener("click", ask);
  input.addEventListener("keydown",(e)=>{ if(e.key==="Enter") ask(); });
}

/* =========================================================
   MAP LAYER BUTTONS + SIDE PANEL
   ========================================================= */
function setupLayerButtons(){
  $$(".layer-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      $$(".layer-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      state.currentLayer = btn.dataset.layer;
      if(state.map) addRadarLayer(state.currentLayer);
      setActivePanelItem(state.currentLayer);
    });
  });
}

function setActivePanelItem(layerKey){
  $$(".map-panel-item").forEach(item=>{
    item.classList.toggle("active", item.dataset.panel === layerKey);
  });
}

function updateMapPanel(){
  const cur = state.data?.current;
  if(!cur) return;
  $("#mpTemp").textContent = Math.round(cur.temperature_2m) + "°C";
  $("#mpPrecip").textContent = cur.precipitation.toFixed(1) + " mm";
  $("#mpClouds").textContent = Math.round(cur.cloud_cover) + "%";
  $("#mpWind").textContent = Math.round(cur.wind_speed_10m) + " km/h";
  setActivePanelItem(state.currentLayer);
}

/* =========================================================
   INIT
   ========================================================= */
function init(){
  setupClouds();
  setupSearch();
  setupGeolocation();
  setupAIAsk();
  setupLayerButtons();
  setInterval(()=>{ if(state.data) updateLocalTime(); }, 30000);

  // Try to auto-locate on first load; fallback to default city
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      async (pos)=>{
        const {latitude, longitude} = pos.coords;
        const name = await reverseGeocodeName(latitude, longitude);
        loadLocation(latitude, longitude, name);
      },
      ()=>{ loadLocation(state.lat, state.lon, state.name); },
      {timeout:8000}
    );
  } else {
    loadLocation(state.lat, state.lon, state.name);
  }
}

init();
