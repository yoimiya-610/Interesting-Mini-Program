'use strict';
globalThis.BitRepairCases = [
  {
    id: 'clean', payload: 10, faults: [], name: ['完好的报文', 'A clean packet'],
    task: ['先找出四个数据位和四个校验位。把一个数据位改掉，观察发送端哪些校验位会一起变化。', 'Find the four data bits and the four check bits. Change one payload bit and watch which check bits change at the sender.'],
    answer: ['没有传输错误时，三个分组校验和总校验都通过。改动数据位是重新编码，接收端翻转才模拟传输错误。', 'Without transmission faults, the three group checks and the overall check pass. Changing a payload bit re-encodes the packet. Flipping a received bit introduces a transmission fault.'],
  },
  {
    id: 'data', payload: 5, faults: [3], name: ['一个数据位出错', 'One data bit flips'],
    task: ['打开第 1、2、4 组校验，找出哪两组失败。用它们的编号推算接收端应翻转哪一位。', 'Open checks 1, 2 and 4. Find the two failed groups and use their numbers to predict the repair position.'],
    answer: ['第 1 和第 2 组失败，1 + 2 = 3。两种接收端都翻回第 3 位，恢复原数据。', 'Groups 1 and 2 fail, giving 1 + 2 = 3. Both receivers flip position 3 back and recover the original payload.'],
  },
  {
    id: 'check', payload: 9, faults: [4], name: ['校验位也会出错', 'A check bit flips'],
    task: ['比较纠正前后的四个数据位。为什么第 4 组失败也需要处理？', 'Compare the four data bits before and after repair. Why does a failure in group 4 still need handling?'],
    answer: ['只有第 4 组失败。第 4 位本来就是校验位，翻回它能修好报文，但不会改变载荷。', 'Only group 4 fails. Position 4 is a check bit, so repairing it fixes the word while leaving the payload unchanged.'],
  },
  {
    id: 'overall', payload: 6, faults: [8], name: ['总校验位出错', 'The overall bit flips'],
    task: ['找一个三组校验都通过但总校验失败的例子。比较两个接收端的操作。', 'Look for three passing group checks with a failing overall check. Compare what the two receivers do.'],
    answer: ['第 8 位不属于前三组。8 位接收端只修第 8 位；7 位报文没有这个位置，所以接收结果不变。', 'Position 8 is outside the first three groups. The 8-bit receiver repairs it. The 7-bit word has no eighth position, so its received word stays unchanged.'],
  },
  {
    id: 'double', payload: 12, faults: [3, 5], name: ['双错与误纠正', 'Two faults and a wrong repair'],
    task: ['按单错规则读出候选位置，再用总校验判断 8 位接收端为什么拒绝交付。', 'Read the candidate position under the single-error rule. Use the overall check to explain why the 8-bit receiver holds the payload.'],
    answer: ['第 3、5 位同时翻转给出症状值 6。7 位接收端会翻第 6 位，交付错误数据；8 位接收端发现总校验仍为偶数，拒绝交付。', 'Flips at 3 and 5 give syndrome 6. The 7-bit receiver flips position 6 and delivers the wrong data. The 8-bit receiver sees even overall parity and holds the payload.'],
  },
  {
    id: 'mixed', payload: 3, faults: [7, 8], name: ['总校验参与双错', 'A double fault includes the overall bit'],
    task: ['保持第 7 位翻转，再关掉第 8 位翻转。记录 8 位接收端何时从拒绝变为修复。', 'Keep position 7 flipped and turn off the flip at position 8. Observe when the 8-bit receiver changes from holding the word to repairing it.'],
    answer: ['第 8 位不影响症状值 7，却会改变总奇偶性。两个错时 8 位接收端拒绝；只剩第 7 位错误时可以修复。', 'Position 8 leaves syndrome 7 unchanged but changes overall parity. The 8-bit receiver holds the two-fault word and repairs it when only position 7 is wrong.'],
  },
  {
    id: 'triple', payload: 14, faults: [3, 5, 6], name: ['三错伪装成单错', 'Three faults mimic one'],
    task: ['预测哪个校验会失败。接收端的修复报告能否说明原数据真的恢复了？', 'Predict which check fails. Does the receiver’s reported repair establish that the original payload was recovered?'],
    answer: ['三个翻转使分组校验互相抵消，只剩总校验失败。8 位接收端会翻第 8 位，但原数据没有恢复。单错修复的保证不覆盖三错。', 'The three flips cancel in the group checks, leaving only the overall check odd. The 8-bit receiver flips position 8, while the original data stays corrupted. Three faults exceed the single-error guarantee.'],
  },
  {
    id: 'silent', payload: 1, faults: [1, 2, 3, 8], name: ['四错无声通过', 'Four faults pass unnoticed'],
    task: ['比较接收端的报告和原数据对照。再看穷举表，找出 8 位报文中有多少种四错会交付错误数据。', 'Compare the receiver’s report with the original-payload check. Use the sweep to count four-fault patterns that deliver incorrect data in the 8-bit word.'],
    answer: ['这四个翻转把一条合法报文变成另一条合法报文，所有校验通过。8 位码共有 70 种四错位置组合，其中 14 种会交付错误数据。', 'These four flips turn one valid word into another, so every check passes. Of the 70 four-flip patterns in the 8-bit word, 14 deliver incorrect data.'],
  },
];
