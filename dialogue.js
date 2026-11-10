let prologue={active:false,index:0,seen:false};
let dialogue={active:false,index:0,revealed:0,lines:[]};
let introEnabled=true;
const seenIntros=new Set();
// Add individual illustrated beats here as they are produced; other stories stay text-only.
const storyIllustrations={0:{2:{src:'assets/story/peer-origin.png',alt:'입사 첫날 실수한 동료를 보고, 그를 흉내 내 임원의 칭찬을 얻은 깐족왕 동기의 과거 세 장면'}}};
const failedStoryImages=new Set();
const scenes=opponents.map((o,i)=>[
 ...(i===0?[
 ['23:58 · 블랙기업','야근은 끝나지 않고, 내일도 오늘과 같았다. 모든 걸 놓아버리고 싶은 밤이었다.'],
 ['나','이런 나쁜 놈들한테 당하고만 끝낼 순 없어. 내 인생부터 돌려받자!'],
 ]:[]),
 ['과거 기록 · '+o.history.title,o.history.origin],
 ['그가 변한 순간',o.history.change],
 ['내가 기억하는 '+o.department,o.history.incident],
 [o.name,o.intro],['나',o.reply],['사내 방송',i===opponents.length-1?'최종전. 이기면 오늘부터 당신이 최대 주주입니다.':'승리하면 다음 라운드로. 퇴근 결재까지 '+(opponents.length-i)+'명 남았다.']
]);
function renderDialogue(){
 const [speaker,line]=dialogue.lines[dialogue.index];
 $('#dialogueSpeaker').textContent=speaker;$('#dialogueText').textContent=line.slice(0,Math.floor(dialogue.revealed));
 $('#dialogueCount').textContent=`${dialogue.index+1} / ${dialogue.lines.length}`;
 $('#dialogueNext').textContent=dialogue.index===dialogue.lines.length-1?(tutorial>=0?'선임과 연습 시작 · Space':'대결 시작 · Space'):'계속 · Space';
 $('#storyChapter').textContent=tutorial>=0?'길잡이 선임 · 사전 연습':dialogue.index<(npc===0?2:0)?'PROLOGUE':'ROUND '+(npc+1)+' · '+opponents[npc].history.title;
 const candidate=tutorial<0?storyIllustrations[npc]?.[dialogue.index]:null,art=candidate&&!failedStoryImages.has(candidate.src)?candidate:null,comic=$('#storyComic');
 comic.hidden=!art;$('.arena').classList.toggle('story-comic',!!art);
 if(art){
  const img=$('#storyComicImage');if(!img.src?.endsWith(art.src))img.src=art.src;img.alt=art.alt;
  img.onerror=()=>{failedStoryImages.add(art.src);comic.hidden=true;$('.arena').classList.remove('story-comic');};
  $('#storyChapter').textContent='과거 만화 · '+opponents[npc].history.title;
 }
}
function beginDialogue(){
 dialogue={active:true,index:0,revealed:0,lines:tutorial>=0?[[trainingCoach.name,trainingCoach.intro],['길잡이 선임','설명은 짧게 하자. 먼저 J로 나를 직접 때려 봐. 다음 동작은 하나씩 알려줄게.']]:scenes[npc]};
 keys={};buffered=null;tauntUntil=0;msgTime=0;$('#dialogueScene').hidden=false;$('#overlay').style.display='none';
 $('#storyName').textContent=tutorial>=0?trainingCoach.name:opponents[npc].name;
 $('#storyAppearance').textContent=tutorial>=0?appearanceOf(activeOpponentLook()):opponents[npc].appearance;
 if(tutorial<0&&typeof Image!=='undefined')for(const art of Object.values(storyIllustrations[npc]||{})){const preload=new Image();preload.src=art.src;}
 $('.arena').classList.add('dialogue-scene');renderDialogue();
}
function finishDialogue(){
 if(!dialogue.active)return;
 dialogue.active=false;seenIntros.add(tutorial>=0?'coach':npc);$('#dialogueScene').hidden=true;$('.arena').classList.remove('dialogue-scene');
 $('#storyComic').hidden=true;$('.arena').classList.remove('story-comic');
 keys={};pressed={};buffered=null;t=0;next=.35;msgTime=0;say('대결 시작');sound(260,.12);$('#game').focus?.();
}
function advanceDialogue(){
 if(!dialogue.active)return;
 const line=dialogue.lines[dialogue.index][1];
 if(dialogue.revealed<line.length){dialogue.revealed=line.length;renderDialogue();return;}
 if(dialogue.index<dialogue.lines.length-1){dialogue.index++;dialogue.revealed=0;renderDialogue();}else finishDialogue();
}
function tickDialogue(dt){if(prologue.active)return;if(dialogue.active){dialogue.revealed=Math.min(dialogue.lines[dialogue.index][1].length,dialogue.revealed+dt*34);renderDialogue();}}
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
 ctx.clearRect(0,0,180,180);ctx.drawImage(source,370,75,260,260,0,0,180,180);
}
const startBeforeDialogue=start;start=()=>{startBeforeDialogue();if(introEnabled&&series.active&&series.stage===0&&!prologue.seen){prologue.active=true;prologue.index=0;renderOpening();}else continueIntro();};
$('#dialogueNext').onclick=advanceDialogue;$('#dialogueSkip').onclick=finishDialogue;

