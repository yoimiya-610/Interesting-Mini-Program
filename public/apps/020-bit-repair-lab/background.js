'use strict';
globalThis.ProgramBackground = {
  target: '.guide-anchor',
  position: 'append',
  accent: '#2a5a49',
  title: ['用多几个比特换可靠性', 'A few extra bits for reliability'],
  lead: ['数据走过线路或保存在存储器里时，有时会变样。冗余校验让接收端有线索判断哪儿出了问题。', 'Data can change in transit or in storage. Redundant check bits give the receiver clues about what went wrong.'],
  sections: [
    {
      title: ['01 / 从偶数检查开始', '01 / Start with an even count'],
      paragraphs: [
        ['偶校验要求一组比特里 1 的个数为偶数。比如 1011 有三个 1，加一个值为 1 的校验位后，变成四个 1。一个翻转会破坏这个约定，两个翻转却可能互相抵消。', 'Even parity means a group has an even number of ones. For example, 1011 has three ones, so adding a check bit set to 1 gives four. One flip breaks the rule. Two flips can cancel in the same check.'],
        ['理查德·汉明在 1950 年的论文中给出了单错纠正和增加总校验后的双错检测方法。本台用四位载荷和可翻转的短报文呈现这些思路。', 'Richard Hamming’s 1950 paper presents single-error correction and a way to add double-error detection with an overall check. This lab demonstrates those ideas with four payload bits and a short word you can flip by hand.'],
      ],
      sources: [{label: 'Hamming · Error Detecting and Error Correcting Codes (1950, PDF)', href: 'https://zoo.cs.yale.edu/classes/cs323/doc/Hamming.pdf'}],
    },
    {
      title: ['02 / 从分组找到位置', '02 / Locate a fault from the checks'],
      paragraphs: [
        ['7 位报文在第 1、2、4 位加校验。每一组覆盖编号的二进制里有对应位的位置。例如第 5 位是 4 + 1，所以只翻这一位会使第 1 和第 4 组失败。把失败组的编号相加，得到症状值 5。', 'The 7-bit word places check bits at positions 1, 2 and 4. A group covers positions whose binary number includes that place value. Position 5 is 4 + 1, so flipping it alone fails groups 1 and 4. Their sum gives syndrome 5.'],
        ['8 位扩展码再加一位，使全字也满足偶校验。当总校验为奇数且症状值非零时，接收端按单错规则翻对应位。总校验为偶数且症状值非零时，接收端拦截。奇数但症状为零时，接收端按单错规则翻总校验位。', 'The extended word adds an eighth bit to make the whole word even. An odd whole word and a nonzero syndrome prompt a repair at the indicated position. An even whole word with a nonzero syndrome is held. An odd whole word with zero syndrome prompts a repair at the overall check bit.'],
      ],
      sources: [],
    },
    {
      title: ['03 / 修复报告与实际恢复', '03 / A reported repair and actual recovery'],
      paragraphs: [
        ['7 位码保证能纠正一个翻转。8 位扩展码保证能纠正单错并拦截双错，常称为 SECDED。更多翻转可能被误纠正或漏检。实验的“原数据对照”知道发了什么，真实接收端通常只有收到的报文。', 'The 7-bit code guarantees correction of one flip. The 8-bit extended code guarantees single-error correction and double-error detection, often called SECDED. More flips can cause wrong repairs or pass unnoticed. The lab can compare against the original payload. A real receiver generally has only the received word.'],
        ['纠错码的实际应用包括保护计算机内存。这里用小报文逐一列出位置组合，演示覆盖范围。穷举表统计组合数。真实通道的故障概率、重发、同步丢失和更长的编码都超出这个模型。', 'Error-correcting codes can protect computer memory. This small word lets you enumerate every combination of flip positions and see the coverage. The sweep counts combinations. Real channel probabilities, retransmission, synchronization loss, and longer codes are outside this model.'],
      ],
      sources: [{label: 'IBM Research · The Reliability of Single-Error Protected Computer Memories', href: 'https://research.ibm.com/publications/the-reliability-of-single-error-protected-computer-memories'}],
    },
  ],
};
