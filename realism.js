// Layered Canvas artwork keeps the combat poses responsive at any resolution.
function shade(x1,y1,x2,y2,stops){const paint=g.createLinearGradient(x1,y1,x2,y2);for(const [at,color] of stops)paint.addColorStop(at,color);return paint;}
function toneColor(hex,delta){const value=parseInt(hex.slice(1),16);return '#'+[16,8,0].map(shift=>Math.max(0,Math.min(255,((value>>shift)&255)+delta)).toString(16).padStart(2,'0')).join('');}
function pathShape(color,draw,stroke=null,width=1){g.beginPath();draw();g.closePath();g.fillStyle=color;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
function curveLine(points,color,width=1){g.beginPath();g.moveTo(points[0],points[1]);g.bezierCurveTo(...points.slice(2));g.strokeStyle=color;g.lineWidth=width;g.stroke();}
function inDialogue(){return typeof dialogue!=='undefined'&&(dialogue.active||prologue.active);}
function leatherGlove(x,y,color,scale=1,side=1,turn=0,foreshorten=1){
 g.save();g.translate(x,y);g.rotate(turn+side*-.07);g.scale(scale,scale*foreshorten);
 // The thumb is a separate, attached volume rather than another round fist.
 const leather=shade(-48,-50,45,50,[[0,'#14191c'],[.23,color],[.52,color],[.87,'#11171b'],[1,'#080e11']]);
 pathShape(leather,()=>{g.moveTo(-36,30);g.bezierCurveTo(-50,11,-52,-24,-39,-42);g.bezierCurveTo(-29,-57,20,-59,36,-43);g.bezierCurveTo(47,-31,47,7,33,34);g.lineTo(28,55);g.lineTo(-30,55);},'#101315',2);
 const thumb=shade(-48,0,5,31,[[0,'#0c1114'],[.5,color],[1,'#20282b']]);
 g.save();g.scale(side,1);pathShape(thumb,()=>{g.moveTo(-35,-8);g.bezierCurveTo(-49,-9,-55,4,-48,20);g.bezierCurveTo(-42,34,-24,36,-19,24);g.bezierCurveTo(-14,12,-24,-3,-35,-8);},'#171c1f',1.5);g.restore();
 // Broad, restrained specular light and fine leather creases.
 pathShape('#ffffff16',()=>{g.moveTo(-31,-40);g.bezierCurveTo(-14,-55,16,-51,27,-36);g.bezierCurveTo(7,-44,-9,-39,-31,-32);});
 curveLine([-31,-24,-17,-34,11,-34,28,-25],'#ffffff22',1.2);
 curveLine([-34,20,-12,27,9,25,28,19],'#080d11aa',2);
 curveLine([-33,25,-10,32,10,29,28,25],'#ffffff17',1);
 for(let i=0;i<5;i++)curveLine([-20+i*9,-44,-24+i*9,-36,-22+i*9,-30,-22+i*9,-24],'#10161c44',.7);
 // Dark wrist strap, edge stitching and manufacturer patch.
 const strap=shade(0,33,0,62,[[0,'#10161a'],[.45,'#3c454a'],[1,'#171e22']]);
 pathShape(strap,()=>{g.moveTo(-32,34);g.lineTo(33,34);g.lineTo(30,61);g.lineTo(-32,59);},'#090e12',1.5);
 for(let i=0;i<12;i++){rect(-27+i*4.4,38,1.8,1,'#9a9d9655');rect(-27+i*4.4,55,1.8,1,'#9a9d9655');}
 rect(-16,42,31,10,'#a5a38f');rect(-11,46,21,2,'#343a36');curveLine([-29,-5,-34,6,-28,15,-21,19],'#d6c0a533',.9);for(let i=0;i<28;i++){const px=-29+(i*17%57),py=-31+(i*11%44);ellipse(px,py,.35,.5,'#fff4df12');}
 g.restore();
}
function drawSleeve(side,phase,active){
 if(active)return;
 const look=activeOpponentLook(),cloth=look.outfit==='suit'?'#b3bbb9':look.suit,skin=look.skinMid;
 const elbow={x:look.body+2,y:426},wrist={x:look.body-8,y:518};
 g.save();g.scale(side,1);
 anatomicalLimb(look.body*.70,353,elbow.x,elbow.y,26,18,cloth,'sleeve',side);
 anatomicalLimb(elbow.x,elbow.y,wrist.x,wrist.y,21,12,skin,'forearm',side);
 rolledCuff(elbow.x,elbow.y,wrist.x,wrist.y,21,cloth);
 // Relaxed palm and staggered fingers keep conversation poses human as well.
 pathShape(shade(wrist.x-12,520,wrist.x+13,557,[[0,toneColor(skin,14)],[.55,skin],[1,toneColor(skin,-25)]]),()=>{
  g.moveTo(wrist.x-11,514);g.bezierCurveTo(wrist.x-18,524,wrist.x-18,538,wrist.x-13,547);
  g.lineTo(wrist.x-6,560);g.quadraticCurveTo(wrist.x-1,564,wrist.x+1,557);
  g.quadraticCurveTo(wrist.x+7,563,wrist.x+9,553);g.quadraticCurveTo(wrist.x+14,556,wrist.x+15,545);
  g.lineTo(wrist.x+13,526);g.quadraticCurveTo(wrist.x+6,521,wrist.x+11,515);
 },toneColor(skin,-30),.7);
 curveLine([wrist.x-7,539,wrist.x-3,544,wrist.x-1,551,wrist.x+1,557],toneColor(skin,-30)+'66',.8);
 curveLine([wrist.x+2,538,wrist.x+6,544,wrist.x+7,549,wrist.x+9,553],toneColor(skin,-30)+'66',.8);
 g.restore();
}
function drawRealFace(){
 const look=activeOpponentLook(),young=look.age<35,w=look.faceWidth,health=ep/epMax;
 g.save();g.translate(0,333);g.scale(.90,.96);g.translate(0,-333);g.translate(0,young?9:0);g.translate(hit?reactionSide*hit*18:0,lastHitTarget==='chin'?-hit*48:lastHitTarget==='body'?hit*32:0);g.translate(0,248);g.rotate(hit?reactionSide*hit*.22:0);g.translate(0,-248);
 ellipse(-w+1,255,11,21,'#a36f56');ellipse(w-1,255,11,21,'#8e604d');
 const skin=shade(-w,192,w,290,[[0,'#916c55'],[.25,look.skinHigh],[.48,look.skinMid],[.75,'#b28266'],[1,'#6a4b3d']]);
 pathShape(skin,()=>{g.moveTo(-w+7,211);g.bezierCurveTo(-w-5,241,-w+4,280,-w+18,306);g.bezierCurveTo(-w+30,330,-26+look.jaw,343,0,343);g.bezierCurveTo(31-look.jaw,343,w-2,322,w-5,280);g.bezierCurveTo(w+7,251,w+4,221,w-9,202);g.bezierCurveTo(w-23,176,-w+32,174,-w+7,211);},'#4c3b33',1);
 // Soft specular planes and cast shadows separate forehead, cheeks and jaw.
 pathShape('#f1d2aa1a',()=>{g.moveTo(-w+22,221);g.quadraticCurveTo(-31,196,3,204);g.lineTo(-8,235);g.quadraticCurveTo(-38,227,-w+22,241);});
 pathShape('#24232e20',()=>{g.moveTo(-w+10,218);g.quadraticCurveTo(0,202,w-11,219);g.lineTo(w-15,234);g.quadraticCurveTo(0,215,-w+15,233);});
 pathShape('#f8d5ab20',()=>{g.moveTo(-w+16,266);g.quadraticCurveTo(-37,258,-19,274);g.quadraticCurveTo(-31,288,-w+22,285);});
 pathShape('#211f2924',()=>{g.moveTo(-w+20,309);g.quadraticCurveTo(0,345,w-17,309);g.quadraticCurveTo(0,354,-w+20,309);});
 // Cheek planes, temples and jaw shading.
 pathShape('#63473a40',()=>{g.moveTo(-w+8,237);g.bezierCurveTo(-w+24,253,-w+30,278,-w+18,299);g.lineTo(-w+5,274);});
 pathShape('#503e3544',()=>{g.moveTo(w-8,238);g.bezierCurveTo(w-30,262,w-30,282,w-22,308);g.bezierCurveTo(w-2,288,w+1,260,w-8,238);});
 ellipse(-29,246,24,13,'#634b3d55');ellipse(30,246,24,13,'#59433566');
 for(const side of [-1,1]){
  const ex=side*look.eyeGap,closed=hit>0||ep<=0;
  if(closed){curveLine([ex-15,249,ex-5,246,ex+7,246,ex+16,250],'#352d28',2.8);}
  else{
   pathShape('#d2c8b3',()=>{g.moveTo(ex-16,249);g.quadraticCurveTo(ex,health<.34?235:249-look.eyeOpen,ex+17,249);g.quadraticCurveTo(ex,258,ex-16,249);});
   ellipse(ex+(npc%3===1?2:0),249,5.2,6.2,'#4c473d');ellipse(ex+(npc%3===1?2:0),249,2.6,4.2,'#141a1b');ellipse(ex-1,247,1,1,'#d6d5c6');
   curveLine([ex-17,249,ex-8,239,ex+8,240,ex+18,249],'#463b32',2);
  }
  curveLine([ex-20,232,ex-6,health<.34?224:230+side*look.browTilt,ex+6,health<.34?226:230-side*look.browTilt,ex+19,228],'#302e29',4.5);
  if(!young)curveLine([ex-16,261,ex-5,265,ex+7,264,ex+17,260],'#805f4c88',1.2);
 }
 // Nose bridge and nostrils.
 g.save();g.scale(look.noseWidth,1);
 pathShape('#e4b48c66',()=>{g.moveTo(-5,248);g.lineTo(-11,277);g.quadraticCurveTo(0,284,7,277);g.lineTo(3,247);});
 curveLine([7,252,8,266,17,280,10,284],'#7a5541',1.5);ellipse(-8,282,4,2,'#624635');ellipse(10,282,4,2,'#624635');g.restore();
 if(!young)curveLine([-21,286,-29,290,-31,303,-27,310],'#7b594788',1.2);if(!young)curveLine([24,284,31,292,34,302,30,309],'#70503f88',1.2);
 // A restrained mouth; no painted smile or cartoon knockout eyes.
 const mouthY=hit?310:306;
 const mouthCurve=look.mouth==='droop'?-7:look.mouth==='grin'?11:look.mouth==='smirk'?6:0;
 curveLine([-25,mouthY,-9,mouthY+mouthCurve,11,mouthY+mouthCurve,27,mouthY-(look.mouth==='smirk'?7:0)],'#654539',2.4);
 if(look.mouth==='grin'&&!hit){pathShape('#ddd6c4',()=>{g.moveTo(-21,mouthY+1);g.quadraticCurveTo(0,mouthY+14,23,mouthY);g.quadraticCurveTo(0,mouthY+7,-21,mouthY+1);});}
 curveLine([-14,mouthY+8,-4,mouthY+11,8,mouthY+10,17,mouthY+6],'#edbd9444',2);
 if(ep/epMax<1/3||ep<=0)ellipse(1,mouthY+2,10,4,'#473a32');
 if(!young)for(let i=0;i<3;i++)curveLine([-31,213+i*5,-13,210+i*5,10,212+i*5,29,211+i*5],'#805f483f',.8);
 // Hair volume, hairline and accessories belong to each person's profile.
 const hc=look.hairColor;
 pathShape(shade(-w,170,w,230,[[0,hc],[.6,hc],[1,'#121820']]),()=>{
  if(look.hair==='receding'){
   g.moveTo(-w+2,239);g.bezierCurveTo(-w-7,211,-w+1,185,-w+25,185);g.bezierCurveTo(-w+13,203,-w+15,224,-w+10,241);g.closePath();
   g.moveTo(w-2,239);g.bezierCurveTo(w+7,211,w-1,185,w-25,185);g.bezierCurveTo(w-13,203,w-15,224,w-10,241);return;
  }
  g.moveTo(-w+2,239);g.lineTo(-w-4,199);
  if(look.hair==='spiky'){for(let j=0;j<6;j++){g.lineTo(-w+j*w/3,170+(j%2)*8);g.lineTo(-w+(j+.5)*w/3,191);}g.lineTo(w+5,201);}else g.bezierCurveTo(-w+6,161,w-8,158,w+5,201);
  if(['fringe','spiky','messy','longpart'].includes(look.hair)){g.lineTo(w-13,207);g.lineTo(22,228);g.lineTo(29,206);g.lineTo(-12,232);g.lineTo(-5,208);g.lineTo(-w+14,229);}
  else if(look.hair==='wave'){g.bezierCurveTo(w-15,184,19,222,1,201);g.bezierCurveTo(-20,184,-27,221,-w+12,218);}
  else if(look.hair==='buzz'){g.lineTo(w-10,203);g.quadraticCurveTo(0,186,-w+12,207);}
  else if(look.hair==='crop'){g.lineTo(w-12,212);g.lineTo(-w+12,204);}
  else{g.lineTo(w-13,211);g.quadraticCurveTo(18,186,-w+13,222);}
  g.lineTo(-w+10,244);
 },'#18201d',1.3);
 if(look.hair==='curly')for(let j=0;j<8;j++)ellipse(-w+10+j*(2*w-20)/7,178+j%2*5,13,17,hc);
 if(look.hair!=='receding')for(let i=0;i<7;i++)curveLine([-w+17+i*13,190,-w+20+i*12,178,-w+24+i*11,190,-w+26+i*10,199],'#ffffff19',1);
 if(look.glasses){g.strokeStyle=look.glasses==='rimless'?'#a5aaa4':'#272f38';g.lineWidth=look.glasses==='rimless'?1.2:3;
  if(look.glasses==='round'){for(const side of [-1,1]){g.beginPath();g.ellipse(side*31,250,23,21,0,0,Math.PI*2);g.stroke();}}
  else{g.strokeRect(-54,235,45,28);g.strokeRect(9,235,45,28);}
  curveLine([-9,246,-3,242,3,242,9,246],g.strokeStyle,2);
  curveLine([-47,239,-36,236,-25,239,-15,239],'#f0ebdb55',1);
 }
 if(look.accessory==='earring'){g.strokeStyle='#c0b99f';g.lineWidth=2;g.beginPath();g.arc(w+1,273,6,0,Math.PI*2);g.stroke();}
 if(look.accessory==='headset'){g.strokeStyle='#29343b';g.lineWidth=6;g.beginPath();g.arc(0,224,w+9,Math.PI,Math.PI*2);g.stroke();rect(w-2,244,12,30,'#202c36');curveLine([w+2,265,w,281,39,291,29,293],'#27343d',4);ellipse(28,293,6,4,'#151f28');}
 if(look.accessory==='blush'){ellipse(-w+25,279,19,9,'#b86d5744');ellipse(w-25,279,19,9,'#b86d5744');}
 if(look.accessory==='moustache'){pathShape('#493b35',()=>{g.moveTo(-24,295);g.quadraticCurveTo(-10,285,0,293);g.quadraticCurveTo(12,285,25,296);g.lineTo(18,300);g.quadraticCurveTo(0,297,-19,301);});}
 if(look.beard){pathShape('#493b3577',()=>{g.moveTo(-w+13,290);g.quadraticCurveTo(0,355,w-13,290);g.lineTo(w-23,320);g.quadraticCurveTo(0,354,-w+23,320);});}
 if(young&&!hit&&look.mouth==='smirk'){curveLine([-20,306,-7,311,13,308,28,299],'#684639',2);curveLine([29,298,32,296,34,295,35,297],'#684639',1);}
 if(ep/epMax<1/3){for(const side of [-1,1]){ellipse(side*(w-14),258,2,6,'#c2d1c077');}}
 g.restore();
}
function drawOpponent(){
 g.save();
 const sway=hit?reactionSide*Math.sin(Math.PI*Math.min(1,hit/.36))*28*reactionPower:Math.sin(t*2)*2;
 const bodyMotion=npcBodyMotion();g.translate(500+sway+bodyMotion.x,koPose*180+bodyMotion.y);g.translate(0,-92);g.scale(1.23,1.23);g.rotate(koPose*.16);
 const bob=Math.sin(t*2.5)*1.6;g.translate(0,bob);g.translate(0,360);g.rotate(bodyMotion.twist);g.translate(0,-360);
 const wide=activeOpponentLook().body;
 pathShape(shade(-wide,330,wide,510,[[0,'#202b31'],[.45,activeOpponentLook().suit],[1,'#182228']]),()=>{g.moveTo(-34,325);g.bezierCurveTo(-85,328,-wide,343,-wide-8,401);g.lineTo(-wide+3,566);g.lineTo(wide-3,566);g.lineTo(wide+8,401);g.bezierCurveTo(wide,344,79,329,34,325);},'#111c23',2);
 pathShape(shade(-20,325,35,510,[[0,'#dddace'],[.6,'#bfc4bf'],[1,'#8d9999']]),()=>{g.moveTo(-31,322);g.lineTo(-56,351);g.lineTo(-35,550);g.lineTo(39,550);g.lineTo(56,351);g.lineTo(30,322);});
 pathShape('#b4b6a8',()=>{g.moveTo(-34,326);g.lineTo(-65,348);g.lineTo(-27,376);g.lineTo(0,345);});
 pathShape('#e2dfd2',()=>{g.moveTo(31,326);g.lineTo(60,351);g.lineTo(25,375);g.lineTo(0,345);});
 const tieShift=ep/epMax<2/3?12:0;
 pathShape(shade(-15,340,23,505,[[0,'#614b42'],[.55,npc%3===1?'#4b455a':'#7a5144'],[1,'#302f32']]),()=>{g.moveTo(tieShift,342);g.lineTo(tieShift+14,360);g.lineTo(11,382);g.lineTo(23,480);g.lineTo(4,506);g.lineTo(-14,483);g.lineTo(-8,383);g.lineTo(tieShift-13,360);});
 pathShape('#26333a',()=>{g.moveTo(-60,341);g.lineTo(-34,417);g.lineTo(-83,366);g.lineTo(-67,357);g.lineTo(-82,348);});
 pathShape('#35444b',()=>{g.moveTo(59,342);g.lineTo(33,419);g.lineTo(81,367);g.lineTo(64,357);g.lineTo(79,349);});
 for(const side of [-1,1]){curveLine([side*77,417,side*64,444,side*61,470,side*66,490],'#111c264d',2);}
 rect(59,407,38,26,'#9baca6');rect(62,411,32,3,'#384a4b');text(activeOpponentLook().badge,78,427,8,'#293c40');
 const wardrobe=activeOpponentLook();
 if(wardrobe.outfit!=='suit'){
  const cloth=wardrobe.suit;
  pathShape(shade(-wide,330,wide,550,[[0,toneColor(cloth,22)],[.42,cloth],[.75,toneColor(cloth,-15)],[1,'#19262d']]),()=>{g.moveTo(-30,329);g.lineTo(-wide,355);g.lineTo(-wide+5,566);g.lineTo(wide-5,566);g.lineTo(wide,355);g.lineTo(30,329);g.quadraticCurveTo(0,364,-30,329);},'#19242c',2);
  if(wardrobe.outfit==='hoodie'){
   pathShape('#b9beb4',()=>{g.moveTo(-34,326);g.lineTo(-65,352);g.lineTo(-30,390);g.lineTo(0,356);g.lineTo(31,390);g.lineTo(65,352);g.lineTo(34,326);g.quadraticCurveTo(0,360,-34,326);});
   curveLine([-24,366,-29,398,-26,422,-26,440],'#d8d4c9',2);curveLine([25,367,29,393,27,415,28,439],'#d8d4c9',2);
   curveLine([-55,485,-33,474,33,474,56,485],'#0f202b88',2);
  }else{
   polygon([[-32,329],[-45,350],[-15,377],[0,350]],'#c4cbd0');
   polygon([[32,329],[45,350],[15,377],[0,350]],'#e1e2d9');
   for(let y=373;y<530;y+=28)ellipse(0,y,2,2,'#d8dbd1');
  }
  rect(45,399,37,48,'#c3c8bd');text(wardrobe.badge,64,428,8,'#273b46');
 }
 if(wardrobe.outfit==='suit'){
  g.save();g.globalAlpha=.18;
  for(let x=-wide+18;x<wide-10;x+=12)curveLine([x,390,x-4,440,x-4,500,x-5,550],'#ced0bd',.8);
  if(wardrobe.clothPattern==='check')for(let y=400;y<550;y+=18)curveLine([-wide+14,y,-50,y-3,50,y-3,wide-14,y],'#ced0bd',.8);
  g.restore();
  pathShape('#bdc7bb',()=>{g.moveTo(47,386);g.lineTo(52,375);g.lineTo(61,383);g.lineTo(69,375);g.lineTo(74,388);});
 }
 // Tailored fabric folds follow chest and shoulder volumes.
 for(const side of [-1,1]){
  curveLine([side*85,366,side*66,387,side*57,405,side*59,426],'#080f1940',3);
  curveLine([side*90,369,side*72,387,side*63,407,side*65,421],'#eef0dc20',1.1);
  curveLine([side*80,474,side*47,462,side*28,474,side*18,494],'#101b2633',2);
  curveLine([side*72,497,side*55,486,side*32,494,side*26,510],'#eff1d51c',1);
 }
 // Personal props sit on clothing and never obscure the moving gloves.
 const prop=wardrobe.accessory;
 if(prop==='pens'){rect(43,419,33,24,'#1c303b88');for(let k=0;k<3;k++){rect(48+k*8,392,4,32,['#ac7c58','#8eafbb','#c4bd8e'][k]);rect(49+k*8,395,1,12,'#e6dccb');}}
 if(prop==='lapel'){pathShape('#c5ac64',()=>{g.moveTo(-60,367);g.lineTo(-54,358);g.lineTo(-47,368);g.lineTo(-54,378);});}
 if(prop==='tieclip'){rect(-10,425,28,5,'#b3afa2');rect(-8,425,5,5,'#e1d5b3');}
 if(prop==='whistle'){curveLine([-29,335,-22,378,22,378,29,335],'#c8c3a6',1.5);rect(-6,374,14,21,'#a2b2b2');ellipse(1,380,3,3,'#1c3038');}
 if(wardrobe.outfit==='hoodie'){curveLine([-87,386,-67,398,-66,451,-75,470],'#c4cbd322',2);rect(-47,437,30,6,'#a4adb844');}
 pathShape(shade(-18,310,20,340,[[0,'#765644'],[.55,'#bd9476'],[1,'#694d3f']]),()=>{g.moveTo(-25,307);g.lineTo(-24,333);g.quadraticCurveTo(0,356,25,331);g.lineTo(24,307);});
 pathShape('#6b4d3c55',()=>{g.moveTo(-19,315);g.lineTo(-11,335);g.lineTo(-3,341);g.lineTo(-15,330);});
 pathShape('#ebc49a44',()=>{g.moveTo(16,313);g.lineTo(9,334);g.lineTo(2,340);g.lineTo(17,331);});
 curveLine([-23,331,-9,339,10,339,23,331],'#523e3544',1);
 drawRealFace();
 if(inDialogue()||koPose>0)for(const side of [-1,1])drawSleeve(side,0,false);
 g.restore();
}
