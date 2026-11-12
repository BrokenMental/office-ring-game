let prologue={active:false,index:0,seen:false,launch:false,alarmPlayed:false};
let companyDuelMode=false;
let dialogue={active:false,index:0,revealed:0,lines:[]};
let introEnabled=true;
const seenIntros=new Set();
// Character-specific origin art for the first twelve opponents; later opponents use contextual art.
const storyIllustrations={0:{2:{src:'assets/story/peer-origin-v2.png',characterId:'peer-0',alt:'입사 첫날 실수한 동료를 보고, 그를 흉내 내 임원의 칭찬을 얻은 깐족왕 동기의 과거 세 장면'}},1:{0:{src:'assets/story/messenger-origin.png',characterId:'peer-1',alt:'메신저 답장이 늦어 질책받은 수습 동기가 알림 감시에 매달리게 된 과거 세 장면'}},2:{0:{src:'assets/story/credit-origin-v2.png',characterId:'peer-2',alt:'공동 보고서에서 이름이 빠진 동기가 남의 공로까지 가져가게 된 과거 세 장면'}},3:{0:{src:'assets/story/dinner-friendship.png',characterId:'peer-3',alt:'술자리를 함께 나와 편의점에서 이야기하고 다음 날 서로 일을 돕는 회식 동기와 주인공의 친했던 시절'},2:{src:'assets/story/dinner-origin-v2.png',characterId:'peer-3',alt:'거래처 회식에서 노래로 칭찬받은 갈색 후드 동기가, 자신을 응원하던 안경 없는 주인공에게 술을 강요하게 된 세 장면'}},4:{0:{src:'assets/story/delegation-origin.png',characterId:'peer-4',alt:'아픈 동료를 돕던 녹색 셔츠의 동기가 고마움을 이용해 남에게 일을 떠넘기게 된 과거 세 장면'}},5:{0:{src:'assets/story/gossip-origin.png',characterId:'peer-5',alt:'자주색 폴로와 금색 고리를 한 동기가 탕비실에서 들은 정보를 소문으로 거래하게 된 과거 세 장면'}},6:{0:{src:'assets/story/revision-origin.png',characterId:'peer-6',alt:'오탈자 하나로 질책받은 회녹색 후드의 동기가 남의 완성본까지 끝없이 수정하게 된 과거 세 장면'}},7:{0:{src:'assets/story/blame-origin.png',characterId:'peer-7',alt:'구두 지시를 따랐다 혼자 징계받은 동기가 자기 지시도 부인하게 된 과거 세 장면'}}};
storyIllustrations[8]={0:{src:'assets/story/rules-origin.png',characterId:'peer-8',alt:'교통비 문제를 함께 풀던 사각 안경의 동기가 상사의 예외 승인을 보고 자기에게만 예외를 적용하게 된 세 장면'}};
storyIllustrations[9]={0:{src:'assets/story/watch-origin.png',characterId:'peer-9',alt:'같이 퇴근하던 회갈색 후드와 작은 콧수염의 동기가 평가에 상처받은 뒤 주인공의 퇴근까지 막게 된 세 장면'}};
storyIllustrations[10]={0:{src:'assets/story/senior-dinner-origin.png',characterId:'senior-10',alt:'회의에서 주인공의 발언을 돕던 회갈색 폴로의 선임이 회식 뒤 예산 승인을 받고 식사 참석을 기획안 검토의 조건으로 삼게 된 세 장면'}};
storyIllustrations[11]={0:{src:'assets/story/senior-delegation-origin.png',characterId:'senior-11',alt:'첫 고객 방문을 돕던 녹색 셔츠의 영업 선임이 항의 대응을 주인공에게 맡기고 교육이라는 말로 고객 지원을 떠넘기는 세 장면'}};
for(const [index,beats] of Object.entries(storyIllustrations))opponents[+index].storyComicReady=Object.values(beats).length>0;
const failedStoryImages=new Set();
const dialogueArt={
 records:{src:'assets/story/office-records.png',alt:'야근 책상·회의 기록·빈 회의실의 상황 만화'},
 broadcast:{src:'assets/opening/company-alarm.png',alt:'붉은 경보등과 사내 스피커로 대결 모드에 들어간 회사'},
 hero:{src:'assets/opening/panel-3-v2.png',alt:'계약서의 조항대로 대결을 결심한 주인공'},
 coach:{src:'assets/opening/panel-5-v2.png',alt:'주인공에게 주먹 쓰는 법을 알려주는 선임'},
 fallback:{src:'assets/backgrounds/office-night.png',alt:'대사가 이어지는 사무실 상황 삽화'}
};
function dialogueIllustration(){
 if(tutorial>=0)return dialogueArt.coach;
 const speaker=dialogue.lines[dialogue.index][0];
 if(speaker==='사내 방송')return dialogueArt.broadcast;
 if(speaker==='나')return dialogueArt.hero;
 const beats=storyIllustrations[npc]||{},previous=Object.keys(beats).map(Number).filter(index=>index<=dialogue.index).sort((a,b)=>b-a)[0];
 return beats[previous]||Object.values(beats)[0]||dialogueArt.records;
}

