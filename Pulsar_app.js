// ========== PULSAR.DSS v4 ==========

// === SATELLITE DATABASE - Her uydunun FARKLI verileri ===
const TURKSAT_FLEET = [
    { id:'TÜRKSAT-5A', alt:35786, vel:3.07, inc:0.05, per:1436, lon:31.0, orbitR:13.0, angle:0, color:0x33ccff },
    { id:'TÜRKSAT-5B', alt:35822, vel:3.06, inc:0.08, per:1437, lon:42.0, orbitR:14.2, angle:Math.PI*0.7, color:0x33ccff },
    { id:'TÜRKSAT-6A', alt:35756, vel:3.08, inc:0.02, per:1435, lon:42.0, orbitR:12.8, angle:Math.PI*1.3, color:0x33ccff }
];

const OTHER_SATS = [
    { id:'EUTELSAT-33E', owner:'Eutelsat', vel:3.07, orbitR:13.0, angle:1.2, orbitGroup:0 },
    { id:'ASTRA-2F', owner:'SES', vel:3.06, orbitR:13.1, angle:2.5, orbitGroup:0 },
    { id:'ARABSAT-6A', owner:'Arabsat', vel:3.07, orbitR:12.9, angle:3.8, orbitGroup:0 },
    { id:'INTELSAT-39', owner:'Intelsat', vel:3.07, orbitR:14.2, angle:0.5, orbitGroup:1 },
    { id:'YAMAL-601', owner:'Gazprom', vel:3.06, orbitR:14.3, angle:1.8, orbitGroup:1 },
    { id:'CHINASAT-18', owner:'CNSA', vel:3.07, orbitR:14.1, angle:3.2, orbitGroup:1 },
    { id:'AMOS-17', owner:'Spacecom', vel:3.07, orbitR:12.8, angle:4.5, orbitGroup:2 },
    { id:'BADR-7', owner:'Arabsat', vel:3.06, orbitR:12.9, angle:5.2, orbitGroup:2 },
    { id:'STARLINK-4721', owner:'SpaceX', vel:7.59, orbitR:11.2, angle:0.3, orbitGroup:-1 },
    { id:'ONEWEB-0156', owner:'OneWeb', vel:7.26, orbitR:15.8, angle:1.0, orbitGroup:-1 },
    { id:'GPS-IIF-12', owner:'USSF', vel:3.87, orbitR:16.2, angle:2.2, orbitGroup:-1 },
    { id:'GLONASS-K2', owner:'Roscosmos', vel:3.95, orbitR:11.0, angle:4.0, orbitGroup:-1 },
];

const DEAD_DEBRIS = [
    { id:'KOSMOS-2251', pos:[10.8,3,5], desc:'Kritik LEO şarapnel bulutu' },
    { id:'SL-8-RB', pos:[-11,-2,4], desc:'Kontrolsüz roket gövdesi' },
    { id:'FENGYUN-1C', pos:[2,11,-8], desc:'Parçalanmış askeri uydu' }
];

let selectedSatIdx = 0;

// === UI ===
function selectSat(idx) {
    selectedSatIdx = idx;
    document.querySelectorAll('.sat-btn').forEach((b,i) => {
        b.classList.toggle('active', i===idx);
        const label = b.querySelector('div');
        if(label) label.className = 'fo text-[11px] font-semibold ' + (i===idx ? 'nc' : 'text-gray-400');
    });
    const s = TURKSAT_FLEET[idx];
    document.getElementById('sel-sat-name').textContent = s.id;
    document.getElementById('kpi-alt').textContent = s.alt.toLocaleString() + ' km';
    document.getElementById('kpi-vel').textContent = s.vel + ' km/s';
    document.getElementById('kpi-inc').textContent = s.inc + '°';
    document.getElementById('kpi-per').textContent = s.per.toLocaleString() + ' dk';
    document.getElementById('kpi-lon').textContent = s.lon + '°E';
    updateSatGlow(idx);
    addTelemetryEntry('SYS', s.id + ' seçildi — veriler güncellendi', '#33ccff');
}

