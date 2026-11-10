const finalBossLines=['네 노동도 이 회사도 전부 내 자산이야.','최대 주주 KO · 경영권 인수!','그 지분, 퇴직금 대신 받아가겠습니다.'];
const careerGroups=[
 ['동기',10],['선임',10],['대리',10],['과장',10],['계장',8],['차장',8],['부장',8],
 ['파트장',6],['부사장',5],['사장 비서',4],['사장',4],['이사',6],['대표 이사',10],['최대 주주',1]
];
const personalities=[
 ['깐족왕','너 아직도 그거 못 끝냈어?','남 일 구경은 여기까지.','남 걱정 말고 네 일부터 해.'],
 ['메신저 폭격','답장 왜 안 해? 방금 보냈잖아.','알림 폭격, 차단.','업무 시간에만 답합니다.'],
 ['공로 수집','이건 내가 한 걸로 보고할게.','내 성과는 내 이름으로.','제 이름부터 돌려놓으세요.'],
 ['회식 강요','오늘도 끝까지 남아야지?','강제 회식, 불참.','퇴근 후엔 제 시간입니다.'],
 ['업무 떠넘김','이것만 대신 해줘. 금방이야.','업무 떠넘기기, 반송.','그 금방을 직접 하시죠.'],
 ['뒷담 전문가','다 너 잘되라고 하는 말이야.','뒷담 회의, 종료.','앞에서 말해보세요.'],
 ['수정 무한대','좋은데, 처음부터 다시 할까?','무한 수정, 최종 확정.','이번 파일이 진짜 최종입니다.'],
 ['책임 회피','내가 언제 그렇게 말했어?','책임 전가, 수신 거부.','회의록에 남아 있습니다.'],
 ['규정 선택','내 경우는 예외지.','선택적 규정, 폐기.','예외 없는 퇴근부터 합시다.'],
 ['퇴근 감시','벌써 가? 나는 아직인데.','퇴근 감시, 해제.','네 퇴근도 네가 결정해.']
];
const departments=['기획팀','영업팀','개발팀','운영팀','인사팀','재무팀','전략팀','홍보팀','총무팀','감사팀'];
const campaignRoster=careerGroups.flatMap(([rank,count],group)=>Array.from({length:count},(_,member)=>{
 if(rank==='최대 주주')return {name:'최대 주주',rank,department:'최종 결재',intro:finalBossLines[0],win:finalBossLines[1],reply:finalBossLines[2]};
 const [trait,intro,win,reply]=personalities[(member+group*3)%personalities.length];
 return {name:trait+' '+rank+' · '+departments[member],rank,department:departments[member],intro,win,reply};
}));
// Art direction follows the character's behavior, rather than only round number.
const characterStyles=[
 {faceWidth:60,jaw:8,eyeGap:28,eyeOpen:8,browTilt:-5,noseWidth:.8,mouth:'smirk',hair:'spiky',glasses:false,accessory:'earring',body:104,suit:'#344b58'},
 {faceWidth:65,jaw:-4,eyeGap:31,eyeOpen:6,browTilt:2,noseWidth:.85,mouth:'flat',hair:'messy',glasses:'round',accessory:'headset',body:98,suit:'#545164'},
 {faceWidth:59,jaw:13,eyeGap:26,eyeOpen:10,browTilt:-3,noseWidth:.7,mouth:'smirk',hair:'slick',glasses:'rimless',accessory:'lapel',body:111,suit:'#34414e'},
 {faceWidth:83,jaw:-8,eyeGap:33,eyeOpen:6,browTilt:0,noseWidth:1.25,mouth:'grin',hair:'wave',glasses:false,accessory:'blush',body:139,suit:'#61544a'},
 {faceWidth:75,jaw:3,eyeGap:29,eyeOpen:7,browTilt:4,noseWidth:1.2,mouth:'droop',hair:'part',glasses:false,accessory:'pens',body:125,suit:'#536152'},
 {faceWidth:57,jaw:16,eyeGap:26,eyeOpen:9,browTilt:-6,noseWidth:.75,mouth:'smirk',hair:'longpart',glasses:false,accessory:'earring',body:102,suit:'#5b455b'},
 {faceWidth:66,jaw:7,eyeGap:32,eyeOpen:13,browTilt:4,noseWidth:.9,mouth:'flat',hair:'curly',glasses:'round',accessory:'pens',body:113,suit:'#62665c'},
 {faceWidth:69,jaw:12,eyeGap:27,eyeOpen:7,browTilt:5,noseWidth:1.05,mouth:'droop',hair:'slick',glasses:'rimless',accessory:'moustache',body:119,suit:'#42534f'},
 {faceWidth:79,jaw:17,eyeGap:30,eyeOpen:8,browTilt:0,noseWidth:1.15,mouth:'flat',hair:'crop',glasses:'square',accessory:'tieclip',body:132,suit:'#3b4256'},
 {faceWidth:71,jaw:5,eyeGap:28,eyeOpen:5,browTilt:-4,noseWidth:1.1,mouth:'droop',hair:'receding',glasses:false,accessory:'moustache',body:117,suit:'#56514d'}
];
const trainingCoach={name:'길잡이 선임',intro:'혼자 버티느라 고생했다. 첫 대결 전에 주먹 쓰는 법부터 알려줄게.'};
function activeOpponentLook(){return typeof tutorial!=='undefined'&&tutorial>=0?{...opponentLooks[0],...characterStyles[4],accessory:'whistle',mouth:'grin',suit:'#48665d',glove:'#6b7661',badge:'길잡이 선임',age:32,hair:'crop',hairColor:'#392d26',outfit:'polo',body:110,faceWidth:65,glasses:false,beard:false}:opponentLooks[npc];}
const opponents=campaignRoster.map((person,index)=>({
 ...person,hint:index<30?'예고된 순서대로 공격 · 큰 준비 동작을 읽으세요':index<65?'고정 패턴에 변형 추가 · 얼굴과 복부를 구분하세요':'자동 조합 공격 · 연타 뒤 빈틈을 노리세요',
 taunts:[person.intro],patterns:[[['A'],['C'],['D']],[['A','C'],['D','A'],['B','D']],[['A','C','D'],['D','B'],['S','C','B']]]
}));
const opponentLooks=opponents.map((o,i)=>({
 body:105+(i%4)*8,face:68+(i%3)*6,
 suit:['#46525b','#41444f','#5e5749','#37494a'][i%4],
 glove:['#79433b','#4d5153','#775b40','#5b465e'][i%4],
 age:i<10?24+i%5:i<30?30+i%8:i<64?40+i%12:52+i%15,
 skinMid:['#c79c7c','#ba8969','#d3ad8e','#ad7c60','#c6a189'][i%5],skinHigh:['#d0a887','#c99c79','#e0bea0','#c29574','#d5b399'][i%5],
 clothPattern:['plain','plain','pinstripe','plain','check'][i%5],
 outfit:i<10?['hoodie','shirt','polo'][i%3]:i<20?['polo','shirt'][i%2]:'suit',glasses:i%4===1,beard:i>=40&&i%5===2,
 ...characterStyles[o.rank==='최대 주주'?9:personalities.findIndex(p=>o.name.startsWith(p[0]))],
 hairColor:i===99?'#bfc1b6':i<64?['#24272c','#493229','#302926'][i%3]:'#797b77',
 ...(i===0?{suit:'#344f58',hairColor:'#24272c'}:i===1?{suit:'#777184',hairColor:'#493229'}:i===3?{suit:'#695044',hairColor:'#302724'}:{}),
 ...(i===99?{suit:'#756652',accessory:'lapel',glasses:'rimless',clothPattern:'pinstripe',mouth:'smirk'}:{}),
 badge:o.rank,title:'ROUND '+(i+1)+' · '+o.name
}));
const hairNames={spiky:'삐죽 세운 짧은 머리',messy:'헝클어진 머리',slick:'뒤로 넘긴 머리',wave:'풍성한 웨이브',part:'단정한 가르마',longpart:'길게 내려온 옆머리',curly:'곱슬머리',crop:'짧게 자른 머리',receding:'넓은 이마'};
function appearanceOf(look){
 const face=look.faceWidth>75?'넓은 얼굴':look.jaw>10?'각진 턱':look.faceWidth<62?'갸름한 얼굴':'부드러운 턱선';
 const detail=look.glasses?(look.glasses==='square'?'사각 안경':look.glasses==='round'?'둥근 안경':'얇은 안경'):look.accessory==='headset'?'업무용 헤드셋':look.accessory==='earring'?'작은 귀걸이':'안경 없는 눈매';
 const pens=look.accessory==='pens'?'가슴 포켓의 펜 두 개':null;
 const outfit={hoodie:'후드티·안쪽 셔츠',shirt:'칼라 셔츠',polo:'폴로 셔츠',suit:'재킷·셔츠·넥타이'}[look.outfit];
 return [face,hairNames[look.hair],detail,...(look.glasses&&look.accessory==='headset'?['업무용 헤드셋']:[]),pens,outfit].filter(Boolean).join(' · ');
}
const shortHistories=[
 ['동료를 놀렸다가 임원의 칭찬을 받은 뒤, 웃기려면 누군가를 깎아내려야 한다고 믿게 됐다.','이제는 내 작은 실수도 사람들 앞에서 흉내 내며 비웃는다.'],
 ['답장이 늦었다고 혼난 뒤, 메신저 응답 속도에 집착하게 됐다.','이제는 내게 쉴 새 없이 메시지를 보내고 즉시 답하라고 다그친다.'],
 ['함께 쓴 보고서에서 이름이 빠진 뒤, 공로를 먼저 차지하려 들었다.','이제는 내가 만든 결과물에서도 내 이름을 지운다.'],
 ['회식에서 거래를 따내 칭찬받은 뒤, 술자리가 곧 실력이라고 믿게 됐다.','이제는 퇴근한 나까지 불러내 끝까지 술을 마시게 한다.'],
 ['아픈 동료를 대신해 일하다가, 부탁하면 남이 해준다는 걸 배웠다.','이제는 자기 업무를 내 책상에 놓고 먼저 퇴근한다.'],
 ['우연히 들은 팀 개편 소식으로 위기를 피한 뒤, 소문을 힘으로 삼았다.','이제는 내 이야기도 부풀려 뒤에서 퍼뜨린다.'],
 ['오탈자 하나로 오래 혼난 뒤, 작은 흠도 용납하지 못하게 됐다.','이제는 내 완성본을 끝없이 돌려보내며 처음부터 다시 하라고 한다.'],
 ['상사의 구두 지시를 따랐다 혼자 징계받은 뒤, 책임부터 피하게 됐다.','이제는 나에게 시킨 일도 자기는 지시한 적 없다고 잡아뗀다.'],
 ['야근 수당을 규정 때문에 받지 못한 뒤, 자기에게 유리한 예외만 찾게 됐다.','이제는 내게만 규정을 들이대고 자기 일에는 예외를 적용한다.'],
 ['야근하던 자신보다 먼저 퇴근한 동료가 승진하자, 회사에 오래 남는 데 집착했다.','이제는 내 퇴근 시간을 감시하며 눈치를 준다.']
];
opponents.forEach((o,i)=>{
 const trait=personalities.findIndex(p=>o.name.startsWith(p[0])),look=opponentLooks[i];
 const [change,incident]=shortHistories[Math.max(0,trait)];
 o.history=i===99?{title:'최대 주주',origin:'이 회사의 최대 주주는 사원들의 시간을 자기 소유로 여겼다.',change:'회사를 사들이며 직원보다 숫자만 보게 됐다.',incident:'고용계약서 마지막 장에 결투 조항을 넣고도, 내가 여기까지 올 줄은 몰랐다.'}:{title:o.name,origin:o.rank==='동기'?'처음에는 서로 일을 도와주며 친하게 지내던 동료였다.':'처음에는 '+o.department+'에서 나를 도와주던 '+o.rank+'이었다.',change,incident};
 o.appearance=appearanceOf(look);
});
function patternForOpponent(){
 const tier=ep/epMax>.75?0:ep/epMax>.375?1:2,rank=npc/(opponents.length-1);
 const specs={A:{lane:-1,side:-1,body:false},C:{lane:0,side:1,body:false},D:{lane:1,side:1,body:false},B:{lane:-1,side:-1,body:true},S:{lane:1,side:1,body:true}};
 const fixed=opponents[npc].patterns[difficulty==='easy'?0:tier].map(p=>p.map(k=>({...specs[k]})));
 // Easy always repeats a readable sequence; later ranks mix in generated combinations.
 const chance=difficulty==='easy'?0:difficulty==='hard'?.35+rank*.65:Math.max(0,(rank-.25)*.9);
 if(Math.random()>=chance)return fixed;
 const length=difficulty==='hard'?2+Math.floor(rank*2):2+Math.floor(rank);
 const keys=Object.keys(specs),pattern=[];
 for(let i=0;i<length;i++){
  const available=keys.filter(k=>i<2||!(k===pattern[i-1]&&k===pattern[i-2]));
  pattern.push(available[Math.floor(Math.random()*available.length)]);
 }
 return [pattern.map(k=>({...specs[k]}))];
}
function selectOpponent(index){
 if(run)return;resetMovement();npc=index;$('#name').textContent=opponents[npc].name;$('#opponentHint').textContent=opponents[npc].hint;
 document.querySelectorAll('.pick').forEach(b=>{b.classList.toggle('selected',+b.dataset.n===npc);b.setAttribute('aria-pressed',String(+b.dataset.n===npc));});
 $('#title').textContent=opponentLooks[npc].title;
 $('#desc').textContent=opponents[npc].intro;$('#results').hidden=true;$('#resultScore').hidden=true;koPose=0;ep=epMax=opponentHealthMax(npc);hp=hpMax=playerHealthMax();hit=0;impact=null;attack=null;papers=[];particles=[];refreshBest();
}
function deputyDetails(){
 // Swept hair and asymmetric smile make the second silhouette readable.
 polygon([[-65,196],[-38,162],[21,158],[65,191],[12,182],[-12,202]],'#31302c');
 if(ep>80&&hit<=0&&!(tauntUntil>t&&run)){g.strokeStyle='#65492e';g.lineWidth=3;g.beginPath();g.moveTo(-12,300);g.quadraticCurveTo(22,315,40,291);g.stroke();}
}
function customerDetails(){
 // Slick hair, moustache and a loud collar distinguish the customer.
 polygon([[-73,196],[-43,167],[20,162],[72,191],[25,183],[-15,192]],'#242622');
 ellipse(-13,296,15,5,'#38332b');ellipse(13,296,15,5,'#38332b');
 if(ep/epMax<2/3){g.strokeStyle='#c48b63';g.lineWidth=2;g.beginPath();g.moveTo(-57,218);g.lineTo(-35,216);g.moveTo(35,216);g.lineTo(57,218);g.stroke();}
}

function opponentHealthMax(index){return 10+Math.max(0,careerGroups.findIndex(([rank])=>rank===opponents[index].rank));}
