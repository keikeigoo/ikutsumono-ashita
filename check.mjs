import assert from 'node:assert/strict';
import {AGES,EVENTS,createGame,currentEvent,matches,choose,advance,validateSave,diaryText,getEnding} from './dist/engine.mjs';
assert.equal(AGES.length,32);assert.ok(EVENTS.length>=44);
assert.equal(new Set(EVENTS.map(e=>e.id)).size,EVENTS.length);
const allFlags=new Set(['thoughtful','curious','warm',...EVENTS.flatMap(e=>e.choices.flatMap(c=>c.flags||[]))]);
for(const age of AGES){assert.equal(EVENTS.filter(e=>e.age===age&&!e.when).length,1,`default ${age}`);}
for(const e of EVENTS){assert.ok(AGES.includes(e.age));assert.equal(e.choices.length,4,e.id);assert.equal(new Set(e.choices.map(c=>c.id)).size,4,e.id);assert.ok(e.choices.filter(c=>!c.requires).length>=2,e.id);for(const f of [...(e.when?.flags||[]),...(e.when?.notFlags||[])])assert.ok(allFlags.has(f),`${e.id} unknown flag ${f}`);for(const c of e.choices){for(const f of [...(c.requires?.flags||[]),...(c.requires?.notFlags||[])])assert.ok(allFlags.has(f),`${e.id}/${c.id} unknown flag ${f}`);for(const s of [e.title,e.lead,e.text,c.title,c.desc,c.result])assert.ok(typeof s==='string'&&s.length>0,`${e.id}/${c.id} empty text`);}}
let seed=81372;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const seen=new Set(),endings=new Set(),choicesSeen=new Set();
for(let run=0;run<1800;run++){
 let s=createGame('テスト', ['curious','thoughtful','warm'][run%3]);assert.ok(validateSave(s));
 while(s.phase!=='ending'){
  const e=currentEvent(s);seen.add(e.id);const opts=e.choices.filter(c=>matches(s,c.requires));assert.ok(opts.length>=2,`stuck ${e.id}`);
  const c=opts[run<4?run%opts.length:Math.floor(rand()*opts.length)];choicesSeen.add(`${e.id}/${c.id}`);
  const before=JSON.stringify(s);const next=choose(s,c.id);assert.equal(JSON.stringify(s),before,'must not mutate');s=next;assert.ok(validateSave(s),`invalid result ${e.id}`);
  const save=JSON.parse(JSON.stringify(s));assert.ok(validateSave(save));assert.equal(currentEvent(save).id,e.id);assert.throws(()=>choose(s,c.id));
  s=advance(save);assert.ok(validateSave(s),`invalid next ${e.id}`);
 }
 assert.equal(s.history.length,32);assert.ok(diaryText(s).includes('80歳'));endings.add(getEnding(s).title);
}
const invalid=createGame('test');invalid.stats.health=NaN;assert.equal(validateSave(invalid),false);assert.equal(validateSave(null),false);assert.equal(validateSave({version:1}),false);
console.log(JSON.stringify({events:EVENTS.length,choices:EVENTS.reduce((n,e)=>n+e.choices.length,0),simulatedLives:1800,visitedEvents:seen.size,visitedChoices:choicesSeen.size,endings:[...endings],unvisitedEvents:EVENTS.filter(e=>!seen.has(e.id)).map(e=>e.id)},null,2));
