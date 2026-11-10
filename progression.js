// Versioned, round-boundary checkpoints. Replays never replace a career checkpoint.
const progressKey='officeRingProgressV1';
function cleanProgress(value){
 const result={version:1,careers:{},cleared:{},automatic:value?.automatic===true};
 if(!value||value.version!==1)return result;
 for(const level of Object.keys(levels)){
  result.cleared[level]=Array.isArray(value.cleared?.[level])?[...new Set(value.cleared[level].filter(n=>Number.isInteger(n)&&n>=0&&n<opponents.length))]:[];
  const item=value.careers?.[level];
  if(!item||!Number.isInteger(item.stage)||item.stage<0||item.stage>opponents.length)continue;
  const valid=n=>Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER;
  if(!valid(item.total)||!valid(item.seconds))continue;
  const stats=freshStats();for(const key of Object.keys(stats))if(valid(item.stats?.[key]))stats[key]=item.stats[key];
  result.careers[level]={stage:item.stage,total:item.total,seconds:item.seconds,stats};
 }
 return result;
}
let progression=cleanProgress(readSaved(progressKey,null)),storageAvailable=true;
function persistProgress(){
 try{localStorage.setItem(progressKey,JSON.stringify(progression));storageAvailable=true;}catch{storageAvailable=false;}
 refreshProgressUI();
}
function saveCareer(won=false){
 if(!series.active)return;
 const checkpoint=progression.careers[difficulty];if(series.replay&&checkpoint&&checkpoint.stage>=series.stage+(won?1:0))return;
 progression.careers[difficulty]={stage:series.stage+(won?1:0),total:series.total,seconds:series.seconds,stats:{...series.stats}};
 persistProgress();
}
function recordClear(){
 const list=progression.cleared[difficulty]??=[];if(!list.includes(npc))list.push(npc);persistProgress();
}
function canReplay(index){return index===0||progression.cleared[difficulty]?.includes(index)||progression.careers[difficulty]?.stage===index;}
function refreshProgressUI(){
 const item=progression.careers[difficulty];
 $('#saveStatus').textContent=storageAvailable?`${{easy:'입문',normal:'보통',hard:'도전'}[difficulty]} · ${item?item.stage===opponents.length?'100라운드 완료':`${item.stage+1}라운드부터 이어하기`:'새 승급전'} · 클리어 ${progression.cleared[difficulty]?.length||0}/${opponents.length} · 경기 중 종료하면 해당 라운드 처음부터`:'브라우저 저장을 사용할 수 없습니다. 이번 창에서는 진행을 유지합니다.';
 $('#careerResume').disabled=run;
 $('#careerResume').textContent=item&&item.stage<opponents.length?`${item.stage+1}라운드 이어하기`:'새 승급전 시작';
 document.querySelectorAll('.pick').forEach(button=>{button.disabled=run||!canReplay(+button.dataset.n);const cleared=progression.cleared[difficulty]?.includes(+button.dataset.n);button.dataset.cleared=String(!!cleared);button.title=cleared?'클리어 · 개별전 재플레이':canReplay(+button.dataset.n)?'현재 도달한 상대 · 개별전':'이 난이도에서 클리어하면 열립니다';});
}
function prepareCareer(){
 resetSeries();$('#playMode').value='series';const item=progression.careers[difficulty];
 if(item&&(item.stage<opponents.length||playableRoundCount()<opponents.length)){series={active:true,stage:item.stage,total:item.total,seconds:item.seconds,stats:{...item.stats},complete:false};selectOpponent(Math.min(item.stage,Math.max(0,playableRoundCount()-1)));}
 else selectOpponent(0);
 $('#start').innerHTML=item&&item.stage<opponents.length?`${item.stage+1}라운드 이어하기 <span>SPACE</span>`:'승급전 시작 <span>SPACE</span>';
 const resume=!!item&&item.stage<opponents.length;
 $('#overlay').classList.toggle('result-screen',resume);$('#resultMeta').hidden=true;
 if(resume){$('#overlay>small').textContent='CONTINUE';$('#title').textContent=`${item.stage+1}라운드`;$('#desc').textContent='저장된 경기부터 이어갑니다.';}
 seriesProgress();
}
const settingsDialog=$('#settingsDialog');let settingsPaused=false,settingsReturnFocus=null;
function settingsIsOpen(){return settingsDialog.open===true;}
function openSettings(){
 if(settingsIsOpen())return;
 settingsReturnFocus=document.activeElement;settingsPaused=run&&!paused;
 if(settingsPaused){if(inDialogue()){paused=true;silenceEffects();}else previousPause();}
 keys={};pressed={};buffered=null;
 if(typeof releaseTouches==='function')releaseTouches();
 $('#difficulty').disabled=run;$('#playMode').disabled=run;refreshProgressUI();syncPauseMenu();settingsDialog.showModal();
}
function closeSettings(){
 if(!settingsIsOpen())return;
 if(typeof closeSettingsPage==='function')closeSettingsPage();
 settingsDialog.close();keys={};pressed={};buffered=null;
 if(settingsPaused&&run){if(inDialogue())paused=false;else if(paused)pause();}
 settingsPaused=false;(settingsReturnFocus?.isConnected&&settingsReturnFocus!==document.body?settingsReturnFocus:$('#game')).focus();
}
$('#settingsOpen').onclick=openSettings;$('#settingsClose').onclick=closeSettings;
settingsDialog.addEventListener('cancel',e=>{e.preventDefault();closeSettings();});
settingsDialog.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();closeSettings();}});
settingsDialog.addEventListener('click',e=>e.stopPropagation());
$('#settingsOpen').addEventListener('click',e=>e.stopPropagation());
$('#careerResume').onclick=()=>{if(run)return;prepareCareer();closeSettings();startAction();};
const previousPause=pause;pause=()=>{
 if(settingsIsOpen()){closeSettings();return;}
 previousPause();if(paused){settingsPaused=false;openSettings();settingsPaused=true;}
};$('#pause').onclick=()=>{if(run)pause();else openSettings();};
// Pause actions and sound preferences live in the same modal.
settingsDialog.append($('#pauseMenu'));$('#pauseMenu').hidden=false;
const previousSync=syncPauseMenu;syncPauseMenu=()=>{previousSync();$('#pauseMenu').hidden=false;$('#pauseRestart').disabled=!run;$('#pauseExit').disabled=!run;};
$('#pauseRestart').onclick=()=>{if(!run)return;settingsPaused=false;closeSettings();start();};
$('#pauseExit').onclick=()=>{
 if(!run)return;
 silenceEffects();resetMovement();resetTactics();run=false;paused=false;keys={};pressed={};buffered=null;combo=[];stop=ko=0;
 dialogue.active=false;prologue.active=false;syncComicModal();$('#dialogueScene').hidden=true;$('#openingScene').hidden=true;
 $('.arena').classList.remove('dialogue-scene','story-comic');$('#storyComic').hidden=true;
 $('#training').disabled=false;$('#difficulty').disabled=false;$('#playMode').disabled=false;
 document.body.classList.remove('playing');prepareCareer();$('#overlay').style.display='flex';settingsPaused=false;closeSettings();
};$('#pauseExit').textContent='저장한 승급전으로 돌아가기';
const previousDifficulty=$('#difficulty').onchange;$('#difficulty').onchange=e=>{previousDifficulty(e);if(!run){prepareCareer();refreshProgressUI();}};
const previousMode=$('#playMode').onchange;$('#playMode').onchange=()=>{previousMode();if($('#playMode').value==='series')prepareCareer();refreshProgressUI();};
document.querySelectorAll('.pick').forEach(button=>{const choose=button.onclick;button.onclick=()=>{if(run||!canReplay(+button.dataset.n))return;choose();closeSettings();$('#title').textContent='개별전 · 재플레이';$('#desc').textContent='승급전 진행과 클리어 기록은 유지됩니다.';};});
const progressionStartAction=startAction;startAction=()=>{if(settingsIsOpen())return;progressionStartAction();};$('#start').onclick=()=>startAction();
// Preserve the furthest old checkpoint while moving the UI to one automatic career.
function useAutomaticCareer(){
 if(!progression.automatic){
  const furthest=Object.values(progression.careers).sort((a,b)=>b.stage-a.stage||b.total-a.total)[0];
  if(furthest)progression.careers.normal={...furthest,stats:{...furthest.stats}};
  progression.cleared.normal=[...new Set(Object.values(progression.cleared).flat())].sort((a,b)=>a-b);
  for(const prefix of ['officeRingBest:','officeRingCareer100Best:']){
   const scores=Object.keys(levels).map(level=>readSaved(prefix+level,0)).filter(value=>Number.isFinite(value)&&value>=0);
   try{localStorage.setItem(prefix+'normal',JSON.stringify(Math.max(0,...scores)));}catch{}
  }
  progression.automatic=true;
 }
 difficulty='normal';$('#difficulty').value='normal';$('#playMode').value='series';saveSettings();refreshBest();
}
const automaticStartAction=startAction;startAction=()=>{$('#playMode').value='series';difficulty='normal';$('#difficulty').value='normal';automaticStartAction();};$('#start').onclick=()=>startAction();
function resetSavedProgress(){
 silenceEffects();resetMovement();resetTactics();if(typeof releaseTouches==='function')releaseTouches();
 run=false;paused=false;keys={};pressed={};buffered=null;combo=[];attack=null;impact=null;stop=ko=0;
 dialogue.active=false;prologue.active=false;$('#dialogueScene').hidden=true;$('#openingScene').hidden=true;
 $('.arena').classList.remove('dialogue-scene','story-comic');$('#storyComic').hidden=true;syncComicModal();
 document.body.classList.remove('playing','duel-mode');companyDuelMode=false;seenIntros.clear();prologue.seen=false;
 progression=cleanProgress({version:1,automatic:true});settingsPaused=false;closeSettings();
 $('#training').disabled=false;$('#difficulty').disabled=false;$('#playMode').disabled=false;
 useAutomaticCareer();prepareCareer();persistProgress();$('#overlay').style.display='flex';showStartupOpening();
}
const returningPlayer=readSaved(openingSeenKey,false)===true||Object.keys(progression.careers).length>0||Object.values(progression.cleared).some(list=>list.length>0);
useAutomaticCareer();prepareCareer();persistProgress();
if(returningPlayer){
 rememberOpening();prologue.seen=true;companyDuelMode=true;document.body.classList.add('duel-mode');
 $('#overlay').style.display='flex';
}else showStartupOpening();
