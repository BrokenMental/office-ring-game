// Shared comic cutout rig. Combat geometry stays in enemyRig/playerHandPose.
const coach2D=(()=>{
 const state={ready:false,frames:0,error:null,parts:[],lastPose:[]};
 if(typeof Image==='undefined')return state;
 const proportions={headWidth:156,torsoWidth:480,torsoHeight:410,shoulderHalfWidth:170,collarY:-52,upperArmWidth:74,forearmWidth:60,wristWidth:51.68,gloveWidth:114,neckWidth:.62,neckLength:.85};
 state.proportions=proportions;
 const atlas=new Image(),gloves=new Image();
 function slices(img,columns,rows){
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
  const {data}=ctx.getImageData(0,0,canvas.width,canvas.height),parts=[];
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const x0=Math.floor(col*canvas.width/columns),x1=Math.floor((col+1)*canvas.width/columns),y0=Math.floor(row*canvas.height/rows),y1=Math.floor((row+1)*canvas.height/rows);
   let left=x1,top=y1,right=x0,bottom=y0;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*canvas.width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<=left||bottom<=top)throw Error('Empty comic sprite');
   const w=right-left+1,h=bottom-top+1;let weight=0,moment=0,wristLeft=right,wristRight=left;
   // Locate the wrist opening from the actual opaque cuff, not the bounding-box centre.
   for(let y=top+Math.floor(h*.89);y<=bottom;y++)for(let x=left;x<=right;x++){
    const alpha=data[(y*canvas.width+x)*4+3];if(alpha>96){weight+=alpha;moment+=(x-left)*alpha;wristLeft=Math.min(wristLeft,x);wristRight=Math.max(wristRight,x);}
   }
   let topWeight=0,topMoment=0;
   for(let y=top;y<top+Math.ceil(h*.10);y++)for(let x=left;x<=right;x++){
    const alpha=data[(y*canvas.width+x)*4+3];if(alpha>96){topWeight+=alpha;topMoment+=(x-left)*alpha;}
   }
   parts.push({image:img,x:left,y:top,w,h,anchorX:weight?moment/weight/w:.5,anchorY:.97,
    elbowX:topWeight?topMoment/topWeight/w:.5,elbowY:.03,wristSpan:(wristRight-wristLeft+1)/w});
  }
  return parts;
 }
 state.slices=slices;
 const load=(img,src)=>new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Comic asset unavailable: '+src));img.src=src;});
 state.assetPromise=Promise.all([load(atlas,'assets/coach/coach-atlas.png'),load(gloves,'assets/coach/boxing-gloves-v2.png')]).then(()=>{
  state.parts=slices(atlas,3,3);const sideGuard=state.parts[7],hands=slices(gloves,3,2);
  for(let i=0;i<3;i++)state.parts[6+i]=hands[i];state.parts[6]=sideGuard;state.playerParts=hands.slice(3);
  state.ready=true;
 }).catch(error=>{state.error=String(error);});
 function coachHead(part,proportions=state.proportions,skin='#cf9571'){
  // Keep the face intact; compress only the neck below the jaw into the collar.
  const split=proportions.neckSplit||.78,scale=proportions.headWidth/145,faceHeight=230*split*scale,neckHeight=230*(1-split)*scale,headLift=proportions.headLift||0,top=-216-230*split*(scale-1)-headLift;
  const faceSplit=part.faceSplit||split,neck=part.neckSource||part;
  const drawFace=()=>g.drawImage(part.image,part.x,part.y,part.w,part.h*faceSplit,-proportions.headWidth/2,top,proportions.headWidth,faceHeight);
  if(!part.neckSource)drawFace();
  const neckLength=neckHeight*proportions.neckLength+headLift;
  if(headLift){
   // One resample avoids horizontal seams when extending the campaign neck.
   const overlap=part.neckSource?12:.5,neckSplit=split;
   if(part.neckSource&&part.neckMode!=='attack'){
    // Cover transparent cutout edges beneath the jaw with a connected neck.
    g.save();g.beginPath();
    const half=proportions.headWidth*.18,y=top+faceHeight,shade=g.createLinearGradient(0,y-overlap,0,y+neckLength);
    shade.addColorStop(0,toneColor(skin,-28));shade.addColorStop(1,skin);g.fillStyle=shade;
    g.moveTo(-half*.8,y-overlap);g.lineTo(half*.8,y-overlap);
    g.lineTo(half*1.08,y+neckLength);g.lineTo(-half*1.08,y+neckLength);g.closePath();g.fill();g.restore();
   }
   // Reuse the attack's own opaque neck edge after atlas bounds are cleaned.
   const sourceSplit=part.neckMode==='attack' ? 0 : neckSplit,sourceHeight=part.neckMode==='attack' ? 1 : 1-neckSplit;
   g.drawImage(neck.image,neck.x,neck.y+neck.h*sourceSplit,neck.w,neck.h*sourceHeight,
    -proportions.headWidth/2,top+faceHeight-overlap,proportions.headWidth,neckLength+overlap);
  }else{
   const rows=64;
   for(let i=0;i<rows;i++){
    const u=i/rows,w=proportions.headWidth*(1-(1-proportions.neckWidth)*easeMotion(u));
    g.drawImage(part.image,part.x,part.y+part.h*(split+(1-split)*u),part.w,part.h*(1-split)/rows,
     -w/2,top+faceHeight+neckLength*u,w,neckLength/rows+.05);
   }
  }
  if(part.neckSource)drawFace();
  state.lastHead={top,faceHeight,jawY:top+faceHeight,faceSplit,neckFromRest:part.neckMode==='rest',neckSourceMode:part.neckMode||null};
 }
 const blendCanvas=document.createElement('canvas');blendCanvas.width=384;blendCanvas.height=384;
 const blendContext=blendCanvas.getContext('2d');
 function gloveImage(ctx,part,w,h){
  ctx.drawImage(part.image,part.x,part.y,part.w,part.h,-part.anchorX*w,-part.anchorY*h,w,h);
 }
 function turningGlove(rest,extended,turn,w,h,mirror){
  g.save();g.scale(mirror?-1:1,1);
  if(turn<=0||turn>=1){gloveImage(g,turn>=1?extended:rest,w,h);g.restore();return;}
  blendContext.clearRect(0,0,384,384);blendContext.save();blendContext.translate(192,352);
  blendContext.globalAlpha=1-turn;gloveImage(blendContext,rest,256,320);
  blendContext.globalCompositeOperation='lighter';blendContext.globalAlpha=turn;
  gloveImage(blendContext,extended,256,320);blendContext.restore();
  g.drawImage(blendCanvas,-192*w/256,-352*h/320,384*w/256,384*h/320);g.restore();
 }
 // A single skin silhouette replaces independently stretched/cut arm sprites.
 function armShape(shoulder,elbow,wrist,upperWidth,lowerWidth,wristWidth){
  const mix=(a,b,u)=>({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u});
  const length=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
  const upperLength=length(shoulder,elbow),lowerLength=length(elbow,wrist);
  const bendIn=mix(elbow,shoulder,.22),bendOut=mix(elbow,wrist,.22);
  const dot=((elbow.x-shoulder.x)*(wrist.x-elbow.x)+(elbow.y-shoulder.y)*(wrist.y-elbow.y))/Math.max(1,upperLength*lowerLength);
  const bend=Math.acos(Math.max(-1,Math.min(1,dot)));
  const elbowRadius=Math.min((upperWidth+lowerWidth)*.22,Math.min(upperLength,lowerLength)*(.36-.19*bend/Math.PI));
  const radii=[[0,upperWidth*.44],[.23,upperWidth*.5],[.5,Math.max(9,elbowRadius)],[.70,lowerWidth*.5],[1,wristWidth/2]];
  const points=[];
  for(let i=0;i<=64;i++){
   const u=i/64;let c;
   if(u<.4)c=mix(shoulder,bendIn,u/.4);
   else if(u>.6)c=mix(bendOut,wrist,(u-.6)/.4);
   else{const q=(u-.4)/.2,v=1-q;c={x:v*v*bendIn.x+2*v*q*elbow.x+q*q*bendOut.x,y:v*v*bendIn.y+2*v*q*elbow.y+q*q*bendOut.y};}
   const segment=radii.findIndex((r,j)=>j<radii.length-1&&u>=r[0]&&u<=radii[j+1][0]),j=Math.max(0,segment);
   const r=radii[j][1]+(radii[j+1][1]-radii[j][1])*easeMotion((u-radii[j][0])/(radii[j+1][0]-radii[j][0]));
   points.push({...c,r});
  }
  const left=[],right=[];
  for(let i=0;i<points.length;i++){
   const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],d=Math.hypot(b.x-a.x,b.y-a.y)||1;
   const n={x:-(b.y-a.y)/d,y:(b.x-a.x)/d},p=points[i];left.push({x:p.x+n.x*p.r,y:p.y+n.y*p.r});right.push({x:p.x-n.x*p.r,y:p.y-n.y*p.r});
  }
  const tube=start=>{
   const path=new Path2D();
   for(let i=start;i<points.length;i++){
    const p=points[i];path.moveTo(p.x+p.r,p.y);path.arc(p.x,p.y,p.r,0,Math.PI*2);path.closePath();
    if(i<points.length-1){
     path.moveTo(left[i].x,left[i].y);path.lineTo(right[i].x,right[i].y);
     path.lineTo(right[i+1].x,right[i+1].y);path.lineTo(left[i+1].x,left[i+1].y);path.closePath();
    }
   }
   return path;
  };
  return {shoulder,elbow,wrist,upperWidth,lowerWidth,wristWidth,points,left,right,path:tube(0),frontPath:tube(25)};
 }
 function drawArm(arm,frontOnly=false,skin=null){
  g.save();
  if(frontOnly)g.clip(arm.frontPath);
  const l=arm.left[43],r=arm.right[43],light=g.createLinearGradient(l.x,l.y,r.x,r.y);
  light.addColorStop(0,skin?toneColor(skin,-30):'#a87053');light.addColorStop(.22,skin||'#cf9571');light.addColorStop(.55,skin?toneColor(skin,28):'#e6b48e');light.addColorStop(1,skin?toneColor(skin,-12):'#bc805f');
  g.fillStyle=light;g.shadowColor='#624638';g.shadowBlur=2;g.fill(arm.path);g.shadowBlur=0;
  g.clip(arm.path);
  g.restore();
 }
 state.renderOpponent=(art=null)=>{
  const proportions=art?.proportions||state.proportions,parts=art?.parts||state.parts;
  const body=npcBodyMotion(),root={...body,twist:body.twist+(art?koPose*.3:0)},sway=hit?reactionSide*Math.sin(Math.PI*Math.min(1,hit/.36))*28*reactionPower:Math.sin(npcAnimationTime()*2)*2;
  const origin={x:500+root.x+sway,y:350+root.y+(art?koPose*180:0)};
  const world=(x,y)=>({x:origin.x+x*Math.cos(root.twist)-y*Math.sin(root.twist),y:origin.y+x*Math.sin(root.twist)+y*Math.cos(root.twist)});
  state.lastPose=[];
  const arms=[-1,1].map(side=>{
   const current=attack?.side===side?attack:impact?.side===side?impact:null;
   const rig=enemyRig(current||{side,lane:side,kind:'idle'},current===attack&&current?(t-current.start)/current.duration:current?1:0,current===impact&&current?impact.life/.2:null);
   if(art&&koPose>0){
    // Carry both joints with the falling torso instead of leaving gloves in guard.
    const angle=koPose*.3,cx=500+body.x,cy=350+body.y;
    const fall=point=>({...point,x:cx+(point.x-cx)*Math.cos(angle)-(point.y-cy)*Math.sin(angle),y:cy+(point.x-cx)*Math.sin(angle)+(point.y-cy)*Math.cos(angle)+koPose*180});
    rig.elbow=fall(rig.elbow);rig.wrist=fall(rig.wrist);
   }
   const roll=rig.drive*10-enemyMotion(current,current===attack&&current?(t-current.start)/current.duration:1,current===impact&&current?impact.life/.2:null).load*3;
   const shoulder=world(side*(proportions.shoulderHalfWidth-roll*.45),-roll*.55);
   rig.elbow={...rig.elbow,x:rig.elbow.x+side*62*(1-rig.drive)};
   const motion=current?.motion||current?.kind,size=proportions.gloveWidth*rig.gloveScale,h=size*1.17;
   const forearmAngle=Math.atan2(rig.elbow.y-rig.wrist.y,rig.elbow.x-rig.wrist.x)-Math.PI/2;
   // Depth can project the elbow above a low fist. Follow the 3D cuff basis
   // toward contact instead of turning the glove upside down in screen space.
   const cuffTilt=Math.atan2(Math.abs(rig.wrist.x-rig.cuff.x),Math.abs(rig.cuff.y-rig.wrist.y));
   const turnBlend=easeMotion((rig.drive-.1)/.5),lowAngle=-side*(.26*(1-turnBlend)+Math.min(1.45,cuffTilt)*turnBlend);
   const angle=current?.body?lowAngle:forearmAngle,focus=h*.16*rig.drive;
   const center={x:rig.wrist.x-Math.sin(angle)*focus,y:rig.wrist.y+Math.cos(angle)*focus};
   const cuff={x:center.x-Math.sin(angle)*h*.43,y:center.y+Math.cos(angle)*h*.43};
   // Both straight and curved punches lead with the knuckles, never the palm.
   const turn=easeMotion((rig.drive-.12)/.48),extended=7;
   const cuffWidth=size*(parts[6].wristSpan*(1-turn)+parts[extended].wristSpan*turn);
   const wristWidth=Math.min(cuffWidth*.82,proportions.wristWidth*rig.elbow.scale);
   const arm=armShape(shoulder,rig.elbow,cuff,proportions.upperArmWidth*rig.shoulder.scale,proportions.forearmWidth*rig.elbow.scale,wristWidth);
   return {side,rig,current,shoulder,roll,motion,size,h,angle,center,cuff,turn,extended,cuffWidth,arm};
  }).sort((a,b)=>a.rig.drive-b.rig.drive);
  // The polo owns the shoulder silhouette. Bare skin starts near the elbow.
  g.save();g.translate(origin.x,origin.y);g.rotate(root.twist);
  // Each chest strip follows its shoulder near the collar and settles at the waist.
  const chest=()=>{
  const torso=parts[3],strips=16,halfWidth=proportions.torsoWidth/2;
  const chestX=x=>x*(1-.35*Math.exp(-Math.pow(x/80,2)));
  for(let i=0;i<strips;i++){
   const x=-halfWidth+halfWidth*2*i/strips,mid=x+halfWidth/strips;
   const side=mid<0?-1:1,roll=arms.find(a=>a.side===side).roll;
   const weight=Math.pow(Math.abs(mid)/halfWidth,2),lift=-roll*.55*weight;
   const left=chestX(x),right=chestX(x+halfWidth*2/strips);
   g.drawImage(torso.image,torso.x+torso.w*i/strips,torso.y,torso.w/strips,torso.h,left,proportions.collarY+lift,right-left+.4,proportions.torsoHeight-lift);
  }
  };chest();
  const expression=hit>0?1:attack?2:0;
  coachHead(parts[expression],proportions,art?.skin);
  // The collar is in front of the neck: hide its cut edge and the source neck seam.
  g.save();g.beginPath();g.moveTo(-240,-52);g.lineTo(-80,-52);g.lineTo(-48,-16);g.lineTo(0,8);
  g.lineTo(48,-16);g.lineTo(80,-52);g.lineTo(240,-52);g.lineTo(240,400);g.lineTo(-240,400);g.closePath();g.clip();
  chest();g.restore();
  if(art?.drawDetails)art.drawDetails(expression);
  g.restore();state.lastExpression=expression;
  for(const {side,rig,shoulder,motion,size,h,angle,center,cuff,turn,extended,cuffWidth,arm} of arms){
   drawArm(arm,true,art?.skin);
   const view=rig.drive>.32?extended:6,mirror=side>0;
   g.save();g.translate(cuff.x,cuff.y);g.rotate(angle);
   turningGlove(parts[6],parts[extended],turn,size,h,mirror);g.restore();
   const attachment={wristError:Math.hypot(arm.points[64].x-cuff.x,arm.points[64].y-cuff.y),wristWidth:arm.wristWidth};
   state.lastPose.push({side,view,shoulder,elbow:rig.elbow,cuff,fist:rig.wrist,center,size,angle,turn,mirror,attachment,cuffWidth,arm});
  }
  state.frames++;
 };
 state.renderPlayer=()=>{
  if(inDialogue())return;
  state.lastPlayer=[];
  for(const hand of [-1,1]){
   const pose=playerHandPose(hand),reach=pose.reach,view=reach>.28?1:0;
   const w=137*(1.58-.63*reach),h=w*(1.4-.30*reach);
   const load=Math.sin(Math.PI*Math.min(1,reach/.18));
   const fist={x:pose.x+hand*8*load,y:pose.y+6*load};
   const shoulder={x:500+hand*290,y:710};
   let elbow={x:500+hand*270,y:710},angle=-hand*.08,cuff;
   // Solve the bent arm against the glove cuff, then orient the wrist along it.
   // The shared attack pose still supplies the impact location and timing.
   for(let iteration=0;iteration<5;iteration++){
    const offset=h*(.43+.20*reach),down={x:-Math.sin(angle),y:Math.cos(angle)};
    cuff={x:fist.x+down.x*offset,y:fist.y+down.y*offset};
    const dx=cuff.x-shoulder.x,dy=cuff.y-shoulder.y,distance=Math.hypot(dx,dy)||1;
    const upper=180+50*reach,lower=190+90*reach,d=Math.max(Math.abs(upper-lower)+.01,Math.min(distance,upper+lower-.01));
    const along=(upper*upper-lower*lower+d*d)/(2*d),bend=Math.sqrt(Math.max(0,upper*upper-along*along));
    const solved={x:shoulder.x+dx/distance*along-dy/distance*bend*hand,y:shoulder.y+dy/distance*along+dx/distance*bend*hand};
    const extension=easeMotion(reach);
    elbow={x:(500+hand*270)*(1-extension)+solved.x*extension,y:710*(1-extension)+solved.y*extension};
    if(iteration<4)angle=-hand*.08*(1-extension)+(Math.atan2(elbow.y-fist.y,elbow.x-fist.x)-Math.PI/2)*extension;
   }
   const turn=easeMotion((pose.reach-.1)/.48),extended=1;
   const cuffWidth=w*(state.playerParts[0].wristSpan*(1-turn)+state.playerParts[extended].wristSpan*turn);
   const wristWidth=Math.min(cuffWidth*.82,54);
   const arm=armShape(shoulder,elbow,cuff,116,104-10*reach,wristWidth);
   drawArm(arm);
   // Rolled shirt follows the same continuous arm silhouette.
   g.save();g.clip(arm.path);g.beginPath();g.moveTo(shoulder.x,shoulder.y);g.lineTo(elbow.x,elbow.y);g.strokeStyle='#627f96';g.lineWidth=126;g.lineCap='round';g.stroke();
   g.beginPath();g.moveTo(elbow.x+(shoulder.x-elbow.x)*.12,elbow.y+(shoulder.y-elbow.y)*.12);g.lineTo(elbow.x,elbow.y);g.strokeStyle='#9caebc';g.lineWidth=130;g.stroke();g.restore();
   const attachment={wristError:Math.hypot(arm.points[64].x-cuff.x,arm.points[64].y-cuff.y),wristWidth};
   g.save();g.translate(cuff.x,cuff.y);g.rotate(angle);
   turningGlove(state.playerParts[0],state.playerParts[extended],turn,w,h,hand<0);g.restore();
   state.lastPlayer.push({hand,view,x:fist.x,y:fist.y,cuff,elbow,shoulder,angle,turn,attachment,cuffWidth,reach,width:w,height:h,arm});
  }
 };
 return state;
})();
const beforeComicOpponent=drawOpponent,beforeComicPlayer=drawPlayerHands;
drawOpponent=function(){if(tutorial>=0&&coach2D.ready)coach2D.renderOpponent();else beforeComicOpponent();};
drawPlayerHands=function(){if(coach2D.ready)coach2D.renderPlayer();else beforeComicPlayer();};