function switchTab(tab) {
    const np = document.getElementById('national-panel');
    const cv = document.getElementById('canvas-container');
    const tb = document.getElementById('top-bar');
    if (tab === 'orbit') {
        np.classList.add('hidden'); cv.style.display='block'; tb.style.display='';
        document.getElementById('btn-orbit').className = 'flex-1 py-2 bg-cyan-900/30 nc rounded-lg text-[11px] fo font-semibold border border-cyan-800/50';
        document.getElementById('btn-national').className = 'flex-1 py-2 text-gray-600 rounded-lg text-[11px] fo font-semibold border border-transparent hover:bg-gray-800/30';
    } else {
        np.classList.remove('hidden'); cv.style.display='none'; tb.style.display='none';
        document.getElementById('btn-national').className = 'flex-1 py-2 bg-cyan-900/30 nc rounded-lg text-[11px] fo font-semibold border border-cyan-800/50';
        document.getElementById('btn-orbit').className = 'flex-1 py-2 text-gray-600 rounded-lg text-[11px] fo font-semibold border border-transparent hover:bg-gray-800/30';
    }
}

function toggleLayer(layer, el) {
    const on = el.classList.toggle('on');
    if(layer==='earth'){earthWireframe.visible=!on;earthTextured.visible=on}
    else if(layer==='danger') dangerPoints.visible = on;
    else if(layer==='safe') safePoints.visible = on;
    else if(layer==='sats') { satGroup.visible = on; otherSatGroup.visible = on; }
    else if(layer==='debris') debrisGroup.visible = on;
}

function openAddSatPanel(){ document.getElementById('add-sat-modal').classList.remove('hidden'); }
function closeAddSatPanel(){ document.getElementById('add-sat-modal').classList.add('hidden'); }

function addNewSatellite() {
    const name = document.getElementById('new-sat-name').value || 'YENI-UYDU';
    const alt = parseFloat(document.getElementById('new-sat-alt').value) || 35786;
    TURKSAT_FLEET.push({ id:name, alt, vel:3.07, inc:0.05, per:1436, lon:50, orbitR:12+Math.random()*4, angle:Math.random()*Math.PI*2, color:0x33ccff });
    const idx = TURKSAT_FLEET.length - 1;
    const btn = document.createElement('button');
    btn.id = 'sat-btn-'+idx; btn.className = 'sat-btn'; btn.onclick = () => selectSat(idx);
    btn.innerHTML = '<div class="fo text-[11px] text-gray-400 font-semibold">'+name+'</div><div class="text-[10px] text-gray-500">GEO • '+alt+'km</div>';
    document.getElementById('sat-selector').appendChild(btn);
    create3DSat(idx);
    closeAddSatPanel();
    addTelemetryEntry('LAUNCH', name + ' fırlatıldı — yörüngeye yerleşiyor', '#33ff66');
}

// === TELEMETRY LOG ===
const TELEM_MESSAGES = [
    ['NAV', 'Yörünge sapması: +0.002° — düzeltme bekleniyor', '#33ccff'],
    ['PROX', 'EUTELSAT-33E: 4.2 km mesafede — izleniyor', '#eab308'],
    ['AI', 'Önerilen manevra: 150m radyal kaçınma', '#33ccff'],
    ['WARN', 'KOSMOS-2251 enkazı: 12 km — risk hesaplanıyor', '#ff3333'],
    ['NAV', 'Güneş paneli açısı optimize: %98.4 verim', '#33ff66'],
    ['PROX', 'STARLINK-4721: Yörünge dışı — tehdit yok', '#666'],
    ['SYS', 'TLE verisi güncellendi — NORAD Epoch: 2026-088', '#33ccff'],
    ['AI', 'Kessler risk indeksi: 0.34 — normal aralıkta', '#33ff66'],
    ['WARN', 'SL-8 roket gövdesi: Kontrolsüz düşüş — 48h', '#ff3333'],
    ['NAV', 'İstasyon tutma manevrası: ΔV = 0.8 m/s planlı', '#33ccff'],
];
let telemIdx = 0;

function addTelemetryEntry(tag, msg, color) {
    const log = document.getElementById('telemetry-log');
    const now = new Date();
    const ts = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0');
    const el = document.createElement('div');
    el.className = 'p-2 rounded-lg bg-gray-900/40 border border-gray-800/50';
    el.style.borderLeftColor = color; el.style.borderLeftWidth = '2px';
    el.innerHTML = '<div class="flex justify-between mb-0.5"><span style="color:'+color+'" class="font-bold">['+tag+']</span><span class="text-gray-600 text-[9px]">'+ts+'</span></div><div class="text-gray-300 leading-snug text-[11px]">'+msg+'</div>';
    log.insertBefore(el, log.firstChild);
    if(log.children.length > 50) log.removeChild(log.lastChild);
}

