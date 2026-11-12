let swing=null,duckAmount=0,duckStartedAt=-Infinity,nextCenterHand=1,handRecovery={};
function crouchHeld(){return !!keys.ArrowDown;}
function crouchStance(){return crouchHeld()||duckAmount>.5;}
function resetMovement(){handRecovery={};nextCenterHand=1;swing=null;duckAmount=0;duckStartedAt=-Infinity;}
function beginDuck(code='ArrowDown'){
 if(!run||paused||inDialogue()||ko>0)return;
 if(!crouchHeld())duckStartedAt=t;
 keys[code]=true;
}
function duckIsActive(){return duckAmount>.55;}
function easeMotion(v){v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);}
function easeBoxing(v){v=Math.max(0,Math.min(1,v));return v*v*v*(v*(v*6-15)+10);}
function npcAnimationTime(){return attack?.trainingHeld?(attack.trainingHeldAt??t):t;}
function swingReach(s){
 if(s.result==='clash')return s.clashReach*Math.max(0,1-(s.elapsed-s.clashAt)/.10);
 if(s.elapsed<s.contactAt)return easeMotion(s.elapsed/s.contactAt);
 const f=Math.min(1,(s.elapsed-s.contactAt)/(s.duration-s.contactAt));return 1-easeMotion(f);
}
function clashWindow(){return tutorial>=0?.24:difficulty==='easy'?.22:difficulty==='normal'?.16:.11;}
function defenseTiming(a,at=t){
 const remaining=a.duration-(at-a.start),inner=23,outer=inner+46*clashWindow()/a.duration,radius=inner+46*remaining/a.duration;
 return {inner,outer,radius,inside:remaining>=0&&remaining<=clashWindow()};
}
function clashTargetAtInput(){return attack&&defenseTiming(attack).inside?attack:null;}
function canGlovesClash(s,a){
 return !!(s&&!s.connected&&a&&s.clashAttack===a&&s.kind!=='uppercut'&&s.lane===a.lane&&s.crouched===!!a.body);
}
function tickMovement(dt){
 for(const hand of [-1,1])if(handRecovery[hand]){handRecovery[hand].elapsed+=dt;if(handRecovery[hand].elapsed>=handRecovery[hand].duration)delete handRecovery[hand];}
 const target=crouchHeld()?1:0;duckAmount+=(target-duckAmount)*Math.min(1,dt*34);
 if(!swing)return;
 swing.elapsed+=dt;
 if(!swing.connected){
  if(canGlovesClash(swing,attack))resolveClash(swing,attack);
  else if(swing.elapsed>=swing.contactAt){swing.connected=true;resolvePlayerStrike(swing);}
 }
 if(swing&&swing.elapsed>=swing.duration)swing=null;
}
function playerHandPose(hand){
 const current=swing&&swing.hand===hand?swing:handRecovery[hand]||null;
 const reach=current?swingReach(current):0;
 const restX=500+hand*207+playerX*.25,restY=508+duckAmount*20;
 const targetX=current?500+current.lane*62+(current.aimX??npcX)*.65:500+hand*62;
 const targetY=current?(current.kind==='uppercut'?262:current.crouched?413:226):226;
 const upper=current?.kind==='uppercut',variant=current?.motion||'straight';
 const hook=variant==='hook'||variant==='shovel',arc=Math.sin(reach*Math.PI);
 const load=upper&&!current.connected?Math.sin(Math.min(1,current.elapsed/current.contactAt)*Math.PI)*72:0;
 const upperBack={x:hand*.10,y:1,z:.35},straightBack={x:hand*(.08+.24*reach),y:1.25*(1-reach)+(current?.crouched?.30:.45)*reach,z:.14*(1-reach)+1.1*reach};
 const back=upper?{x:hand*.08,y:1.25*(1-reach)+upperBack.y*reach,z:.14*(1-reach)+upperBack.z*reach}:hook?{x:hand*(.08+reach*1.65),y:1.25*(1-reach)+.18*reach,z:.14*(1-reach)+.55*reach}:straightBack;
 const top=upper?{x:0,y:0,z:1}:{x:0,y:-reach,z:1-reach+.12*reach};
 const basis=gloveBasis(back,top);
 return {basis,x:restX+(targetX-restX)*reach+hand*arc*(upper?58:hook?96:variant==='jab'?4:20),y:restY+(targetY-restY)*reach+load+arc*(variant==='shovel'?44:hook?-38:variant==='jab'?-12:0),scale:1.58-.38*reach,reach,motion:variant,turn:hand*(-.08+(upper?-.48:hook?.55:.18)*reach),pitch:upper?-.25+reach*1.0:-.24+reach*.56,yaw:hand*(.20+reach*.42)};
}
function anatomicalLimb(x1,y1,x2,y2,r1,r2,color,kind='forearm',side=1){
 const length=Math.hypot(x2-x1,y2-y1);if(length<.01)return;
 const skin=kind==='forearm',radius=Math.max(r1,r2);
 g.save();g.translate(x1,y1);g.rotate(Math.atan2(y2-y1,x2-x1));
 // Unequal muscle bellies, a bony elbow, and a narrow wrist replace straight tube walls.
 const bulge=skin?r1*1.17:r1*1.08;
 pathShape(shade(0,-radius,0,radius,[[0,toneColor(color,-27)],[.22,toneColor(color,10)],[.48,toneColor(color,19)],[.75,color],[1,toneColor(color,-34)]]),()=>{
  g.moveTo(-r1*.22,-r1*.66);
  g.bezierCurveTo(length*.08,-r1*.92,length*.23,-bulge,length*.41,-r1*.85);
  g.bezierCurveTo(length*.63,-r1*.58,length*.84,-r2*.88,length,-r2*.87);
  g.quadraticCurveTo(length+r2*.13,0,length,r2*.86);
  g.bezierCurveTo(length*.78,r2*.91,length*.59,r1*.77,length*.36,r1*.92);
  g.bezierCurveTo(length*.18,r1*1.02,-r1*.25,r1*.72,-r1*.22,-r1*.66);
 },toneColor(color,-41),.65);
 if(skin){
  // Brachioradialis volume fades into the two wrist tendons, rather than a metallic stripe.
  pathShape(toneColor(color,25)+'38',()=>{g.moveTo(length*.10,-r1*.48);g.bezierCurveTo(length*.27,-r1*.88,length*.46,-r1*.59,length*.73,-r2*.43);g.bezierCurveTo(length*.50,-r2*.18,length*.27,-r1*.15,length*.10,-r1*.48);});
  curveLine([length*.21,r1*.48,length*.44,r1*.24,length*.68,r2*.65,length*.95,r2*.28],toneColor(color,-29)+'55',Math.max(.7,radius*.035));
  for(const offset of [-.30,.18])curveLine([length*.58,offset*r1,length*.74,offset*r2*.8,length*.90,offset*r2,length*.99,offset*r2],toneColor(color,25)+'55',Math.max(.7,radius*.025));
  curveLine([length*.06,-r1*.1,length*.10,-r1*.3,length*.18,-r1*.32,length*.23,-r1*.2],toneColor(color,-34)+'55',1);
  curveLine([length*.64,-r2*.12,length*.72,-r2*.23,length*.78,-r2*.15,length*.83,-r2*.25],'#65848025',.8);
 }else{
  // Compressed cloth at the elbow and long folds running toward the shoulder.
  for(let i=0;i<3;i++){const x=length*(.70+i*.08);curveLine([x,-r2*.67,x-r1*.25,-r2*.14,x+r1*.1,r2*.30,x-r1*.14,r2*.65],toneColor(color,-36)+'55',1.2);}
  curveLine([length*.12,-r1*.47,length*.35,-r1*.33,length*.61,-r2*.12,length*.88,-r2*.35],toneColor(color,27)+'55',1);
 }
 g.restore();
}
function rolledCuff(x1,y1,x2,y2,width,color){
 const angle=Math.atan2(y2-y1,x2-x1);g.save();g.translate(x1,y1);g.rotate(angle);
 pathShape(shade(0,-width,0,width,[[0,toneColor(color,-25)],[.45,toneColor(color,26)],[1,toneColor(color,-18)]]),()=>{
  g.moveTo(-5,-width);g.quadraticCurveTo(5,-width*1.12,13,-width*.86);g.lineTo(15,width*.83);g.quadraticCurveTo(3,width*1.02,-5,width);g.closePath();
 },toneColor(color,-32),.7);
 curveLine([5,-width*.84,1,-width*.35,9,width*.3,7,width*.82],toneColor(color,-35)+'77',1);g.restore();
}
function drawPlayerHands(){
 if(inDialogue())return;
 for(const hand of [-1,1]){
  const pose=playerHandPose(hand),cuff=projectGlovePose(hand,0,0,0,pose.basis).project([0,52,0]),wrist={x:pose.x+cuff[0]*pose.scale,y:pose.y+cuff[1]*pose.scale};
  const upper=swing?.hand===hand&&swing.kind==='uppercut';
  const elbow={x:500+hand*(235-(upper?150:100)*pose.reach),y:640-(upper?155:125)*pose.reach};
  anatomicalLimb(500+hand*285,660,elbow.x,elbow.y,47,34,'#52616a','sleeve',hand);
  anatomicalLimb(elbow.x,elbow.y,wrist.x,wrist.y,34,15*pose.scale,'#bb9276','forearm',hand);
  leatherGlove(pose.x,pose.y,'#6b443a',pose.scale,hand,0,1,0,0,pose.basis);
 }
}
function enemyMotion(a,phase,recovery=null){
 if(!a)return {load:0,drive:0,x:0,y:0,twist:0};
 const returnAmount=recovery===null?0:easeBoxing(recovery),startPhase=a.recoilPhase??1;
 const load=recovery===null?easeBoxing(phase/.28):returnAmount*easeBoxing(startPhase/.28);
 const drive=recovery===null?easeBoxing((phase-.28)/.72):returnAmount*easeBoxing((startPhase-.28)/.72);
 return {load,drive,x:a.side*(-10*load*(1-drive)+8*drive),y:a.body?16*load*(1-drive):0,twist:a.side*(-.07*load*(1-drive)+.07*drive)};
}
function npcBodyMotion(){
 const pose=attack?enemyMotion(attack,(t-attack.start)/attack.duration):impact?enemyMotion(impact,1,impact.life/.20):enemyMotion(null,0);
 const groggy=npcIsGroggy()&&!reduced?Math.sin(t*12)*Math.min(1,(npcGroggyUntil-t)*5):0;
 return {...pose,x:pose.x+npcX*.2+groggy*7,y:pose.y+Math.abs(npcX)*.06+Math.abs(groggy)*3,twist:pose.twist+npcX*.002+groggy*.025};
}
function enemyRig(a,phase,recovery=null){
 const motion=enemyMotion(a,phase,recovery),side=a.side,lane=a.lane??a.side,style=a.motion||a.kind;
 const lerp=(a,b,f)=>a+(b-a)*f;
 const guard={x:side*128,y:28,z:260},loaded={x:side*(a.body?165:150),y:a.body?110:25,z:a.body?260:330};
 const loadedWrist={x:lerp(guard.x,loaded.x,motion.load)+(a.body?side*Math.sin(motion.load*Math.PI)*25:0),y:lerp(guard.y,loaded.y,motion.load),z:lerp(guard.z,loaded.z,motion.load)};
 const drive=motion.drive;
 // Return along the same loaded path: contact and recovery share one pose.
 const from=loadedWrist;
 const aimOffset=0;
 const wrist={x:lerp(from.x,lane*30+aimOffset,drive),y:lerp(from.y,a.body?60:0,drive),z:lerp(from.z,90,drive)};
 if(a.kind==='idle'&&npcGuard){
  const raised=easeMotion((t-npcGuard.start)/.18);
  wrist.x=lerp(wrist.x,side*38,raised);wrist.y=lerp(wrist.y,npcGuard.body?88:-8,raised);wrist.z=lerp(wrist.z,225,raised);
 }
 if(style==='hook'){wrist.x+=side*Math.sin(drive*Math.PI)*92;wrist.y-=Math.sin(drive*Math.PI)*28;}
 if(style==='overhand')wrist.y-=Math.sin(drive*Math.PI)*75;
 if(style==='shovel'){wrist.x+=side*Math.sin(drive*Math.PI)*48;wrist.y+=Math.sin(drive*Math.PI)*45;}
 if(style==='uppercut'){wrist.x+=side*Math.sin(drive*Math.PI)*26;wrist.y+=Math.sin(drive*Math.PI)*105;}
 if(style==='jab')wrist.x-=side*Math.sin(drive*Math.PI)*24;
 if(a.clashed){const recoil=recovery===null?1-drive:1-easeMotion(recovery);wrist.x+=side*Math.sin(recoil*Math.PI)*55;wrist.y-=Math.sin(recoil*Math.PI)*24;}
 const physiqueScale=Math.max(.9,Math.min(1.15,activeOpponentLook().body/115));
 const shoulder={x:side*(109*physiqueScale-12*drive),y:86-10*drive,z:315-16*drive},fist={...wrist};
 const unit=v=>{const n=Math.hypot(...v)||1;return v.map(q=>q/n);};
 // Solve the elbow once against the fist target; iterative wrist guesses became
 // singular when the target approached the shoulder and could throw elbows off-screen.
 const delta=[fist.x-shoulder.x,fist.y-shoulder.y,fist.z-shoulder.z],distance=Math.hypot(...delta)||1;
 const upper=105,forearm=125,handOffset=Math.min(32,Math.max(0,distance-22)),lower=forearm+handOffset;
 const d=Math.max(Math.abs(upper-lower)+.01,Math.min(distance,upper+lower-.01)),direction=delta.map(v=>v/distance);
 const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 const desired=[side*(style==='hook'?1.2:a.body?.85:.4),style==='hook'?.5:style==='overhand'?.6:1,-.6],dot=desired.reduce((sum,v,i)=>sum+v*direction[i],0),bend=unit(desired.map((v,i)=>v-dot*direction[i]));
 const elbow={x:shoulder.x+direction[0]*along+bend[0]*height,y:shoulder.y+direction[1]*along+bend[1]*height,z:shoulder.z+direction[2]*along+bend[2]*height};
 const forward=unit([fist.x-elbow.x,fist.y-elbow.y,fist.z-elbow.z]);
 const joint={x:elbow.x+forward[0]*forearm,y:elbow.y+forward[1]*forearm,z:elbow.z+forward[2]*forearm};
 const root=npcBodyMotion();
 const sway=hit?reactionSide*Math.sin(Math.PI*Math.min(1,hit/.36))*28*reactionPower:Math.sin(npcAnimationTime()*2)*2;
 function project(p){
  const scale=300/Math.max(85,p.z),x=p.x*scale,y=255+p.y*scale-350;
  return {x:500+root.x+sway+x*Math.cos(root.twist)-y*Math.sin(root.twist),y:350+root.y+x*Math.sin(root.twist)+y*Math.cos(root.twist),scale};
 }
 const back={x:-forward[0]*Math.cos(root.twist)+forward[1]*Math.sin(root.twist),y:-forward[0]*Math.sin(root.twist)-forward[1]*Math.cos(root.twist),z:forward[2]};
 const basis=gloveBasis(back,{x:Math.sin(root.twist),y:-Math.cos(root.twist),z:0});
 const center=project(fist),scale=center.scale*.8,cuffOffset=projectGlovePose(side,0,0,0,basis).project([0,52,0]);
 const cuff={x:center.x+cuffOffset[0]*scale,y:center.y+cuffOffset[1]*scale,scale:project(joint).scale};
 return {shoulder:project(shoulder),elbow:project(elbow),wrist:center,cuff,basis,gloveScale:scale,turn:0,pitch:0,yaw:0,drive,joints:{shoulder,elbow,wrist:joint,fist}};
}
function enemyPunchPose(a,phase,recovery=null){const rig=enemyRig(a,phase,recovery);return {...rig.wrist,turn:rig.turn,pitch:rig.pitch,yaw:rig.yaw,thrust:rig.drive};}
function drawEnemyArm(a,phase,recovery=null){
 const rig=enemyRig(a,phase,recovery),s=rig.shoulder,e=rig.elbow,w=rig.wrist,look=activeOpponentLook();
 const cloth=look.outfit==='suit'?'#b3bbb9':look.suit,skin=look.skinMid;
 anatomicalLimb(s.x,s.y,e.x,e.y,28*s.scale,20*e.scale,cloth,'sleeve',a.side);
 // Rolled sleeves expose a muscular forearm and make wrist/skin ownership unambiguous.
 const roll={x:e.x+(rig.cuff.x-e.x)*.14,y:e.y+(rig.cuff.y-e.y)*.14};
 anatomicalLimb(e.x,e.y,rig.cuff.x,rig.cuff.y,22*e.scale,13*rig.cuff.scale,skin,'forearm',a.side);
 anatomicalLimb(e.x,e.y,roll.x,roll.y,22*e.scale,21*e.scale,cloth,'sleeve',a.side);
 rolledCuff(roll.x,roll.y,rig.cuff.x,rig.cuff.y,21*e.scale,cloth);
 leatherGlove(w.x,w.y,look.glove,rig.gloveScale,a.side,0,1,0,0,rig.basis);
}
