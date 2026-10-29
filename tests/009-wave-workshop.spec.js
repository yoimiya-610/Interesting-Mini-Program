import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const path='/apps/009-wave-workshop/index.html',lang=(page,which)=>page.locator('[data-program-language="'+which+'"]');
async function number(page,id,value){await page.locator('#'+id).fill(String(value));await page.locator('#'+id).press('Tab');}
async function exported(page,id){const waiting=page.waitForEvent('download');await page.locator('#'+id).click();return readFile(await(await waiting).path());}

test('All eight starting experiments are usable, translated, and retained above a cutoff',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(path+'?lang=en');
  const expected=[['sine',1],['square',8],['saw',16],['triangle',8],['octaves',5],['pulse',16],['missing',4],['phase',16]];
  for(const [id,count]of expected){await page.locator('[data-preset="'+id+'"]').click();await expect(page.locator('#active')).toHaveText(count+' / 16');expect(await page.locator('#experiment').innerText()).not.toMatch(/[\u3400-\u9fff]/);await expect(page.locator('#plot svg')).toBeVisible();}
  await page.locator('[data-preset="square"]').click();const third=await page.locator('#amplitude-3').inputValue();await number(page,'cutoff',1);await expect(page.locator('#active')).toHaveText('1 / 16');await expect(page.locator('#rms')).toHaveText('0.707');await number(page,'cutoff',16);await expect(page.locator('#active')).toHaveText('8 / 16');await expect(page.locator('#amplitude-3')).toHaveValue(third);expect(errors).toEqual([]);
});

test('Equal amplitude spectra can have different shapes, and bilingual context preserves a reference',async({page},info)=>{
  await page.goto(path+'?lang=en');await page.locator('[data-preset="saw"]').click();const rms=await page.locator('#rms').innerText();
  await page.locator('#label').fill('相位归零 <my> & wave');await page.locator('#save').click();const id=await page.locator('#reference option').nth(1).getAttribute('value');await page.locator('#reference').selectOption(id);
  await page.locator('[data-preset="phase"]').click();await expect(page.locator('#rms')).toHaveText(rms);await expect(page.locator('#phase-1')).toHaveValue('90');await expect(page.locator('#plot path[stroke-dasharray]')).toHaveCount(1);await expect(page.locator('#comparison')).not.toContainText('0.000');
  await page.locator('#programBackground summary').press('Enter');await expect(page.locator('#programBackground')).toContainText('1822');await expect(page.locator('#programBackground')).toContainText('not one person');
  await lang(page,'zh').click();await lang(page,'en').click();await expect(page.locator('#label')).toHaveValue('相位归零 <my> & wave');await expect(page.locator('#slots strong')).toHaveText('相位归零 <my> & wave');await expect(page.locator('#phase-1')).toHaveValue('90');await expect(page.locator('#reference')).toHaveValue(id);await expect(page.locator('#backgroundDetails')).toHaveAttribute('open','');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:info.outputPath('009-comparison-typography.png'),fullPage:true,animations:'disabled'});
  await page.reload();await expect(page.locator('#phase-1')).toHaveValue('90');await expect(page.locator('#reference')).toHaveValue(id);await expect(page.locator('#label')).toHaveValue('相位归零 <my> & wave');
});

test('Editing, mute, solo, undo and invalid-input recovery work with the keyboard',async({page})=>{
  await page.goto(path+'?lang=en');await page.locator('#amplitude-1').fill('0.5');await expect(page.locator('#rms')).toHaveText('0.354');await number(page,'phase-1',90);await expect(page.locator('#rms')).toHaveText('0.354');await expect(page.locator('#peak')).toHaveText('0.500');
  await page.locator('#on-1').press('Space');await expect(page.locator('#active')).toHaveText('0 / 16');await expect(page.locator('#listen')).toBeDisabled();await page.locator('#undo').click();await expect(page.locator('#on-1')).toBeChecked();
  await page.locator('[data-preset="octaves"]').click();await page.locator('#solo-4').press('Enter');await expect(page.locator('#active')).toHaveText('1 / 16');await expect(page.locator('#highest')).toHaveText('880 Hz');await page.locator('#label').fill('Keep this 标题');await page.locator('#undo').click();await expect(page.locator('#active')).toHaveText('5 / 16');await expect(page.locator('#label')).toHaveValue('Keep this 标题');
  await number(page,'frequency','600.5');await expect(page.locator('#frequency')).toHaveAttribute('aria-invalid','true');await expect(page.locator('#exportWav')).toBeDisabled();await expect(page.locator('#save')).toBeDisabled();await lang(page,'zh').click();await expect(page.locator('#frequency')).toHaveValue('600.5');await lang(page,'en').click();await expect(page.locator('#frequency')).toHaveAttribute('aria-invalid','true');await number(page,'frequency',600);await expect(page.locator('#exportWav')).toBeEnabled();await expect(page.locator('#highest')).toHaveText('9600 Hz');
});

