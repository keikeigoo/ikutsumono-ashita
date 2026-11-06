import { AGES, EVENTS } from './story.mjs?v=1';
export { AGES, EVENTS };
export const STAT_INFO={health:{label:'健やかさ',color:'#6c8c70'},joy:{label:'充実',color:'#c79761'},knowledge:{label:'知性',color:'#7792a0'},courage:{label:'勇気',color:'#bd826f'},connection:{label:'つながり',color:'#9b8daa'}};
export const PEOPLE={haru:{name:'春',role:'幼なじみ',color:'#d6b99b',initial:'春'},aoi:{name:'葵',role:'学校で出会う友人',color:'#acc3bc',initial:'葵'},ren:{name:'蓮',role:'道の途中で出会う人',color:'#bac1d4',initial:'蓮'}};
export function matches(s,r={}){return (!r.flags||r.flags.every(f=>s.flags.includes(f)))&&(!r.notFlags||r.notFlags.every(f=>!s.flags.includes(f)))&&(!r.stats||Object.entries(r.stats).every(([k,v])=>s.stats[k]>=v))&&(r.money===undefined||s.money>=r.money);}
export function pickEvent(s){const es=EVENTS.filter(e=>e.age===AGES[s.index]);return es.find(e=>e.when&&matches(s,e.when))||es.find(e=>!e.when);}
export function currentEvent(s){return EVENTS.find(e=>e.id===s.eventId);}
export function createGame(name,trait='curious'){
 const stats={health:58,joy:50,knowledge:45,courage:45,connection:45};
 if(trait==='thoughtful')stats.knowledge+=15;if(trait==='curious')stats.courage+=15;if(trait==='warm')stats.connection+=15;
 const s={version:1,name:(name.trim()||'凪').slice(0,16),trait,index:0,phase:'choice',stats,money:8,flags:[trait],bonds:{haru:30,aoi:8,ren:0},career:'高校生',home:'生まれ育った街',relationship:'自分のペース',history:[],eventId:null};
 s.eventId=pickEvent(s).id;return s;
}
export function interpolate(text,s){return String(text??'').replace(/\{(name|career|home)\}/g,(_,k)=>s[k]);}
export function choose(state,choiceId){
 if(state.phase!=='choice')throw new Error('今は選択できません。');
 const e=currentEvent(state),c=e.choices.find(x=>x.id===choiceId);
 if(!c||!matches(state,c.requires))throw new Error('この選択肢はまだ選べません。');
 const s=structuredClone(state),deltas={};
 for(const [k,v] of Object.entries(c.effects||{})){if(k==='money'){const before=s.money;s.money=Math.max(0,s.money+v);deltas.money=s.money-before;}else if(k in STAT_INFO){const before=s.stats[k];s.stats[k]=Math.max(0,Math.min(100,before+v));deltas[k]=s.stats[k]-before;}}
 for(const [k,v] of Object.entries(c.bond||{}))if(k in PEOPLE)s.bonds[k]=Math.max(0,Math.min(100,s.bonds[k]+v));
 s.flags=[...new Set([...s.flags,...(c.flags||[])])];
 for(const key of ['career','home','relationship'])if(c.set?.[key])s[key]=c.set[key];
 s.history.push({age:e.age,eventId:e.id,title:interpolate(e.title,state),choice:interpolate(c.title,state),result:interpolate(c.result,s),deltas});
 s.phase='result';return s;
}
export function advance(state){
 if(state.phase!=='result')return state;
 const s=structuredClone(state);if(s.index===AGES.length-1){s.phase='ending';return s;}
 s.index++;s.phase='choice';s.eventId=pickEvent(s).id;return s;
}
export function getEnding(s){
 const rank=Object.entries(s.stats).sort((a,b)=>b[1]-a[1]);const top=rank[0][0];
 const endings={health:['自分の歩幅で、遠くまで。','急がずに、自分の声を聞く。その小さな選択を重ねて、暮らしはあなたに似た形になった。立ち止まった時間にも、ちゃんと意味があった。'],joy:['好き、を集めた人生。','誰かのものさしから少し離れて、心が動くほうへ。たくさんの小さな喜びが、振り返ればひとつの大きな風景になっていた。'],knowledge:['問いつづけた、その先に。','知らなかったことを知るたびに、世界の輪郭が変わった。答えが見つからない日も、あなたの好奇心は次の扉を開いていた。'],courage:['扉の向こうにも、明日。','迷いが消えるのを待たずに、踏み出した日があった。選ばなかった道も胸にしまって、あなたはあなたの物語を歩いてきた。'],connection:['あなたがいたから。','交わした言葉、並んで歩いた道、久しぶりの連絡。誰かとの時間があなたをつくり、あなたとの時間が誰かの人生に残っている。']};
 const [title,text]=endings[top];return {title,text,top};
}
export function validateSave(s){
 if(!s||s.version!==1||typeof s.name!=='string'||s.name.length>16||!['curious','thoughtful','warm'].includes(s.trait))return false;
 if(!Number.isInteger(s.index)||s.index<0||s.index>=AGES.length||!['choice','result','ending'].includes(s.phase))return false;
 if(!s.stats||!Object.keys(STAT_INFO).every(k=>Number.isFinite(s.stats[k])&&s.stats[k]>=0&&s.stats[k]<=100)||!Number.isFinite(s.money)||s.money<0||s.money>1e9)return false;
 if(!Array.isArray(s.flags)||s.flags.some(f=>typeof f!=='string')||!s.bonds||!Object.keys(PEOPLE).every(k=>Number.isFinite(s.bonds[k])&&s.bonds[k]>=0&&s.bonds[k]<=100))return false;
 if(!['career','home','relationship'].every(k=>typeof s[k]==='string'&&s[k].length<=100))return false;
 const e=EVENTS.find(e=>e.id===s.eventId);if(!e||e.age!==AGES[s.index])return false;
 if(!Array.isArray(s.history)||s.history.length!==(s.index+(s.phase==='choice'?0:1)))return false;
 if(s.phase==='ending'&&s.index!==AGES.length-1)return false;
 return s.history.every((h,i)=>h&&h.age===AGES[i]&&EVENTS.some(e=>e.id===h.eventId&&e.age===h.age)&&['title','choice','result'].every(k=>typeof h[k]==='string'&&h[k].length<2000)&&h.deltas&&Object.entries(h.deltas).every(([k,v])=>(k==='money'||k in STAT_INFO)&&Number.isFinite(v)));
}
export function diaryText(s){const end=getEnding(s);return `いくつもの明日 ─ ${s.name}の人生\n${s.phase==='ending'?end.title+'\n'+end.text:'いま、'+AGES[s.index]+'歳の物語'}\n\n`+s.history.map(h=>`${h.age}歳 ─ ${h.title}\n選んだこと：${h.choice}\n${h.result}`).join('\n\n');}
