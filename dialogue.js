let prologue={active:false,index:0,seen:false,launch:false,alarmPlayed:false};
let companyDuelMode=false;
let dialogue={active:false,index:0,revealed:0,lines:[]};
let introEnabled=true;
const seenIntros=new Set();
// Character-specific origin art for eight peers; every other line gets contextual art.
const storyIllustrations={0:{2:{src:'assets/story/peer-origin.png',characterId:'peer-0',alt:'입사 첫날 실수한 동료를 보고, 그를 흉내 내 임원의 칭찬을 얻은 깐족왕 동기의 과거 세 장면'}},1:{0:{src:'assets/story/messenger-origin.png',characterId:'peer-1',alt:'메신저 답장이 늦어 질책받은 수습 동기가 알림 감시에 매달리게 된 과거 세 장면'}},2:{0:{src:'assets/story/credit-origin.png',characterId:'peer-2',alt:'공동 보고서에서 이름이 빠진 동기가 남의 공로까지 가져가게 된 과거 세 장면'}},3:{0:{src:'assets/story/dinner-origin.png',characterId:'peer-3',alt:'첫 회식의 노래 한 곡으로 인정받은 동기가 동료들에게 회식을 강요하게 된 과거 세 장면'}},4:{0:{src:'assets/story/delegation-origin.png',characterId:'peer-4',alt:'아픈 동료를 돕던 녹색 셔츠의 동기가 고마움을 이용해 남에게 일을 떠넘기게 된 과거 세 장면'}},5:{0:{src:'assets/story/gossip-origin.png',characterId:'peer-5',alt:'자주색 폴로와 금색 고리를 한 동기가 탕비실에서 들은 정보를 소문으로 거래하게 된 과거 세 장면'}},6:{0:{src:'assets/story/revision-origin.png',characterId:'peer-6',alt:'오탈자 하나로 질책받은 회녹색 후드의 동기가 남의 완성본까지 끝없이 수정하게 된 과거 세 장면'}},7:{0:{src:'assets/story/blame-origin.png',characterId:'peer-7',alt:'구두 지시를 따랐다 혼자 징계받은 동기가 자기 지시도 부인하게 된 과거 세 장면'}}};
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
 return storyIllustrations[npc]?.[dialogue.index]||Object.values(storyIllustrations[npc]||{})[0]||dialogueArt.records;
}

const scenes=opponents.map((o,i)=>[
 ...(i===0?[
 ['사내 방송','지하실 대결 신청 접수. 전 층 대결 모드로 전환했습니다. 첫 번째 상대는 기획팀 깐족왕 동기입니다.'],
 ['나','내년까지 일만 하라고? 좋아. 계약서에 적힌 대로 이 회사부터 가져가겠어.'],
 ]:[]),
 ['과거 기록 · '+o.history.title,o.history.origin],
 ['그가 변한 순간',o.history.change],
 ['내가 기억하는 '+o.department,o.history.incident],
 [o.name,o.intro],['나',o.reply],['사내 방송',i===opponents.length-1?'최종전. 이기면 오늘부터 당신이 최대 주주입니다.':'승리하면 다음 라운드로. 퇴근 결재까지 '+(opponents.length-i)+'명 남았다.']
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
 $('#storyChapter').textContent=tutorial>=0?'길잡이 선임 · 사전 연습':dialogue.index<(npc===0?2:0)?'PROLOGUE':'ROUND '+(npc+1)+' · '+opponents[npc].history.title;
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
 ['23:58 · 더는 못 버티겠다','끝없는 야근, 떠넘기는 업무, 매일 이어지는 괴롭힘. 결국 사직서를 썼다.','assets/opening/panel-1.png'],
 ['찢겨버린 사직서','“내년까지 계약이잖아. 못 그만둬. 가서 일이나 해 와.” 상사는 사직서를 눈앞에서 찢어버리고 나를 방 밖으로 내쫓았다.','assets/opening/resignation-torn.png'],
 ['몰래 신고를 준비하던 밤','자리로 돌아와 몰래 노동청에 신고하려 했다. 늦은 밤, 접수 전에 증거를 챙기려고 고용계약서부터 확인했다.','assets/opening/report-preparation.png'],
 ['계약서 맨 끝, 작은 조항','마지막 장 끄트머리에 작은 글씨가 있었다. “회사 내 모든 사람을 이기고 최대 주주를 이기면 회사 지분 100%를 양도한다.”','assets/opening/contract-clause.png'],
 ['그 조항대로 하겠습니다','다음 날 아침, 계약서에 적힌 지하실 대결 신청 버튼을 찾아 내려갔다. 그만두지도 못하게 한다면, 이 회사부터 내 것으로 만들겠다.','assets/opening/panel-3-v2.png'],
 ['지하실의 대결 신청 버튼','덮개를 열고 대결 신청 버튼을 눌렀다. 지하실의 경보등이 켜지고, 사이렌이 회사 전체에 울려 퍼졌다.','assets/opening/basement-activation.png'],
 ['회사 전체, 대결 모드','위이이잉—! 붉은 경보등과 함께 회사 전체가 대결 모드로 바뀌었다. “대결 신청 접수. 전 층 대결 모드 전환. 첫 상대를 안내합니다.”','assets/opening/company-alarm.png'],
 ['내게 잘해주던 선임','신청은 접수됐다. 회사에서 유일하게 나를 잘 대해주던 선임이, 첫 대결 전에 주먹 쓰는 법을 알려주겠다고 했다.','assets/opening/panel-5-v2.png']
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
function showStartupOpening(){prologue.active=true;prologue.index=0;prologue.launch=true;prologue.alarmPlayed=false;renderOpening();$('#openingScene').focus?.();}
function finishOpening(){
 if(!prologue.active)return;const launch=prologue.launch;prologue.active=false;prologue.launch=false;prologue.seen=true;companyDuelMode=true;document.body.classList.add('duel-mode');syncComicModal();$('#openingScene').hidden=true;keys={};pressed={};
 if(launch){startAction();}else continueIntro();
}
function advanceOpening(){if(!prologue.active)return;if(prologue.index<comicPanels.length-1){prologue.index++;renderOpening();}else finishOpening();}
$('#comicSkip').onclick=finishOpening;