function autoTelemetry() {
    const m = TELEM_MESSAGES[telemIdx % TELEM_MESSAGES.length];
    addTelemetryEntry(m[0], m[1], m[2]);
    telemIdx++;
    setTimeout(autoTelemetry, 3000 + Math.random()*4000);
}

// === TURKEY MAP ===
function generateTurkeyMap() {
    const group=document.getElementById('provinces-group'),lines=document.getElementById('network-lines'),tooltip=document.getElementById('map-tooltip'),border=document.getElementById('turkey-border');
    const B=[[26,40.7],[26.3,41.2],[26.8,41.7],[27.5,42],[28.5,42.1],[29.5,41.3],[30.5,41.1],[31.5,41.4],[32.5,41.8],[33.5,42],[34.8,42.1],[35.8,41.7],[36.8,41.3],[37.8,41.1],[38.8,41],[39.8,41],[40.8,41.2],[41.8,41.4],[42.8,41.5],[43.5,41],[44.2,40.2],[44.8,39.6],[44.5,38.8],[44.2,38],[44.6,37.2],[43.5,37.2],[42.5,37.2],[41.5,37.1],[40.5,37.1],[39.5,36.8],[38.5,36.7],[37.5,36.6],[36.6,36.8],[36.5,36.3],[36.5,35.8],[36.1,35.9],[35.8,36.3],[35.8,36.8],[35.1,36.6],[34.5,36.5],[33.5,36.2],[32.8,36],[32.1,36.4],[31.5,36.8],[30.8,36.5],[30.2,36.2],[29.6,36.1],[29,36.4],[28.5,36.7],[27.8,36.6],[27.3,36.6],[27.2,37],[27.2,37.5],[27.2,37.8],[26.7,38],[26.3,38.3],[26.6,38.7],[26.9,39],[26.4,39.2],[26,39.4],[26.2,39.8],[26.5,40.1],[26.2,40.4],[26,40.7]];
    const P=(lo,la)=>({x:(lo-25.5)/19.5*900+50,y:(42.5-la)/7*400+25});
    let d='M '+P(B[0][0],B[0][1]).x+','+P(B[0][0],B[0][1]).y+' ';
    for(let i=1;i<B.length-1;i++){let p1=P(B[i][0],B[i][1]),p2=P(B[i+1][0],B[i+1][1]);d+='Q '+p1.x+','+p1.y+' '+(p1.x+p2.x)/2+','+(p1.y+p2.y)/2+' ';}
    let lp=P(B[B.length-1][0],B[B.length-1][1]);d+='L '+lp.x+','+lp.y+' Z';border.setAttribute('d',d);
    const C=[{n:"Adana",la:37,lo:35.32},{n:"Ankara",la:39.92,lo:32.85},{n:"Antalya",la:36.88,lo:30.7},{n:"İstanbul",la:41,lo:28.97},{n:"İzmir",la:38.41,lo:27.14},{n:"Bursa",la:40.18,lo:29.06},{n:"Konya",la:37.86,lo:32.48},{n:"Gaziantep",la:37.06,lo:37.38},{n:"Diyarbakır",la:37.91,lo:40.23},{n:"Erzurum",la:39.9,lo:41.27},{n:"Samsun",la:41.28,lo:36.33},{n:"Trabzon",la:41,lo:39.71},{n:"Kayseri",la:38.73,lo:35.48},{n:"Eskişehir",la:39.77,lo:30.52},{n:"Mersin",la:36.81,lo:34.63},{n:"Van",la:38.49,lo:43.38},{n:"Malatya",la:38.35,lo:38.31},{n:"Sivas",la:39.74,lo:37.01},{n:"Edirne",la:41.67,lo:26.55},{n:"Hatay",la:36.2,lo:36.16},{n:"Kocaeli",la:40.76,lo:29.91},{n:"Denizli",la:37.77,lo:29.08},{n:"Muğla",la:37.21,lo:28.36},{n:"Mardin",la:37.31,lo:40.73},{n:"Ağrı",la:39.72,lo:43.05},{n:"Bolu",la:40.73,lo:31.6},{n:"Çanakkale",la:40.15,lo:26.4},{n:"Elazığ",la:38.67,lo:39.22},{n:"Kars",la:40.6,lo:43.09},{n:"Rize",la:41.02,lo:40.51},{n:"Şanlıurfa",la:37.16,lo:38.79},{n:"Manisa",la:38.61,lo:27.42},{n:"Aydın",la:37.83,lo:27.84},{n:"Balıkesir",la:39.64,lo:27.88},{n:"Zonguldak",la:41.45,lo:31.79},{n:"Sinop",la:42.02,lo:35.15},{n:"Artvin",la:41.18,lo:41.81},{n:"Hakkari",la:37.57,lo:43.73},{n:"Isparta",la:37.76,lo:30.55},{n:"Afyon",la:38.75,lo:30.55},{n:"Nevşehir",la:38.62,lo:34.71},{n:"Tokat",la:40.31,lo:36.55},{n:"Çorum",la:40.54,lo:34.95},{n:"Kastamonu",la:41.37,lo:33.77},{n:"Ordu",la:40.98,lo:37.87},{n:"Batman",la:37.88,lo:41.13},{n:"Aksaray",la:38.36,lo:34.02},{n:"Bingöl",la:38.88,lo:40.49},{n:"Bitlis",la:38.4,lo:42.1},{n:"Giresun",la:40.91,lo:38.39},{n:"Muş",la:38.73,lo:41.49},{n:"Kırşehir",la:39.14,lo:34.16},{n:"Niğde",la:37.96,lo:34.67},{n:"Yozgat",la:39.81,lo:34.8},{n:"Siirt",la:37.93,lo:41.94},{n:"Tunceli",la:39.1,lo:39.54},{n:"Uşak",la:38.67,lo:29.4},{n:"Tekirdağ",la:40.97,lo:27.51},{n:"Kırklareli",la:41.73,lo:27.22},{n:"Sakarya",la:40.77,lo:30.39},{n:"Düzce",la:40.84,lo:31.15},{n:"Bartın",la:41.63,lo:32.33},{n:"Karabük",la:41.19,lo:32.62},{n:"Bilecik",la:40.14,lo:29.97},{n:"Kütahya",la:39.41,lo:29.98},{n:"Burdur",la:37.71,lo:30.28},{n:"Adıyaman",la:37.76,lo:38.27},{n:"Erzincan",la:39.75,lo:39.49},{n:"Gümüşhane",la:40.46,lo:39.48},{n:"Bayburt",la:40.26,lo:40.22},{n:"Ardahan",la:41.11,lo:42.7},{n:"Iğdır",la:39.92,lo:44.04},{n:"Yalova",la:40.65,lo:29.27},{n:"Osmaniye",la:37.07,lo:36.24},{n:"Kilis",la:36.71,lo:37.11},{n:"Maraş",la:37.57,lo:36.92},{n:"Çankırı",la:40.6,lo:33.61},{n:"Amasya",la:40.65,lo:35.83},{n:"Karaman",la:37.18,lo:33.22},{n:"Kırıkkale",la:39.84,lo:33.51},{n:"Şırnak",la:37.51,lo:42.45}];
    const ST=[{c:'#22c55e',t:'Temiz',d:c=>c+' — temiz, fırlatma optimum.'},{c:'#eab308',t:'Hafif',d:c=>c+' — mikro-döküntü tespit.'},{c:'#f97316',t:'Kesişim',d:c=>c+' — uydu kesişimi!'},{c:'#dc2626',t:'Kritik',d:c=>c+' — enkaz, iptal!'}];
    for(let i=0;i<C.length;i++)for(let j=i+1;j<C.length;j++){let dx=C[i].lo-C[j].lo,dy=C[i].la-C[j].la;if(Math.sqrt(dx*dx+dy*dy)<1.8){let p1=P(C[i].lo,C[i].la),p2=P(C[j].lo,C[j].la),l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1',p1.x);l.setAttribute('y1',p1.y);l.setAttribute('x2',p2.x);l.setAttribute('y2',p2.y);l.setAttribute('class','bline');lines.appendChild(l);}}
    C.forEach(c=>{let pos=P(c.lo,c.la),h=c.n.length+c.la+c.lo,s=h%10<6?ST[0]:h%10<8?ST[1]:h%10<9?ST[2]:ST[3];let ci=document.createElementNS('http://www.w3.org/2000/svg','circle');ci.setAttribute('cx',pos.x);ci.setAttribute('cy',pos.y);ci.setAttribute('r','5');ci.setAttribute('fill',s.c);ci.setAttribute('class','city-dot');ci.style.filter='drop-shadow(0 0 5px '+s.c+')';ci.onmouseenter=()=>{tooltip.innerHTML='<strong style="font-size:13px">📍 '+c.n+'</strong> <span style="color:'+s.c+';font-size:12px">'+s.t+'</span><br><span style="color:#999;font-size:11px">'+s.d(c.n)+'</span>';tooltip.style.opacity=1};ci.onmousemove=e=>{tooltip.style.left=e.clientX+12+'px';tooltip.style.top=e.clientY-12+'px'};ci.onmouseleave=()=>{tooltip.style.opacity=0};group.appendChild(ci)});
}

// === THREE.JS ===
let scene,camera,renderer,controls;
let masterGroup,earthGroup,satGroup,otherSatGroup,debrisGroup;
let earthWireframe,earthTextured,dangerPoints,safePoints;
let moon,sunMesh,sunGlows=[];
let turksatMeshes=[],otherSatMeshes=[],debrisMeshes=[];
let isAutoRotating=false,interactionTimer;
const raycaster=new THREE.Raycaster(),mouseV=new THREE.Vector2();

function init3D(){
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,0.1,3000);
    camera.position.set(0,15,30);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setSize(innerWidth,innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.domElement.style.pointerEvents='auto';
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    controls=new THREE.OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;controls.dampingFactor=0.05;controls.minDistance=10.5;controls.maxDistance=150;

    // ÖNEMLİ: Karanlık tarafı tamamen siyah yapma - uydular görünsün
    scene.add(new THREE.AmbientLight(0x445566, 0.6)); // Daha güçlü ambient
    const hemiLight = new THREE.HemisphereLight(0x6688aa, 0x223344, 0.4); // Gökyüzü/yer arası dolgu
    scene.add(hemiLight);
    const dL=new THREE.DirectionalLight(0xffeedd,1.0);dL.position.set(200,50,-150);scene.add(dL);
    // Arka dolgu ışığı - karanlık taraftaki uyduları görsün
    const fillLight=new THREE.DirectionalLight(0x334466,0.3);fillLight.position.set(-100,-30,100);scene.add(fillLight);

    masterGroup=new THREE.Group();scene.add(masterGroup);
    earthGroup=new THREE.Group();masterGroup.add(earthGroup);

    createStarfield();
    createSun();
    createMoon();
    createEarth();
    createSurfaceZones();
    createTurksatSats();
    createOtherSats();
    createDebris();

    window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
    window.addEventListener('mousemove',onMouseMove);
    controls.addEventListener('start',()=>{isAutoRotating=false;clearTimeout(interactionTimer)});
    controls.addEventListener('end',resetTimer);
    resetTimer();
    generateTurkeyMap();
    autoTelemetry();
    updateSatGlow(0);
    animate();
}

function createStarfield(){
    // Bol yıldız! 25000 adet
    const g=new THREE.BufferGeometry(),count=25000;
    const p=new Float32Array(count*3),c=new Float32Array(count*3),sizes=new Float32Array(count);
    for(let i=0;i<count;i++){
        p[i*3]=(Math.random()-.5)*2200;
        p[i*3+1]=(Math.random()-.5)*2200;
        p[i*3+2]=(Math.random()-.5)*2200;
        const b=.3+Math.random()*.7;
        const tint=Math.random();
        c[i*3]=b*(tint>.92?.8:1); // Kırmızımsı yıldızlar
        c[i*3+1]=b*(tint>.96?.7:1);
        c[i*3+2]=b*(tint>.85?1.2:1); // Mavimsi yıldızlar
        sizes[i]=.3+Math.random()*.8;
    }
    g.setAttribute('position',new THREE.BufferAttribute(p,3));
    g.setAttribute('color',new THREE.BufferAttribute(c,3));
    scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:.5,vertexColors:true,transparent:true,opacity:.9,sizeAttenuation:true})));
}

