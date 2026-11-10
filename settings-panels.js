// The settings landing page contains category buttons; native child dialogs
// keep focus and pointer input in the selected category until Back/Escape.
let settingsPage=null,settingsPageButton=null;
const settingsCategories=[
 ['controls','조작법'],
 ['motion','화면 효과 줄이기'],
 ['reset','진행 초기화']
];
const settingsPages=new Map(),settingsMenu=document.createElement('div');
settingsMenu.className='settingsCategories';
$('#settingsTitle').textContent='설정';
function closeSettingsPage(){
 if(!settingsPage)return;
 settingsPage.close();settingsPage=null;
 settingsPageButton?.focus();settingsPageButton=null;
}
for(const [id,title] of settingsCategories){
 const button=document.createElement('button');button.type='button';button.textContent=title;button.dataset.settingsPage=id;
 const page=document.createElement('dialog');page.className='settingsPage';page.id='settings-'+id;page.setAttribute('aria-labelledby',page.id+'-title');
 const heading=document.createElement('div');heading.className='settingsHeading';
 const label=document.createElement('h2');label.id=page.id+'-title';label.textContent=title;
 const back=document.createElement('button');back.type='button';back.textContent='뒤로 · Esc';back.onclick=closeSettingsPage;
 heading.append(label,back);page.append(heading);settingsDialog.append(page);settingsPages.set(id,page);
 button.onclick=()=>{settingsPageButton=button;settingsPage=page;syncPauseMenu();page.showModal();back.focus();};
 page.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();closeSettingsPage();});
 page.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();closeSettingsPage();}});
 page.addEventListener('click',e=>e.stopPropagation());settingsMenu.append(button);
}
settingsPages.get('controls').append($('.guide'));
// Retain internal controls for save compatibility, outside the visible settings.
const legacy=document.createElement('div');legacy.hidden=true;legacy.id='legacySessionControls';
legacy.append($('#saveStatus'),$('#careerResume'),settingsDialog.querySelector('aside'),$('#pauseRestart'),$('#pauseExit'));
document.body.append(legacy);
const soundSwitch=$('#pauseSound');soundSwitch.type='button';soundSwitch.className='settingSwitch';soundSwitch.setAttribute('role','switch');soundSwitch.setAttribute('aria-label','소리');
settingsMenu.prepend(soundSwitch);
const motionPage=settingsPages.get('motion'),description=document.createElement('p');
description.textContent='피격 시 화면 흔들림·확대·반동과 그로기 일렁임을 줄입니다. 공격 속도와 판정은 바뀌지 않습니다.';
motionPage.append(description,$('#pauseMotion'));
$('#pauseMotion').setAttribute('role','switch');$('#pauseMotion').setAttribute('aria-label','화면 효과 줄이기');
const resetPage=settingsPages.get('reset'),resetDescription=document.createElement('p'),resetConfirm=document.createElement('button');
resetDescription.textContent='저장된 라운드와 클리어 기록을 지우고 처음부터 시작합니다. 최고 점수와 소리·화면 설정은 유지됩니다.';
resetConfirm.type='button';resetConfirm.id='progressResetConfirm';resetConfirm.textContent='진행 초기화';resetConfirm.onclick=resetSavedProgress;
resetPage.append(resetDescription,resetConfirm);
const syncSettingsBase=syncPauseMenu;syncPauseMenu=()=>{
 syncSettingsBase();soundSwitch.setAttribute('aria-checked',String(!muted));soundSwitch.innerHTML='<span>소리</span><span class="switchTrack">'+(muted?'OFF':'ON')+'</span>';
 $('#pauseMotion').setAttribute('aria-checked',String(reduced));$('#pauseMotion').textContent='효과 줄이기: '+(reduced?'ON':'OFF');
};
$('#pauseMenu').replaceChildren();settingsDialog.append(settingsMenu);syncPauseMenu();
