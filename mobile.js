const touchPointers=new Map();
function releaseTouches(){
 for(const {code,button} of touchPointers.values()){keys[code]=false;button.classList.remove('held');}
 touchPointers.clear();
}
const touchControls=document.createElement('div');touchControls.id='touchControls';
touchControls.innerHTML='<div class="touchAttacks"><button data-key="KeyJ" aria-label="왼쪽 공격">좌 공격</button><button data-key="KeyK">중 공격</button><button data-key="KeyL">우 공격</button></div><div class="touchMovement"><button data-key="ArrowLeft">← 회피</button><button data-key="ArrowDown">↓ 숙이기</button><button data-key="ArrowRight">회피 →</button></div>';
$('.arena').append(touchControls);syncComicModal();
for(const button of touchControls.querySelectorAll('button')){
 button.addEventListener('pointerdown',e=>{
  e.preventDefault();if(!run||paused||inDialogue()||settingsIsOpen())return;
  button.setPointerCapture(e.pointerId);const code=button.dataset.key;
  const held=[...touchPointers.values()].some(p=>p.code===code);touchPointers.set(e.pointerId,{code,button});button.classList.add('held');
  if(!held)handleKeyDown({code,target:$('#game'),preventDefault(){}});
 });
 const release=e=>{const item=touchPointers.get(e.pointerId);if(!item)return;touchPointers.delete(e.pointerId);if(![...touchPointers.values()].some(p=>p.code===item.code)){keys[item.code]=false;item.button.classList.remove('held');}};
 for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,release);
 button.addEventListener('contextmenu',e=>e.preventDefault());
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
const touchGuide=document.createElement('p');touchGuide.textContent='터치: 왼쪽 좌/중/우 공격 · 오른쪽 위빙/숙이기. 숙이기를 누르며 좌/우 공격은 복부, 중 공격은 어퍼컷. 버튼을 길게 눌러도 자동 공격하지 않습니다.';$('.guide').append(touchGuide);
