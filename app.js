import {T,stage,mesh,material,tex,clamp,lerp,smooth,span,ui} from './core.js?v=8d37539694e3'
ui()
// A deterministic ridged heightfield. Camera travel changes the landscape's silhouette.
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453123;return n-Math.floor(n)}
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);return lerp(lerp(hash(ix,iy),hash(ix+1,iy),fx),lerp(hash(ix,iy+1),hash(ix+1,iy+1),fx),fy)}
function height(x,z){const ridge=Math.exp(-Math.pow((x-4*Math.sin(z*.11))/13,2));const ridge2=Math.exp(-Math.pow((x+20+4*Math.cos(z*.1))/11,2));let h=2.2+ridge*(8+5*Math.sin(z*.07+1.3))+ridge2*7;let amp=3.2,f=.12;for(let i=0;i<5;i++){h+=(1-Math.abs(noise(x*f+51,z*f+39)*2-1))*amp;f*=2.12;amp*=.48}h-=5*Math.exp(-Math.pow((x-14-4*Math.sin(z*.08))/5,2));return Math.max(.5,h)}
const paths=[[[16,27],[13,18],[9,12],[6,9],[3,4],[1,-2],[-2,-9],[0,-17]],[[21,26],[21,14],[16,7],[18,-1],[16,-8],[18,-19]],[[27,23],[21,19],[17,10],[10,9],[5,3],[1,-2]]]
const routeData=[['The Ridge Line','Three days of climbing from sheltered meadows to a high ridge. The imagined route pauses at a mountain hut before a long, open walk above the cloud line.','M100 510Q400 450 290 320T430 110',[430,110]],['The Quiet Valley','A slower two-day walk beside the valley’s river. Stop in open clearings, sit by the water and follow the path back as the evening light turns the peaks blue.','M100 510Q190 400 165 310T300 110',[300,110]],['The First Light','Leave in the blue hour for a short, purposeful ascent. Reach the overlook as the first light arrives, then return to the valley for a long breakfast.','M100 510Q400 490 425 350T470 210',[470,210]]]
const ALT=(h)=>1480+(h-.5)/(16-.5)*2050
// The atlas profile is sampled from the same height field the scene stands on, so the
// drawing and the mountain cannot disagree.
const profileData=paths.map(pts=>{const curve=new T.CatmullRomCurve3(pts.map(([x,z])=>new T.Vector3(x,0,z)),false,'catmullrom',.45);const out=[];for(let i=0;i<=90;i++){const q=curve.getPoint(i/90);out.push(height(q.x,q.z))}return out})
const profileMin=Math.min(...profileData.flat()),profileMax=Math.max(...profileData.flat())
const profileSvg=document.querySelector('#profile-svg'),profileArea=document.querySelector('#profile-area'),profileLine=document.querySelector('#profile-line'),profileDot=document.querySelector('#profile-dot'),profileText=document.querySelector('#profile-text')
function drawProfile(i){const vals=profileData[i],W=560,H=78,pad=6
 const lo=profileMin,hi=profileMax,span2=Math.max(.001,hi-lo)
 const pt=(k,v)=>[k/(vals.length-1)*W,H-pad-(v-lo)/span2*(H-pad*2)]
 let d='',area=''
 vals.forEach((v,k)=>{const [x,y]=pt(k,v);d+=(k?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)})
 area=d+'L'+W+' '+H+'L0 '+H+'Z'
 profileLine.setAttribute('d',d);profileArea.setAttribute('d',area)
 const [ex,ey]=pt(vals.length-1,vals[vals.length-1]);profileDot.setAttribute('cx',ex.toFixed(1));profileDot.setAttribute('cy',ey.toFixed(1))
 document.querySelector('#profile-start').textContent=Math.round(ALT(vals[0])).toLocaleString('en')+' m'
 document.querySelector('#profile-end').textContent=Math.round(ALT(vals[vals.length-1])).toLocaleString('en')+' m'
 const gain=Math.round(ALT(vals[vals.length-1])-ALT(vals[0]))
 profileText.textContent=routeData[i][0]+': ascent profile, '+Math.round(ALT(vals[0])).toLocaleString('en')+' metres to '+Math.round(ALT(vals[vals.length-1])).toLocaleString('en')+' metres, '+(gain>=0?'a gain':'a drop')+' of '+Math.abs(gain).toLocaleString('en')+' metres.'
 profileSvg.setAttribute('aria-label',routeData[i][0]+' ascent profile')}
