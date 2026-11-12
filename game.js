const $=s=>document.querySelector(s),c=$('#game'),g=c.getContext('2d');
// Keep virtual gameplay coordinates while resolving desktop linework more finely.
const renderScale=typeof innerWidth==='number'&&innerWidth>=900?1.5:1;
c.width=1000*renderScale;c.height=590*renderScale;g.setTransform(renderScale,0,0,renderScale,0,0);
let npc=0,run=false,paused=false,t=0,hp=10,ep=10,hpMax=10,epMax=10,energy=100,score=0,remaining=90,next=1,attack=null,counter=0,shake=0,flash=0,hit=0,punch=0,punchSide=-1,cool=0,msg='',msgTime=0,particles=[],keys={},pressed={},audio,muted=false,best=0;
const levels={easy:{gap:.26,perfect:.18},normal:{gap:.18,perfect:.12},hard:{gap:.13,perfect:.085}};
let difficulty='easy',impact=null,bodyDip=0,hurt=0,opening=0,sequence=0,enemyBlock=0,contact=null;
let reactionSide=1,reactionPower=0,papers=[],koPose=0,lastHitTarget='head';
let stop=0,ko=0,taunt='',tauntUntil=0,reduced=false;
let series={active:false,stage:0,total:0,seconds:0,stats:{},complete:false};
let combatTime=0,buffered=null,combo=[],comboIndex=0,comboNumber=0,tutorial=-1;let tutorialStartedAt=0;
$('#motion').onclick=()=>{reduced=!reduced;$('#motion').textContent=reduced?'움직임: 약하게':'움직임: 기본'};
function actionKeyFor(a){const lane=a.lane??a.side;return tutorial>=0?(lane<0?'A':lane>0?'D':'S'):(lane<0?'J':lane>0?'L':'K');}
const lessons=[
 {key:'KeyA',lane:-1,side:-1,mode:'hit',label:'선임: A로 왼쪽 얼굴을 쳐 봐. J도 같은 공격이야.'},
 {key:'KeyS',lane:0,side:1,mode:'hit',label:'선임: 이번엔 S로 가운데 스트레이트. K도 같아.'},
 {key:'KeyD',lane:1,side:1,mode:'hit',label:'선임: D로 오른쪽! L도 같은 공격이야.'},
 {key:'KeyA',lane:-1,side:-1,mode:'clash',label:'선임: 천천히 간다. 주먹이 멈추면 A 또는 J로 맞부딪쳐!'},
 {key:'ArrowDown',lane:0,side:1,mode:'evade',label:'선임: 주먹이 멈추면 ↓를 눌러 숙여 봐!'}
];
let trainingFinishAt=Infinity;
function nextLesson(){tutorial++;tutorialStartedAt=t;attack=null;next=t+.8;}
function finishTraining(){
 if(tutorial<0)return;
 tutorial=-1;const enabled=$('#training').checked;$('#training').checked=false;
 start();$('#training').checked=enabled;
}
function skipTutorial(){if(!run||paused||inDialogue())return;finishTraining();}
$('#skipTraining').onclick=skipTutorial;
function npcPunchDuration(index=npc){return .8-index*.003;}
function beginAttack(){
 if(npcIsGroggy()){next=Math.max(next,npcGroggyUntil);return;}
 if(tutorial>=0&&tutorial<lessons.length&&lessons[tutorial].mode==='hit'){next=Infinity;return;}
 if(tutorial>=0&&tutorial<lessons.length){attack={...lessons[tutorial],kind:'cross',start:t,duration:1.05,training:true,trainingHeld:false,trainingReleased:false};next=Infinity;return;}
 if(tutorial===lessons.length){next=Infinity;return;}
 if(!combo.length){comboNumber++;const patterns=patternForOpponent();combo=patterns[(comboNumber-1)%patterns.length].map(a=>({...a}));if(difficulty==='easy')combo=combo.slice(0,2);comboIndex=0;}
 const a=combo.shift(),styles=['jab','cross','hook','overhand'];
 if((crouchHeld()&&t-duckStartedAt>.45)||sequence%6>=4){a.body=true;a.lane=a.lane||((sequence%2)?1:-1);a.side=a.lane;}
 const motion=a.body?(sequence%2?'shovel':'uppercut'):styles[sequence%styles.length];
 npcGuard=null;
 const hand=a.side;
 attack={...a,side:hand,motion,aimX:playerX,kind:a.body?'body':comboIndex%2?'hook':'cross',start:t,duration:npcPunchDuration()*(comboIndex?.9:1)};comboIndex++;sequence++;next=Infinity;
}
function requestStrike(lane){
 if(!run||paused||inDialogue()||ko>0)return;
 if(cool>0){if(cool<=.055)buffered={lane,crouched:crouchStance(),clashAttack:clashTargetAtInput(),expires:t+.10};return;}
 strike(lane);
}
const cfg=()=>levels[difficulty];
$('#difficulty').onchange=e=>{if(!run){difficulty=e.target.value;hp=hpMax=playerHealthMax();}};
function grunt(){sound(65,.5);if(muted)return;try{const o=audio.createOscillator(),filter=audio.createBiquadFilter(),v=audio.createGain();o.type='sawtooth';o.frequency.setValueAtTime(135,audio.currentTime);o.frequency.exponentialRampToValueAtTime(48,audio.currentTime+.32);filter.type='lowpass';filter.frequency.value=420;v.gain.setValueAtTime(.001,audio.currentTime);v.gain.exponentialRampToValueAtTime(.18,audio.currentTime+.04);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.35);o.connect(filter).connect(v).connect(audio.destination);o.start();o.stop(audio.currentTime+.36)}catch{}}
const names=opponents.map(o=>o.name);function sound(f=90,p=.25){if(muted)return;try{audio??=new AudioContext();audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(30,audio.currentTime+.13);v.gain.setValueAtTime(p,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.connect(v).connect(audio.destination);o.start();o.stop(audio.currentTime+.2)}catch{}}
function say(s){msg=s;msgTime=1}function burst(x,y,color){for(let i=0;i<24;i++){let a=Math.random()*Math.PI*2;particles.push({x,y,vx:Math.cos(a)*(150+Math.random()*350),vy:Math.sin(a)*(150+Math.random()*350),life:.45,color})}}

function start(){
 resetMovement();resetTactics();roundStarted();combatTime=0;resetRound();$('#training').disabled=true;$('#game').focus?.();$('#resultScore').hidden=true;
 buffered=null;combo=[];comboIndex=comboNumber=0;tutorial=$('#training').checked&&(!series.active||series.stage===0)?0:-1;
 trainingFinishAt=Infinity;tutorialStartedAt=0;$('#skipTraining').hidden=tutorial<0;
 hp=hpMax=playerHealthMax();ep=epMax=opponentHealthMax(npc);energy=100;enemyBlock=0;contact=null;reactionPower=koPose=0;papers=[];stop=ko=0;taunt=opponents[npc].intro;tauntUntil=0;
 score=t=0;impact=null;bodyDip=hurt=opening=sequence=shake=hit=punch=flash=0;$('#difficulty').disabled=true;remaining=90;next=.35;counter=cool=0;attack=null;particles=[];keys={};pressed={};
 $('#name').textContent=tutorial>=0?trainingCoach.name:opponents[npc].name;
 if(tutorial>=0&&series.active)$('#seriesProgress').textContent='사전 연습 · 길잡이 선임 · 본 경기 100라운드와 별도';
 run=true;paused=false;$('#overlay').style.display='none';sound(350);say('FIGHT!');
}
function end(){
 buffered=null;combo=[];tutorial=-1;run=false;$('#difficulty').disabled=false;$('#training').disabled=false;
 $('#title').textContent=ep<=0?opponents[npc].win:hp<=0?'잠깐 쉬고, 다시 한 판.':'TIME UP · '+(ep/epMax<hp/hpMax?'판정승!':'다음엔 이길 수 있어요.');finishRound();$('#start').innerHTML='다시 도전 <span>SPACE</span>';$('#overlay').style.display='flex';roundFinished();
}
function pause(){
 if(!run||inDialogue())return;silenceEffects();paused=!paused;buffered=null;keys={};pressed={};$('#overlay').style.display=paused?'flex':'none';$('#title').textContent='잠시 숨 고르기';$('#desc').textContent='ESC 또는 아래 버튼으로 계속하세요.';$('#start').textContent='계속하기';
}
$('#start').onclick=()=>paused?pause():start();$('#pause').onclick=pause;
$('#sound').onclick=()=>{$('#sound').textContent=(muted=!muted)?'SOUND OFF':'SOUND ON';if(muted)silenceEffects();};
document.querySelectorAll('.pick').forEach(b=>b.onclick=()=>{if(!run)selectOpponent(+b.dataset.n);});
function strike(lane,stanceOverride,clashAttack=clashTargetAtInput()){
 if(inDialogue()||!run||paused||cool>0||ko>0)return;
 const crouched=stanceOverride??crouchStance(),kind=crouched?(lane===0?'uppercut':'body'):(lane===0?'straight':'cross');
 const hand=lane===0?(crouched?1:nextCenterHand):lane;
 if(lane===0&&!crouched)nextCenterHand=-nextCenterHand;
 const motion=kind==='uppercut'?'uppercut':crouched?'shovel':lane===0?(hand<0?'jab':'straight'):punchNumber%2?'hook':'cross';punchNumber++;
 const contactAt=motion==='uppercut'?.17:motion==='hook'||motion==='shovel'?.15:motion==='jab'?.10:.12,duration=contactAt+.13;
 cool=kind==='uppercut'?.25:punchSide===hand?.21:.18;punch=duration;punchSide=hand;
 if(swing&&swing.hand!==hand)handRecovery[swing.hand]={...swing,connected:true};
 delete handRecovery[hand];
 swing={lane,side:lane,hand,clashAttack,crouched,kind,motion,aimX:npcX,counter:counter>0,elapsed:0,duration,contactAt,connected:false,result:null};counter=0;
 notePlayerStrike(lane,kind==='body');
 impactSound('swing');
}
function resolveClash(s,a){
 s.elapsed=Math.max(s.elapsed,s.contactAt*.55);
 const reach=swingReach(s);
 s.connected=true;s.result='clash';s.clashAt=s.elapsed;s.clashReach=reach;s.duration=Math.max(s.duration,s.elapsed+.10);
 contact=null;particles=[];hit=hurt=bodyDip=flash=0;stop=.018;shake=3;impactSound('guard');
 finishEnemyAction(a,'clash');say('방어 성공');
}
function finishEnemyAction(a,outcome){
 if(attack!==a)return;
 impact={...a,recoilPhase:Math.max(0,Math.min(1,(t-a.start)/a.duration)),life:.20,clashed:outcome==='clash',dodged:outcome==='evade'};attack=null;
 if(outcome==='clash'){
  roundStats.guards++;const precise=Math.abs(a.duration-(t-a.start))<.045;if(precise)roundStats.perfects++;
  score+=precise?80:40;opening=.48;
 }else if(outcome==='evade'){
  roundStats.dodges++;score+=60;const timely=(duckIsActive()&&t-duckStartedAt<=.32)||(weaveEvades(a)&&t-weaveStartedAt<=.32);counter=timely?.60:0;opening=.55;
  impactSound('swing');say(timely?'회피 성공 · 카운터!':'회피');
 }else{
  roundStats.taken++;if(tutorial<0)hp=Math.max(0,hp-1);
  shake=a.body?10:20;hurt=.32;if(a.body){bodyDip=.5;grunt();say('복부 피격!');}else{impactSound('hurt');say('HIT!');}
  opening=.15;combo=[];
 }
 if(tutorial>=0&&tutorial<lessons.length){const mode=lessons[tutorial].mode;if(mode==='clash'&&outcome==='clash'||mode==='evade'&&outcome==='evade')nextLesson();combo=[];}
 next=t+(combo.length?(difficulty==='easy'?.18:.12):Math.max(opening,cfg().gap));
 if(tutorial<0&&!a.counter&&++npcActions%(difficulty==='easy'?4:3)===0){combo=[];beginNPCGuard(repeatedLane??0,repeatedHeight);}
 if(tutorial===lessons.length){tutorialStartedAt=t;next=Infinity;}
 if(hp<=0)end();
}
function resolvePlayerStrike(s){
 let critical=s.counter||counter>0;
 // A crouched punch can pass below a committed head strike, then counter the exposed opponent.
 if(attack&&!attack.body&&s.crouched&&duckIsActive()&&(t-attack.start)/attack.duration>=.55){
  finishEnemyAction(attack,'evade');critical=critical||counter>0;
 }
 s.counter=critical;counter=0;s.result='hit';
 if(tutorial<0&&s.kind!=='body'&&!critical&&opening<=0&&Math.abs(npcX)>28){s.result='miss';roundStats.misses++;say('NPC 위빙 · 복부가 빈다');return;}
 if(npcBlocks(s)){
  s.result='blocked';roundStats.blocked++;enemyBlock=.22;contact=null;particles=[];hit=0;impactSound('guard');
  if(npcIsGroggy()){npcGuard.until=npcGroggyUntil;next=npcGroggyUntil;say('그로기 · NPC 방어');}
  else{npcCounterAt=t+.26;npcGuard.until=npcCounterAt;next=npcCounterAt;say('NPC 방어 · 카운터 준비!');}return;
 }
 if(npcGuard){npcGuard=null;npcCounterAt=Infinity;next=t+.45;}
 const practice=tutorial>=0;
 const base=s.kind==='uppercut'?10:s.crouched?7:s.lane===0?8:6;
 const scoreDamage=opening>0?Math.round(base*1.5):base;
 const damage=practice?0:1;
 if(tutorial===lessons.length&&s.kind==='uppercut')trainingFinishAt=Math.min(trainingFinishAt,t+.5);
 ep=Math.max(0,ep-damage);if(!practice){roundStats.hits++;if(critical)roundStats.counters++;score+=critical?300:scoreDamage*10;}
 stop=practice?.012:critical?.065:.035;lastHitTarget=s.kind==='uppercut'?'chin':s.crouched?'body':'head';
 reactionSide=s.lane||s.hand;reactionSide=-reactionSide;reactionPower=critical?1.25:.8;hit=critical?.36:.24;shake=critical?18:8;
 contact={x:500+opponentScreenX()+s.lane*62,y:s.kind==='uppercut'?263:s.crouched?410:226,life:critical?.28:.15,strong:critical,guarded:false};
 impactSound(critical?'counter':'punch');if(damage)burst(contact.x,contact.y,critical?'#c8b58e':'#ddd5be');
 if(practice&&tutorial<lessons.length&&lessons[tutorial].mode==='hit'&&s.lane===lessons[tutorial].lane&&!s.crouched)nextLesson();
 say(practice?'선임: 좋아, 방금 그 감각이야!':critical?'COUNTER!':({jab:'JAB',straight:'STRAIGHT',cross:'CROSS',hook:'HOOK',shovel:'BODY HOOK',uppercut:'UPPERCUT'}[s.motion]||'HIT'));
 if(critical&&!practice&&ep>0)beginNPCGroggy();
 if(npcIsGroggy())next=Math.max(next,npcGroggyUntil);
 if(ep<=0){impactSound('ko');ko=2;koPose=0;attack=null;impact=null;combo=[];keys={};papers=Array.from({length:16},(_,i)=>({x:500,y:300,vx:(i-7.5)*65,vy:-160-Math.random()*230,angle:Math.random()*6}));say('K.O. '+opponents[npc].win);}
}
const punchKeys={KeyJ:-1,KeyK:0,KeyL:1,KeyA:-1,KeyS:0,KeyD:1};
function handleKeyDown(e){
 if(typeof settingsIsOpen==='function'&&settingsIsOpen())return;
 if(e.ctrlKey||e.altKey||e.metaKey)return;if(inDialogue()){dialogueKey(e);return;}
 if((e.target?.isContentEditable||['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName))&&e.code!=='Escape')return;
 if(['Enter','Space'].includes(e.code)&&e.target?.tagName==='BUTTON')return;
 if(!Object.hasOwn(punchKeys,e.code)&&!['ArrowLeft','ArrowRight','ArrowDown','Enter','Escape','Space'].includes(e.code))return;
 e.preventDefault();if(e.repeat)return;
 if(e.code==='Escape'){pause();return;}if(e.code==='Enter'||e.code==='Space'){if(paused)pause();else if(!run)startAction();return;}
 if(!run||paused||ko>0)return;
 if(e.code==='ArrowDown'){beginDuck();return;}
 if(e.code==='ArrowLeft'||e.code==='ArrowRight'){beginWeave(e.code);return;}
 if(e.code==='Space')return;
 keys[e.code]=true;pressed[e.code]=t;requestStrike(punchKeys[e.code]);
}
addEventListener('keydown',handleKeyDown);addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{if(run&&!paused&&!inDialogue())pause();});
document.addEventListener?.('visibilitychange',()=>{if(document.hidden&&run&&!paused)pause();});
function ellipse(x,y,rx,ry,col){g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}
function rect(x,y,w,h,col){g.fillStyle=col;g.fillRect(x,y,w,h);}
function text(s,x,y,size,col){g.fillStyle=col;g.font=`900 ${size}px sans-serif`;g.textAlign='center';g.fillText(s,x,y);}
function guideTrainingAttack(dt){
 const a=attack,lesson=lessons[tutorial];
 if(tutorial<0||!a?.training||a.trainingReleased||!['clash','evade'].includes(lesson?.mode))return;
 if(a.trainingHeld){
  // Only the NPC's clock waits. Player punches, cooldown and crouching keep moving.
  if(lesson.mode==='evade'&&duckIsActive()){a.trainingHeld=false;a.trainingReleased=true;}
  else a.start+=dt;
 }else{
  a.start+=dt*.65;
  const holdAt=a.duration-Math.min(.16,clashWindow()*.7);
  if(t-a.start>=holdAt){a.start=t-holdAt;a.trainingHeld=true;a.trainingHeldAt=t;}
 }
}
function update(dt){
 if(ko>0){koPose=Math.min(1,koPose+dt/1.4);ko-=dt;if(ko<=0)end();return;}
 if(stop>0){stop=Math.max(0,stop-dt);return;}
 t+=dt;if(tutorial>=0&&t>=trainingFinishAt){finishTraining();return;}$('#skipTraining').hidden=tutorial<0;if(tutorial<0){combatTime+=dt;if(difficulty!=='easy')remaining-=dt;}
 guideTrainingAttack(dt);
 cool=Math.max(0,cool-dt);counter=Math.max(0,counter-dt);opening=Math.max(0,opening-dt);tickTactics(dt);tickMovement(dt);if(stop>0||ko>0)return;
 if(buffered){if(t>buffered.expires)buffered=null;else if(cool<=0){const input=buffered;buffered=null;strike(input.lane,input.crouched,input.clashAttack);}}
 if(!attack&&t>next)beginAttack();
 if(attack&&t-attack.start>=attack.duration)finishEnemyAction(attack,enemyEvaded(attack)?'evade':'hit');
 if(remaining<=0)end();
}
function drawThreat(){
 if(inDialogue()||koPose>0)return;
 const comicArms=typeof coach2D!=='undefined'&&coach2D.ready&&(tutorial>=0||(typeof fighters2D!=='undefined'&&fighters2D.ready));
 if(!comicArms&&!(typeof human3D!=='undefined'&&human3D.active))for(const side of [-1,1]){
  if(attack?.side===side)drawEnemyArm(attack,Math.min(1,(t-attack.start)/attack.duration));
  else if(impact?.side===side)drawEnemyArm(impact,1,Math.max(0,impact.life/.20));
  else drawEnemyArm({side,lane:side,body:false,kind:'idle'},0);
 }
 if(!attack)return;
 const guideFist=tutorial>=0&&coach2D.ready?coach2D.lastPose.find(p=>p.side===attack.side):null;
 const x=guideFist?guideFist.center.x:500+(attack.lane??attack.side)*260,y=guideFist?guideFist.center.y:attack.body?460:275;
 const zone=defenseTiming(attack),ready=tutorial>=0&&attack.training?!!attack.trainingHeld:zone.inside;
 // Only this annulus is a defense zone; its center stays empty.
 g.beginPath();g.arc(x,y,zone.outer,0,Math.PI*2);g.moveTo(x+zone.inner,y);g.arc(x,y,zone.inner,0,Math.PI*2,true);
 g.fillStyle=ready?'#e5d29c55':'#d4bd8a28';g.fill('evenodd');
 g.strokeStyle=ready?'#e5d29c':'#a89a7b99';g.lineWidth=2;g.stroke();
 g.beginPath();g.arc(x,y,Math.max(0,zone.radius),0,Math.PI*2);g.strokeStyle=ready?'#fff1bd':'#bec9cb';g.lineWidth=3;g.stroke();
 if(tutorial<0&&difficulty!=='hard')text((attack.body?'↓ + ':'')+actionKeyFor(attack)+' 펀치',x,y-80,17,'#ded8c5');
 if(tutorial<0&&difficulty==='easy')text(ready?'지금 같은 방향!':'상대 주먹을 보고 펀치',500,113,19,'#d9ccb0');
}
let last=0;function frame(now){let dt=Math.max(0,Math.min((now-last)/1000,.04));last=now;const frozen=stop>0;if(inDialogue())tickDialogue(dt);if(run&&!paused&&!inDialogue())update(dt);if(!paused&&!frozen){enemyBlock=Math.max(0,enemyBlock-dt);if(contact){contact.life-=dt;if(contact.life<=0)contact=null;}papers.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;p.angle+=dt*2});shake*=Math.exp(-dt*13);bodyDip=Math.max(0,bodyDip-dt);hurt=Math.max(0,hurt-dt);if(impact){impact.life-=dt;if(impact.life<=0)impact=null;}hit=Math.max(0,hit-dt);punch=Math.max(0,punch-dt);flash-=dt;msgTime-=dt;particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt});particles=particles.filter(p=>p.life>0)}g.save();rect(0,0,1000,590,'#202a25');const dip=reduced?0:Math.sin(Math.PI*(bodyDip/.6));g.translate(500,295);g.rotate((!reduced&&hurt>0&&!bodyDip?Math.sin(hurt*26)*.025:0)+(reduced?0:playerX*.00065));g.scale(1+dip*.06+Math.abs(playerX)*.0012,1+dip*.06+Math.abs(playerX)*.0012);g.translate(-500-playerX*.22,-295+Math.abs(playerX)*.05-dip*105-(reduced?duckAmount*20:duckAmount*100));g.translate((Math.random()-.5)*(reduced?0:shake),(Math.random()-.5)*(reduced?0:shake));if(!drawOfficeBackdrop()){rect(0,0,1000,590,'#202a25');for(let i=0;i<9;i++){rect(i*130,40,3,310,'#344039');rect(i*130+15,100,95,160,'#17211d');for(let j=0;j<4;j++)rect(i*130+25,120+j*32,65,8,'#2c3830')}text('OFFICE RING',500,148,25,'#82916b');rect(0,380,1000,210,'#394332');for(let y of []){rect(0,y,1000,7,'#101a15');rect(0,y,1000,3,'#798368')}officeDetails();}ellipse(500,537,190,27,'#15201966');g.save();g.translate(opponentScreenX(),0);drawOpponent();g.restore();if(typeof drawStoryPortrait==='function')drawStoryPortrait(c);g.save();g.translate(opponentScreenX(),0);drawThreat();g.restore();drawPlayerHands();drawFootwork();if(!inDialogue()){particles.forEach(p=>rect(p.x,p.y,6,6,p.color));drawContact();}g.restore();g.save();if(!inDialogue()){if(hurt>0){g.strokeStyle=`rgba(255,65,35,${hurt})`;g.lineWidth=40;g.strokeRect(0,0,1000,590);}rect(340,568,320,5,'#171d13');rect(340,568,320*Math.min(1,Math.max(0,opening)),5,'#c8b58e');if(tutorial<0)text(opening>0?'공격 기회 · J / K / L':'J / K / L 펀치 · ↓ 숙이기',500,555,13,'#c8b58e');papers.forEach(p=>{g.save();g.translate(p.x,p.y);g.rotate(p.angle);rect(-16,-21,32,42,'#e7e8d6');rect(-10,-10,20,2,'#777f6a');rect(-10,-3,17,2,'#777f6a');g.restore()});if(msgTime>0&&tutorial<0)text(msg,500,450,msg==='COUNTER!'?32:21,'#dfcfac');if(counter>0&&tutorial<0)text('COUNTER · J / K / L',500,185,22,'#c8b58e');if(run&&tutorial>=0){if(typeof drawTrainingSpotlight==='function')drawTrainingSpotlight();rect(150,485,700,42,'#172019');text(tutorial<lessons.length?lessons[tutorial].label:'선임: 마지막! ↓를 누른 채 S 어퍼컷을 내게 맞혀 봐.',500,512,18,'#dfcfac');}else if(run&&difficulty==='easy'&&attack&&combo.length){text('받아칠 펀치: '+[attack,...combo].map(a=>(a.body?'↓+':'')+actionKeyFor(a)).join(' → '),500,480,20,'#ffffff');}if(flash>0)rect(0,0,1000,590,'#ffffff66');}g.restore();if(typeof syncTouchLesson==='function')syncTouchLesson();$('#hp').value=hp;$('#ep').value=ep;syncHealthHUD();$('#clock').textContent=difficulty==='easy'?'∞':Math.max(0,Math.ceil(remaining));$('#score').textContent=score;$('#contextHint').hidden=run&&tutorial>=0;$('#contextHint').textContent=crouchStance()?'복부 J/L · 어퍼컷 K':'펀치 J/K/L · 글러브 충돌로 받아치기';$('#status').textContent=paused?'PAUSED':run?(tutorial>=0?'선임과 연습':typeof companyDuelMode!=='undefined'&&companyDuelMode?'DUEL MODE · ROUND '+String(npc+1).padStart(2,'0'):'LIVE · ROUND 01'):'READY TO FIGHT';requestAnimationFrame(frame)}requestAnimationFrame(frame);

function playerHealthMax(){return 10+['easy','normal','hard'].indexOf(difficulty);}
function syncHealthHUD(){
 for(const [id,value,max] of [['hp',hp,hpMax],['ep',ep,epMax]]){
  $('#'+id).max=max;$('#'+id+'Text').textContent=value+' / '+max;
  const bar=$('#'+id+'Segments'),stamp=value+':'+max;
  if(bar.healthStamp===stamp)continue;
  bar.healthStamp=stamp;bar.innerHTML=Array.from({length:max},(_,i)=>'<span class="'+(i<value?'filled':'empty')+'"></span>').join('');
  bar.setAttribute?.('aria-valuemax',max);bar.setAttribute?.('aria-valuenow',value);
 }
}
