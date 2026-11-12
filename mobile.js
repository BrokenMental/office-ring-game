const touchPointers=new Map();
let touchLane=0;
const touchControls=document.createElement('div');touchControls.id='touchControls';
touchControls.innerHTML='<div class="touchMovement" role="group" aria-label="Direction">'+[-1,0,1,-1,0,1].map((lane,i)=>'<button data-lane="'+lane+'" data-low="'+(i>=3?1:0)+'">'+['\u2190 \uc88c','\u25cf \uc911','\uc6b0 \u2192','\u2199 \uc88c\ud558','\u2193 \uc911\ud558','\uc6b0\ud558 \u2198'][i]+'</button>').join('')+'</div><div class="touchAttacks"><button id="touchStrike">타격</button></div>';
$('.arena').append(touchControls);syncComicModal();
function setTouchDirection(button){
 const oldDirection=Number(!!keys.ArrowRight)-Number(!!keys.ArrowLeft);
 const oldDuck=crouchHeld();
 touchLane=button?Number(button.dataset.lane):0;
 for(const code of ['ArrowLeft','ArrowRight','ArrowDown'])keys[code]=false;
 if(button){if(touchLane){keys[touchLane<0?'ArrowLeft':'ArrowRight']=true;if(touchLane!==oldDirection)weaveStartedAt=t;}keys.ArrowDown=button.dataset.low==='1';}
 if(keys.ArrowDown&&!oldDuck)duckStartedAt=t;
 for(const b of touchControls.querySelectorAll('[data-lane]'))b.classList.toggle('held',b===button);
}
function releaseTouches(){
 for(const code of ['ArrowLeft','ArrowRight','ArrowDown','KeyJ','KeyK','KeyL'])keys[code]=false;
 touchPointers.clear();setTouchDirection(null);
 for(const b of touchControls.querySelectorAll('button'))b.classList.remove('held');
}
const directionPad=touchControls.querySelector('.touchMovement'),strikeButton=$('#touchStrike');
const canTouch=()=>run&&!paused&&!inDialogue()&&!settingsIsOpen();
directionPad.addEventListener('pointerdown',e=>{
 e.preventDefault();if(!canTouch()||[...touchPointers.values()].includes('direction'))return;
 directionPad.setPointerCapture(e.pointerId);touchPointers.set(e.pointerId,'direction');
 setTouchDirection(e.target.closest('[data-lane]'));
});
directionPad.addEventListener('pointermove',e=>{
 if(touchPointers.get(e.pointerId)!=='direction')return;e.preventDefault();
 const b=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-lane]');
 setTouchDirection(b&&directionPad.contains(b)?b:null);
});
strikeButton.addEventListener('pointerdown',e=>{
 e.preventDefault();if(!canTouch()||[...touchPointers.values()].includes('strike'))return;
 strikeButton.setPointerCapture(e.pointerId);touchPointers.set(e.pointerId,'strike');strikeButton.classList.add('held');
 const code=touchLane<0?'KeyJ':touchLane>0?'KeyL':'KeyK';
 handleKeyDown({code,target:$('#game'),preventDefault(){}});keys[code]=false;
});
for(const element of [directionPad,strikeButton]){
 for(const name of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(name,e=>{
  const kind=touchPointers.get(e.pointerId);touchPointers.delete(e.pointerId);
  if(kind==='direction')setTouchDirection(null);if(kind==='strike')strikeButton.classList.remove('held');
 });element.addEventListener('contextmenu',e=>e.preventDefault());
}
function syncTouchLesson(){
 const active=run&&tutorial>=0,lesson=lessons[tutorial],lane=lesson?.lane??0,low=tutorial===lessons.length||lesson?.mode==='evade';
 const ready=active&&(!['clash','evade'].includes(lesson?.mode)||!!attack?.trainingHeld);
 for(const b of directionPad.querySelectorAll('button')){
  const target=active&&Number(b.dataset.lane)===lane&&(b.dataset.low==='1')===low;
  b.classList.toggle('lessonDim',active&&!target);b.classList.toggle('lessonTarget',target);b.classList.toggle('lessonReady',target&&ready);
 }
 strikeButton.classList.toggle('lessonDim',active&&lesson?.mode==='evade');
 strikeButton.classList.toggle('lessonTarget',active&&lesson?.mode!=='evade');strikeButton.classList.toggle('lessonReady',ready&&lesson?.mode!=='evade');
}
addEventListener('blur',releaseTouches);addEventListener('resize',releaseTouches);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseTouches();});
const mobilePause=pause;pause=()=>{releaseTouches();mobilePause();};
const mobileStart=start;start=()=>{releaseTouches();mobileStart();};
const mobileEnd=end;end=()=>{releaseTouches();mobileEnd();};
const fullscreenButton=$('#fullscreen');
function syncFullscreen(){fullscreenButton.textContent=document.fullscreenElement?'전체화면 해제':document.fullscreenEnabled?'전체화면':'화면 확대';}
fullscreenButton.onclick=async()=>{
 try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.fullscreenEnabled)await document.documentElement.requestFullscreen();else toggleFocus();}
 catch{toggleFocus();fullscreenButton.textContent='화면 확대 · 전체화면 불가';}
};document.addEventListener('fullscreenchange',()=>{releaseTouches();syncFullscreen();});syncFullscreen();
const touchGuide=document.createElement('p');touchGuide.textContent='터치: 왼쪽 패드로 방향·위빙·숙이기 선택, 오른쪽 타격. 아래 가운데+타격은 어퍼컷. 손을 떼면 가운데 선 자세로 복귀합니다.';$('.guide').append(touchGuide);