let selected=0,hovered=-1
const buttons=[...document.querySelectorAll('[data-route]')]
function select(i){selected=i;buttons.forEach((b,k)=>{b.classList.toggle('selected',k===i);b.setAttribute('aria-pressed',String(k===i))});document.querySelector('#map-route').setAttribute('d',routeData[i][2]);const end=document.querySelector('#map-end');end.setAttribute('cx',routeData[i][3][0]);end.setAttribute('cy',routeData[i][3][1]);document.querySelector('#map-name').textContent=routeData[i][0];document.querySelector('#route-live').textContent=routeData[i][0]+' selected.';drawProfile(i);world?.wake()}
drawProfile(0)
buttons.forEach((b,i)=>{b.addEventListener('click',()=>select(i));b.addEventListener('pointerenter',()=>{hovered=i;world?.wake()});b.addEventListener('pointerleave',()=>{hovered=-1;world?.wake()});b.addEventListener('focus',()=>{hovered=i;world?.wake()});b.addEventListener('blur',()=>{hovered=-1;world?.wake()})})
document.querySelector('#plan').addEventListener('click',()=>{document.querySelector('#note-title').textContent=routeData[selected][0];document.querySelector('#note-copy').textContent=routeData[selected][1];document.querySelector('#field-note').showModal()})
const contours=document.querySelector('#contours');for(let i=0;i<27;i++){const p=document.createElementNS('http://www.w3.org/2000/svg','path');let d='';for(let j=0;j<=130;j++){const a=j/130*Math.PI*2,r=45+i*10+(Math.sin(a*4+i*.18)+Math.cos(a*7+i*.23))*i*1.4;const x=355+Math.cos(a)*r*.8,y=270+Math.sin(a)*r*1.14;d+=(j?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)}p.setAttribute('d',d+'Z');contours.append(p)}
let world
try{
 world=stage({poster:.48,fov:43,far:250});const {scene,camera}=world
 scene.fog=new T.FogExp2('#acc6d0',.009)
 scene.add(new T.HemisphereLight('#dbefff','#425767',2.1));const sun=new T.DirectionalLight('#fff3c5',3.5);sun.position.set(-35,45,12);scene.add(sun)
 const geo=new T.PlaneGeometry(140,150,200,210);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position
 for(let i=0;i<pos.count;i++)pos.setY(i,height(pos.getX(i),pos.getZ(i)))
 geo.computeVertexNormals();const colors=[],color=new T.Color(),rock=new T.Color('#435863'),snow=new T.Color('#e6eee8'),green=new T.Color('#71887c');const normals=geo.attributes.normal
 for(let i=0;i<pos.count;i++){const h=pos.getY(i),ny=normals.getY(i),n=noise(pos.getX(i)*.8,pos.getZ(i)*.8);color.copy(h<7?green:rock);const s=clamp((h-9.2+n*2)*.23)*clamp((ny-.32)*2.9);color.lerp(snow,s);colors.push(color.r,color.g,color.b)}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:true}),scene)
 // Long route tubes remain on the terrain, with small waypoints for scale.
 const routes=[];for(let k=0;k<paths.length;k++){const input=paths[k].map(([x,z])=>new T.Vector3(x,height(x,z)+.17,z));const flat=new T.CatmullRomCurve3(input);const points=[];for(let i=0;i<=240;i++){const q=flat.getPoint(i/240);q.y=height(q.x,q.z)+.19;points.push(q)}const curve=new T.CatmullRomCurve3(points);const m=new T.MeshBasicMaterial({color:k===0?'#dbfc75':'#d1e2de',transparent:true,opacity:k===0?1:.3});const obj=mesh(new T.TubeGeometry(curve,240,.075,5,false),m,scene);routes.push(obj);mesh(new T.TubeGeometry(curve,240,.11,5,false),new T.MeshBasicMaterial({color:'#304a55',transparent:true,opacity:.55}),scene).position.y=-.075}
 const marker=mesh(new T.SphereGeometry(.24,12,8),new T.MeshBasicMaterial({color:'#e1ff79'}),scene)
 // Sparse dark firs in the lower valley create near/middle/far parallax.
 const treeMat=material('#243d3e',.95),trunkMat=material('#2d2620',.98)
 const treeSpots=[];for(let i=0;i<600&&treeSpots.length<190;i++){const x=hash(i,2)*100-50,z=hash(i,8)*110-55,y=height(x,z);if(y>9||x>11&&x<19)continue;treeSpots.push([x,y,z,.6+hash(i,13)*.7,hash(i,17)*6.28])}
 // Three stacked canopies and a trunk read as a conifer at any distance.
 const mkTree=(geo,m,yOff,n)=>{const im=new T.InstancedMesh(geo,m,n),d=new T.Object3D();treeSpots.forEach(([x,y,z,sc,ry],i)=>{d.position.set(x,y+yOff*sc,z);d.scale.set(sc,sc,sc);d.rotation.y=ry;d.updateMatrix();im.setMatrixAt(i,d.matrix)});im.count=treeSpots.length;return im}
 scene.add(mkTree(new T.ConeGeometry(.5,1.5,6),treeMat,.95,treeSpots.length))
 scene.add(mkTree(new T.ConeGeometry(.36,1.15,6),treeMat,1.75,treeSpots.length))
 scene.add(mkTree(new T.ConeGeometry(.21,.8,6),treeMat,2.4,treeSpots.length))
 scene.add(mkTree(new T.CylinderGeometry(.055,.075,.7,5),trunkMat,.34,treeSpots.length))
 // Rock outcrops on the higher ground.
 const rockMat=material('#5a6b6d',.96),rocks=new T.InstancedMesh(new T.IcosahedronGeometry(.6,0),rockMat,90),rd=new T.Object3D();let rn=0
 for(let i=0;i<400&&rn<90;i++){const x=hash(i,31)*96-48,z=hash(i,37)*104-52,y=height(x,z);if(y<7.5||y>15)continue;const sc=.5+hash(i,41)*1.1;rd.position.set(x,y+sc*.1,z);rd.scale.set(sc,sc*(.5+hash(i,43)*.45),sc);rd.rotation.set(hash(i,47)*3,hash(i,53)*6.28,hash(i,59)*3);rd.updateMatrix();rocks.setMatrixAt(rn++,rd.matrix)}rocks.count=rn;scene.add(rocks)
 // Slow cloud sprites and a distant flock give the air some depth.
 const cloudTex=tex((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'#ffffff');g.addColorStop(.45,'#ffffffcc');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,w,h)},192,192)
 const clouds=[];for(let i=0;i<18;i++){const m=new T.SpriteMaterial({map:cloudTex,transparent:true,depthWrite:false,opacity:.42+hash(i,61)*.34,color:'#e2ecef'});const sp=new T.Sprite(m);const sc=16+hash(i,67)*30;sp.scale.set(sc,sc*.5,1);sp.position.set(hash(i,71)*150-75,(i%2?9+hash(i,73)*8:19+hash(i,73)*9),hash(i,79)*170-85);sp.userData.speed=.35+hash(i,83)*.7;clouds.push(sp);scene.add(sp)}
 const birdTex=tex((c,w,h)=>{c.strokeStyle='#22343a';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(18,96);c.quadraticCurveTo(64,54,96,92);c.quadraticCurveTo(128,54,174,96);c.stroke()},192,128)
 const birds=[];for(let i=0;i<9;i++){const m=new T.SpriteMaterial({map:birdTex,transparent:true,depthWrite:false,opacity:.75});const sp=new T.Sprite(m);const sc=1.1+hash(i,89)*.7;sp.scale.set(sc,sc*.62,1);sp.userData={r:26+hash(i,97)*22,a:hash(i,101)*6.28,y:15+hash(i,103)*7,s:.05+hash(i,107)*.05};birds.push(sp);scene.add(sp)}
 const plane=new T.PlaneGeometry(12,150,20,120);plane.rotateX(-Math.PI/2);const pp=plane.attributes.position;for(let i=0;i<pp.count;i++){const z=pp.getZ(i);pp.setX(i,pp.getX(i)*.14+16+4*Math.sin(z*.08));pp.setY(i,.8)}mesh(plane,material('#6aafb2',.15,.25),scene)
 const cameraPath=new T.CatmullRomCurve3([new T.Vector3(37,22,49),new T.Vector3(26,26,26),new T.Vector3(18,35,8),new T.Vector3(9,44,-12)],false,'catmullrom',.45)
 const targetPath=new T.CatmullRomCurve3([new T.Vector3(0,8,0),new T.Vector3(0,9,-3),new T.Vector3(0,8,-8),new T.Vector3(0,7,-15)],false,'catmullrom',.45)
 const sticky=document.querySelector('.sticky'),altitude=document.querySelector('#altitude'),chapter=document.querySelector('#chapter-label')
 world.update(({p,raw,time,mobile})=>{const u=smooth(p);
 clouds.forEach((c,i)=>{c.position.x+=c.userData.speed*.016;if(c.position.x>78)c.position.x=-78});
 birds.forEach((b,k)=>{const d=b.userData;d.a+=d.s*.016;b.position.set(Math.cos(d.a)*d.r, d.y+Math.sin(d.a*2.2+k)*1.1, Math.sin(d.a)*d.r-6);b.scale.y=(1.1+hash(k,89)*.7)*.62*(.75+.25*Math.sin(time*7+k))});camera.position.copy(cameraPath.getPoint(u));if(mobile){camera.position.x+=8;camera.position.y+=4;camera.position.z+=18}camera.lookAt(targetPath.getPoint(u));const q=routes[selected].geometry.parameters.path.getPoint(clamp(.02+p*.95));marker.position.copy(q);routes.forEach((o,i)=>{o.material.opacity=i===(hovered<0?selected:hovered)?1:.22});sticky.style.setProperty('--intro-opacity',1-span(raw,.09,.3));sticky.style.setProperty('--intro-y',(-raw*100)+'px');sticky.style.setProperty('--title-opacity',1-span(raw,.1,.48));sticky.style.setProperty('--title-y',(-raw*150)+'px');sticky.style.setProperty('--middle-opacity',span(raw,.33,.5)*(1-span(raw,.86,1)));sticky.style.setProperty('--middle-y',((1-span(raw,.33,.5))*35)+'px');sticky.style.setProperty('--gain',p);altitude.textContent=Math.round(1480+p*2050).toLocaleString('en');chapter.textContent=p<.34?'01 / THE DEPARTURE':p<.72?'02 / THE RIDGE':'03 / A NEW PERSPECTIVE';world.host.dataset.selected=selected})
}catch(e){console.error('Alpine scene:',e)}
