// Upper-body weaving and readable NPC decisions. Neither fighter changes foot position.
let playerX=0,npcX=0,npcStep=0,npcStepAt=1.2,npcGuard=null,npcCounterAt=Infinity,npcActions=0;
let weaveStartedAt=-Infinity,npcWeaveUntil=0;
let repeatedLane=null,repeatedHeight=false,repeatedPunches=0,punchNumber=0;
function resetTactics(){
 playerX=npcX=npcStep=npcActions=punchNumber=0;npcStepAt=1.2;npcGuard=null;npcCounterAt=Infinity;
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
 const style=a.motion||a.kind;
 return !a.body&&!['hook','shovel','uppercut'].includes(style)&&Math.abs(playerX)>32&&Math.sign(playerX)===a.side;
}
function tickTactics(dt){
 const move=Number(!!keys.ArrowRight)-Number(!!keys.ArrowLeft);
 playerX+=(move*55-playerX)*Math.min(1,dt*22);
 if(tutorial>=0)return;
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
 npcGuard={lane,body,start,ready:start+.18,until:start+.95};next=start+1.02;
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
 if(npcGuard)text(t<npcGuard.ready?'NPC 가드 올리는 중':npcGuard.body?'NPC 복부 가드':'NPC 얼굴 가드',500+opponentScreenX(),165,18,'#dfca97');
}