function drawTrainingSpotlight(){
 if(!run||tutorial<0)return;
 const lesson=lessons[tutorial],lane=lesson?.lane??0,evade=lesson?.mode==='evade',defense=['clash','evade'].includes(lesson?.mode);
 const ready=defense&&!!attack?.trainingHeld,color=defense&&!ready?'#e8c58c':'#f5e4a6';
 const hand=swing?.hand??(lane||1),pose=playerHandPose(hand);
 const opponent=attack&&coach2D.ready?coach2D.lastPose.find(p=>p.side===attack.side):null;
 const focus=defense&&opponent?{x:opponent.center.x+opponentScreenX(),y:opponent.center.y,rx:opponent.size*.8,ry:opponent.size*.9}:{x:500+lane*62,y:tutorial===lessons.length?262:evade?360:226,rx:evade?185:95,ry:evade?150:100};
 const holes=[focus];if(!evade)holes.push({x:pose.x,y:pose.y,rx:135,ry:125});
 g.save();
 // Separate exclusion clips keep overlapping spotlights bright.
 for(const hole of holes){g.beginPath();g.rect(0,0,1000,590);g.ellipse(hole.x,hole.y,hole.rx,hole.ry,0,0,Math.PI*2);g.clip('evenodd');}
 g.fillStyle='#0009';g.fillRect(0,0,1000,590);g.restore();
 g.save();g.strokeStyle=color;g.lineWidth=ready?5:2;g.beginPath();g.ellipse(focus.x,focus.y,focus.rx,focus.ry,0,0,Math.PI*2);g.stroke();g.restore();
 const mobile=matchMedia('(pointer:coarse), (max-width:900px)').matches;
 const input=tutorial===lessons.length?(mobile?['중하','타격']:['↓','S / K']):evade?(mobile?['중하 ↓']:['↓']):(mobile?[['좌','중','우'][lane+1],'타격']:[['A / J','S / K','D / L'][lane+1]]);
 const heading=defense?(ready?'지금 누르세요 · 주먹이 기다립니다':attack?.trainingReleased?'좋아요 · 숙인 자세 유지':'주먹이 천천히 다가옵니다'):'강조된 곳을 이 키로 공격하세요';
 text(heading,500,110,23,color);
 const width=input.length===1?190:142,gap=26,total=input.length*width+(input.length-1)*gap,left=500-total/2;
 for(let i=0;i<input.length;i++){
  const x=left+i*(width+gap);g.save();
  g.shadowColor=color;g.shadowBlur=reduced?0:ready?18:8;g.fillStyle=ready?'#f5e4a6':'#14232bef';g.fillRect(x,423,width,49);g.shadowBlur=0;
  g.strokeStyle=color;g.lineWidth=ready?4:2;g.strokeRect(x,423,width,49);text(input[i],x+width/2,459,32,ready?'#172127':'#fff4d5');g.restore();
  if(i)text('+',x-gap/2,457,25,color);
 }
}
