'use strict';
globalThis.ProgramBackground={
  target:'.reading',position:'append',accent:'#7543a1',
  title:['从简单振动，到复杂形状','From simple oscillations to complex shapes'],
  lead:['振幅决定每一层有多强，相位决定这一层从哪里起步。先看合成，再读原因。','Amplitude sets each layer’s strength; phase sets where it starts. Explore the sum, then read why it changes.'],
  sections:[
    {title:['01 / 波为什么能相加','01 / Why add waves?'],paragraphs:[
      ['在线性模型中，同一位置的位移可以相加，这叫叠加原理。例如两条同频、同振幅的正弦波同相时振幅加倍，反相时可完全相消。真实介质在大振幅或非线性条件下未必这样工作。','In a linear model, displacements at the same position add: the superposition principle. Two equal-amplitude sine waves at the same frequency double in amplitude when in phase and cancel when opposite. Real media need not behave linearly at large amplitudes.'],
      ['这里画的是随时间变化的信号，不是水面空间图。每个阶只有一个分量；复杂曲线来自不同整数倍频率的相加。可以借它认识声音合成、信号表示与频率选择。','This plot is a signal changing over time, not a spatial map of water. Each harmonic has one component. Complex curves come from adding integer multiples of a base frequency. Use it to explore synthesis, signal representation, and frequency selection.']
    ],sources:[{label:'OpenStax · Interference of Waves',href:'https://openstax.org/books/university-physics-volume-1/pages/16-5-interference-of-waves'}]},
    {title:['02 / 读懂三种参数','02 / Read the three parameters'],paragraphs:[
      ['每路是 aₙ sin(2π n f₀ t + φₙ)。基频 f₀ 以 Hz 表示每秒的基准循环数；第 n 路频率为 n f₀，叫第 n 次谐波。振幅 aₙ 是相对强度，不是分贝。界面相位用角度，计算时换算为弧度。','Each component is aₙ sin(2π n f₀ t + φₙ). Base frequency f₀ in Hz counts base cycles per second; n f₀ is harmonic n. Amplitude aₙ is relative strength, not decibels. Phase controls use degrees, converted to radians for calculation.'],
      ['横轴一个基准周期对应 1/f₀ 秒。调高基频会改变声音与时间尺度，但按周期画出的形状不变。相位改为 90°，会把该正弦变为余弦；把所有阶都加同一个角度，一般不等于把整个波形平移同一段时间。','One base cycle spans 1/f₀ seconds. Raising f₀ changes pitch and the time scale, but not the shape drawn against cycles. A phase of 90° turns a sine into a cosine. Adding the same angle to every harmonic generally differs from shifting the whole signal by the same time interval.']
    ],sources:[]},
    {title:['03 / 傅里叶与有限的和','03 / Fourier and a finite sum'],paragraphs:[
      ['Joseph Fourier 在 1822 年《热的解析理论》中用三角级数研究热传导。这是傅里叶方法的重要代表作；三角级数研究也有更早的参与者，不能把所有波动与合成方法归于一个人。本台的起点、方案栏与试听方式是为探索设计的界面。','Joseph Fourier used trigonometric series to study heat conduction in his 1822 Analytical Theory of Heat, a major work associated with Fourier methods. Trigonometric-series research also had earlier contributors; wave and synthesis methods are not one person’s invention. This workshop’s starting points, version shelf, and playback controls are interface choices for exploration.'],
      ['理想方波、锯齿和三角波可以用特定的谐波系数表示。本台只有前 16 阶，不是无限级数：方波与锯齿边缘会出现振铃，增加项数不会让跳变附近的所有过冲消失。脉冲起点也是零均值的有限余弦和，不是单个真实冲击。','Ideal square, sawtooth, and triangle waves have particular harmonic coefficients. This workshop stops at harmonic 16 rather than using an infinite series. Square and sawtooth edges ring; more terms do not remove all overshoot near a jump. The pulse example is a finite, zero-mean cosine sum, not a single physical impulse.']
    ],sources:[{label:'Fourier · The Analytical Theory of Heat (Cambridge edition)',href:'https://www.cambridge.org/core/books/analytical-theory-of-heat/F6D4802336FABD1116DDA4AA3FE6EFAA'},{label:'TU Delft · Fourier Series',href:'https://mude.citg.tudelft.nl/book/2024/signal/fourier_real.html'}]},
    {title:['04 / 一个可复现的对照','04 / A reproducible comparison'],paragraphs:[
      ['载入“锯齿的斜坡”，保存方案并选择它作参考。再载入“同谱异相”：每阶振幅完全相同，但相位不同。观察紫色实线与绿色虚线；振幅谱条与 RMS 相同，形状与峰值却可以不同。','Load Sawtooth ramp, save it, and select it as a reference. Then load Same spectrum, new phase. Every amplitude is identical but phases differ. Compare the purple solid and green dashed curves: amplitude bars and RMS match, while shape and peak can differ.'],
      ['RMS 是一个基准周期内平方后取平均再开方的量。本模型不同谐波相互正交，所以 RMS = √(Σaₙ²/2)，不依赖相位。峰值用每周期 8192 个间隔估计。形状差异 RMS 对齐双方的基准周期；它不是相同秒数下的音频差异，也不是听感评分。','RMS is the square root of the average squared signal over one base cycle. Distinct harmonics are orthogonal here, so RMS = √(Σaₙ²/2), independent of phase. Peak is estimated at 8192 intervals per cycle. Shape-difference RMS aligns the two base cycles; it is neither a difference over equal seconds nor a listening-quality score.']
    ],sources:[]},
    {title:['05 / 能做什么，又省略了什么','05 / Uses and boundaries'],paragraphs:[
      ['用最高阶限制模拟理想的高频截断，比较尖角、平滑和频谱；用独奏听各层，再恢复混合。缺席基频例子帮助区分“某路没有振幅”和“没有共同重复周期”。这些适合课堂演示、声音设计草图与信号学习，不是音色识别或听力测试。','Use the cutoff as an ideal high-frequency truncation to compare edges, smoothness, and spectra. Solo layers, then restore the mix. Missing fundamental separates “no amplitude at one frequency” from “no common repeat period.” These are classroom, sound-design, and signal-learning experiments, not timbre recognition or hearing tests.'],
      ['模型只包含固定的整数谐波，没有直流、非整数分音、真实乐器的起音与衰减，也不模拟房间。图的纵轴自动缩放；虚实曲线共用刻度。试听与 WAV 采用相同的 24 kHz 信号、保守幅度与短淡入淡出；所有允许的谐波频率都低于其 12 kHz 奈奎斯特频率。音量还取决于设备，请先调低音量。','The model has fixed integer harmonics, no DC or non-integer partials, no real instrument attack/decay, and no room. The vertical axis fits both curves on a common scale. Playback and WAV use the same 24 kHz signal with conservative amplitude and short fades; every allowed harmonic is below its 12 kHz Nyquist frequency. Device volume still matters: start low.']
    ],sources:[]}
  ]
};