const scenes=opponents.map(o=>[
 ...(o.history.beats||[o.history.origin,o.history.change,o.history.incident]).map(line=>['나레이션',line]),
 [o.name,o.intro],['나',o.reply]
]);
// Keep the comic proportions while making the rest of the page non-interactive.
const comicInertState=new Map();
function activeComicScene(){return prologue.active?$('#openingScene'):dialogue.active?$('#dialogueScene'):null;}
function syncComicModal(){
 const scene=activeComicScene();$('#comicBackdrop').hidden=!scene;document.body.classList.toggle('comic-modal',!!scene);
 for(const element of document.querySelectorAll('header,main>footer,.hud,.arenafooter,#game,#overlay,#touchControls')){
  if(scene){if(!comicInertState.has(element))comicInertState.set(element,element.inert);element.inert=true;}
 }
 if(!scene){for(const [element,inert] of comicInertState)element.inert=inert;comicInertState.clear();}
}
for(const type of ['pointerdown','wheel'])$('#comicBackdrop').addEventListener?.(type,e=>{e.preventDefault();e.stopPropagation();},{passive:false});
$('#comicBackdrop').addEventListener?.('click',e=>{e.preventDefault();e.stopPropagation();if(typeof settingsIsOpen==='function'&&settingsIsOpen())return;if(prologue.active)advanceOpening();else if(dialogue.active)advanceDialogue();});
addEventListener('keydown',e=>{
 const scene=activeComicScene();if(!scene||e.code!=='Tab'||(typeof settingsIsOpen==='function'&&settingsIsOpen()))return;
 const buttons=[...scene.querySelectorAll('button')].filter(button=>!button.hidden&&!button.disabled);if(!buttons.length)return;
 e.preventDefault();const index=buttons.indexOf(document.activeElement);buttons[index<0?(e.shiftKey?buttons.length-1:0):(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();
});
document.addEventListener?.('focusin',e=>{
 const scene=activeComicScene();if(!scene||(typeof settingsIsOpen==='function'&&settingsIsOpen())||scene.contains(e.target))return;
 scene.querySelector('button')?.focus();
});
function renderDialogue(){
 syncComicModal();
 const [speaker,line]=dialogue.lines[dialogue.index];
 $('#dialogueSpeaker').textContent=speaker;$('#dialogueText').textContent=line.slice(0,Math.floor(dialogue.revealed));
 $('#dialogueCount').textContent=`${dialogue.index+1} / ${dialogue.lines.length}`;
 $('#storyChapter').hidden=true;
 const candidate=dialogueIllustration(),art=failedStoryImages.has(candidate.src)?(failedStoryImages.has(dialogueArt.records.src)?dialogueArt.fallback:dialogueArt.records):candidate,comic=$('#storyComic');
 comic.hidden=false;$('.arena').classList.add('story-comic');
 const img=$('#storyComicImage');if(!img.src?.endsWith(art.src))img.src=art.src;img.alt=art.alt;
 img.onerror=()=>{if(art===dialogueArt.fallback){img.onerror=null;return;}failedStoryImages.add(art.src);renderDialogue();};

}
function beginDialogue(){
 dialogue={active:true,index:0,revealed:0,lines:tutorial>=0?[[trainingCoach.name,trainingCoach.intro],['길잡이 선임','설명은 짧게 하자. 왼쪽부터 A/S/D로 나를 직접 때려 봐. J/K/L도 같은 공격이야. 다음 동작은 하나씩 알려줄게.']]:scenes[npc]};
 keys={};buffered=null;tauntUntil=0;msgTime=0;$('#dialogueScene').hidden=false;$('#overlay').style.display='none';
 $('#storyName').textContent=tutorial>=0?trainingCoach.name:opponents[npc].name;
 $('#storyAppearance').textContent=tutorial>=0?appearanceOf(activeOpponentLook()):opponents[npc].appearance;
 if(tutorial<0&&typeof Image!=='undefined')for(const art of Object.values(storyIllustrations[npc]||{})){const preload=new Image();preload.src=art.src;}
 $('.arena').classList.add('dialogue-scene');renderDialogue();$('#dialogueScene').focus?.();
}
function finishDialogue(){
 if(!dialogue.active)return;
 dialogue.active=false;syncComicModal();seenIntros.add(tutorial>=0?'coach':npc);$('#dialogueScene').hidden=true;$('.arena').classList.remove('dialogue-scene');
 $('#storyComic').hidden=true;$('.arena').classList.remove('story-comic');
 keys={};pressed={};buffered=null;t=0;next=.35;msgTime=0;say('대결 시작');sound(260,.12);$('#game').focus?.();
}
function advanceDialogue(){
 if(!dialogue.active)return;
 const line=dialogue.lines[dialogue.index][1];
 if(dialogue.revealed<line.length){dialogue.revealed=line.length;renderDialogue();return;}
 if(dialogue.index<dialogue.lines.length-1){dialogue.index++;dialogue.revealed=0;renderDialogue();}else finishDialogue();
}
function tickDialogue(dt){if(paused||prologue.active)return;if(dialogue.active){dialogue.revealed=Math.min(dialogue.lines[dialogue.index][1].length,dialogue.revealed+dt*34);renderDialogue();}}
function dialogueKey(e){
 if(e.code==='Enter'){e.preventDefault();return;}
 if(prologue.active){if(!e.repeat&&['Space','Escape'].includes(e.code)){e.preventDefault();e.code==='Escape'?finishOpening():advanceOpening();}return;}
 if(e.repeat)return;
 if(!['Space','Escape'].includes(e.code))return;
 if(e.target?.tagName==='BUTTON'&&e.code!=='Escape')return;
 e.preventDefault();if(e.code==='Escape')finishDialogue();else advanceDialogue();
}
function continueIntro(){if(introEnabled&&(tutorial<0||!seenIntros.has('coach')))beginDialogue();}
function drawStoryPortrait(source){
 if(!dialogue.active)return;
 const portrait=$('#storyPortrait'),ctx=portrait.getContext('2d');
 ctx.clearRect(0,0,180,180);ctx.drawImage(source,370*source.width/1000,75*source.width/1000,260*source.width/1000,260*source.width/1000,0,0,180,180);
}
const startBeforeDialogue=start;start=()=>{startBeforeDialogue();if(introEnabled&&series.active&&series.stage===0&&!prologue.seen){prologue.active=true;prologue.index=0;renderOpening();}else continueIntro();};
$('#dialogueSkip').onclick=finishDialogue;

// One click advances once, including buttons (whose own handler runs first).
document.addEventListener?.('click',e=>{
 if(typeof settingsIsOpen==='function'&&settingsIsOpen())return;
 if(e.target?.closest?.('#settingsOpen, #settingsClose, #pause, #fullscreen, #focus'))return;
 if(prologue.active){if(!e.target?.closest?.('#comicSkip, #start'))advanceOpening();return;}
 if(!dialogue.active||e.target?.closest?.('#dialogueSkip, #comicSkip, #start'))return;
 advanceDialogue();
});

selectOpponent(0);

const comicPanels=[
 ['나레이션','처음에는 서로 도우면 함께 일찍 갈 수 있을 줄 알았다. 하지만 부탁은 의무가 되고, 끝없는 야근과 괴롭힘에 지쳐 사직서를 냈다.','assets/opening/panel-1.png'],
 ['나레이션','상사는 “내년까지 계약이잖아”라며 사직서를 찢어버리고 나를 내쫓았다.','assets/opening/resignation-torn.png'],
 ['나레이션','내 말만으로는 또 없던 일이 될 것 같았다. 몰래 노동청에 신고하려고 기록을 모으다가, 증거가 될 고용계약서 마지막 장을 펼쳤다.','assets/opening/report-preparation.png'],
 ['나레이션','“모든 사원과 최대 주주를 이기면 회사 지분 100%를 양도한다.” 아무도 해내지 못할 거라 여긴 사내 결투 조항이었다. 이기면 퇴근을 막는 규칙도 바꿀 수 있었다.','assets/opening/contract-clause.png'],
 ['나레이션','내가 떠나도 누군가는 같은 일을 겪을 것이다. 계약서의 지하실 대결 신청 버튼을 누르면 모든 사원에게 게임 시작이 전달된다. 이번에는 그 약속을 실행하러 내려갔다.','assets/opening/panel-3-v2.png'],
 ['나레이션','시작 버튼을 눌렀다. 사이렌이 회사 전체에 울려 퍼졌다.','assets/opening/basement-activation.png'],
 ['사내 방송','“대결 신청 접수. 전 층 대결 모드 전환. 첫 상대를 안내합니다.”','assets/opening/company-alarm.png'],
 ['나레이션','신청은 접수됐다. 지금도 유일하게 나를 잘 대해주던 선임이 찾아왔다. 야근하던 내게 밥을 챙겨주던 그는, 다치지 않도록 먼저 싸우는 법을 알려주겠다고 했다.','assets/opening/panel-5-v2.png']
];
function renderOpening(){
 syncComicModal();
 if(prologue.index===6&&!prologue.alarmPlayed){prologue.alarmPlayed=true;companyDuelMode=true;document.body.classList.add('duel-mode');if(typeof playCompanySiren==='function')playCompanySiren();}
 const [title,line,art]=comicPanels[prologue.index];
 $('#openingScene').hidden=false;$('#overlay').style.display='none';
 $('#comicCount').textContent='PROLOGUE · '+(prologue.index+1)+' / '+comicPanels.length;
 $('#comicTitle').textContent=title;$('#comicText').textContent=line;
 $('#comicArt').style.animation=reduced?'none':'';
 $('#comicArt').innerHTML='<img src="'+art+'" alt="'+title+'" decoding="async">';
 $('#comicArt img').onerror=()=>{$('#comicArt').innerHTML='<p class="comicFallback">삽화를 불러오지 못했습니다. 아래 이야기로 계속할 수 있습니다.</p>';};
 if(typeof Image!=='undefined'&&prologue.index<comicPanels.length-1){const preload=new Image();preload.src=comicPanels[prologue.index+1][2];}
}
const openingSeenKey='officeRingOpeningSeenV1';
function rememberOpening(){try{localStorage.setItem(openingSeenKey,'true');}catch{}}
function showStartupOpening(){rememberOpening();prologue.active=true;prologue.index=0;prologue.launch=true;prologue.alarmPlayed=false;renderOpening();$('#openingScene').focus?.();}
function finishOpening(){
 if(!prologue.active)return;const launch=prologue.launch;prologue.active=false;prologue.launch=false;prologue.seen=true;companyDuelMode=true;document.body.classList.add('duel-mode');syncComicModal();$('#openingScene').hidden=true;keys={};pressed={};
 if(launch){startAction();}else continueIntro();
}
function advanceOpening(){if(!prologue.active)return;if(prologue.index<comicPanels.length-1){prologue.index++;renderOpening();}else finishOpening();}
$('#comicSkip').onclick=finishOpening;
