import {test,expect} from '@playwright/test';
const path='/apps/005-logic-patch/index.html';
async function openGuide(page){if(!await page.locator('#logicPrimer').evaluate(node=>node.open))await page.locator('#logicPrimer > summary').click();}
async function openAddition(page){await openGuide(page);if(!await page.locator('#primerAdder').evaluate(node=>node.open))await page.locator('#primerAdder summary').click();}

test('Learning gates and half-adder outputs match all four input combinations',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(path+'?lang=en');await openAddition(page);
 const combinations=[{a:0,b:0,and:0,or:0,not:1,bits:'00',decimal:0},{a:0,b:1,and:0,or:1,not:1,bits:'01',decimal:1},{a:1,b:0,and:0,or:1,not:0,bits:'01',decimal:1},{a:1,b:1,and:1,or:1,not:0,bits:'10',decimal:2}];
 for(const row of combinations){for(const[id,value]of [['primerA',row.a],['primerB',row.b]])if(await page.locator('#'+id).getAttribute('aria-pressed')!==String(Boolean(value)))await page.locator('#'+id).press('Space');await expect(page.locator('#primerAnd')).toHaveText(String(row.and));await expect(page.locator('#primerOr')).toHaveText(String(row.or));await expect(page.locator('#primerNot')).toHaveText(String(row.not));await expect(page.locator('#primerSum')).toHaveText(row.bits[1]);await expect(page.locator('#primerCarry')).toHaveText(row.bits[0]);await expect(page.locator('#primerAddition')).toHaveText(`${row.a} + ${row.b} = ${row.bits}₂ = ${row.decimal}₁₀`);}
 expect(errors).toEqual([]);
});

test('The independent learning area preserves the main challenge, records, and language state',async({page})=>{
 await page.goto(path);await page.locator('#challengeMode').click();await page.locator('#puzzle').selectOption('all-on');for(let i=1;i<=3;i++)await page.locator('#g'+i).selectOption('AND');await page.locator('#verify').click();await expect(page.locator('#completedCount')).toHaveText('1/16');await page.locator('#inputA').click();const inputSummary=await page.locator('#inputSummary').textContent();
 await openAddition(page);await page.locator('#primerA').click();await page.locator('#primerB').click();await page.locator('[data-program-language="en"]').click();await expect(page.locator('#primerAddition')).toHaveText('1 + 1 = 10₂ = 2₁₀');await expect(page.locator('#puzzle')).toHaveValue('all-on');await expect(page.locator('#completedCount')).toHaveText('1/16');for(let i=1;i<=3;i++)await expect(page.locator('#g'+i)).toHaveValue('AND');await page.locator('[data-program-language="zh"]').click();await expect(page.locator('#inputSummary')).toHaveText(inputSummary);await expect(page.locator('#primerAddition')).toHaveText('1 + 1 = 10₂ = 2₁₀');
 await page.reload();await expect(page.locator('#completedCount')).toHaveText('1/16');await openAddition(page);await expect(page.locator('#primerAddition')).toHaveText('0 + 0 = 00₂ = 0₁₀');
});

test('Progressive guide translates fully and remains usable beside the activity and on mobile',async({page},info)=>{
 await page.goto(path+'?lang=en');const mobile=info.project.name==='mobile';expect(await page.locator('#logicPrimer').evaluate(node=>node.open)).toBe(false);await openGuide(page);for(const id of ['primerWorkbench','primerAdder','primerComputer'])await page.locator('#'+id).evaluate(node=>node.open=true);
 expect(await page.locator('.primer').innerText()).not.toMatch(/[\u3400-\u9fff]/);expect(await page.locator('.primer [aria-label]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label')).join('\n'))).not.toMatch(/[\u3400-\u9fff]/);await expect(page.locator('#primerComputer')).toContainText('no clock, registers, or instruction-execution system');await expect(page.locator('#primerWorkbench')).toContainText('NOT has one input');
 await page.screenshot({path:info.outputPath('005-guide-en-typography.png'),fullPage:true});await page.locator('[data-program-language="zh"]').click();await expect(page.locator('#primerBasics')).toHaveText('01 / 与、或、非是什么？');await page.screenshot({path:info.outputPath('005-guide-zh-typography.png'),fullPage:true});
 await page.locator('#logicPrimer > summary').press('Enter');await expect(page.locator('#primerA')).toBeHidden();await page.locator('#logicPrimer > summary').press('Space');await expect(page.locator('#primerA')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();if(!mobile){const position=await page.locator('.logic-sidebar').boundingBox(),board=await page.locator('.stage').boundingBox();expect(position.x).toBeGreaterThan(board.x+board.width-1);}
});

test('Guide and experiment work offline even when browser storage is unavailable',async({page,context})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('Disabled','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('Disabled','SecurityError');};});await context.setOffline(true);await page.goto(new URL('../public/apps/005-logic-patch/index.html?lang=en',import.meta.url).href);await openAddition(page);await page.locator('#primerA').press('Space');await page.locator('#primerB').press('Enter');await expect(page.locator('#primerAddition')).toHaveText('1 + 1 = 10₂ = 2₁₀');await expect(page.locator('#primerAnd')).toHaveText('1');await expect(page.locator('.primer')).toHaveCSS('border-top-color','rgb(232, 183, 107)');expect(errors).toEqual([]);
});
