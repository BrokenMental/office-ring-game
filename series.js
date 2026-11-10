// Registered individual origin comics define the contiguous playable release.
function playableRoundCount(){let count=0;while(count<opponents.length&&opponents[count].storyComicReady)count++;return count;}
function showContentBoundary(){
 run=false;paused=false;keys={};pressed={};buffered=null;combo=[];attack=null;
 series.contentComplete=true;document.body.classList.remove('playing');
 $('#title').textContent='다음 라운드는 준비중입니다.';
 $('#desc').textContent=`현재 ${playableRoundCount()}라운드까지 만화가 준비되어 있습니다. 다음 이야기를 준비하고 있습니다.`;
 $('#start').innerHTML='다시하기 <span>SPACE</span>';$('#overlay').style.display='flex';
 $('#status').textContent='다음 라운드 준비중';seriesProgress();
}
function seriesProgress(){
 $('#seriesProgress').hidden=!series.active;
 const count=playableRoundCount();
 $('#seriesProgress').textContent=series.active?(series.contentComplete?`${count}라운드까지 완료 · 다음 라운드 준비중`:`${Math.min(series.stage+1,count)} / ${count}라운드 · ${opponents[npc].name} · 다음: ${series.stage+1<count?opponents[series.stage+1].name:'준비중'}`):'';
}
function resetSeries(){series={active:false,stage:0,total:0,seconds:0,stats:freshStats(),complete:false,contentComplete:false,replay:false};seriesProgress();}
function startAction(){
 if(paused){pause();return;}
 if(run)return;
 if(playableRoundCount()===0){showContentBoundary();return;}
 if(series.contentComplete){resetSeries();series.active=true;series.replay=true;selectOpponent(0);seriesProgress();start();return;}
 if(series.active&&series.stage>=playableRoundCount()&&playableRoundCount()<opponents.length){showContentBoundary();return;}
 if($('#playMode').value!=='series'){resetSeries();start();return;}
 if(!series.active||series.complete){resetSeries();series.active=true;selectOpponent(0);}
 else if(ep<=0){if(series.stage+1>=playableRoundCount()&&playableRoundCount()<opponents.length){showContentBoundary();return;}series.stage++;selectOpponent(series.stage);}
 seriesProgress();start();
}
function roundStarted(){
 $('#playMode').disabled=true;
 seriesProgress();
 if(typeof saveCareer==='function')saveCareer();
}
function roundFinished(){
 $('#playMode').disabled=false;
 if(typeof recordClear==='function'&&ep<=0)recordClear();
 if(!series.active)return;
 $('#difficulty').disabled=true;
 if(ep>0){$('#start').innerHTML='이 상대 다시 도전 <span>SPACE</span>';$('#desc').textContent+=' · 앞선 승리 기록은 유지됩니다';return;}
 series.total+=score;series.seconds+=combatTime;
 for(const key of Object.keys(series.stats))series.stats[key]+=roundStats[key];
 if(typeof saveCareer==='function')saveCareer(true);
 if(series.stage+1>=playableRoundCount()&&playableRoundCount()<opponents.length){showContentBoundary();return;}
 if(series.stage<opponents.length-1){
  $('#start').innerHTML=`다음 상대 · ${opponentLooks[series.stage+1].badge} <span>SPACE</span>`;
  $('#desc').textContent+=` · ${series.stage+1}/${opponents.length} 정리 완료 · 누적 ${series.total.toLocaleString()}점`;
  $('#difficulty').disabled=true;
 }else{
  series.complete=true;$('#difficulty').disabled=false;$('#title').textContent='최대 주주 KO! 이제 이 회사는 내 회사다.';
  $('#desc').textContent=`${opponents.length}명 정리 완료 · 첫 사내 규정: 정시 퇴근 · 총 전투 ${Math.ceil(series.seconds)}초 · 카운터 ${series.stats.counters}회`;
  $('#results').innerHTML=[['총 적중',series.stats.hits],['총 충돌',series.stats.guards],['정확한 충돌',series.stats.perfects],['회피',series.stats.dodges],['카운터',series.stats.counters]].map(([label,value])=>`<div><b>${value}</b><span>${label}</span></div>`).join('');
  const key='officeRingCareer100Best:'+difficulty,old=readSaved(key,0),previous=Number.isFinite(old)?old:0;
  try{localStorage.setItem(key,JSON.stringify(Math.max(previous,series.total)));}catch{}
  $('#resultScore').textContent=`합계 ${series.total.toLocaleString()}점 · 연속전 최고 ${Math.max(previous,series.total).toLocaleString()}점`;
  $('#start').innerHTML='신입부터 다시 도전 <span>SPACE</span>';
  $('#seriesProgress').textContent='✓ 100라운드 정복 · 지분 100% · 전 직원 정시 퇴근';
 }
}
$('#start').onclick=startAction;
$('#playMode').onchange=()=>{if(run)return;resetSeries();$('#difficulty').disabled=false;selectOpponent(npc);$('#start').innerHTML='링에 오르기 <span>SPACE</span>';};
document.querySelectorAll('.pick').forEach(button=>{const choose=button.onclick;button.onclick=()=>{if(!run){resetSeries();$('#playMode').value='single';$('#difficulty').disabled=false;}choose();};});
