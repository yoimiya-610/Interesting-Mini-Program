import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function runtime(slug,language='en',storage=null){
  const context=vm.createContext({URLSearchParams,location:{search:'?lang='+language},localStorage:{getItem:()=>storage},document:{addEventListener(){}}});
  vm.runInContext(read('public/apps/'+slug+'/english.js'),context);if(slug==='002-story-fold')vm.runInContext(read('public/apps/'+slug+'/content.js'),context);vm.runInContext(read('public/shared/program-language.js'),context);return context;
}
test('全部内置故事卡、九张任务的目标与提示、九关名称都有英文',()=>{
  const story=runtime('002-story-fold');
  const inline=read('public/apps/002-story-fold/index.html').match(/<script>\s*'use strict';([\s\S]*?)const CURRENT=/)[1];
  vm.runInContext(inline+'globalThis.cardsForTest=pools;',story);
  for(const pools of Object.values(story.cardsForTest))for(const cards of pools)for(const card of cards)assert(!/[\u3400-\u9fff]/.test(story.ProgramLanguage.t(card)),card);
  for(const [slug,api,collection,keys] of [['005-logic-patch','LogicPatch','PUZZLES',['name','goal','hint','tier']],['006-light-path','LightPath','LEVELS',['name']]]){
    const context=runtime(slug);vm.runInContext(read('public/apps/'+slug+'/core.js'),context);assert.equal(context[api][collection].length,16);
    for(const entry of context[api][collection])for(const key of keys)assert(!/[\u3400-\u9fff]/.test(context.ProgramLanguage.t(entry[key])),entry[key]);
  }
});
test('用户文字逐字保留，包括与界面同名的文字、标点与特殊字符',()=>{
  const {ProgramLanguage:language}=runtime('004-time-bento');
  for(const value of ['睡眠','已完成','<b>工作 / 学习</b>，。\nEnglish & 中文','\uE0000\uE001']){
    const protectedText=language.user(value);assert.equal(language.t(protectedText),value);assert.equal(language.t('完成：'+protectedText),'Complete: '+value);assert.equal(language.t('完成：'+protectedText,'zh'),'完成：'+value);
  }
});
test('语言参数优先于保存偏好，未知值安全回退；故事提示使用英语句序',()=>{
  assert.equal(runtime('002-story-fold','en','zh').ProgramLanguage.language,'en');assert.equal(runtime('002-story-fold','fr','en').ProgramLanguage.language,'en');assert.equal(runtime('002-story-fold','fr','fr').ProgramLanguage.language,'zh');
  const {ProgramLanguage:language}=runtime('002-story-fold');const text=language.t('替人保管秘密的邮递员来到雨停后的旧书店，想要把一封没有地址的信送达。偏偏这时，对方也在寻找同一个人……');assert(text.includes(' arrives at '));assert(text.includes(', hoping to deliver a letter with no address. But '));assert(!/[\u3400-\u9fff]/.test(text));
});
