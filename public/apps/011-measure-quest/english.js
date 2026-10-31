'use strict';
globalThis.ProgramEnglish={
 '011 · 瓶中分寸':'011 · Measure Quest','011 瓶中分寸：十六关倒水谜题，规划容器空位与管路，精确分配每一份水。':'011 Measure Quest: sixteen pouring puzzles about capacity, empty space, and connected routes.',
 '把刚刚好，':'Find the right amount,','倒进每个瓶子。':'for every vessel.','有时，你需要的不是更多的水，而是一点空位。':'Sometimes the useful thing is a little empty space.','阅读背景与方法 ↓':'Read the background ↓',
 '01 / 倒水工作台':'01 / The pouring table','选择关卡（全部可直接进入）':'Choose a puzzle (all are available)',
 '每次都要倒到底。':'Always pour to a boundary. ','从一个容器倒向另一个，直到来源为空或目标装满；不能在中途随意停下。每次有效倒水、装满或倒空计 1 步。':'Pour until the source is empty or the destination is full; you cannot stop partway. Each effective pour, fill, or empty action counts as 1 move.',
 '容器示意图等高，水位表示各自容量的占比；比较实际份量请看数字。先选来源，再用下方按钮选择去向。':'Vessels are drawn at equal height; water shows the fraction of each capacity. Compare amounts using the numbers. Select a source, then choose a destination below.',
 '装满来源':'Fill source','倒空来源':'Empty source','↶ 撤销':'↶ Undo','↷ 重做':'↷ Redo','重开本关':'Restart puzzle','下一关 →':'Next puzzle →',
 '键盘：1–4 选来源，U 撤销，Y 重做；所有按钮也可用 Tab 与 Enter。重开会清空本关当前步骤，保留成绩。每次尝试最多 200 步，可撤销或重开继续探索。':'Keyboard: 1–4 select a source, U undoes, Y redoes. All buttons also work with Tab and Enter. Restart clears this attempt and keeps records. Each attempt allows 200 moves; undo or restart to continue exploring.',
 '本次完整操作记录':'Full log of this attempt','02 / 卡住的时候':'02 / When you get stuck','先看空位，再看水量。':'Look at empty space as well as water.',
 '提示只显示当前状态的一步建议，不会自动操作。查看提示会把本次尝试标为“辅助”，撤销不会抹去此标记；重开可重新独立挑战。':'Hints show one next move from the current state without acting automatically. Asking marks this attempt as assisted; undo keeps that mark. Restart to try independently again.',
 '查看下一步建议':'Show a next-move hint','执行这一步建议':'Apply this hint','03 / 数论小试验':'03 / A number-theory experiment',
 '这是独立的双容器试验，不改变闯关。假设从空开始、有无限水源、允许任意互倒与排水，只要求任意一个容器得到目标量。':'This separate two-vessel experiment leaves the puzzle untouched. Start empty with unlimited water, unrestricted pouring and draining, and require the target amount in either vessel.',
 '容量 A':'Capacity A','容量 B':'Capacity B','目标量':'Target amount','检查可达条件':'Check reachability',
 '数值均为 1–12 的整数。这个结论不能直接用于有限水量、指定全部容器目标或受限管路的关卡。':'Use whole numbers from 1 to 12. This criterion does not directly solve finite-water puzzles, full-vector goals, or restricted pipes.',
 '04 / 我的量水笔记':'04 / My pouring notebook','自己的思路（可选，最多 2000 字符）':'Your strategy notes (optional, up to 2000 characters)','比如：先给中转容器留下空位……':'For example: leave space in the junction vessel first…',
 '独立与辅助成绩分开保存。达到最短步数的独立成绩标为金标；用更多步骤完成也算通关。切换关卡保留各自步骤、重做和辅助标记。':'Independent and assisted records are separate. An independent shortest solution earns a gold mark; longer solutions still complete a puzzle. Switching preserves each attempt, redo history, and assistance mark.',
 '05 / 留下这次探索':'05 / Keep your exploration','↓ TXT 本关记录':'↓ TXT puzzle log','↓ JSON 完整备份':'↓ JSON full backup','导入 JSON':'Import JSON','撤销最近一次导入':'Undo last import',
 'JSON 包含全部关卡的尝试、重做、成绩和原文笔记；上限 150 KB。导入会整体替换，可在继续操作前撤销最近一次导入，撤销导入不跨刷新。无法验证的步骤或成绩会被拒绝，原记录保留。':'JSON includes all attempts, redo moves, records, and original notes; maximum 150 KB. Import replaces everything and can be undone before further activity in this visit; import undo does not survive reloading. Unverifiable moves or records are rejected, keeping existing work.',
 '一份理想化的模型。':'An idealized model. ','只计算整数份量，不模拟真实流体、刻度误差或流速。闭合关不增减总水量；管路关只允许标出的双向连接。':'Only whole-number amounts are modeled, without fluid dynamics, measurement error, or flow rates. Closed puzzles conserve water; pipe puzzles allow only the listed two-way connections.',
 '留在当前浏览器。':'Keep it in this browser. ','步骤、成绩和笔记保存在本机，不上传。清除浏览器数据会删除记录，请导出备份。切换语言不改变状态，也不翻译自己的笔记。':'Moves, records, and notes stay on this device and are not uploaded. Clearing browser data removes them; keep a backup. Language changes preserve state and your original notes.',
 '011 / 游戏 · 量水与规划 · 完全本地':'011 / Games · Pouring and planning · Offline'
};
