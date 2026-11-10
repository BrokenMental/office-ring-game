// Rounded glove geometry is projected and lit in 3D, then cached as a Canvas layer.
// The pose changes the geometry's visible planes rather than rotating a flat drawing.
const gloveVolumeCache=new Map();
function volumeFaces(){
 const faces=[];
 function surface(rings,segments,center,material,twist=0,subdivisions=1){
  if(subdivisions>1){
   const smooth=[];
   for(let i=0;i<rings.length-1;i++)for(let j=0;j<subdivisions;j++){
    const t=j/subdivisions,p0=rings[Math.max(0,i-1)],p1=rings[i],p2=rings[i+1],p3=rings[Math.min(rings.length-1,i+2)];
    smooth.push(p1.map((v,k)=>{const value=.5*(2*v+(-p0[k]+p2[k])*t+(2*p0[k]-5*v+4*p2[k]-p3[k])*t*t+(-p0[k]+3*v-3*p2[k]+p3[k])*t*t*t);return k?Math.max(.1,value):value;}));
   }
   smooth.push(rings[rings.length-1]);rings=smooth;
  }
  const points=rings.map(([y,rx,rz])=>Array.from({length:segments},(_,j)=>{
   const a=j/segments*Math.PI*2,x=Math.cos(a)*rx,z=Math.sin(a)*rz;
   return [x*Math.cos(twist)-y*Math.sin(twist)+center[0],x*Math.sin(twist)+y*Math.cos(twist)+center[1],z+center[2]];
  }));
  for(let i=0;i<points.length-1;i++)for(let j=0;j<segments;j++){
   const quad=[points[i][j],points[i][(j+1)%segments],points[i+1][(j+1)%segments],points[i+1][j]];
   const a=quad[0],u=quad[1].map((v,k)=>v-a[k]),v=quad[3].map((q,k)=>q-a[k]);
   let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
   const midpoint=quad.reduce((sum,p)=>sum.map((q,k)=>q+p[k]/4),[0,0,0]);
   if(n.reduce((sum,q,k)=>sum+q*(midpoint[k]-center[k]),0)<0)n=n.map(q=>-q);
   const len=Math.hypot(...n)||1;faces.push({points:quad,normal:n.map(q=>q/len),material,grain:((i*11+j*7)%5-2)*.15});
  }
 }
 surface([[-54,.1,.1],[-50,24,17],[-40,39,28],[-24,44,33],[-5,43,34],[14,38,30],[31,30,23],[42,29,21]],40,[0,0,0],'leather',0,4);
 const thumb=[];for(let i=0;i<=16;i++){const a=-Math.PI/2+i/16*Math.PI;thumb.push([Math.sin(a)*24,Math.max(.1,Math.cos(a)*17),Math.max(.1,Math.cos(a)*20)]);}
 surface(thumb,28,[-37,12,7],'leather',-.35);
 surface([[36,30,22],[40,32,23],[61,31,22],[65,27,20]],32,[0,0,0],'strap',0,2);
 // Padded cuff lining closes the artificial hollow ring around the entering wrist.
 surface([[64.5,27,20],[65,16,12]],40,[0,0,0],'lining');
 function patch(x,y,w,h,z,material){faces.push({points:[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],normal:[0,0,1],material,grain:0});}
 patch(-17,46,34,12,25,'label');patch(-11,50,22,3,25.6,'ink');
 // Average shared vertex normals so leather lighting stays smooth across faces.
 const normals=new Map();
 for(const face of faces)for(const point of face.points){const sum=normals.get(point)||[0,0,0];face.normal.forEach((n,i)=>sum[i]+=n);normals.set(point,sum);}
 for(const face of faces)face.normals=face.points.map(point=>{const n=normals.get(point),length=Math.hypot(...n)||1;return n.map(v=>v/length);});
 return faces;
}
const gloveVolumeMesh=volumeFaces();
function gloveBasis(back,preferredTop={x:0,y:-1,z:0}){
 const unit=v=>{const length=Math.hypot(v.x,v.y,v.z)||1;return {x:v.x/length,y:v.y/length,z:v.z/length};};
 const y=unit(back),dot=y.x*preferredTop.x+y.y*preferredTop.y+y.z*preferredTop.z;
 let z=unit({x:preferredTop.x-dot*y.x,y:preferredTop.y-dot*y.y,z:preferredTop.z-dot*y.z});
 if(Math.hypot(z.x,z.y,z.z)<.5)z=unit({x:0,y:-y.z,z:y.y});
 const x=unit({x:y.y*z.z-y.z*z.y,y:y.z*z.x-y.x*z.z,z:y.x*z.y-y.y*z.x});
 return {x,y,z};
}
function projectGlovePose(side,pitch,yaw,roll,basis=null){
 const cx=Math.cos(pitch),sx=Math.sin(pitch),cy=Math.cos(yaw),sy=Math.sin(yaw),cz=Math.cos(roll),sz=Math.sin(roll);
 function rotate([x,y,z]){
  if(basis){x*=side;return [x*basis.x.x+y*basis.y.x+z*basis.z.x,x*basis.x.y+y*basis.y.y+z*basis.z.y,x*basis.x.z+y*basis.y.z+z*basis.z.z];}
  x*=side;const xx=x*cy+z*sy,zz=-x*sy+z*cy;
  const yy=y*cx-zz*sx,depth=y*sx+zz*cx;
  return [xx*cz-yy*sz,xx*sz+yy*cz,depth];
 }
 function project(point){const [x,y,z]=rotate(point),perspective=210/(210-z);return [x*perspective,y*perspective,z];}
 return {rotate,project};
}
function compileGlove(color,side,pitch,yaw,roll,basis=null){
 const {rotate,project}=projectGlovePose(side,pitch,yaw,roll,basis);
 const base=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 const materials={leather:base,strap:[28,37,42],lining:[66,48,40],label:[164,161,140],ink:[39,49,50]};
 const polygons=gloveVolumeMesh.filter(face=>{
  const n=rotate(face.normal),center=face.points.reduce((sum,p)=>sum.map((v,i)=>v+p[i]/4),[0,0,0]),point=rotate(center);
  return n[0]*-point[0]+n[1]*-point[1]+n[2]*(210-point[2])>0;
 }).map(face=>{
  const colors=face.normals.map(n=>{
   const normal=rotate(n),light=Math.max(0,normal[0]*-.43+normal[1]*-.55+normal[2]*.71);
   const specular=Math.pow(Math.max(0,normal[0]*-.20+normal[1]*-.28+normal[2]*.94),25)*(face.material==='leather'?85:20);
   return materials[face.material].map(q=>Math.round(Math.min(255,q*(.43+.71*light)+specular)));
  });
  const points=face.points.map(project);
  const order=colors.map((rgb,i)=>({i,value:rgb.reduce((a,b)=>a+b,0)})).sort((a,b)=>a.value-b.value),dark=order[0].i,bright=order[3].i;
  return {points,color:`rgb(${colors[0].join(',')})`,gradient:{a:points[dark],b:points[bright],dark:`rgb(${colors[dark].join(',')})`,bright:`rgb(${colors[bright].join(',')})`},depth:points.reduce((sum,p)=>sum+p[2]/4,0)};
 }).sort((a,b)=>a.depth-b.depth);
 const showDetails=!basis||Math.abs(basis.y.z)<.45;
 const seams=showDetails?[[-31,22,23],[-19,28,29],[0,30,31],[19,28,29],[30,22,23]].map(project):[];
 const stitches=[];if(showDetails)for(let i=0;i<11;i++)stitches.push(project([-25+i*5,43,24]),project([-25+i*5,60,23]));
 return {polygons,seams,stitches};
}
function paintGloveVolume(ctx,commands){
 for(const face of commands.polygons){
  ctx.beginPath();face.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
  const {a,b,dark,bright}=face.gradient,paint=ctx.createLinearGradient(a[0],a[1],b[0],b[1]);paint.addColorStop(0,dark);paint.addColorStop(1,bright);
  ctx.fillStyle=paint;ctx.fill();ctx.strokeStyle=paint;ctx.lineWidth=.45;ctx.stroke();
 }
 ctx.beginPath();commands.seams.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle='#201b1a99';ctx.lineWidth=1.1;ctx.stroke();
 ctx.fillStyle='#bdbaa266';for(const [x,y] of commands.stitches)ctx.fillRect(x,y,1.4,.6);
}
function leatherGlove(x,y,color,scale=1,side=1,turn=0,foreshorten=1,pitch=-.13,yaw=side*.22,basis=null){
 // Small angle bins reuse shading while preserving the shape change through a punch.
 const snap=v=>Math.round(v*12)/12;pitch=snap(pitch);yaw=snap(yaw);turn=snap(turn);
 let basisKey='';
 if(basis){const snapAxis=v=>({x:Math.round(v.x*18)/18,y:Math.round(v.y*18)/18,z:Math.round(v.z*18)/18});basis=gloveBasis(snapAxis(basis.y),snapAxis(basis.z));basisKey=JSON.stringify(basis);pitch=yaw=turn=0;}
 const key=[color,side,pitch,yaw,turn,basisKey].join(':');let cached=gloveVolumeCache.get(key);
 if(!cached){
  const commands=compileGlove(color,side,pitch,yaw,turn,basis);
  if(typeof document.createElement==='function'){
   const layer=document.createElement('canvas');layer.width=layer.height=320;
   const context=layer.getContext('2d');context.translate(160,144);context.scale(1.7,1.7);paintGloveVolume(context,commands);cached={layer};
  }else cached={commands};
  if(gloveVolumeCache.size>=120)gloveVolumeCache.delete(gloveVolumeCache.keys().next().value);
  gloveVolumeCache.set(key,cached);
 }
 gloveVolumeCache.delete(key);gloveVolumeCache.set(key,cached);
 g.save();g.translate(x,y);g.scale(scale,scale*foreshorten);
 if(cached.layer)g.drawImage(cached.layer,-160/1.7,-144/1.7,320/1.7,320/1.7);else paintGloveVolume(g,cached.commands);
 g.restore();
}
