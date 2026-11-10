// Self-contained WebGL humanoid renderer. Gameplay and timing remain in game/movement.js.
const human3D=(()=>{
 const state={available:false,error:null,frames:0};
 if(typeof WebGLRenderingContext==='undefined')return state;
 const canvas=document.createElement('canvas');const pixelScale=typeof innerWidth==='number'&&innerWidth>=900?1.5:1;canvas.width=1000*pixelScale;canvas.height=590*pixelScale;
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});
 if(!gl)return state;
 const vertex=`
 attribute vec3 position;attribute vec3 normal;attribute vec2 uv;
 uniform mat4 model;uniform mat3 normalMatrix;
 varying vec3 vNormal;varying vec3 vPosition;varying vec3 vLocal;varying vec2 vUv;
 void main(){
  vec4 p=model*vec4(position,1.);
  vUv=uv;vLocal=position;vPosition=p.xyz;vNormal=normalize(normalMatrix*normal);
  float n=25.,f=1200.;
  gl_Position=vec4(600.*p.x/1000.,-600.*p.y/590.+(1.-510./590.)*p.z,((f+n)/(f-n))*p.z-2.*f*n/(f-n),p.z);
 }`;
 const fragment=`
 precision mediump float;
 uniform vec3 color;uniform float material;uniform float textured;uniform sampler2D skinMap;
 varying vec3 vNormal;varying vec3 vPosition;varying vec3 vLocal;varying vec2 vUv;
 void main(){
  vec3 n=normalize(vNormal),view=normalize(-vPosition);
  vec3 key=normalize(vec3(-.6,-.7,-1.)),fill=normalize(vec3(.8,-.15,-.4));
  float diffuse=max(0.,dot(n,key)),bounce=max(0.,dot(n,fill));
  float spec=pow(max(0.,dot(n,normalize(key+view))),material>2.5?38.:material>1.5?26.:12.);
  float rim=pow(1.-max(0.,dot(n,view)),3.);
  float grain=sin(vPosition.x*6.7+sin(vPosition.y*9.))*sin(vPosition.z*7.3+vPosition.y*4.);
  vec3 base=mix(color,texture2D(skinMap,vUv).rgb*color,textured);
  // Soft illustrated value groups and warm skin shadows, rather than plastic gloss.
  float lightBand=mix(.34,.62,smoothstep(.12,.25,diffuse))+ .27*smoothstep(.58,.72,diffuse);
  vec3 shadowTint=material<.5?vec3(.91,.77,.73):vec3(.78,.85,.93);
  if(material<.5&&vLocal.z<242.&&vLocal.y<24.){
   float lips=exp(-pow(vLocal.x/17.,4.)-pow((vLocal.y-7.)/4.,2.));
   float cheek=exp(-pow((abs(vLocal.x)-29.)/15.,2.)-pow((vLocal.y+11.)/17.,2.));
   base=mix(base,base*vec3(.74,.50,.48),lips*.46);
   base=mix(base,base*vec3(1.06,.84,.79),cheek*.24);
  }
  vec3 shade=base*mix(shadowTint,vec3(1.),smoothstep(.18,.7,diffuse))*(mix(.34+.60*diffuse,lightBand,.40)+.13*bounce);
  float edge=pow(1.-max(0.,dot(n,view)),4.);
  shade*=1.-edge*(material>3.5?.36:material<.5?.15:.23);
  shade+=vec3(.96,.88,.73)*spec*(material>3.5?.06:material>2.5?.28:material<.5?.045:.025);
  shade+=vec3(.27,.42,.50)*rim*.15;
  if(material<.5)shade+=vec3(.12,.035,.015)*pow(max(0.,dot(-n,key)),2.)*.25;
  shade*=1.+grain*(material>1.5?.008:.014);
  if(material>3.5)shade*=.96+.06*(.5+.5*sin(vPosition.x*1.7+vPosition.y*.25+sin(vPosition.z*.12)*2.));
  gl_FragColor=vec4(shade,1.);
 }`;
 function shader(kind,source){const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 let program;
 try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}
 catch(error){state.error=String(error);return state;}
 gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
 const loc={};for(const name of ['model','normalMatrix','color','material','textured','skinMap'])loc[name]=gl.getUniformLocation(program,name);
 const pos=gl.getAttribLocation(program,'position'),nor=gl.getAttribLocation(program,'normal'),uvLoc=gl.getAttribLocation(program,'uv');
 const skinTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,skinTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([220,193,172,255]));
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 state.skinReady=true;
 let headAsset=null,bodyAsset=null;
 const readAsset=name=>fetch('assets/human/'+name+'.json').then(r=>{if(!r.ok)throw Error(name+' '+r.status);return r.json();});
 state.assetPromise=Promise.all([readAsset('neutral-head'),readAsset('anatomical-body')]).then(([head,body])=>{
  headAsset=head;bodyAsset=body;state.headReady=state.bodyReady=true;state.bodyVertexCount=body.positions.length/3;cachedLook=null;
 }).catch(error=>{state.assetError=String(error);});
 const unit=v=>{const d=Math.hypot(...v)||1;return v.map(x=>x/d);};
 const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,k)=>a.map(x=>x*k);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const lerp=(a,b,k)=>a.map((x,i)=>x+(b[i]-x)*k);
 const xyz=p=>[p.x,p.y,p.z];
 const identity=[[1,0,0],[0,1,0],[0,0,1]];
 let root={x:0,y:0,z:0,twist:0,yaw:0};
 function transform(p){
  const cy=Math.cos(root.yaw),sy=Math.sin(root.yaw),cz=Math.cos(root.twist),sz=Math.sin(root.twist);
  const x=p[0]*cy+(p[2]-310)*sy,z=310-p[0]*sy+(p[2]-310)*cy;
  const y=p[1]-85;return [x*cz-y*sz+root.x,85+x*sz+y*cz+root.y,z+root.z];
 }
 function axisTransform(p){const a=transform(p),b=transform([0,0,0]);return sub(a,b);}
 function makeMesh(vertices){
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
  return {buffer,count:vertices.length/6};
 }
 function gridMesh(rows,columns,point){
  const data=[];
  const v=(i,j)=>point(i/rows,j/columns);
  function tri(a,b,c){for(const p of [a,b,c])data.push(...p.p,...p.n);}
  for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){const a=v(i,j),b=v(i+1,j),c=v(i+1,j+1),d=v(i,j+1);tri(a,b,d);tri(b,c,d);}
  return makeMesh(data);
 }
 const sphere=gridMesh(16,24,(u,v)=>{const a=u*Math.PI,b=v*Math.PI*2,n=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];return {p:n,n};});
 const paddedGlove=gridMesh(18,24,(u,v)=>{
  const a=u*Math.PI,b=v*Math.PI*2,n=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];
  return {p:n.map(x=>Math.sign(x)*Math.pow(Math.abs(x),.78)),n:unit(n.map(x=>Math.sign(x)*Math.pow(Math.abs(x),1.22)))};
 });
 function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
 function draw(mesh,center,scale,color,material=0,basis=identity,world=true){
  const c=world?transform(center):center,axes=basis.map(a=>world?axisTransform(a):a);
  const m=new Float32Array([axes[0][0]*scale[0],axes[0][1]*scale[0],axes[0][2]*scale[0],0,axes[1][0]*scale[1],axes[1][1]*scale[1],axes[1][2]*scale[1],0,axes[2][0]*scale[2],axes[2][1]*scale[2],axes[2][2]*scale[2],0,...c,1]);
  const nm=new Float32Array(axes.flatMap((a,i)=>a.map(x=>x/Math.max(.01,scale[i]))));
  gl.uniformMatrix4fv(loc.model,false,m);gl.uniformMatrix3fv(loc.normalMatrix,false,nm);gl.uniform3fv(loc.color,rgb(color));gl.uniform1f(loc.material,material);
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(nor);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(nor,3,gl.FLOAT,false,24,12);
  gl.uniform1f(loc.textured,mesh.uv?(mesh.textureWeight??1):0);gl.uniform1i(loc.skinMap,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,skinTexture);
  if(mesh.uv){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.uv);gl.enableVertexAttribArray(uvLoc);gl.vertexAttribPointer(uvLoc,2,gl.FLOAT,false,8,0);}else{gl.disableVertexAttribArray(uvLoc);gl.vertexAttrib2f(uvLoc,0,0);}
  gl.drawArrays(gl.TRIANGLES,0,mesh.count);
 }
 function ball(c,s,col,mat=0,basis=identity,world=true){draw(sphere,c,s,col,mat,basis,world);}
 function bone(a,b,r1,r2,col,mat=0,world=true){
  const y=unit(sub(b,a)),x=unit(cross(Math.abs(y[2])>.9?[0,1,0]:[0,0,1],y)),z=unit(cross(x,y));
  ball(lerp(a,b,.5),[r1,Math.hypot(...sub(a,b))*.55,r2],col,mat,[x,y,z],world);
 }
 function line(points,r,col,mat=0,world=true){for(let i=0;i<points.length-1;i++)bone(points[i],points[i+1],r,r,col,mat,world);}
 let cachedLook=null,headMesh=null,hairMesh=null,eyes=[],peerFeatures=null;
 const dynamicBuffers=new Map();
 let preparedBody=null;
 function bodyScale(look){return Math.max(.9,Math.min(1.15,look.body/115));}
 function fitBodyPoint(p,look){
  const neck=1-easeMotion((p[1]-24)/42),scale=bodyScale(look)*(1-neck)+(look.faceWidth/65)*neck;
  return [p[0]*scale,p[1],p[2]];
 }
 function prepareBody(look){
  const {positions,normals,weights,materials,indices,joints}=bodyAsset,count=positions.length/3;
  const points=new Float32Array(positions.length),ns=new Float32Array(normals.length),groups=[[],[]],front=[];
  for(let i=0;i<count;i++){
   const p=fitBodyPoint(positions.slice(i*3,i*3+3),look),n=unit([normals[i*3]/bodyScale(look),normals[i*3+1],normals[i*3+2]]);
   const dressed=!(p[1]<52&&Math.abs(p[0])<39);
   const ease=dressed?(look.outfit==='hoodie'?6:look.outfit==='suit'?4.5:3):0;for(let k=0;k<3;k++){points[i*3+k]=p[k]+n[k]*ease;ns[i*3+k]=n[k];}
  }
  for(let t=0;t<indices.length;t+=3){const ids=indices.slice(t,t+3),centre=ids.map(i=>Array.from(points.subarray(i*3,i*3+3))).reduce((a,p)=>a.map((v,k)=>v+p[k]/3),[0,0,0]);
   const longSleeve=look.outfit==='hoodie'||look.outfit==='suit'||look.outfit==='shirt';
   const neck=ids.every(i=>points[i*3+1]<44&&Math.abs(points[i*3])<40);
   const neckline=centre[1]<70&&Math.abs(centre[0])<65;
   const cloth=(longSleeve||neckline)?!neck:ids.reduce((sum,i)=>sum+materials[i],0)>=2;
   if(!cloth&&neckline)continue; // A smooth neck bridge replaces overlapping skin edges.
   groups[cloth?1:0].push(...ids);}
  for(let y=45;y<=320;y+=10){
   let z=Infinity;for(let i=0;i<count;i++)if(Math.abs(points[i*3])<18&&Math.abs(points[i*3+1]-y)<14)z=Math.min(z,points[i*3+2]);
   front.push(Number.isFinite(z)?z:front.at(-1)||280);
  }
  const bind={};for(const side of [-1,1]){bind[side]={};for(const name of ['shoulder','elbow','wrist'])bind[side][name]=fitBodyPoint(joints[side][name],look);}
  preparedBody={points,ns,groups,weights,bind,front,posed:new Float32Array(points.length),posedNormals:new Float32Array(points.length),arrays:groups.map(ids=>new Float32Array(ids.length*6)),surfaceCache:new Map()};
  state.bodyPose=preparedBody.posed;
 }
 function bodyFront(y){const i=Math.max(0,Math.min(preparedBody.front.length-1,(y-45)/10)),a=Math.floor(i),b=Math.min(a+1,preparedBody.front.length-1);return preparedBody.front[a]+(preparedBody.front[b]-preparedBody.front[a])*(i-a)-2;}
 function boneTransform(a,b,c,d){
  const u=unit(sub(b,a)),v=unit(sub(d,c)),dot=u.reduce((s,x,i)=>s+x*v[i],0),axis=cross(u,v);
  let q=[...axis,1+dot],length=Math.hypot(...q);
  if(length<.0001){q=[...unit(cross(u,Math.abs(u[0])<.8?[1,0,0]:[0,1,0])),0];length=1;}
  return {a,c,u,q:q.map(x=>x/length),scale:Math.hypot(...sub(d,c))/Math.hypot(...sub(b,a))};
 }
 function rotateBone(v,q){const t=mul(cross(q,v),2);return add(v,add(mul(t,q[3]),cross(q,t)));}
 function drawBody(look,arms){
  const data=preparedBody,bones=[null];
  for(const side of [-1,1]){const r=data.bind[side],a=arms[side];bones.push(boneTransform(r.shoulder,r.elbow,a.shoulder,a.elbow),boneTransform(r.elbow,r.wrist,a.elbow,a.wrist));}
  const count=data.points.length/3;
  for(let i=0;i<count;i++){
   const p=Array.from(data.points.subarray(i*3,i*3+3)),n=Array.from(data.ns.subarray(i*3,i*3+3));let point=[0,0,0],normal=[0,0,0];
   for(let j=0;j<5;j++){
    const weight=data.weights[i*5+j];if(weight<.00001)continue;
    if(!j){point=add(point,mul(p,weight));normal=add(normal,mul(n,weight));continue;}
    const b=bones[j],delta=sub(p,b.a),along=delta.reduce((sum,x,k)=>sum+x*b.u[k],0),ndot=n.reduce((sum,x,k)=>sum+x*b.u[k],0);
    point=add(point,mul(add(b.c,rotateBone(add(delta,mul(b.u,along*(b.scale-1))),b.q)),weight));
    normal=add(normal,mul(rotateBone(add(n,mul(b.u,ndot*(1/b.scale-1))),b.q),weight));
   }
   data.posed.set(point,i*3);data.posedNormals.set(unit(normal),i*3);
  }
  for(let material=0;material<2;material++){
   const ids=data.groups[material],array=data.arrays[material];let out=0;
   for(const i of ids){for(let k=0;k<3;k++)array[out++]=data.posed[i*3+k];for(let k=0;k<3;k++)array[out++]=data.posedNormals[i*3+k];}
   const key='anatomicalBody'+material;let mesh=dynamicBuffers.get(key);if(!mesh){mesh={buffer:gl.createBuffer()};dynamicBuffers.set(key,mesh);}
   mesh.count=ids.length;gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.bufferData(gl.ARRAY_BUFFER,array,gl.DYNAMIC_DRAW);
   draw(mesh,[0,0,0],[1,1,1],material?look.suit:look.skinMid,material);
  }
 }
 function opponentArms(look){
  const arms={};
  for(const side of [-1,1]){
   if(inDialogue()){arms[side]={shoulder:[side*109*bodyScale(look),86,315],elbow:[side*135,185,320],wrist:[side*145,302,300],center:[side*145,326,296]};continue;}
   const current=attack?.side===side?attack:impact?.side===side?impact:null,a=current||{side,lane:side,body:false,kind:'idle'};
   const rig=enemyRig(a,current===attack&&current?(t-attack.start)/attack.duration:current?1:0,current===impact&&current?impact.life/.2:null);
   arms[side]={shoulder:xyz(rig.joints.shoulder),elbow:xyz(rig.joints.elbow),wrist:xyz(rig.joints.wrist),center:xyz(rig.joints.fist)};
  }
  state.npcJoints=arms;return arms;
 }
 function loft(key,centers,widths,depths,color,material,world=true,anatomy=0){
  const count=24,data=[];
  let previousX=null;
  const rings=centers.map((p,i)=>{
   const lo=Math.max(0,i-1),hi=Math.min(i+1,centers.length-1),tangent=unit(sub(centers[hi],centers[lo]));
   const projection=previousX?sub(previousX,mul(tangent,previousX.reduce((sum,v,k)=>sum+v*tangent[k],0))):cross([0,0,1],tangent);
   const x=unit(Math.hypot(...projection)>.01?projection:cross([0,1,0],tangent)),z=unit(cross(x,tangent));previousX=x;
   const span=Math.max(.01,Math.hypot(...sub(centers[hi],centers[lo]))),dw=(widths[hi]-widths[lo])/span,dd=(depths[hi]-depths[lo])/span;
   return Array.from({length:count+1},(_,j)=>{const a=j/count*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
    const n=unit(sub(add(mul(x,c/widths[i]),mul(z,s/depths[i])),mul(tangent,c*c*dw/widths[i]+s*s*dd/depths[i])));
    const u=i/(centers.length-1),belly=Math.sin(u*Math.PI),lobe=anatomy*belly*(.10*Math.cos(3*a)+.07*Math.sin(a));
    return {p:add(p,add(mul(x,c*widths[i]*(1+lobe)),mul(z,s*depths[i]*(1+lobe)))),n};});
  });
  // Surface normals follow the asymmetric muscle surface, including elbow and wrist taper.
  if(anatomy)for(let i=0;i<rings.length;i++)for(let j=0;j<=count;j++){
   const lo=Math.max(0,i-1),hi=Math.min(rings.length-1,i+1),k=j%count;
   const along=sub(rings[hi][j].p,rings[lo][j].p),around=sub(rings[i][(k+1)%count].p,rings[i][(k+count-1)%count].p);
   let n=unit(cross(along,around));if(n.reduce((sum,v,k)=>sum+v*rings[i][j].n[k],0)<0)n=mul(n,-1);rings[i][j].n=n;
  }
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<count;j++)for(const p of [rings[i][j],rings[i+1][j],rings[i][j+1],rings[i+1][j],rings[i+1][j+1],rings[i][j+1]])data.push(...p.p,...p.n);
  let mesh=dynamicBuffers.get(key);if(!mesh){mesh={buffer:gl.createBuffer()};dynamicBuffers.set(key,mesh);}
  mesh.count=data.length/6;gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);
  draw(mesh,[0,0,0],[1,1,1],color,material,identity,world);
 }
 function prepare(look){
  const peer=look===opponentLooks[0];
  const key=JSON.stringify([peer,look.faceWidth,look.jaw,look.noseWidth,look.hair,look.body,look.outfit,look.mouth,look.eyeOpen,!!headAsset]);if(cachedLook===key)return;cachedLook=key;
  for(const mesh of [headMesh,hairMesh])if(mesh){gl.deleteBuffer(mesh.buffer);if(mesh.uv)gl.deleteBuffer(mesh.uv);}
  peerFeatures=null;state.faceProfile=peer?'peer-0':'base';
  prepareBody(look);
  if(headAsset){
   const vertices=[],hair=[];
   eyes=headAsset.eyes.map(eye=>({...eye,x:eye.x*look.faceWidth/65,y:eye.y-18}));
   const {indices,positions,normals}=headAsset;
   for(let t=0;t<indices.length;t+=3){
    const ids=indices.slice(t,t+3),faceVertices=[];
    const scalp=ids.every(i=>{
     const x=positions[i*3],y=positions[i*3+1],front=positions[i*3+2]>.4;
     const hairline=look.hair==='receding'?3.6:look.hair==='crop'?2.95:look.hair==='longpart'?2.4:look.hair==='wave'?2.55:2.75;
     return y>(front?hairline+(look.hair==='part'||look.hair==='longpart'?x*.13:0):look.hair==='longpart'?1.25:1.95);
    });
    for(const i of ids){
     const rawX=positions[i*3],rawY=positions[i*3+1],neck=rawY<-1?Math.max(.5,1-(Math.abs(rawX)-.9)*.7):1;
     const jawMask=Math.max(0,1-Math.abs(rawY+.25)/1.1),noseMask=Math.max(0,1-Math.abs(rawX)/.6)*Math.max(0,1-Math.abs(rawY-.75)/.8)*Math.max(0,positions[i*3+2]-1.6);
     let x=rawX*30*(look.faceWidth/65)*neck*(1+(look.jaw-5)*.004*jawMask)*(1+((look.noseWidth||1)-1)*noseMask),y=-9-positions[i*3+1]*30,z=300-positions[i*3+2]*30-((look.noseWidth||1)-1)*noseMask*5,n=[normals[i*3],-normals[i*3+1],-normals[i*3+2]];
     const lipMask=Math.exp(-Math.pow((rawY+.48)/.32,2)-Math.pow(rawX/.9,6))*Math.max(0,Math.min(1,(positions[i*3+2]-2.2)/.4));
     const corner=Math.min(1,Math.abs(rawX)/.55),mouth=look.mouth;
     const lift=mouth==='grin'?-2.6*corner:mouth==='smirk'?-3*Math.max(0,Math.min(1,rawX/.55)):mouth==='droop'?1.8*corner:0;
     y+=lift*lipMask;if(mouth==='grin')x*=1+.065*lipMask;
     const eyeMask=Math.exp(-Math.pow((Math.abs(rawX)-.67)/.28,2)-Math.pow((rawY-1.27)/.25,2))*Math.max(0,Math.min(1,positions[i*3+2]-1.3));
     y-=((look.eyeOpen||8)-8)*.15*Math.sign(rawY-1.27)*eyeMask;
     if(peer){
      const front=Math.max(0,Math.min(1,(positions[i*3+2]-1.2)/1.3));
      const cheek=Math.exp(-Math.pow((rawY-.05)/.75,2))*Math.pow(Math.min(1,Math.abs(rawX)/1.1),2);
      const chin=Math.exp(-Math.pow((rawY+1.05)/.43,2));
      x*=1-.065*cheek-.13*chin;
      y+=chin*2.2+Math.max(0,rawY-2.5)*6;
      // A sharper bridge, restrained lips and lifted corner match the comic's smirk.
      const bridge=Math.exp(-Math.pow(rawX/.28,2)-Math.pow((rawY-.80)/.70,2));
      z-=bridge*2.8*front;z+=lipMask*1.4;
      y-=lipMask*Math.max(0,rawX/.7)*2.8;
      const lid=Math.exp(-Math.pow((Math.abs(rawX)-.67)/.35,2)-Math.pow((rawY-1.28)/.30,2));
      y+=lid*(rawY>1.27?1.5:-.6)*front;
     }
     if(peer&&y<-75)y=-75+(y+75)*.78;
     faceVertices.push({p:[x,y,z],n});
     if(scalp){
      const crown=Math.max(0,rawY-2.7),style=peer?3:look.hair==='spiky'?10+Math.sin(rawX*13)*5:look.hair==='curly'?8+Math.sin(rawX*17+rawY*12)*4:look.hair==='messy'?7+Math.sin(rawX*9+rawY*5)*5:look.hair==='wave'?9+Math.sin(rawX*5)*3:look.hair==='crop'?.8:look.hair==='slick'?1.5:3;
      const lift=1.25+crown*style+(look.hair==='wave'?Math.max(0,n[0])*2.5:0);hair.push(x+n[0]*lift,y+n[1]*lift,z+n[2]*lift,...n);
     }
    }
    // Clip crossing neck triangles at one plane instead of dropping them:
    // dropping whole triangles left tooth-shaped skin edges above collars.
    const clipped=[];
    for(let j=0;j<faceVertices.length;j++){
     const a=faceVertices[j],b=faceVertices[(j+1)%faceVertices.length],inside=a.p[1]<=44,nextInside=b.p[1]<=44;
     if(inside)clipped.push(a);
     if(inside!==nextInside){const f=(44-a.p[1])/(b.p[1]-a.p[1]);clipped.push({p:lerp(a.p,b.p,f),n:unit(lerp(a.n,b.n,f))});}
    }
    for(let j=1;j<clipped.length-1;j++)for(const v of [clipped[0],clipped[j],clipped[j+1]])vertices.push(...v.p,...v.n);
   }
   if(look.hair==='longpart'){
    const rows=[[-20,-96,265,14],[-34,-82,263,12],[-43,-61,267,9],[-49,-39,275,7],[-48,-20,281,2]];
    const edge=([x,y,z,w],side)=>[(x+side*w)*look.faceWidth/65,y,z];
    for(let j=0;j<rows.length-1;j++){
     const a=edge(rows[j],-1),b=edge(rows[j],1),c=edge(rows[j+1],-1),d=edge(rows[j+1],1),normal=unit(cross(sub(b,a),sub(c,a)));
     for(const q of [a,c,b,b,c,d])hair.push(...q,...(normal[2]>0?mul(normal,-1):normal));
    }
   }
   // Layered tapered locks give each hairstyle a readable silhouette and fringe.
   // Built once per look; all locks remain attached to the head transform.
   const lock=(a,b,c,width,curl=0)=>{
    const rings=Array.from({length:10},(_,i)=>{
     const u=i/9,v=1-u,p=a.map((x,k)=>v*v*x+2*v*u*b[k]+u*u*c[k]);
     p[0]+=curl*Math.sin(u*Math.PI*2);p[1]-=curl*Math.sin(u*Math.PI);
     const tangent=unit(add(mul(sub(b,a),2*v),mul(sub(c,b),2*u))),axis=unit(cross([0,0,1],tangent)),depth=unit(cross(axis,tangent));
     const w=Math.max(.12,width*Math.pow(1-u,.65)),d=Math.max(.1,w*.18);
     return Array.from({length:9},(_,j)=>{const q=j/8*Math.PI*2,n=unit(add(mul(axis,Math.cos(q)/w),mul(depth,Math.sin(q)/d)));return {p:add(p,add(mul(axis,Math.cos(q)*w),mul(depth,Math.sin(q)*d))),n};});
    });
    for(let i=0;i<9;i++)for(let j=0;j<8;j++)for(const v of [rings[i][j],rings[i+1][j],rings[i][j+1],rings[i+1][j],rings[i+1][j+1],rings[i][j+1]])hair.push(...v.p,...v.n);
   };
   const style=look.hair,fit=look.faceWidth/65;
   for(let i=0;i<(peer?0:15);i++){
    const x=(i-7)*6.0,arch=x*x*.013,random=Math.sin(i*7.13);
    if(style==='receding'&&Math.abs(x)<28)continue;
    const short=style==='crop'||style==='receding',slick=style==='slick';
    const sweep=style==='part'||style==='longpart'||style==='wave'?-16:slick?8:random*9;
    const tipY=short?-95+arch:slick?-103+arch:style==='spiky'?-119+arch+random*8:style==='curly'?-93+arch+random*3:style==='messy'?-81+arch+random*5:style==='longpart'?-80+arch+random*4:-84+arch+random*4;
    lock([x*fit,-96+arch,258],[(x+sweep)*fit,-122+arch+(short?18:0),slick?207:218],[(x+sweep*1.3)*fit,tipY,slick?246:short?218:style==='curly'?218:208],short?5.2:style==='curly'?9:10,style==='curly'?4:style==='messy'?2:0);
   }
   if(peer){
    // Broad, overlapping root masses with short swept tips, rather than a tall mohawk.
    for(const layer of [0,1])for(let i=0;i<11;i++){
     const x=(i-5)*7.8,arch=x*x*.011,variation=Math.sin(i*4.7+layer*2);
     lock([x*fit,-94+arch,layer?280:251],[(x+7+variation*3)*fit,-117+arch,layer?258:222],[(x+12+variation*4)*fit,-111+arch+variation*5,layer?239:214],layer?9:8.6,1.3);
    }
    // Short temple sections stay connected to the scalp and leave the hoop visible.
    for(const side of [-1,1])for(let i=0;i<3;i++)lock([side*(37+i*3)*fit,-77+i*5,267],[side*(47+i)*fit,-86+i*4,248],[side*(48+i)*fit,-69+i*6,249],5.5);
    for(let i=1;i<hair.length;i+=6)if(hair[i]<-75)hair[i]=-75+(hair[i]+75)*.78;
    const normalSums=new Map(),vertexKey=i=>vertices.slice(i,i+3).map(v=>v.toFixed(4)).join(',');
    for(let i=0;i<vertices.length;i+=18){
     const a=vertices.slice(i,i+3),b=vertices.slice(i+6,i+9),c=vertices.slice(i+12,i+15);let normal=cross(sub(b,a),sub(c,a));
     if(normal.reduce((sum,v,k)=>sum+v*vertices[i+3+k],0)<0)normal=mul(normal,-1);
     for(const j of [i,i+6,i+12]){const key=vertexKey(j);normalSums.set(key,add(normalSums.get(key)||[0,0,0],normal));}
    }
    for(let i=0;i<vertices.length;i+=6){const normal=unit(normalSums.get(vertexKey(i)));for(let k=0;k<3;k++)vertices[i+3+k]=normal[k];}
    // Barycentric sampling attaches lip and nose accents to the sculpted face.
    const surface=(x,y)=>{
     let z=Infinity;
     for(let i=0;i<vertices.length;i+=18){
      const a=vertices.slice(i,i+3),b=vertices.slice(i+6,i+9),c=vertices.slice(i+12,i+15),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
      if(Math.abs(den)<1e-6)continue;
      const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den,w=1-u-v;
      if(Math.min(u,v,w)>=-1e-5)z=Math.min(z,u*a[2]+v*b[2]+w*c[2]);
     }
     return [x,y,z-.65];
    };
    peerFeatures={mouth:[[-16,-3],[-9,-2],[0,-3],[9,-5],[17,-8]].map(p=>surface(...p)),lip:[[-9,1],[0,1],[9,-1]].map(p=>surface(...p))};
    state.featureFinite=Object.values(peerFeatures).flat(2).every(Number.isFinite);
   }else state.featureFinite=true;
   state.headFinite=vertices.every(Number.isFinite)&&hair.every(Number.isFinite);
   headMesh=makeMesh(vertices);
   hairMesh=makeMesh(hair);
  }
 }
 function playerElbow(shoulder,wrist,hand,pose){
  const delta=sub(wrist,shoulder),distance=Math.hypot(...delta),direction=unit(delta),upper=105,fore=125,d=Math.max(20.01,Math.min(distance,229.99));
  const along=(upper*upper-fore*fore+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
  const hook=pose.motion==='hook'||pose.motion==='shovel',pole=[hand*(.4+(hook?.65:0)*pose.reach),1-(hook?.45:0)*pose.reach,.2],dot=pole.reduce((sum,v,i)=>sum+v*direction[i],0),bend=unit(sub(pole,mul(direction,dot)));
  return add(shoulder,add(mul(direction,along),mul(bend,height)));
 }
 function arm(key,shoulder,elbow,wrist,cloth,skin,world=true){
  const sleeveEnd=lerp(elbow,wrist,.18);
  const attach=[shoulder[0]*.84,shoulder[1]-8,shoulder[2]+12];
  loft(key+'upper',[attach,lerp(attach,shoulder,.55),shoulder,lerp(shoulder,elbow,.15),lerp(shoulder,elbow,.38),lerp(shoulder,elbow,.65),lerp(shoulder,elbow,.89),elbow,sleeveEnd],[1,19,25,29,28,23,17,16,19],[1,20,26,27,25,20,16,15,17],cloth,1,world,.5);
  loft(key+'fore',[sleeveEnd,...[.25,.34,.45,.58,.72,.86,1].map(u=>lerp(elbow,wrist,u))],[18,21,24,23,20,16,12,10.5],[15,17,18,17,15,12,9,8],skin,0,world,1);
  loft(key+'roll',[lerp(elbow,wrist,.12),lerp(elbow,wrist,.15),lerp(elbow,wrist,.19),lerp(elbow,wrist,.22)],[19,21,21,18],[17,19,18,15],toneColor(cloth,10),1,world,.4);
  const axis=unit(sub(wrist,elbow)),front=unit(sub([0,0,-1],mul(axis,-axis[2]))),side=unit(cross(axis,front));
  // Two shallow tendons run into the cuff, with a soft elbow crease instead of a tube seam.
  for(const sign of [-1,1])line([.57,.72,.88,.98].map((u,i)=>add(lerp(elbow,wrist,u),add(mul(front,[15.5,12.5,9.3,8.2][i]),mul(side,sign*(5-i*.7))))),.55,toneColor(skin,12),0,world);
  line([-.65,0,.65].map(s=>add(lerp(elbow,wrist,.28),add(mul(front,17),mul(side,s*16)))),.65,toneColor(skin,-15),0,world);
  for(const u of [.70,.81])line([-.6,0,.6].map(s=>add(lerp(shoulder,elbow,u),add(mul(front,18+(1-u)*8),mul(side,s*18)))),.8,toneColor(cloth,-16),1,world);
 }
 function glove(center,basis,side,color,world=true,scale=1){
  const axis=[mul(basis.x,side),basis.y,basis.z];
  const local=p=>add(center,add(mul(axis[0],p[0]*scale),add(mul(axis[1],p[1]*scale),mul(axis[2],p[2]*scale))));
  const part=(p,s,c,mat)=>ball(local(p),s.map(x=>x*scale),c,mat,axis,world);
  draw(paddedGlove,local([0,-10,0]),[34,41,28].map(x=>x*scale),color,3,axis,world);
  part([0,-25,6],[33,25,27],color,3);
  part([-30,9,12],[17,27,19],color,3);
  part([0,40,0],[27,18,21],'#293239',2);
  part([0,40,20],[14,5,1.8],'#b4b09b',1);
  // Flexion seam across the palm, kept as leather rather than a visible wrist hole.
  line([local([-24,22,22]),local([0,27,27]),local([24,22,22])],.65,'#432e28',2,world);
 }
 function face(look){
   draw(headMesh,[0,0,0],[1,1,1],look.skinMid,0);
   draw(hairMesh,[0,0,0],[1,1,1],look.hairColor,4);
   const blink=hit>0||ep<=0||Math.sin(t*.8)>.998;
   for(const eye of eyes){
    const [rx,ry,rz]=eye.radius;
    if(blink){ball([eye.x,eye.y,eye.z-rz+.5],[rx*.95,ry*.35,1.2],look.skinMid,0);continue;}
    ball([eye.x,eye.y,eye.z],[rx,ry,rz],'#d5cbb5',0);
    const gaze=unit([-eye.x,0,-eye.z]),iris=add([eye.x,eye.y,eye.z],mul(gaze,rz-.15));
    ball(iris,[4.5,4.5,.6],'#4a4432',2);ball(add(iris,[0,0,-.55]),[1.7,1.9,.3],'#152023',2);
    ball(add(iris,[-.8,-1,-.9]),[.3,.3,.1],'#bdbbae',2);
    if(peerFeatures&&!blink){
     const side=Math.sign(eye.x),z=eye.z-rz-.6;
     line([[-8,.5],[-3,-2.2],[3,-2.8],[8,-1.5]].map(([x,y])=>[eye.x+x,eye.y+y-side*x*.09,z+Math.abs(x)*.10]),.65,'#46392f',2);
    }
    const browZ=eye.z-rz-3;
    const tilt=(look.browTilt||0)*Math.sign(eye.x)*.42;
    line([[eye.x-rx,eye.y-8-tilt,browZ+1],[eye.x,eye.y-10,browZ],[eye.x+rx,eye.y-8+tilt,browZ+1]],look.age>45?2.1:1.7,look.hairColor,2);
   }
   if(peerFeatures){
    line(peerFeatures.mouth,.65,toneColor(look.skinMid,-55),0);
    line(peerFeatures.lip,.45,toneColor(look.skinMid,13),0);
   }
   if(look.glasses){
    for(const eye of eyes){
     const z=eye.z-eye.radius[2]-3,points=[];
     if(look.glasses==='square'||look.glasses==='rimless')for(const [x,y] of (look.glasses==='rimless'?[[-11,-7],[11,-7],[14,-4],[14,4],[11,7],[-11,7],[-14,4],[-14,-4],[-11,-7]]:[[-14,-9],[14,-9],[14,9],[-14,9],[-14,-9]]))points.push([eye.x+x,eye.y+y,z]);
     else for(let j=0;j<=24;j++){const angle=j/24*Math.PI*2;points.push([eye.x+Math.cos(angle)*14,eye.y+Math.sin(angle)*10,z]);}
     line(points,look.glasses==='rimless'?.45:1.1,look.glasses==='rimless'?'#9caaa9':'#30383b',2);
     const side=Math.sign(eye.x);line([[eye.x+side*14,eye.y,z],[side*look.faceWidth*.78,eye.y+2,275]],.8,'#30383b',2);
    }
    line([[-6,eyes[0].y,231],[0,eyes[0].y-2,228],[6,eyes[0].y,231]],.8,'#414b50',2);
   }
   if(look.accessory==='moustache')line([[-16,0,222],[-8,-4,215],[0,-1,213],[8,-4,215],[16,0,222]],2.2,look.hairColor,4);
   if(look.accessory==='earring'){const hoop=Array.from({length:21},(_,j)=>{const a=j/20*Math.PI*2;return [look.faceWidth*.79+Math.cos(a)*3,-15+Math.sin(a)*4,275];});loft('earHoop',hoop,hoop.map(()=>.7),hoop.map(()=>.7),'#c2b28c',2);}
   if(look.accessory==='headset'){line([[-look.faceWidth*.82,-43,282],[-look.faceWidth*.7,-89,290],[0,-112,291],[look.faceWidth*.7,-89,290],[look.faceWidth*.82,-43,282]],2.4,'#27343b',2);for(const side of [-1,1])ball([side*look.faceWidth*.83,-32,278],[7,15,10],'#27343b',2);line([[look.faceWidth*.83,-20,275],[43,-3,244],[24,0,228]],1.6,'#27343b',2);}

 }
 // Locate the visible bind surface once; barycentric interpolation then follows
 // the SAME skinned vertices as the chest, including arm/shoulder deformation.
 function garmentSurface(x,y,lift=2){
  const d=preparedBody,key=x.toFixed(3)+','+y.toFixed(3);let sample=d.surfaceCache.get(key);
  if(!sample){
   let depth=Infinity;
   for(let j=0;j<bodyAsset.indices.length;j+=3){
    const ids=bodyAsset.indices.slice(j,j+3),p=ids.map(i=>Array.from(d.points.subarray(i*3,i*3+3)));
    const den=(p[1][1]-p[2][1])*(p[0][0]-p[2][0])+(p[2][0]-p[1][0])*(p[0][1]-p[2][1]);if(Math.abs(den)<.00001)continue;
    const a=((p[1][1]-p[2][1])*(x-p[2][0])+(p[2][0]-p[1][0])*(y-p[2][1]))/den;
    const b=((p[2][1]-p[0][1])*(x-p[2][0])+(p[0][0]-p[2][0])*(y-p[2][1]))/den,c=1-a-b;
    if(Math.min(a,b,c)<-.0001)continue;
    const z=a*p[0][2]+b*p[1][2]+c*p[2][2];if(z<depth){depth=z;sample={ids,weights:[a,b,c]};}
   }
   sample??={point:[x,y,bodyFront(y)]};d.surfaceCache.set(key,sample);
  }
  if(sample.point)return add(sample.point,[0,0,-lift]);
  let p=[0,0,0],n=[0,0,0];sample.ids.forEach((id,j)=>{p=add(p,mul(Array.from(d.posed.subarray(id*3,id*3+3)),sample.weights[j]));n=add(n,mul(Array.from(d.posedNormals.subarray(id*3,id*3+3)),sample.weights[j]));});
  return add(p,mul(unit(n),lift));
 }
 function fabricMesh(key,triangles,color){
  const vertices=[];for(const tri of triangles){const n=unit(cross(sub(tri[1],tri[0]),sub(tri[2],tri[0])));for(const p of tri)vertices.push(...p,...(n[2]>0?mul(n,-1):n));}
  let mesh=dynamicBuffers.get(key);if(!mesh){mesh={buffer:gl.createBuffer()};dynamicBuffers.set(key,mesh);}
  mesh.count=vertices.length/6;gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);draw(mesh,[0,0,0],[1,1,1],color,1);
  state.garmentFinite=state.garmentFinite&&vertices.every(Number.isFinite);state.garmentVertices+=mesh.count;
 }
 function fabricPanel(key,rows,color,lift=2){
  const triangles=[],rings=rows.map(([y,left,right,raise=0])=>Array.from({length:9},(_,j)=>garmentSurface(left+(right-left)*j/8,y,lift+raise)));
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<8;j++)triangles.push([rings[i][j],rings[i+1][j],rings[i][j+1]],[rings[i+1][j],rings[i+1][j+1],rings[i][j+1]]);
  fabricMesh(key,triangles,color);
 }
 function garmentLine(points,r,color){line(points.map(([x,y,lift=3])=>garmentSurface(x,y,lift)),r,color,1);}
 function drawGarments(look,arms){
  state.garmentFinite=true;state.garmentVertices=0;state.garmentOutfit=look.outfit;
  const suit=look.outfit==='suit',hood=look.outfit==='hoodie',shirt=suit?'#d4d6cf':hood?'#d3d1c5':look.suit;
  const fit=bodyScale(look),neckFit=look.faceWidth/65;
  if(hood){
   // A folded, open hood drapes behind the neck, with a rolled lip at the front.
   const centres=Array.from({length:33},(_,i)=>{const a=.48+i/32*(Math.PI*2-.96);return [Math.sin(a)*52*neckFit,65-43*(1-Math.cos(a))/2,314-Math.cos(a)*36];});
   const folds=centres.map((_,i)=>5+9*Math.sin(i/32*Math.PI));
   loft('foldedHood',centres,folds,folds.map(v=>v*1.15),look.suit,1);
   loft('teeNeck',[[0,44,302],[0,50,302],[0,58,303]],[35,38,40].map(v=>v*neckFit),[30,32,33],shirt,1);
   fabricPanel('innerTee',[[58,-24,24],[73,-22,22],[88,-15,15],[98,-2,2]],shirt,2.5);
   for(const side of [-1,1]){
    garmentLine([[side*23,57,5],[side*31,76,4],[side*19,96,4]],2.8,toneColor(look.suit,15));
    garmentLine([[side*29,76,6],[side*31,102,6],[side*28,132,6]],1.3,'#d0cdbd');
    ball(garmentSurface(side*28,132,6),[2,3,2],'#b3ac97',2);
   }
   fabricPanel('kangarooPocket',[[193,-45*fit,45*fit],[201,-57*fit,57*fit],[237,-54*fit,54*fit],[244,-43*fit,43*fit]],toneColor(look.suit,5),3);
   for(const side of [-1,1])garmentLine([[side*45*fit,195,5],[side*31*fit,215,5],[side*28*fit,232,5]],1.1,toneColor(look.suit,-20));
   garmentLine([[-43*fit,244,5],[0,247,5],[43*fit,244,5]],.8,toneColor(look.suit,-17));
  }else{
   loft('shirtNeck',[[0,40,302],[0,48,302],[0,55,304]],[35,38,41].map(x=>x*neckFit),[30,32,34],shirt,1);
   if(suit)fabricPanel('suitShirt',[[49,-24,24],[68,-33,33],[93,-28,28],[125,-19,19],[164,-5,5],[181,-1,1]],shirt,2.5);
   for(const side of [-1,1]){
    fabricPanel('shirtCollar'+side,[[52,side*2,side*22,3],[65,side*8,side*35,4],[86,side*19,side*25,2]],toneColor(shirt,10),4);
    if(suit){
     fabricPanel('jacketLapel'+side,[[57,side*34,side*47,2],[77,side*28,side*61,5],[92,side*34,side*50,4],[106,side*22,side*59,5],[148,side*12,side*34,3],[186,side*2,side*12,1]],toneColor(look.suit,15),5);
     garmentLine([[side*35,58,9],[side*29,77,10],[side*37,92,9],[side*24,108,10],[side*14,148,8],[side*3,184,7]],.65,toneColor(look.suit,-18));
     garmentLine([[side*3,185,5],[side*6,227,5],[side*13,276,5]],.8,toneColor(look.suit,-15));
     garmentLine([[side*47,177,6],[side*76,180,6]],1.5,toneColor(look.suit,-24));
    }
   }
   if(suit){
    fabricPanel('tie',[[76,-3,3],[84,-6,6],[91,-3,3],[141,-6,6],[155,0,.1]],'#684849',7);
    ball(garmentSurface(0,190,7),[3,3,1.8],toneColor(look.suit,28),2);
   }else if(look.outfit==='polo'){
    fabricPanel('poloPlacket',[[65,-5,5],[77,-5,5],[101,-4,4]],toneColor(shirt,-10),3);
    for(const y of [82,96])ball(garmentSurface(0,y,5),[1.8,1.8,1],toneColor(shirt,32),2);
   }else for(let y=101;y<245;y+=27)ball(garmentSurface(0,y,3),[2,2,1.2],toneColor(shirt,-30),2);
  }
  if(look.outfit==='shirt'){
   fabricPanel('shirtPlacket',[[87,-4,4],[164,-4,4],[254,-4,4]],toneColor(look.suit,7),2.8);
   garmentLine([[-4,91,4],[-4,164,4],[-4,251,4]],.45,toneColor(look.suit,-18));
   for(let y=101;y<245;y+=27)ball(garmentSurface(0,y,5),[2,2,1.1],toneColor(look.suit,-25),2);
  }
  for(const side of [-1,1]){
   garmentLine([[side*74*fit,105,2.5],[side*80*fit,145,2.5],[side*74*fit,193,2.5]],.45,toneColor(look.suit,-14));
   for(const y of [157,181,214])fabricPanel('drape'+side+y,[[y,side*39*fit,side*40*fit],[y+7,side*56*fit,side*59*fit],[y+10,side*72*fit,side*73*fit]],toneColor(look.suit,-7),1.3);
  }
  if(look.accessory==='pens'){
   fabricPanel('penPocket',[[113,30*fit,60*fit],[145,31*fit,59*fit]],toneColor(look.suit,4),2.5);
   garmentLine([[30*fit,113,5],[45*fit,115,5],[60*fit,113,5]],.65,toneColor(look.suit,-18));
   for(const [x,color] of [[39,'#243d5d'],[48,'#bac1b9']])garmentLine([[x*fit,96,5],[x*fit,113,5]],1.3,color);
  }
  if(look.accessory==='lapel')ball(garmentSurface(44*fit,112,6),[5,1.8,1.2],'#afb8b5',2);
  // Shallow cloth ridges follow the same posed chest surface as the garment.
  for(const side of [-1,1])fabricPanel('chestFold'+side,[[132,side*65*fit,side*66*fit],[147,side*52*fit,side*55*fit],[167,side*62*fit,side*63*fit]],toneColor(look.suit,2),2);
  if(hood||suit||look.outfit==='shirt')for(const side of [-1,1]){
   const {elbow,wrist}=arms[side];
   const cuff=hood?toneColor(look.suit,-8):suit?'#d1d2c8':toneColor(look.suit,12);
   loft('npcCuff'+side,[.88,.92,.98,1.01].map(u=>lerp(elbow,wrist,u)),[13.5,14.2,13,11.5],[12,12.8,11.5,10],cuff,1,true,.2);
   if(hood)for(const u of [.91,.94,.97])loft('cuffRib'+side+u,[u,u+.006].map(v=>lerp(elbow,wrist,v)),[14,14],[12.6,12.6],toneColor(cuff,7),1);
  }
 }
 function begin(){gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);}
 state.renderOpponent=()=>{
  begin();const look=activeOpponentLook();prepare(look);
  const body=npcBodyMotion(),sway=hit?reactionSide*Math.sin(Math.PI*Math.min(1,hit/.36))*18*reactionPower:Math.sin(t*2)*1.5;
  root={x:body.x+sway,y:body.y+koPose*165,z:koPose*90,twist:body.twist+koPose*.48,yaw:(attack?attack.side*.12*body.drive:0)};
  const arms=opponentArms(look);drawBody(look,arms);
  // One smooth neck bridges the clipped head and shirt opening.
  loft('npcNeck',[[0,18,305],[0,28,305],[0,40,306],[0,52,307]],[27,28,30,32].map(v=>v*look.faceWidth/65),[27,28,29,31],look.skinMid,0);
  drawGarments(look,arms);face(look);
  for(const side of [-1,1]){
   const {wrist,center}=arms[side];
   const back=unit(sub(wrist,center)),basis=gloveBasis({x:back[0],y:back[1],z:back[2]},{x:0,y:-1,z:0});
   if(inDialogue()){
    ball(center,[12,24,9],look.skinMid);for(let j=0;j<4;j++)bone(add(center,[-7+j*5,12,-2]),add(center,[-7+j*5,31-(j%2)*3,-1]),2.6,2.8,look.skinMid);
   }else glove(center,[basis.x,basis.y,basis.z].reduce((o,v,i)=>(o[['x','y','z'][i]]=[v.x,v.y,v.z],o),{}),side,look.glove,true,.8);
  }
  g.drawImage(canvas,0,0,1000,590);state.frames++;
 };
 state.renderPlayer=()=>{
  if(inDialogue())return;state.playerJoints={};begin();root={x:0,y:0,z:0,twist:0,yaw:0};
  for(const hand of [-1,1]){
   const pose=playerHandPose(hand),depth=140+95*pose.reach;
   const center=[(pose.x-500)*depth/300,(pose.y-255)*depth/300,depth];
   const basis={x:xyz(pose.basis.x),y:xyz(pose.basis.y),z:xyz(pose.basis.z)};
   const wrist=add(center,mul(basis.y,42));
   const shoulder=[hand*(89-14*pose.reach),142-14*pose.reach,83+39*pose.reach];
   // The shoulder follows a wide lateral target without stretching the forearm.
   const span=sub(wrist,shoulder),distance=Math.hypot(...span);
   if(distance>225)for(let i=0;i<3;i++)shoulder[i]+=span[i]*(distance-225)/distance;
   const elbow=playerElbow(shoulder,wrist,hand,pose);
   state.playerJoints[hand]={shoulder,elbow,wrist};
   arm('player'+hand,shoulder,elbow,wrist,'#3d505a','#b78d70',false);
   glove(center,basis,hand,'#6b443a',false,1);
  }
  g.drawImage(canvas,0,0,1000,590);
 };
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();state.available=false;state.error='WebGL context lost';});
 Object.defineProperty(state,'active',{get:()=>state.available&&state.headReady&&state.bodyReady&&state.skinReady});
 state.available=true;state.canvas=canvas;state.gl=gl;return state;
})();
const canvasOpponentFallback=drawOpponent,canvasPlayerFallback=drawPlayerHands;
drawOpponent=function(){if(human3D.active)human3D.renderOpponent();else canvasOpponentFallback();};
drawPlayerHands=function(){if(human3D.active)human3D.renderPlayer();else canvasPlayerFallback();};