function createSun(){
    // Daha gerçekçi güneş - çoklu katman
    sunMesh=new THREE.Mesh(new THREE.SphereGeometry(14,48,48),new THREE.MeshBasicMaterial({color:0xffee44}));
    sunMesh.position.set(300,60,-240);scene.add(sunMesh);
    // Corona katmanları
    const layers=[[22,0xffdd33,.1],[35,0xffaa11,.05],[55,0xff8800,.025],[80,0xff440000,.012]];
    layers.forEach(([r,col,op])=>{
        const g=new THREE.Mesh(new THREE.SphereGeometry(r,32,32),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,blending:THREE.AdditiveBlending}));
        g.position.copy(sunMesh.position);scene.add(g);sunGlows.push(g);
    });
    const sL=new THREE.PointLight(0xffeedd,1.2,1200);sL.position.copy(sunMesh.position);scene.add(sL);
}

function createMoon(){
    // Gerçekçi ay - texture
    const mat=new THREE.MeshStandardMaterial({color:0xaaaaaa,roughness:.8,metalness:.05});
    new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/1024px-FullMoon2010.jpg',
        t=>{mat.map=t;mat.color.setHex(0xffffff);mat.needsUpdate=true},undefined,()=>{});
    moon=new THREE.Mesh(new THREE.SphereGeometry(2.8,48,48),mat);
    moon.position.set(70,8,-40);scene.add(moon);
    // Ay halo
    const halo=new THREE.Mesh(new THREE.SphereGeometry(3.5,32,32),new THREE.MeshBasicMaterial({color:0xaabbcc,transparent:true,opacity:.03,blending:THREE.AdditiveBlending}));
    halo.position.copy(moon.position);scene.add(halo);
}

