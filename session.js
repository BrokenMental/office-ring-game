let roundStats=freshStats();
function freshStats(){return {hits:0,guards:0,perfects:0,counters:0,dodges:0,taken:0,blocked:0,misses:0};}
function readSaved(key,fallback){try{const value=JSON.parse(localStorage.getItem(key));return value??fallback;}catch{return fallback;}}
function saveSettings(){try{localStorage.setItem('officeRingSettings',JSON.stringify({muted,reduced,difficulty,training:$('#training').checked}));}catch{}}
function refreshBest(){const value=readSaved('officeRingBest:'+difficulty,0);best=Number.isFinite(value)&&value>=0?value:0;$('#best').textContent=best;}
function resetRound(){roundStats=freshStats();$('#results').hidden=true;refreshBest();}
function finishRound(){
 const previous=best;best=Math.max(previous,score);try{localStorage.setItem('officeRingBest:'+difficulty,JSON.stringify(best));}catch{}
 $('#best').textContent=best;
 $('#desc').textContent=`${names[npc]} · ${$('#difficulty').options?.[$('#difficulty').selectedIndex]?.text||difficulty} · ${Math.ceil(combatTime)}초`;
 $('#results').innerHTML=[['적중',roundStats.hits],['글러브 충돌',roundStats.guards],['정확한 충돌',roundStats.perfects],['회피',roundStats.dodges],['카운터',roundStats.counters]].map(([label,value])=>`<div><b>${value}</b><span>${label}</span></div>`).join('');
 $('#results').hidden=false;
 $('#resultScore').textContent=`${score.toLocaleString()}점${score>previous?' · 이 난이도 최고 기록!':''}`;
 $('#resultScore').hidden=false;
}
const settings=readSaved('officeRingSettings',{});
if(settings&&typeof settings==='object'){
 muted=settings.muted===true;reduced=settings.reduced===true;
 if(Object.hasOwn(levels,settings.difficulty))difficulty=settings.difficulty;
 if(typeof settings.training==='boolean')$('#training').checked=settings.training;
}
$('#difficulty').value=difficulty;
$('#sound').textContent=muted?'SOUND OFF':'SOUND ON';$('#motion').textContent=reduced?'움직임: 약하게':'움직임: 기본';
for(const selector of ['#sound','#motion']){const button=$(selector),original=button.onclick;button.onclick=()=>{original();saveSettings();};}
const changeDifficulty=$('#difficulty').onchange;$('#difficulty').onchange=e=>{changeDifficulty(e);refreshBest();saveSettings();};$('#training').onchange=saveSettings;
refreshBest();
