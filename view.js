let focused=false;
function toggleFocus(){
 focused=!focused;document.body.classList.toggle('focused',focused);
 $('#focus').textContent=focused?'원래 화면 F':'집중 모드 F';
 $('#focus').setAttribute?.('aria-pressed',String(focused));
 $('#game').focus?.();
}
function syncPauseMenu(){
 $('#pauseMenu').hidden=!paused;
 $('#pauseSound').textContent=muted?'소리 켜기':'소리 끄기';
 $('#pauseMotion').textContent=reduced?'움직임 기본으로':'움직임 줄이기';
}
$('#focus').onclick=toggleFocus;
addEventListener('keydown',e=>{
 if(typeof settingsIsOpen==='function'&&settingsIsOpen())return;
 if(typeof activeComicScene==='function'&&activeComicScene())return;
 if(e.code!=='KeyF'||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;
 if(e.target?.isContentEditable||['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName))return;
 e.preventDefault();toggleFocus();
});
const pauseBeforeMenu=pause;pause=()=>{pauseBeforeMenu();syncPauseMenu();};$('#pause').onclick=pause;
const startBeforeMenu=start;start=()=>{startBeforeMenu();document.body.classList.add("playing");syncPauseMenu();};
const endBeforeMenu=end;end=()=>{endBeforeMenu();document.body.classList.remove("playing");syncPauseMenu();};
$('#pauseRestart').onclick=()=>{if(paused)start();};
$('#pauseSound').onclick=()=>{$('#sound').onclick();syncPauseMenu();};
$('#pauseMotion').onclick=()=>{$('#motion').onclick();syncPauseMenu();};
$('#pauseExit').onclick=()=>{
 if(!paused)return;
 silenceEffects();resetMovement();run=false;paused=false;keys={};pressed={};buffered=null;combo=[];stop=0;ko=0;resetSeries();
 $('#playMode').disabled=false;$('#difficulty').disabled=false;$('#training').disabled=false;
 document.body.classList.remove("playing");selectOpponent(npc);$('#start').innerHTML='링에 오르기 <span>SPACE</span>';
 $('#overlay').style.display='flex';syncPauseMenu();
 if(focused)toggleFocus();
};
