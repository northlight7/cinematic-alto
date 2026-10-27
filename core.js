import * as T from 'three'
import {RoomEnvironment} from './assets/vendor/RoomEnvironment.js'
import {RoundedBoxGeometry} from './assets/vendor/RoundedBoxGeometry.js'
export {T}
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x))
export const lerp=(a,b,p)=>a+(b-a)*p
export const smooth=p=>{p=clamp(p);return p*p*(3-2*p)}
export const span=(p,a,b)=>smooth((p-a)/(b-a))
export const material=(color,roughness=.5,metalness=0,extra={})=>new T.MeshStandardMaterial({color,roughness,metalness,...extra})
export function mesh(g,m,parent,pos=[0,0,0]){const o=new T.Mesh(g,m);o.position.set(...pos);parent.add(o);return o}
export function rounded(w,h,d,m,parent,pos=[0,0,0],r=.05){return mesh(new RoundedBoxGeometry(w,h,d,3,r),m,parent,pos)}
export function tex(draw,w=1024,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t}
export function stage({background=null,environment=false,poster=.5,fov=40,far=250}={}){
 const host=document.querySelector('.scene'),story=document.querySelector('.journey'),canvas=host.querySelector('canvas'),motion=document.querySelector('[data-motion]')
 let renderer
 try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'})}catch(e){document.body.classList.add('no-webgl');host.querySelector('.fallback').hidden=false;motion.hidden=true;throw e}
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05
 const scene=new T.Scene();if(background)scene.background=new T.Color(background)
 const camera=new T.PerspectiveCamera(fov,1,.05,far)
 let env
 if(environment){const pm=new T.PMREMGenerator(renderer),room=new RoomEnvironment();env=pm.fromScene(room,.05);scene.environment=env.texture;room.dispose();pm.dispose()}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduced.matches,p=0,target=0,time=0,raf=0,last=0,visible=true,fn=()=>{},dirty=3,initialized=false,dead=false,contextLost=false
 function status(){motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'Motion off':'Motion on';document.body.classList.toggle('motion-off',paused);document.documentElement.classList.toggle('motion-off',paused)}
 function wake(){dirty=3;if(!raf&&!dead&&!document.hidden&&visible&&!contextLost)raf=requestAnimationFrame(loop)}
 function measure(){const box=host.getBoundingClientRect();renderer.setSize(box.width,box.height,false);camera.aspect=box.width/box.height;camera.updateProjectionMatrix();scroll();p=target;wake()}
 function scroll(){const r=story.getBoundingClientRect();target=clamp(-r.top/Math.max(1,story.offsetHeight-host.clientHeight));visible=r.bottom>0&&r.top<innerHeight;if(!initialized){p=target;initialized=true}wake()}
 function loop(stamp){raf=0;if(dead||document.hidden||!visible||contextLost)return;const frame=last?stamp-last:16.67,dt=Math.min(frame/1000,.05);last=stamp
  if(!paused)time+=dt
  p=paused?target:lerp(p,target,1-Math.exp(-dt*14))
  fn({p:paused?poster:p,raw:target,time,dt,paused,mobile:innerWidth<700,width:host.clientWidth,height:host.clientHeight})
  scene.updateMatrixWorld();renderer.render(scene,camera)
  host.dataset.progress=p.toFixed(4);host.dataset.camera=camera.position.toArray().map(n=>n.toFixed(3)).join(',');host.dataset.triangles=renderer.info.render.triangles;host.dataset.drawCalls=renderer.info.render.calls;host.dataset.frameMs=frame.toFixed(1)
  if(!paused||Math.abs(target-p)>.0001||--dirty>0)raf=requestAnimationFrame(loop)
 }
 const motionClick=()=>{paused=!paused;status();wake()};motion.addEventListener('click',motionClick)
 const reducedChange=()=>{paused=reduced.matches;status();wake()};reduced.addEventListener('change',reducedChange)
 const vis=()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0}else wake()}
 window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',measure);document.addEventListener('visibilitychange',vis)
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;document.body.classList.add('no-webgl');host.querySelector('.fallback').hidden=false})
 canvas.addEventListener('webglcontextrestored',()=>location.reload())
 window.addEventListener('pagehide',e=>{cancelAnimationFrame(raf);raf=0;if(e.persisted)return;dead=true;window.removeEventListener('scroll',scroll);window.removeEventListener('resize',measure);document.removeEventListener('visibilitychange',vis);reduced.removeEventListener('change',reducedChange);const gs=new Set(),ms=new Set(),ts=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){ms.add(m);for(const t of Object.values(m))if(t?.isTexture)ts.add(t)}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());env?.dispose();renderer.dispose()})
 window.addEventListener('pageshow',()=>{last=0;measure()})
 status();measure();document.body.classList.add('ready')
 return {scene,camera,renderer,canvas,host,wake,isPaused:()=>paused,update(callback){fn=callback;wake()}}
}
export function ui(){
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in-view')}),{threshold:.12});document.querySelectorAll('.reveal').forEach(x=>io.observe(x))
 document.querySelectorAll('dialog').forEach(d=>{d.querySelector('[data-close]')?.addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d)d.close()})})
}
