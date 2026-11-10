function seriesProgress(){
 $('#seriesProgress').hidden=!series.active;
 $('#seriesProgress').textContent=series.active?`${series.stage+1} / ${opponents.length}라운드 · ${opponents[npc].name} · 다음: ${opponents[series.stage+1]?.name||'경영권 인수'}`:'';
}
function resetSeries(){series={active:false,stage:0,total:0,seconds:0,stats:freshStats(),complete:false};seriesProgress();}
function startAction(){
 if(paused){pause();return;}
 if(run)return;
 if($('#playMode').value!=='series'){resetSeries();start();return;}
 if(!series.active||series.complete){resetSeries();series.active=true;selectOpponent(0);}
 else if(ep<=0){series.stage++;selectOpponent(series.stage);}
 seriesProgress();start();
}
function roundStarted(){
 $('#playMode').disabled=true;
 seriesProgress();
}
function roundFinished(){
 $('#playMode').disabled=false;
 if(!series.active)return;
 $('#difficulty').disabled=true;
 if(ep>0){$('#start').innerHTML='이 상대 다시 도전 <span>ENTER ↵</span>';$('#desc').textContent+=' · 앞선 승리 기록은 유지됩니다';return;}
 series.total+=score;series.seconds+=combatTime;
 for(const key of Object.keys(series.stats))series.stats[key]+=roundStats[key];
 if(series.stage<opponents.length-1){
  $('#start').innerHTML=`다음 상대 · ${opponentLooks[series.stage+1].badge} <span>ENTER ↵</span>`;
  $('#desc').textContent+=` · ${series.stage+1}/${opponents.length} 정리 완료 · 누적 ${series.total.toLocaleString()}점`;
  $('#difficulty').disabled=true;
 }else{
  series.complete=true;$('#difficulty').disabled=false;$('#title').textContent='최대 주주 KO! 이제 이 회사는 내 회사다.';
  $('#desc').textContent=`${opponents.length}명 정리 완료 · 첫 사내 규정: 정시 퇴근 · 총 전투 ${Math.ceil(series.seconds)}초 · 카운터 ${series.stats.counters}회`;
  $('#results').innerHTML=[['총 적중',series.stats.hits],['총 충돌',series.stats.guards],['정확한 충돌',series.stats.perfects],['회피',series.stats.dodges],['카운터',series.stats.counters]].map(([label,value])=>`<div><b>${value}</b><span>${label}</span></div>`).join('');
  const key='officeRingCareer100Best:'+difficulty,old=readSaved(key,0),previous=Number.isFinite(old)?old:0;
  try{localStorage.setItem(key,JSON.stringify(Math.max(previous,series.total)));}catch{}
  $('#resultScore').textContent=`합계 ${series.total.toLocaleString()}점 · 연속전 최고 ${Math.max(previous,series.total).toLocaleString()}점`;
  $('#start').innerHTML='신입부터 다시 도전 <span>ENTER ↵</span>';
  $('#seriesProgress').textContent='✓ 100라운드 정복 · 지분 100% · 전 직원 정시 퇴근';
 }
}
$('#start').onclick=startAction;
$('#playMode').onchange=()=>{if(run)return;resetSeries();$('#difficulty').disabled=false;selectOpponent(npc);$('#start').innerHTML='링에 오르기 <span>ENTER ↵</span>';};
document.querySelectorAll('.pick').forEach(button=>{const choose=button.onclick;button.onclick=()=>{if(!run){resetSeries();$('#playMode').value='single';$('#difficulty').disabled=false;}choose();};});