test('Eight saved versions remain independently loadable; removal and loading can be undone',async({page})=>{
  await page.goto(path+'?lang=en');const presets=['sine','square','saw','triangle','octaves','pulse','missing','phase'];
  for(let i=0;i<8;i++){await page.locator('[data-preset="'+presets[i]+'"]').click();await page.locator('#label').fill('Sheet '+i);await page.locator('#save').click();}
  await expect(page.locator('#slotCount')).toHaveText('8 / 8');await expect(page.locator('#save')).toBeDisabled();await expect(page.locator('#slots article')).toHaveCount(8);
  await page.locator('[data-load]').first().click();await expect(page.locator('#active')).toHaveText('1 / 16');await expect(page.locator('#label')).toHaveValue('Sheet 0');await page.locator('#undo').click();await expect(page.locator('#active')).toHaveText('16 / 16');await expect(page.locator('#label')).toHaveValue('Sheet 7');
  await page.locator('[data-remove]').first().click();await expect(page.locator('#slotCount')).toHaveText('7 / 8');await page.locator('#undo').click();await expect(page.locator('#slotCount')).toHaveText('8 / 8');
});

test('Exports contain real data and backup import preserves settings, versions and reference',async({page})=>{
  await page.goto(path+'?lang=en');await page.locator('[data-preset="pulse"]').click();await page.locator('#label').fill('<my> & signal');await page.locator('#save').click();const id=await page.locator('#reference option').nth(1).getAttribute('value');await page.locator('#reference').selectOption(id);
  const wav=await exported(page,'exportWav');expect(wav.length).toBe(96044);expect(wav.toString('ascii',0,4)).toBe('RIFF');expect(wav.readUInt32LE(24)).toBe(24000);
  const svg=(await exported(page,'exportSvg')).toString();expect(svg).toContain('&lt;my&gt; &amp; signal');expect(svg).toContain('stroke-dasharray');
  const csv=(await exported(page,'exportCsv')).toString().split('\n');expect(csv).toHaveLength(515);expect(csv[0]).toBe('base_frequency_hz,220');expect(csv[1]).toBe('base_cycle,seconds,relative_amplitude');expect(Number(csv[2].split(',')[2])).toBeCloseTo(8,10);
  const backup=await exported(page,'exportJson');expect(JSON.parse(backup.toString()).reference).toBe(id);await page.locator('#zero').click();await expect(page.locator('#active')).toHaveText('0 / 16');await page.locator('#importFile').setInputFiles({name:'wave.json',mimeType:'application/json',buffer:backup});await expect(page.locator('#active')).toHaveText('16 / 16');await expect(page.locator('#reference')).toHaveValue(id);await page.locator('#undo').click();await expect(page.locator('#active')).toHaveText('0 / 16');
  await page.locator('#importFile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":99}')});await expect(page.locator('#notice')).toContainText('Not imported');await expect(page.locator('#active')).toHaveText('0 / 16');await expect(page.locator('#slots strong')).toHaveText('<my> & signal');
  await page.locator('#importFile').setInputFiles({name:'large.json',mimeType:'application/json',buffer:Buffer.alloc(150001,32)});await expect(page.locator('#notice')).toContainText('Not imported');
});

test('Explicit listening can be stopped, and a settings edit stops an active sound',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(path+'?lang=en');await page.locator('#listen').click();await expect(page.locator('#stop')).toBeEnabled();await page.locator('#stop').click();await expect(page.locator('#stop')).toBeDisabled();await expect(page.locator('#notice')).toContainText('Playback stopped');
  await page.locator('#listen').click();await number(page,'phase-1',90);await expect(page.locator('#stop')).toBeDisabled();await expect(page.locator('#listen')).toBeEnabled();expect(errors).toEqual([]);
});

test('Offline files and blocked storage keep the core experiment, guide and WAV export usable',async({page,context},info)=>{
  await page.addInitScript(()=>{Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError');};Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError');};});await context.setOffline(true);
  await page.goto(new URL('../public/apps/009-wave-workshop/index.html?lang=en',import.meta.url).href);await page.locator('[data-preset="triangle"]').click();await number(page,'cutoff',3);await expect(page.locator('#active')).toHaveText('2 / 16');await page.locator('#save').click();await expect(page.locator('#storage')).toContainText('Local saving is unavailable');await page.locator('#programBackground summary').click();await expect(page.locator('#programBackground')).toContainText('Fourier');expect((await exported(page,'exportWav')).length).toBe(96044);
  await lang(page,'zh').click();await expect(page.locator('#active')).toHaveText('2 / 16');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:info.outputPath('009-offline-typography.png'),fullPage:true,animations:'disabled'});await page.getByRole('link',{name:'← 小程序索引',exact:true}).click();await expect(page.getByRole('link',{name:'009 波形工坊',exact:true})).toBeVisible();
});