function createEarth(){
    const g=new THREE.SphereGeometry(10,64,64);
    earthWireframe=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x33ccff,wireframe:true,transparent:true,opacity:.12}));
    earthGroup.add(earthWireframe);
    const mat=new THREE.MeshStandardMaterial({color:0x2244aa,roughness:.7});
    new THREE.TextureLoader().load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',t=>{mat.map=t;mat.color.setHex(0xffffff);mat.needsUpdate=true});
    earthTextured=new THREE.Mesh(g,mat);earthTextured.visible=false;earthGroup.add(earthTextured);
    // Atmosfer glow
    earthGroup.add(new THREE.Mesh(new THREE.SphereGeometry(10.25,64,64),new THREE.MeshBasicMaterial({color:0x4488ff,transparent:true,opacity:.06,blending:THREE.AdditiveBlending,side:THREE.BackSide})));
}

function createSurfaceZones(){
    const mk=(n,col,sz,op,fn)=>{const g=new THREE.BufferGeometry(),p=new Float32Array(n*3);for(let i=0;i<n;i++){const r=10.05,t=Math.random()*Math.PI*2,ph=Math.acos(Math.random()*2-1);if(fn(t,ph)){p[i*3]=r*Math.sin(ph)*Math.cos(t);p[i*3+1]=r*Math.sin(ph)*Math.sin(t);p[i*3+2]=r*Math.cos(ph)}}g.setAttribute('position',new THREE.BufferAttribute(p,3));return new THREE.Points(g,new THREE.PointsMaterial({color:col,size:sz,transparent:true,opacity:op,blending:THREE.AdditiveBlending}))};
    dangerPoints=mk(4000,0xff1133,.15,.9,(t,p)=>Math.sin(t*4)*Math.cos(p*3)>0);
    safePoints=mk(3000,0x22ff55,.12,.7,(t,p)=>Math.sin(t*4)*Math.cos(p*3)<=0);
    masterGroup.add(dangerPoints);masterGroup.add(safePoints);
}

