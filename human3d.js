// Self-contained WebGL humanoid renderer. Gameplay and timing remain in game/movement.js.
const human3D=(()=>{
 const state={available:false,error:null,frames:0};
 if(typeof WebGLRenderingContext==='undefined')return state;
 const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=590;
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});
 if(!gl)return state;
 const vertex=`
 attribute vec3 position;attribute vec3 normal;attribute vec2 uv;
 uniform mat4 model;uniform mat3 normalMatrix;
 varying vec3 vNormal;varying vec3 vPosition;varying vec2 vUv;
 void main(){
  vec4 p=model*vec4(position,1.);
  vUv=uv;vPosition=p.xyz;vNormal=normalize(normalMatrix*normal);
  float n=25.,f=1200.;
  gl_Position=vec4(600.*p.x/1000.,-600.*p.y/590.+(1.-510./590.)*p.z,((f+n)/(f-n))*p.z-2.*f*n/(f-n),p.z);
 }`;
 const fragment=`
 precision mediump float;
 uniform vec3 color;uniform float material;uniform float textured;uniform sampler2D skinMap;
 varying vec3 vNormal;varying vec3 vPosition;varying vec2 vUv;
 void main(){
  vec3 n=normalize(vNormal),view=normalize(-vPosition);
  vec3 key=normalize(vec3(-.6,-.7,-1.)),fill=normalize(vec3(.8,-.15,-.4));
  float diffuse=max(0.,dot(n,key)),bounce=max(0.,dot(n,fill));
  float spec=pow(max(0.,dot(n,normalize(key+view))),material>2.5?38.:material>1.5?26.:12.);
  float rim=pow(1.-max(0.,dot(n,view)),3.);
  float grain=sin(vPosition.x*6.7+sin(vPosition.y*9.))*sin(vPosition.z*7.3+vPosition.y*4.);
  vec3 base=mix(color,texture2D(skinMap,vUv).rgb*color,textured);
  vec3 shade=base*(.42+.60*diffuse+.16*bounce);
  shade+=vec3(.96,.88,.73)*spec*(material>2.5?.28:material<.5?.09:.035);
  shade+=vec3(.27,.42,.50)*rim*.15;
  if(material<.5)shade+=vec3(.12,.035,.015)*pow(max(0.,dot(-n,key)),2.)*.25;
  shade*=1.+grain*(material>1.5?.008:.014);
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
 let cachedLook=null,headMesh=null,hairMesh=null,eyes=[];
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
   const ease=materials[i]?3:0;for(let k=0;k<3;k++){points[i*3+k]=p[k]+n[k]*ease;ns[i*3+k]=n[k];}
  }
  for(let t=0;t<indices.length;t+=3){const ids=indices.slice(t,t+3),cloth=ids.reduce((sum,i)=>sum+materials[i],0)>=2?1:0;groups[cloth].push(...ids);}
  for(let y=45;y<=320;y+=10){
   let z=Infinity;for(let i=0;i<count;i++)if(Math.abs(points[i*3])<18&&Math.abs(points[i*3+1]-y)<14)z=Math.min(z,points[i*3+2]);
   front.push(Number.isFinite(z)?z:front.at(-1)||280);
  }
  const bind={};for(const side of [-1,1]){bind[side]={};for(const name of ['shoulder','elbow','wrist'])bind[side][name]=fitBodyPoint(joints[side][name],look);}
  preparedBody={points,ns,groups,weights,bind,front,posed:new Float32Array(points.length),posedNormals:new Float32Array(points.length),arrays:groups.map(ids=>new Float32Array(ids.length*6))};
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
  const key=JSON.stringify([look.faceWidth,look.jaw,look.noseWidth,look.hair,look.body,!!headAsset]);if(cachedLook===key)return;cachedLook=key;
  for(const mesh of [headMesh,hairMesh])if(mesh){gl.deleteBuffer(mesh.buffer);if(mesh.uv)gl.deleteBuffer(mesh.uv);}
  prepareBody(look);
  if(headAsset){
   const vertices=[],hair=[];
   eyes=headAsset.eyes.map(eye=>({...eye,x:eye.x*look.faceWidth/65,y:eye.y-18}));
   const {indices,positions,normals}=headAsset;
   for(let t=0;t<indices.length;t+=3){
    const ids=indices.slice(t,t+3);if(ids.some(i=>positions[i*3+1]<-1.8))continue;
    const scalp=ids.every(i=>{
     const x=positions[i*3],y=positions[i*3+1],front=positions[i*3+2]>.4;
     const hairline=look.hair==='receding'?3.6:look.hair==='crop'?2.95:look.hair==='longpart'?2.4:2.75;
     return y>(front?hairline+(look.hair==='part'||look.hair==='longpart'?x*.13:0):look.hair==='longpart'?1.25:1.95);
    });
    for(const i of ids){
     const rawX=positions[i*3],rawY=positions[i*3+1],neck=rawY<-1?Math.max(.5,1-(Math.abs(rawX)-.9)*.7):1;
     const jawMask=Math.max(0,1-Math.abs(rawY+.25)/1.1),noseMask=Math.max(0,1-Math.abs(rawX)/.6)*Math.max(0,1-Math.abs(rawY-.75)/.8)*Math.max(0,positions[i*3+2]-1.6);
     const x=rawX*30*(look.faceWidth/65)*neck*(1+(look.jaw-5)*.004*jawMask)*(1+((look.noseWidth||1)-1)*noseMask),y=-9-positions[i*3+1]*30,z=300-positions[i*3+2]*30-((look.noseWidth||1)-1)*noseMask*5,n=[normals[i*3],-normals[i*3+1],-normals[i*3+2]];
     vertices.push(x,y,z,...n);
     if(scalp){
      const crown=Math.max(0,rawY-2.7),style=look.hair==='spiky'?10+Math.sin(rawX*13)*5:look.hair==='curly'?8+Math.sin(rawX*17+rawY*12)*4:look.hair==='messy'?7+Math.sin(rawX*9+rawY*5)*5:look.hair==='wave'?9+Math.sin(rawX*5)*3:look.hair==='crop'?.8:look.hair==='slick'?1.5:3;
      const lift=1.25+crown*style;hair.push(x+n[0]*lift,y+n[1]*lift,z+n[2]*lift,...n);
     }
    }
   }
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
   draw(hairMesh,[0,0,0],[1,1,1],look.hairColor,2);
   const blink=hit>0||ep<=0||Math.sin(t*.8)>.998;
   for(const eye of eyes){
    const [rx,ry,rz]=eye.radius;
    if(blink){ball([eye.x,eye.y,eye.z-rz+.5],[rx*.95,ry*.35,1.2],look.skinMid,0);continue;}
    ball([eye.x,eye.y,eye.z],[rx,ry,rz],'#aaa99f',0);
    const gaze=unit([-eye.x,0,-eye.z]),iris=add([eye.x,eye.y,eye.z],mul(gaze,rz-.15));
    ball(iris,[3.9,3.9,.6],'#4a4432',2);ball(add(iris,[0,0,-.55]),[1.7,1.9,.3],'#152023',2);
    ball(add(iris,[-.8,-1,-.9]),[.3,.3,.1],'#bdbbae',2);
    const browZ=eye.z-rz-3;
    const tilt=(look.browTilt||0)*Math.sign(eye.x)*.42;
    line([[eye.x-rx,eye.y-8-tilt,browZ+1],[eye.x,eye.y-10,browZ],[eye.x+rx,eye.y-8+tilt,browZ+1]],look.age>45?1.5:1.1,look.hairColor,2);
   }
   if(look.glasses){
    for(const eye of eyes){
     const z=eye.z-eye.radius[2]-3,points=[];
     if(look.glasses==='square')for(const [x,y] of [[-14,-9],[14,-9],[14,9],[-14,9],[-14,-9]])points.push([eye.x+x,eye.y+y,z]);
     else for(let j=0;j<=24;j++){const angle=j/24*Math.PI*2;points.push([eye.x+Math.cos(angle)*14,eye.y+Math.sin(angle)*10,z]);}
     line(points,look.glasses==='rimless'?.55:1.1,'#30383b',2);
     const side=Math.sign(eye.x);line([[eye.x+side*14,eye.y,z],[side*look.faceWidth*.78,eye.y+2,275]],.8,'#30383b',2);
    }
    line([[-6,eyes[0].y,231],[0,eyes[0].y-2,228],[6,eyes[0].y,231]],.8,'#414b50',2);
   }
   if(look.accessory==='earring')ball([look.faceWidth*.79,-15,276],[3,4,1.3],'#c2b28c',2);
   if(look.accessory==='headset'){for(const side of [-1,1])ball([side*look.faceWidth*.83,-32,278],[7,15,10],'#27343b',2);line([[look.faceWidth*.83,-20,275],[43,-3,244],[24,0,228]],1.6,'#27343b',2);}

 }
 function begin(){gl.viewport(0,0,1000,590);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);}
 state.renderOpponent=()=>{
  begin();const look=activeOpponentLook();prepare(look);
  const body=npcBodyMotion(),sway=hit?reactionSide*Math.sin(Math.PI*Math.min(1,hit/.36))*18*reactionPower:Math.sin(t*2)*1.5;
  root={x:body.x+sway,y:body.y+koPose*165,z:koPose*90,twist:body.twist+koPose*.48,yaw:(attack?attack.side*.12*body.drive:0)};
  const arms=opponentArms(look);drawBody(look,arms);
  // Garment details follow the chest surface of the continuous skinned body.
  const shirt=look.outfit==='suit'?'#c5c8c0':look.suit;
  face(look);
  const neckFit=look.faceWidth/65;
  loft('garmentCollar',[[0,38,307],[0,43,307],[0,54,310]],[32,38,46].map(x=>x*neckFit),[29,31,35],shirt,1);
  if(look.outfit==='hoodie'){
   for(const side of [-1,1])line([[side*21,69,bodyFront(69)-2],[side*24,103,bodyFront(103)-2],[side*26,132,bodyFront(132)-2]],1.2,'#bfc1b2',1);
  }else{
   for(const side of [-1,1]){
    const vertices=[];const points=[[side*19,56],[side*40,73],[side*18,95],[0,69]].map(([x,y])=>[x,y,bodyFront(y)-3]);
    for(const i of [0,1,2,0,2,3])vertices.push(...points[i],0,0,-1);
    let mesh=dynamicBuffers.get('collar'+side);if(!mesh){mesh={buffer:gl.createBuffer()};dynamicBuffers.set('collar'+side,mesh);}mesh.count=6;gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);draw(mesh,[0,0,0],[1,1,1],shirt,1);
   }
  }
  if(look.outfit==='suit'){
   const points=[[0,82,4],[2,98,7],[3,151,6],[4,174,0]],vertices=[];
   for(let i=0;i<points.length-1;i++){
    const [x,y,w]=points[i],[nx,ny,nw]=points[i+1],a=[x-w,y,bodyFront(y)-3],b=[x+w,y,bodyFront(y)-3],c=[nx-nw,ny,bodyFront(ny)-3],d=[nx+nw,ny,bodyFront(ny)-3];
    for(const p of [a,b,c,b,d,c])vertices.push(...p,0,0,-1);
   }
   let mesh=dynamicBuffers.get('tieRibbon');if(!mesh){mesh={buffer:gl.createBuffer()};dynamicBuffers.set('tieRibbon',mesh);}mesh.count=vertices.length/6;gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);draw(mesh,[0,0,0],[1,1,1],'#5b3938',1);
  }
  if(look.outfit!=='hoodie')for(let y=99;y<245;y+=27)ball([0,y,bodyFront(y)],[2,2,1.3],toneColor(shirt,-30),2);
  for(const side of [-1,1]){
   const {wrist,center}=arms[side];
   const back=unit(sub(wrist,center)),basis=gloveBasis({x:back[0],y:back[1],z:back[2]},{x:0,y:-1,z:0});
   if(inDialogue()){
    ball(center,[12,24,9],look.skinMid);for(let j=0;j<4;j++)bone(add(center,[-7+j*5,12,-2]),add(center,[-7+j*5,31-(j%2)*3,-1]),2.6,2.8,look.skinMid);
   }else glove(center,[basis.x,basis.y,basis.z].reduce((o,v,i)=>(o[['x','y','z'][i]]=[v.x,v.y,v.z],o),{}),side,look.glove,true,.8);
  }
  g.drawImage(canvas,0,0);state.frames++;
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
  g.drawImage(canvas,0,0);
 };
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();state.available=false;state.error='WebGL context lost';});
 Object.defineProperty(state,'active',{get:()=>state.available&&state.headReady&&state.bodyReady&&state.skinReady});
 state.available=true;state.canvas=canvas;state.gl=gl;return state;
})();
const canvasOpponentFallback=drawOpponent,canvasPlayerFallback=drawPlayerHands;
drawOpponent=function(){if(human3D.active)human3D.renderOpponent();else canvasOpponentFallback();};
drawPlayerHands=function(){if(human3D.active)human3D.renderPlayer();else canvasPlayerFallback();};
