// Upper-body weaving and readable NPC decisions. Neither fighter changes foot position.
let playerX=0,npcX=0,npcStep=0,npcStepAt=1.2,npcGuard=null,npcCounterAt=Infinity,npcActions=0;
let npcGroggyUntil=0;
function npcIsGroggy(){return tutorial<0&&ko<=0&&t<npcGroggyUntil;}
function beginNPCGroggy(){
 if(npcIsGroggy())return;
 npcGroggyUntil=t+1;combo=[];attack=null;impact=null;npcCounterAt=Infinity;npcGuard=null;npcX=0;npcWeaveUntil=0;opening=0;
 beginNPCGuard(repeatedLane??0,repeatedHeight);next=npcGroggyUntil;
}
let weaveStartedAt=-Infinity,npcWeaveUntil=0;
let repeatedLane=null,repeatedHeight=false,repeatedPunches=0,punchNumber=0;
function resetTactics(){
 npcGroggyUntil=0;playerX=npcX=npcStep=npcActions=punchNumber=0;npcStepAt=1.2;npcGuard=null;npcCounterAt=Infinity;
 repeatedLane=null;repeatedPunches=0;repeatedHeight=false;
 weaveStartedAt=-Infinity;npcWeaveUntil=0;
}
function opponentScreenX(){return 0;}
function beginWeave(code){
 const old=Number(!!keys.ArrowRight)-Number(!!keys.ArrowLeft);keys[code]=true;
 const direction=Number(!!keys.ArrowRight)-Number(!!keys.ArrowLeft);
 if(direction&&direction!==old)weaveStartedAt=t;
}
function weaveEvades(a){
 const lane=a.lane??a.side;
 return Math.abs(playerX)>32&&(lane===0||Math.sign(playerX)===-Math.sign(lane));
}
function tickTactics(dt){
 const move=Number(!!keys.ArrowRight)-Number(!!keys.ArrowLeft);
 playerX+=(move*55-playerX)*Math.min(1,dt*22);
 if(tutorial>=0)return;
 if(npcIsGroggy()){npcCounterAt=Infinity;npcX=0;return;}
 if(t>=npcStepAt&&!attack&&!npcGuard&&opening<=0){npcStep++;npcStepAt=t+(difficulty==='easy'?2.4:1.8);npcWeaveUntil=t+.48;}
 const target=t<npcWeaveUntil&&!attack&&!npcGuard?(npcStep%2?-42:42):0;
 npcX+=(target-npcX)*Math.min(1,dt*18);
 if(npcGuard&&t>npcGuard.until)npcGuard=null;
 if(t>=npcCounterAt&&!attack){
  npcCounterAt=Infinity;npcGuard=null;combo=[];
  const body=crouchHeld(),lane=body?(repeatedLane||1):(repeatedLane??0);
  const hand=lane||1;
  attack={lane,side:hand,body,kind:body?'body':'cross',motion:body?'shovel':'overhand',counter:true,aimX:playerX,start:t,duration:difficulty==='easy'?.70:difficulty==='normal'?.56:.46};
  next=Infinity;say(body?'NPC 카운터 · 복부!':'NPC 카운터 · 받아치거나 옆으로!');
 }
}
function beginNPCGuard(lane=0,body=false){
 if(tutorial>=0||ko>0)return;
 const start=t+Math.max(0,opening);
 npcGuard={lane,body,start,ready:start+.18,until:npcIsGroggy()?npcGroggyUntil:start+.95};next=npcIsGroggy()?npcGroggyUntil:start+1.02;
 say(body?'NPC 낮은 가드 · 얼굴이 빈다':lane===0?'NPC 높은 가드 · 복부가 빈다':'NPC 높은 가드 · 복부나 반대쪽!');
}
function notePlayerStrike(lane,body){
 repeatedPunches=lane===repeatedLane&&body===repeatedHeight?repeatedPunches+1:1;
 repeatedLane=lane;repeatedHeight=body;
 if(repeatedPunches>=3&&!attack&&!npcGuard&&opening<=0){beginNPCGuard(lane,body);repeatedPunches=0;}
}
function npcBlocks(s){
 return tutorial<0&&npcGuard&&t>=npcGuard.ready&&t<=npcGuard.until&&!s.counter&&opening<=0&&
  npcGuard.body===(s.kind==='body')&&(npcGuard.lane===0||npcGuard.lane===s.lane);
}
function enemyEvaded(a){
 return weaveEvades(a)||(!a.body&&duckIsActive());
}
function drawFootwork(){
 if(!run||inDialogue()||tutorial>=0)return;
 text('← → 위빙 · 훅은 ↓로 숙이기',500,515,12,'#c7d4bc');
 drawNPCGroggy();
 if(npcGuard)text(t<npcGuard.ready?'NPC 가드 올리는 중':npcGuard.body?'NPC 복부 가드':'NPC 얼굴 가드',500+opponentScreenX(),165,18,'#dfca97');
}

// Draw on the combat canvas so this follows both WebGL and fallback characters.
function drawNPCGroggy(){
 if(!npcIsGroggy())return;
 const fade=Math.min(1,(npcGroggyUntil-t)*5),motion=reduced?0:Math.sin(t*15)*5;
 g.save();g.globalAlpha=fade;
 for(let i=0;i<7;i++){
  const angle=i*Math.PI*2/7+(reduced?0:t*2.5),x=500+Math.cos(angle)*103,y=200+Math.sin(angle)*68+motion;
  const mist=g.createRadialGradient(x,y,1,x,y,34);mist.addColorStop(0,'#131022bb');mist.addColorStop(1,'#13102200');
  ellipse(x,y,34,34,mist);
 }
 if(!reduced){g.strokeStyle='#b6a1cd88';g.lineWidth=2;for(let i=0;i<3;i++){g.beginPath();g.ellipse(500,145+i*9,47+i*6,8,Math.sin(t*4+i)*.12,0,Math.PI*1.6);g.stroke();}}
 text('그로기',650,205,22,'#e0cbed');g.restore();
}
