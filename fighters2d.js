// Campaign art uses the tutorial's connected cutout rig and its combat poses.
const fighters2D=(()=>{
 const state={ready:false,error:null,frames:0,profileId:null,cache:new Map()};
 if(typeof Image==='undefined')return state;
 const images=['heads-a','heads-b','wardrobe','shareholder'].map(()=>new Image());
 const load=(image,name)=>new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Fighter art unavailable: '+name));image.src='assets/fighters/'+name+'.png';});
 state.assetPromise=Promise.all([coach2D.assetPromise,...images.map((img,i)=>load(img,['heads-a','heads-b','wardrobe','shareholder'][i]))]).then(()=>{
  if(!coach2D.ready)throw Error('Shared comic rig unavailable');
  state.heads=[...coach2D.slices(images[0],3,5),...coach2D.slices(images[1],3,5)];
  state.wardrobe=coach2D.slices(images[2],2,2);state.boss=coach2D.slices(images[3],3,1);
  state.ready=true;
 }).catch(error=>{state.error=String(error);});
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 // Tint once per opponent, retaining the original comic's ink, folds and alpha.
 function colored(part,color,mode='cloth',skin=null){
  const image=document.createElement('canvas');image.width=part.w;image.height=part.h;
  const ctx=image.getContext('2d',{willReadFrequently:true});ctx.drawImage(part.image,part.x,part.y,part.w,part.h,0,0,part.w,part.h);
  const pixels=ctx.getImageData(0,0,part.w,part.h),data=pixels.data,target=rgb(color),skinRGB=skin&&rgb(skin);
  for(let y=0;y<part.h;y++)for(let x=0;x<part.w;x++){
   const i=(y*part.w+x)*4;if(!data[i+3])continue;
   const r=data[i],b=data[i+2],v=(r+data[i+1]+b)/3;
   if(mode==='head'){
    const hair=(y<part.h*.30||((x<part.w*.22||x>part.w*.78)&&y<part.h*.64))&&v<116&&r-b<46;
    if(hair){for(let c=0;c<3;c++)data[i+c]=Math.min(255,target[c]*(.5+v/95));}
    else if(skinRGB&&r>b*1.12&&r>75){for(let c=0;c<3;c++)data[i+c]=Math.min(255,data[i+c]*skinRGB[c]/[207,153,115][c]);}
   }else{
    // White undershirts, suit shirts and drawstrings retain their own material.
    const neutral=Math.max(r,data[i+1],b)-Math.min(r,data[i+1],b)<30;
    if((mode==='glove'||neutral)&&v<205)for(let c=0;c<3;c++)data[i+c]=Math.min(255,target[c]*(.40+v/110));
   }
  }
  ctx.putImageData(pixels,0,0);return {...part,image,x:0,y:0};
 }
 function details(look,p,index){
  const prop=look.accessory,x=p.torsoWidth*.22;
  g.save();g.lineCap='round';
  if(prop==='pens'){
   g.fillStyle=toneColor(look.suit,-12);g.fillRect(x-12,75,30,30);
   for(const [offset,color] of [[-5,'#243d5d'],[8,'#bac1b9']]){
    g.fillStyle='#151d25';g.fillRect(x+offset-1,49,5,40);g.fillStyle=color;g.fillRect(x+offset,50,3,38);
    g.fillStyle='#dddcd3';g.fillRect(x+offset,54,1,12);
   }
  }
  if(prop==='lapel'){g.fillStyle='#bfc6be';g.fillRect(-x-8,52,19,4);g.strokeStyle='#5b625e';g.strokeRect(-x-8,52,19,4);}
  // The peer wears a polo, so its tie clip is a small placket clip.
  if(prop==='tieclip'){g.fillStyle='#b9c1be';g.fillRect(-10,55,20,3);}
  if(index>=10&&index!==99){
   const age=Math.max(0,(look.age-32)/35);
   if(age>0){g.strokeStyle=`rgba(85,52,38,${Math.min(.48,age*.5)})`;g.lineWidth=.9;
    for(const y of [-164,-159]){g.beginPath();g.moveTo(-20,y);g.quadraticCurveTo(0,y+3,20,y);g.stroke();}
    for(const side of [-1,1]){g.beginPath();g.moveTo(side*24,-94);g.quadraticCurveTo(side*34,-85,side*31,-76);g.stroke();}
   }
   if(look.beard){g.fillStyle=look.hairColor+'88';g.beginPath();g.moveTo(-38,-58);g.quadraticCurveTo(0,-19,38,-58);g.lineTo(26,-29);g.quadraticCurveTo(0,-8,-26,-29);g.closePath();g.fill();}
  }
  g.restore();
 }
 state.profile=index=>{
  const look=opponentLooks[index],family=index===99?9:personalities.findIndex(p=>opponents[index].name.startsWith(p[0]));
  // Include appearance values in the key, so a later identity review invalidates art.
  const key=index+':'+JSON.stringify(look);if(state.cache.has(key))return state.cache.get(key);
  const heads=index===99?state.boss:state.heads.slice(family*3,family*3+3);
  const outfit=['hoodie','shirt','polo','suit'].indexOf(look.outfit),torso=colored(state.wardrobe[outfit],look.suit);
  const headParts=index<10||index===99?heads:heads.map(part=>colored(part,look.hairColor,'head',look.skinMid));
  const gloves=coach2D.parts.slice(6).map(part=>colored(part,look.glove,'glove'));
  const build=look.body/110;
  const proportions={...coach2D.proportions,neckSplit:.90,neckWidth:.88,neckLength:.95,headWidth:156*Math.pow(look.faceWidth/65,.55),torsoWidth:480*Math.pow(build,.7),shoulderHalfWidth:170*Math.pow(build,.7),upperArmWidth:74*Math.pow(build,.55),forearmWidth:60*Math.pow(build,.55)};
  const profile={index,family,look,proportions,skin:look.skinMid,parts:[...headParts,torso,null,null,...gloves],drawDetails:()=>details(look,proportions,index)};
  state.cache.set(key,profile);return profile;
 };
 state.renderOpponent=()=>{const profile=state.profile(npc);coach2D.renderOpponent(profile);state.profileId=npc;state.family=profile.family;state.frames++;};
 return state;
})();
const beforeCampaignComic=drawOpponent;
drawOpponent=function(){if(tutorial<0&&fighters2D.ready)fighters2D.renderOpponent();else beforeCampaignComic();};