// One click advances once, including buttons (whose own handler runs first).
document.addEventListener?.('click',e=>{
 if(prologue.active){if(!e.target?.closest?.('#comicNext, #comicSkip, #start'))advanceOpening();return;}
 if(!dialogue.active||e.target?.closest?.('#dialogueNext, #dialogueSkip, #comicNext, #comicSkip, #start'))return;
 advanceDialogue();
});

selectOpponent(0);

const comicPanels=[
 ['23:58 · 또 야근','퇴근 버튼은 고장 났고, 메신저만 살아 있었다.','office'],
 ['업무가 복사됩니다','“이것도 네가.” “아직도 안 했어?” 내 책상에 남의 일이 쌓였다.','papers'],
 ['내 인생부터 돌려받자','이런 놈들한테 당하고만 끝낼 순 없어. 오늘은 내가 결재한다.','resolve'],
 ['이상한 사규, 발견','사내 결투 100연승. 최대 주주를 이기면 회사 지분 100% 양도. 진짜로 적혀 있었다.','contract'],
 ['첫 상대는 바로 너','길잡이 선임에게 주먹부터 배운다. 깐족대는 동기야, 거기서 기다려.','gloves']
];
function renderOpening(){
 const [title,line,art]=comicPanels[prologue.index];
 $('#openingScene').hidden=false;$('#overlay').style.display='none';
 $('#comicCount').textContent='PROLOGUE · '+(prologue.index+1)+' / '+comicPanels.length;
 $('#comicTitle').textContent=title;$('#comicText').textContent=line;
 $('#comicArt').style.animation=reduced?'none':'';
 $('#comicArt').innerHTML='<img src="assets/opening/panel-'+(prologue.index+1)+'.png" alt="'+title+'" decoding="async">';
 if(typeof Image!=='undefined'&&prologue.index<comicPanels.length-1){const preload=new Image();preload.src='assets/opening/panel-'+(prologue.index+2)+'.png';}
 $('#comicNext').textContent=prologue.index===comicPanels.length-1?'선임 만나기 →':'다음 컷 →';
}
function finishOpening(){if(!prologue.active)return;prologue.active=false;prologue.seen=true;$('#openingScene').hidden=true;keys={};pressed={};continueIntro();}
function advanceOpening(){if(!prologue.active)return;if(prologue.index<comicPanels.length-1){prologue.index++;renderOpening();}else finishOpening();}
$('#comicNext').onclick=advanceOpening;$('#comicSkip').onclick=finishOpening;