function makeSatMesh(color, isOwn, glowIntensity){
    const g=new THREE.Group();
    const bMat=new THREE.MeshStandardMaterial({
        color,metalness:.8,roughness:.15,
        emissive: isOwn ? color : 0x222222,
        emissiveIntensity: glowIntensity
    });
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.7,16),bMat);
    body.rotation.x=Math.PI/2;
    const panel=new THREE.Mesh(new THREE.BoxGeometry(2.0,.02,.5),new THREE.MeshStandardMaterial({
        color:0x112266,metalness:.3,emissive:0x112244,emissiveIntensity:.2 // Panel de biraz parlasın
    }));
    g.add(body);g.add(panel);
    // Seçili uydu için neon point light
    if(isOwn){
        const glow=new THREE.PointLight(color,.3,5);
        glow.position.set(0,0,0);
        g.add(glow);
    }
    return g;
}

function createTurksatSats(){
    satGroup=new THREE.Group();masterGroup.add(satGroup);
    TURKSAT_FLEET.forEach((s,i)=>{
        const mesh=makeSatMesh(0x33ccff, true, i===0?.6:.15);
        mesh.userData={...s,idx:i,isTurksat:true,speed:.002};
        mesh.position.set(s.orbitR*Math.cos(s.angle),0,s.orbitR*Math.sin(s.angle));
        // Yörünge halkası
        const ring=new THREE.Mesh(new THREE.RingGeometry(s.orbitR-.03,s.orbitR+.03,128),new THREE.MeshBasicMaterial({color:0x33ccff,transparent:true,opacity:i===0?.15:.04,side:THREE.DoubleSide}));
        ring.rotation.x=Math.PI/2;ring.userData={forSat:i};masterGroup.add(ring);
        turksatMeshes.push(mesh);satGroup.add(mesh);
    });
}

