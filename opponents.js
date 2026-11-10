const finalBossLines=['네 노동도 이 회사도 전부 내 자산이야.','최대 주주 KO · 경영권 인수!','그 지분, 퇴직금 대신 받아가겠습니다.'];
const careerGroups=[
 ['동기',10],['선임',10],['대리',10],['과장',10],['계장',8],['차장',8],['부장',8],
 ['파트장',6],['부사장',5],['사장 비서',4],['사장',4],['이사',6],['대표 이사',10],['최대 주주',1]
];
const personalities=[
 ['깐족왕','너 아직도 그거 못 끝냈어?','남 일 구경은 여기까지.','남 걱정 말고 네 일부터 해.'],
 ['메신저 폭격','답장 왜 안 해? 방금 보냈잖아.','알림 폭격, 차단.','업무 시간에만 답합니다.'],
 ['공로 수집','이건 내가 한 걸로 보고할게.','공로 회수 완료.','제 이름부터 돌려놓으세요.'],
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
const trainingCoach={name:'길잡이 선임',intro:'주먹부터 배우고 가자. 깐족대는 동기가 기다린다.'};
function activeOpponentLook(){return typeof tutorial!=='undefined'&&tutorial>=0?{...opponentLooks[0],...characterStyles[4],accessory:'whistle',mouth:'grin',suit:'#48665d',glove:'#6b7661',badge:'길잡이 선임',age:32,hair:'crop',hairColor:'#392d26',outfit:'polo',body:110,faceWidth:65,glasses:false,beard:false}:opponentLooks[npc];}
const opponents=campaignRoster.map((person,index)=>({
 ...person,hint:index<30?'예고된 순서대로 공격 · 큰 준비 동작을 읽으세요':index<65?'고정 패턴에 변형 추가 · 얼굴과 복부를 구분하세요':'자동 조합 공격 · 연타 뒤 빈틈을 노리세요',
 taunts:[person.intro],patterns:[[['A'],['C'],['D']],[['A','C'],['D','A'],['B','D']],[['A','C','D'],['D','B'],['S','C','B']]]
}));
const opponentLooks=opponents.map((o,i)=>({
 wind:1.35-(i/99)*.54,body:105+(i%4)*8,face:68+(i%3)*6,
 suit:['#46525b','#41444f','#5e5749','#37494a'][i%4],
 glove:['#79433b','#4d5153','#775b40','#5b465e'][i%4],
 age:i<10?24+i%5:i<30?30+i%8:i<64?40+i%12:52+i%15,
 skinMid:['#c79c7c','#ba8969','#d3ad8e','#ad7c60','#c6a189'][i%5],skinHigh:['#d0a887','#c99c79','#e0bea0','#c29574','#d5b399'][i%5],
 clothPattern:['plain','plain','pinstripe','plain','check'][i%5],
 outfit:i<10?['hoodie','shirt','polo'][i%3]:i<20?['polo','shirt'][i%2]:'suit',glasses:i%4===1,beard:i>=40&&i%5===2,
 ...characterStyles[o.rank==='최대 주주'?9:personalities.findIndex(p=>o.name.startsWith(p[0]))],
 hairColor:i===99?'#bfc1b6':i<64?['#24272c','#493229','#302926'][i%3]:'#797b77',
 ...(i===99?{suit:'#756652',accessory:'lapel',glasses:'rimless',clothPattern:'pinstripe',mouth:'smirk'}:{}),
 badge:o.rank,title:'ROUND '+(i+1)+' · '+o.name
}));
// Biography and on-screen appearance share the same character direction.
const pastLives=[
 ['칭찬에 중독된 신입','입사 첫날, 동료의 실수를 웃기게 흉내 냈다가 임원에게 칭찬을 받았다.','그 뒤로 웃음이 끊길까 두려워 누군가를 매일 놀림거리로 만들었다.'],
 ['꺼지지 않는 초록 불','수습 때 메신저 답장이 3분 늦었다는 이유로 불려 갔다.','살아남으려고 알림을 감시하다가, 이제는 남의 침묵을 견디지 못하는 사람이 됐다.'],
 ['지워진 공동 작성자','첫 프로젝트 보고서에서 자신의 이름이 빠지는 일을 겪었다.','다시는 빼앗기지 않겠다며 시작한 일이, 남의 공로까지 자기 이름으로 바꾸는 습관이 됐다.'],
 ['첫 잔의 대가','첫 회식에서 노래 한 곡으로 거래를 따냈다는 무용담이 생겼다.','그 한 번의 행운을 실력으로 믿고, 모든 문제를 술자리로 해결하려 들었다.'],
 ['부탁의 달인','입사 초기에는 아픈 동료 대신 밤새 일을 마무리하던 사람이었다.','고맙다는 말 한마디가 사람을 움직이는 걸 배운 뒤로, 부탁하는 쪽에만 서기 시작했다.'],
 ['탕비실의 정보원','팀 개편 소식을 남들보다 먼저 들은 덕분에 위기를 피했다.','정보가 힘이라고 믿은 순간부터, 확인되지 않은 소문도 거래하기 시작했다.'],
 ['빨간 펜의 저주','첫 기획안에서 오탈자 하나를 놓쳐 한 달 내내 혼났다.','완벽하면 안전할 거라 믿었지만, 이제는 남의 완성본에서 흠을 찾는 데 하루를 쓴다.'],
 ['회의록에서 사라진 이름','상사의 구두 지시를 따랐다가 혼자 징계를 받았다.','책임을 피하는 법을 익힌 뒤, 자신이 내린 지시마저 기억나지 않는다고 말한다.'],
 ['규정집의 빈칸','야근 수당을 신청했다가 사규의 작은 예외 조항에 가로막혔다.','규정을 바꾸는 대신 빈틈을 외웠고, 지금은 자기에게만 그 빈틈을 열어 둔다.'],
 ['불 꺼진 사무실의 파수꾼','혼자 남아 야근하던 날, 먼저 퇴근한 동료가 승진했다.','노력보다 눈에 보이는 체류 시간이 중요하다고 믿게 돼, 남의 퇴근부터 세기 시작했다.']
];
const departmentIncidents=[
 '기획안 최종 발표 전날', '거래처 재계약을 앞둔 주', '새 기능 출시가 밀리던 밤', '장애 보고서를 제출하던 새벽',
 '인사 평가표가 돌던 오후', '분기 결산이 끝나던 날', '조직 개편안이 유출된 날', '회사 홍보 영상 촬영 날',
 '사무실 이사를 준비하던 주', '내부 감사 자료를 모으던 밤'
];
const careerMemories=[
 '동기들끼리 서로 도와주자던 입사 단체방은 이제 읽고도 답하지 않는 방이 됐다.',
 '처음 후배를 맡았을 때 만든 인수인계 파일은, 어느새 후배의 실수를 적는 장부로 바뀌었다.',
 '대리 명함을 받은 날 자신에게도 후배가 생겼다며, 예전에 싫어하던 상사의 말투부터 따라 했다.',
 '과장으로 승진할 때 팀원들의 야근으로 실적을 채웠고, 인사 발표에서는 혼자 꽃다발을 받았다.',
 '첫 결재 도장을 받은 뒤로 문서 한 장을 돌려보내는 데서 자기 존재감을 찾았다.',
 '차장 승진에서 한 번 밀린 뒤로, 경쟁자의 실수만 모아 두는 개인 폴더가 생겼다.',
 '부장이 되던 날 약속했던 정시 퇴근제는 첫 주 실적 회의에서 없던 이야기가 됐다.',
 '파트를 맡은 뒤 직접 작업하던 책상은 사라지고, 팀원들의 접속 시간을 띄운 모니터가 놓였다.',
 '부사장 취임식에서는 사람을 먼저 보겠다고 했지만, 다음 날 가장 먼저 인건비 표를 열었다.',
 '사장실 앞자리로 옮긴 뒤로 회의실에 들어갈 수 있는 사람과 기다릴 사람을 나누기 시작했다.',
 '사장 취임 사진의 환한 웃음 뒤에는, 직원 휴게실을 임원 라운지로 바꾼 첫 결재가 남아 있다.',
 '이사회에 처음 참석한 날, 회의록에서 직원들의 항의는 기타 의견 두 글자로 줄어들었다.',
 '대표 이사 선임 때 약속한 성과 공유는, 주주들에게만 보내는 배당 안내문이 됐다.',
 '회사 이름보다 보유 지분율을 먼저 말하는 사람이 됐다.'
];
const hairNames={spiky:'삐죽 세운 짧은 머리',messy:'헝클어진 머리',slick:'뒤로 넘긴 머리',wave:'풍성한 웨이브',part:'단정한 가르마',longpart:'길게 내려온 옆머리',curly:'곱슬머리',crop:'짧게 자른 머리',receding:'넓은 이마'};
function appearanceOf(look){
 const face=look.faceWidth>75?'넓은 얼굴':look.jaw>10?'각진 턱':look.faceWidth<62?'갸름한 얼굴':'부드러운 턱선';
 const detail=look.glasses?(look.glasses==='square'?'사각 안경':look.glasses==='round'?'둥근 안경':'얇은 안경'):look.accessory==='headset'?'업무용 헤드셋':look.accessory==='earring'?'작은 귀걸이':'안경 없는 눈매';
 return [face,hairNames[look.hair],detail].join(' · ');
}
opponents.forEach((o,i)=>{
 const trait=personalities.findIndex(p=>o.name.startsWith(p[0])),look=opponentLooks[i];
 const [title,origin,change]=pastLives[Math.max(0,trait)];
 o.history=i===99?{title:'회사를 숫자로만 보던 사람',origin:'첫 회사를 인수할 때, 직원들의 야근을 비용 절감이라는 숫자로만 계산했다.',change:'합병을 거듭해 최대 주주가 된 뒤에도 직원 이름은 외우지 않았다. 대신 전 직원의 시간을 자기 소유라고 여겼다.',incident:'지분 100%를 건 사내 결투 조항을 만든 것도 이 사람이다. 아무도 여기까지 오지 못할 거라 믿었다.'}:{title:o.department+' · '+title,origin,change,incident:departmentIncidents[i%10]+', '+o.department+'의 '+o.rank+'인 그는 “'+o.intro+'”라는 말을 남겼다. 그날 떠넘겨진 일의 마지막 수신자가 나였다.'};
 if(i!==99)o.history.change+=' '+careerMemories[careerGroups.findIndex(([rank])=>rank===o.rank)];
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
