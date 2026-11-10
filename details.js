let officeBackdrop=null;
if(typeof Image!=='undefined'){officeBackdrop=new Image();officeBackdrop.src='assets/backgrounds/office-night.png';}
function drawOfficeBackdrop(){
 if(!officeBackdrop?.complete||!officeBackdrop.naturalWidth)return false;
 g.drawImage(officeBackdrop,0,0,1000,590);
 // Keep foreground gloves and timing marks distinct from the environment.
 const veil=g.createLinearGradient(0,0,0,590);veil.addColorStop(0,'#0b17252b');veil.addColorStop(.55,'#0b17250d');veil.addColorStop(1,'#08121d55');g.fillStyle=veil;g.fillRect(0,0,1000,590);
 if(typeof companyDuelMode!=='undefined'&&companyDuelMode){
  const alarm=g.createLinearGradient(0,0,1000,0);alarm.addColorStop(0,'#9d2d2829');alarm.addColorStop(.25,'#9d2d2800');alarm.addColorStop(.75,'#9d2d2800');alarm.addColorStop(1,'#9d2d2829');g.fillStyle=alarm;g.fillRect(0,0,1000,590);
 }
 return true;
}
// Canvas layers share the game's drawing helpers; no external image assets.
function polygon(points,color){g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function officeDetails(){
 rect(40,175,190,156,'#344338');rect(49,184,172,138,'#1b2823');
 for(let i=0;i<4;i++){rect(62+i*38,208,24,42,i%2?'#d7d7a7':'#a2b6a0');rect(67+i*38,216,13,3,'#687760');}
 text('이번 주도 파이팅…',135,285,13,'#879b80');
 rect(804,204,152,144,'#354139');rect(815,215,130,123,'#56634d');
 text('업무 현황',880,237,14,'#d9dfc6');for(let i=0;i<3;i++){rect(828,252+i*23,12,12,'#a7b88c');rect(849,255+i*23,76,4,'#7c8e69');}
 rect(70,365,170,13,'#727456');rect(90,378,12,115,'#2a3328');rect(212,378,12,115,'#2a3328');
 rect(116,302,82,58,'#101a18');rect(122,308,70,43,'#3c695e');rect(148,360,16,5,'#9d9e7c');
 rect(77,343,25,20,'#c3bb91');ellipse(90,343,13,4,'#ded4a3');
 rect(770,379,208,13,'#727456');for(let i=0;i<4;i++)rect(793+i*3,363-i*4,66,5,'#c7c8ae');
 rect(900,327,30,51,'#9d9b70');ellipse(915,326,18,6,'#d1c6a0');
 rect(355,79,290,5,'#b6c6a1');rect(365,84,270,3,'#d9e8b8');
}
function shirtDetails(){
 polygon([[-28,327],[-66,352],[-28,382],[0,345]],'#f5f0dd');
 polygon([[28,327],[66,352],[28,382],[0,345]],'#d4d9c9');
 g.strokeStyle='#93a397';g.lineWidth=2;g.beginPath();g.moveTo(-70,396);g.lineTo(-43,432);g.moveTo(67,394);g.lineTo(48,438);g.stroke();
 rect(54,397,44,34,'#d9dfcf');rect(57,401,38,5,'#536b59');text(activeOpponentLook().badge,76,422,9,'#344b40');
 for(let y=390;y<510;y+=30)ellipse(9,y,2,2,'#9aa494');
}
function faceDetails(){
 ellipse(-52,279,17,8,'#d8916c33');ellipse(52,279,17,8,'#d8916c33');
 g.strokeStyle='#b57b56';g.lineWidth=2;g.beginPath();g.moveTo(-51,285);g.quadraticCurveTo(-44,294,-45,302);g.moveTo(51,285);g.quadraticCurveTo(44,294,45,302);g.stroke();
 if(ep>=80&&hit<=0){rect(-20,305,39,5,'#f2dec0');}
 if(tauntUntil>t&&run&&hit<=0){ellipse(0,307,16,5+Math.abs(Math.sin(t*14))*7,'#62442f');}
}
const activeSounds=new Set();
function impactSound(kind){
 if(muted||paused)return;
 try{
 audio??=new AudioContext();audio.resume();
 const presets={swing:[180,.07,.035,1500],punch:[95,.16,.23,1200],counter:[58,.28,.34,1500],guard:[180,.10,.13,420],perfect:[740,.12,.10,2100],hurt:[52,.22,.24,500],ko:[45,.40,.27,1200]};
 const [freq,duration,volume,cutoff]=presets[kind]||presets.punch;
 const source=audio.createBufferSource(),buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
 source.buffer=buffer;const filter=audio.createBiquadFilter(),gain=audio.createGain();filter.type='lowpass';filter.frequency.value=cutoff;gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);source.connect(filter).connect(gain).connect(audio.destination);
 activeSounds.add(source);source.onended=()=>{activeSounds.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start();
 const tone=audio.createOscillator(),envelope=audio.createGain();tone.frequency.setValueAtTime(freq,audio.currentTime);tone.frequency.exponentialRampToValueAtTime(30,audio.currentTime+duration);envelope.gain.setValueAtTime(volume*.7,audio.currentTime);envelope.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);tone.connect(envelope).connect(audio.destination);activeSounds.add(tone);tone.onended=()=>{activeSounds.delete(tone);tone.disconnect();envelope.disconnect();};tone.start();tone.stop(audio.currentTime+duration);
 }catch{}
}
function silenceEffects(){for(const source of activeSounds){try{source.stop()}catch{}}activeSounds.clear();}
function drawContact(){
 if(!contact||contact.guarded)return;
 const {x,y,life,strong,guarded}=contact;
 g.save();g.globalAlpha=Math.min(1,life*7);g.strokeStyle=guarded?'#d1cdb3':strong?'#dac6a0':'#fff2c9';g.lineWidth=strong?5:3;
 const count=strong?12:6,radius=(strong?40:22)+(1-life/.3)*15;
 for(let i=0;i<count;i++){const angle=i*Math.PI*2/count;g.beginPath();g.moveTo(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius);g.lineTo(x+Math.cos(angle)*(radius+(strong?35:14)),y+Math.sin(angle)*(radius+(strong?35:14)));g.stroke();}
 if(guarded)text('CLASH',x,y-45,16,'#d1cdb3');g.restore();
}

function playCompanySiren(){
 if(muted||paused)return;
 try{
  audio??=new AudioContext();audio.resume();const tone=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;
  tone.type='triangle';for(let i=0;i<=8;i++)tone.frequency.linearRampToValueAtTime(i%2?880:440,now+i*.3);
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.08,now+.08);gain.gain.setValueAtTime(.08,now+2.2);gain.gain.linearRampToValueAtTime(0,now+2.5);
  tone.connect(gain).connect(audio.destination);activeSounds.add(tone);tone.onended=()=>{activeSounds.delete(tone);tone.disconnect();gain.disconnect();};tone.start();tone.stop(now+2.5);
 }catch{}
}