function create3DSat(idx){
    const s=TURKSAT_FLEET[idx];
    const mesh=makeSatMesh(0x33ccff,true,.15);
    mesh.userData={...s,idx,isTurksat:true,speed:.002};
    mesh.position.set(s.orbitR*Math.cos(s.angle),0,s.orbitR*Math.sin(s.angle));
    turksatMeshes.push(mesh);satGroup.add(mesh);
}

function createOtherSats(){
    otherSatGroup=new THREE.Group();masterGroup.add(otherSatGroup);
    OTHER_SATS.forEach(s=>{
        const mesh=makeSatMesh(s.orbitGroup>=0?0x888899:0x666677, false, .1);
        mesh.userData={...s,speed:.001+Math.random()*.001};
        mesh.position.set(s.orbitR*Math.cos(s.angle),(Math.random()-.5)*2,s.orbitR*Math.sin(s.angle));
        const hb=new THREE.Mesh(new THREE.SphereGeometry(1.2),new THREE.MeshBasicMaterial({visible:false}));
        hb.userData={...s,parentMesh:mesh};mesh.add(hb);
        otherSatMeshes.push(mesh);otherSatGroup.add(mesh);
    });
}

function createDebris(){
    debrisGroup=new THREE.Group();masterGroup.add(debrisGroup);
    DEAD_DEBRIS.forEach(d=>{
        const g=new THREE.Group();
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(.4,.5,1.2,8),new THREE.MeshStandardMaterial({color:0x775544,wireframe:true,emissive:0x221100,emissiveIntensity:.15})));
        const p=new THREE.Mesh(new THREE.BoxGeometry(1.3,.08,.35),new THREE.MeshStandardMaterial({color:0x444,emissive:0x111111,emissiveIntensity:.1}));
        p.position.set(.7,0,0);p.rotation.z=Math.PI/5;g.add(p);
        g.position.set(...d.pos);
        const hb=new THREE.Mesh(new THREE.SphereGeometry(1.3),new THREE.MeshBasicMaterial({visible:false}));
        hb.userData={id:d.id,desc:d.desc,isDead:true};g.add(hb);
        debrisMeshes.push(g);debrisGroup.add(g);
    });
}

function updateSatGlow(idx){
    // Seçili uyduya belirgin NEON fosfor, diğerlerine hafif
    turksatMeshes.forEach((m,i)=>{
        const sel=i===idx;
        // Body material
        m.children[0].material.emissiveIntensity = sel ? .7 : .15;
        m.children[0].material.emissive.setHex(sel ? 0x33ccff : 0x112233);
        // Point light (3. child)
        if(m.children[2] && m.children[2].isLight){
            m.children[2].intensity = sel ? .6 : .05;
            m.children[2].color.setHex(sel ? 0x33ccff : 0x112233);
        }
    });
    // Yörünge halkası opaklık
    masterGroup.children.forEach(c=>{
        if(c.userData && c.userData.forSat!==undefined){
            c.material.opacity = c.userData.forSat===idx ? .18 : .03;
        }
    });
}

// === MOUSE INTERACTION ===
function onMouseMove(e){
    mouseV.x=(e.clientX/innerWidth)*2-1;mouseV.y=-(e.clientY/innerHeight)*2+1;
    raycaster.setFromCamera(mouseV,camera);
    const tooltip=document.getElementById('sat-tooltip');
    const hitboxes=[];
    otherSatGroup.children.forEach(m=>{if(m.children.length>2)hitboxes.push(m.children[m.children.length-1])});
    debrisGroup.children.forEach(m=>{if(m.children&&m.children.length>0){const last=m.children[m.children.length-1];if(last.userData&&last.userData.isDead)hitboxes.push(last)}});
    const hits=raycaster.intersectObjects(hitboxes);
    if(hits.length>0){
        const ud=hits[0].object.userData;
        if(ud.isDead){
            document.body.style.cursor='pointer';
            tooltip.innerHTML='<span style="color:#ff3333;font-size:13px">⚠ '+ud.id+'</span><br><span style="color:#999;font-size:12px">'+ud.desc+'</span>';
            tooltip.style.opacity=1;
            tooltip.style.left=(e.clientX+14)+'px';tooltip.style.top=(e.clientY+14)+'px';
            return;
        }
        // Sadece seçili uydunun yörüngesindeki uyduları göster
        if(ud.orbitGroup===selectedSatIdx){
            document.body.style.cursor='pointer';
            tooltip.innerHTML='<span style="color:#33ccff;font-size:13px;font-weight:bold">'+ud.id+'</span><br>'+
                '<span style="color:#888">Operatör: </span><span style="color:#fff;font-size:12px">'+ud.owner+'</span><br>'+
                '<span style="color:#888">Hız: </span><span style="color:#33ccff;font-size:12px;font-weight:bold">'+ud.vel+' km/s</span>';
            tooltip.style.opacity=1;
            tooltip.style.left=(e.clientX+14)+'px';tooltip.style.top=(e.clientY+14)+'px';
        } else {
            document.body.style.cursor='default';tooltip.style.opacity=0;
        }
    } else {
        document.body.style.cursor='default';tooltip.style.opacity=0;
    }
}

// === ANIMATION ===
let moonAngle=0;
function resetTimer(){isAutoRotating=false;clearTimeout(interactionTimer);interactionTimer=setTimeout(()=>{isAutoRotating=true},8000)}

function animate(){
    requestAnimationFrame(animate);
    if(isAutoRotating&&masterGroup)masterGroup.rotation.y+=.0003;
    // Ay yörüngesi
    if(moon){moonAngle+=.0002;moon.position.x=70*Math.cos(moonAngle);moon.position.z=-40+70*Math.sin(moonAngle)}
    // Güneş glow nabız
    sunGlows.forEach((g,i)=>g.scale.setScalar(1+Math.sin(Date.now()*.0006+i*1.5)*.035));
    // Türksat uyduları
    turksatMeshes.forEach(m=>{
        m.userData.angle+=m.userData.speed;
        m.position.x=m.userData.orbitR*Math.cos(m.userData.angle);
        m.position.z=m.userData.orbitR*Math.sin(m.userData.angle);
        m.lookAt(0,0,0);
    });
    // Diğer uydular
    otherSatMeshes.forEach(m=>{
        m.userData.angle+=m.userData.speed;
        m.position.x=m.userData.orbitR*Math.cos(m.userData.angle);
        m.position.z=m.userData.orbitR*Math.sin(m.userData.angle);
        m.lookAt(0,0,0);
        // Yörünge yakınlığına göre parlaklık
        const inOrbit=m.userData.orbitGroup===selectedSatIdx;
        m.children[0].material.emissiveIntensity=inOrbit?.2:.05;
        m.children[0].material.emissive.setHex(inOrbit?0x33ccff:0x111122);
    });
    // Enkaz dönüşü
    debrisGroup.children.forEach(d=>{d.rotation.x+=.005;d.rotation.y+=.003});
    controls.update();renderer.render(scene,camera);
}

window.onload=()=>{init3D()};
