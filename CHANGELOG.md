# 更新记录

这里记录新加入的小程序、体验改进，以及使用时需要知道的说明。

## 2026-10-31

### 010 Critical Path Desk

- Explore eight complete projects with 79 bilingual tasks: a community exhibition, repair workshop, zine, environment logger, shared dinner, rooftop garden, interview episode, and school science day. Each has different dependencies and an exploration prompt.
- Edit up to 24 tasks, durations, and finish-to-start dependencies. Inspect earliest and latest schedules, total/free float, all critical tasks, critical connections, and the number of longest paths. Cycles are rejected without overwriting the network. This engineering workbench explores precedence and parallelism rather than daily time allocation or packing choices.
- Preview a duration change across the whole network before adopting it, inspect each task’s independent one-unit acceleration, compare eight saved networks, and undo thirty recent changes. Custom names and titles remain as entered; language changes preserve unapplied edits.
- Export an SVG timeline, a CSV calculation table, or a strict version-1 JSON backup. Invalid, cyclic, or oversized imports preserve existing work; successful replacement can be undone. Applied networks and saved versions stay in this browser; drafts, previews, and undo history do not survive reloads.
- The bilingual contextual guide introduces dependencies, early/late times, float, multiple critical paths, an exhibition example, Kelley and Walker’s related work, and model limits. Durations use abstract units, all tasks are required, and resources are assumed sufficient. There are no calendars, staffing constraints, costs, or probabilistic estimates.
- Validation coverage includes independent exhaustive-path comparisons on every template and 200 generated networks, float thresholds and tied paths, backup rejection and restoration, real SVG/CSV exports, and desktop/mobile bilingual editing, previews, versions, keyboard controls, and offline use.

## 2026-10-30

### 009 Wave Workshop

- Build a periodic signal from sixteen individually editable harmonic amplitudes and phases. Mute, solo, restore the mix, limit the highest harmonic, and inspect the sum, component curves, amplitude bars, exact cycle RMS, and an estimated peak.
- Eight complete starting experiments cover a sine, square and sawtooth approximations, triangle, octave layers, a narrow pulse, missing fundamental, and identical amplitudes with different phases. Each has a concrete exploration prompt. This signal-synthesis workbench offers a different activity from the collection's particle fields and probability experiments.
- Save eight local versions, overlay a reference on a common vertical scale, compare shape-difference RMS, and undo thirty recent actions. Custom titles stay as entered. Export a two-second WAV, an SVG plot, one-cycle CSV samples, or a restorable JSON backup.
- A bilingual guide explains linear superposition, frequency, amplitude, phase, Fourier's heat work, finite-series ringing, interpretation of statistics, and model boundaries. Reference comparisons align base cycles rather than equal time intervals; they compare shapes rather than pitch.
- Playback uses 24 kHz mono samples with amplitude-sum attenuation and short fades; WAV stores the same signal as 16-bit PCM. No microphone, login, network runtime, or external asset is required. Settings and saved versions stay in this browser; clearing browser data removes them, and undo does not survive reloads.
- Validation includes independent numerical RMS and difference checks, all eight distinct signals, cutoff and mute behavior, version-1 backup rejection and restoration, SVG escaping, WAV headers and sample bounds, bilingual desktop/mobile workflows, keyboard controls, listening, exports, and offline file use.

## 2026-10-29

### 008 Pack & Pick: keep deliberately edited item names

- An item renamed to an existing Chinese or English template label now stays exactly as entered when changing language, reloading, previewing a selection, or exporting and restoring a backup.
- Editing only a template item's measurements still keeps its bilingual label. Existing version-1 records and backups remain compatible; item quantities, selections, and packed marks are preserved.
- The background guide adds a referenced example of early discrete-optimization research, distinguishing that history from this app's packing controls and avoiding an inventor claim for travel packing.
- Regression coverage exercises both naming paths, undo, saved records, TXT/JSON exports, and backup import on desktop and mobile.

### Background guides throughout the collection

- All eight apps now offer contextual reading: the existing Logic Patch primer is joined by seven Chinese/English guides with examples, uses, references, and clear model boundaries. Compact entries sit beside the activity or in its adjacent panel; extended reading is optional and does not alter user work.
- Orbit Garden distinguishes artistic fields from Newtonian gravity. Probability Rain explains discrete binomial counts, normal distributions, de Moivre's early approximation, and why more samples do not make every distribution normal. Its theory line remains exact binomial probabilities.
- Story Fold introduces related combinational writing and freewriting, including Rodari and Elbow, without inventing a sole originator for the app's four-card format. Erasure Poems explains found/erasure writing and Phillips's A Humument as a related historical work rather than a universal invention claim.
- Time Bento connects time budgets with proportional-area visualization and Shneiderman's treemap history. Light Path distinguishes reflection from refraction and physical optics from linked-button puzzle rules. Pack & Pick explains two-capacity group selection, a concrete counterexample to greedy choice, and limits of the packing model.
- All guide text is bundled locally, with optional external reference links. Language switching preserves disclosure/focus state, main controls, custom writing, and stored progress. Core interactions and algorithms are unchanged.

### 005 Logic Patch: a beginner's guide to digital logic

- Added a side guide explaining bits, AND, inclusive OR, and single-input NOT through everyday examples. It also explains the fixed workbench, inverted gates, and why four independent inputs require sixteen truth-table cases.
- An independent two-input experiment shows AND, OR, and NOT A, then reuses the same inputs in a half adder. Sum and carry explain why binary 1 + 1 is 10. The experiment does not change the main circuit or saved puzzle records.
- A progressive reading path connects gates to arithmetic circuits, ALUs, state, registers, memory, CPUs, and instruction-driven computer systems. It distinguishes the current combinational model from clocked circuits and a complete computer.
- Chinese/English explanations, keyboard operation, collapsible sections, and a compact mobile entry keep the guide available alongside the activity. References link to Cornell CS 3410 and the original Nand to Tetris arithmetic, memory, and architecture projects; the guide and experiment work offline.

### More to explore in 001–008

- **001 Orbit Garden:** eight different particle-force behaviors: attraction, repulsion, circular flow, spiral, two poles, traveling wave, horizontal rail, and hollow ring. Star catching keeps its original inward pull. These are artistic fields, not physical simulations.
- **002 Story Fold:** eight genres with four decks of twelve cards each (384 cards). New genres include historical fiction, science fiction, journeys, comedy, and fables. Each deck is drawn through before reshuffling; locked cards and writing are preserved.
- **003 Probability Rain:** eight guided experiment starting points and a comparison desk for up to eight results. Compare sample size, observed/theoretical mean and standard deviation, and total variation distance; export comparisons as CSV. Comparisons last for the current page session. The distance is descriptive, not a significance test, and need not decrease after every additional sample.
- **004 Time Bento:** eight editable plans with at least eight activities each, including exam preparation, working from home, caring, travel, and creative work. Existing plans, undo, and local records remain usable.
- **005 Logic Patch:** sixteen tasks, including ten inventory challenges. Seven new targets have different truth tables and exactly one inventory-valid circuit each; satisfying the truth table alone still does not bypass inventory.
- **006 Light Path:** sixteen paths with seven new ten-mirror boards. Each new board has one complete optical solution; minimum linked-control counts are 6, 7, 8, 8, 9, 9, and 10. Enlarge the board and scroll within its viewport for closer inspection.
- **007 Erasure Poems:** ten original bilingual passages spanning everyday life, making, nature, travel, and observation. Each source has aligned words, an editable example, and its own saved draft. Custom writing and titles stay as written.
- **008 Pack & Pick:** eight editable packing templates with at least eight item groups each, including hikes, beach trips, commuting, photo walks, and picnics. Template measurements are illustrative; adjust them to your own items and capacity.
- Validation covers deck exhaustion and translation coverage, complete source examples, template validity, distinct finite particle forces, probability comparison calculations, exhaustive circuit search, and independent breadth-first searches of mirror states. Browser checks cover new content, Chinese/English, keyboard controls, mobile layouts, local records, exports, and offline files.

### 008 行囊取舍

- 同时设置重量和空间上限，为物品填写单件数值、数量和整组重要度，保留必带物品，再比较可选组合。建议先预览再采用，不会默默修改清单；必带已超额时明确提示。
- 与按一天分配时长的时间便当不同，这里使用两项独立容量约束，按每行整组取舍。组合优先保留更高的重要度总分，同分时依次选更轻、更省空间的组合；不模拟形状与真实摆放。
- 支持三份样例、物品编辑、带上与打包标记、最近 30 步操作撤销、TXT 清单和可重新导入的 JSON 备份。打包只记录进度，不释放容量；自填标题和名称保持原文。
- 核心验证以独立穷举对照取舍结果，覆盖整数计量、数量、双约束、必带超额、零成本、同分、18 行边界与坏记录。浏览器验证覆盖中英、桌面手机、键盘、导出导入、撤销、存储失效与断网文件。

## 2026-10-28

### 007 留白诗笺

- 从短文中挑出词语，保留底稿顺序，通过遮盖与逐词换行创作小诗。提供三篇原创中英底稿；切换语言保留对应词位与换行。
- 支持自带短文（最多 1200 字符、180 个可选词或汉字）、独立草稿、标题、最近 30 步操作撤销，以及 TXT 与 SVG 诗笺导出。自己的文字与标题保持原文。
- 与故事灵感卡不同，这里通过删减与留白发现新的表达，不设关卡、评分或标准答案。支持键盘、手机、离线文件和浏览器本机保存。
- 验证覆盖选词顺序、分词边界、坏记录恢复、原文保护、导出转义、语言切换、独立草稿与操作撤销。草稿保存在当前浏览器；标题输入单独保存，撤销历史不跨刷新。

## 2026-10-27

### 六个小程序的英文版本

- 001–006 新增中文 / English 切换，覆盖操作说明、内置故事卡、实验反馈、事项样例、全部关卡目标与提示、无障碍标签，以及 TXT、PNG、SVG 中的说明文字。CSV 列名继续采用英文。
- 切换语言保留当前游戏、实验、锁定卡片、草稿、事项与通关状态；自己填写的标题、正文与事项名称保持原文。语言入口支持键盘操作、直接链接、浏览器偏好与离线文件。
- 主页进入程序、返回索引时沿用所选语言；英文长文案调整按钮、页头和手机布局。浏览器无法保存时仍可切换，通过链接继续使用英文。
- 验证覆盖六个页面的桌面与手机展示、中文回切、断网文件打开、存储失效、草稿原文保护与导出、实验计数、库存挑战及联动终关。

### 首页中英文切换

- 首页新增“中文 / English”切换，翻译介绍、分类、六张程序卡片、搜索提示、使用说明和感谢文字。
- 搜索同时识别中英文，切换语言时保留筛选条件；语言选择可在当前浏览器记住，也可通过 `?lang=en` 直接打开英文主页。
- 主页仍可离线打开，浏览器无法保存偏好时也能正常切换语言；各小程序的英文版本见上方更新。

### 字体与阅读体验

- 首页与六个小程序统一字号层级，正文以 18px 为基线，常用按钮和说明提高到 16px，辅助文字至少 14px。
- 中文采用黑体、宋体或楷体，英文与数字采用 Arial 或 Times New Roman；标题、数字和重要状态使用字重与颜色区分。
- 调整页头、窄按钮、卡片及手机布局，放大图表标注与导出文字。字体使用本机系统字体，缺失时回退至对应类别，无需联网加载。

### 005 / 006 闯关进阶

- 005「逻辑接线台」保留六张基础任务，新增三张器件库存挑战：在数量有限的逻辑门中寻找等价电路。真值表全对但器件超额时不能通关，提示默认收起。
- 006「折光小径」保留六条原有小径，新增三关联动挑战。一次点击会同时翻转多个镜片，需要规划整体光路；后两关使用 9×9 棋盘，操作目标分别为 5 次和 7 次以内。
- 联动表完整列出每个按钮的影响范围，悬停或键盘聚焦可以预览；超过目标仍可尝试、撤销或重置，暂不计为完成。
- 关卡选择器标明入门、进阶和挑战阶段，旧版完成记录与当前草稿继续保留。两款程序各有九关，仍支持离线使用和导出。

### 006 折光小径

- 新增六关镜片谜题：旋转斜杠与反斜杠镜片，让光束拾起全部星光后抵达终点。
- 通过路径规划解谜，尝试折返、交叉光路与干扰镜片；支持任意选关、撤销、重置和键盘操作。
- 当前棋盘、完成进度与最佳旋转次数可在本机恢复；光路可导出为 SVG，手机使用纵向布局。
- 采用格子转向规则，不模拟真实光学。撤销历史不跨刷新保留，清除浏览器数据会删除本机纪录。

## 2026-10-26

### 合集与使用说明

- 整理项目介绍、在线与离线使用方法、数据保存说明和反馈入口。
- 首页补充使用引导与感谢，编号搜索、分类筛选和独立入口保持可用。

### 005 逻辑接线台

- 新增数字逻辑实验台：四个输入、三个器件，支持 AND、OR、XOR、NAND、NOR、XNOR。
- 自由切换开关与器件，观察信号线、中间结果和完整真值表；也可以挑战六张任务卡，功能等价的接法同样能通关。
- 接线和通关进度可在本机保存，支持刷新恢复及 TXT 导出；手机使用纵向布局。
- 这是理想的 0/1 组合逻辑，不模拟电压、电流或延迟。参考：[Cornell CS 3410](https://www.cs.cornell.edu/courses/cs3410/2025sp/notes/logic.html)。

### 004 时间便当

- 用可视化餐盒分配一天 24 小时，最多添加 12 项事项，查看留白、超额和完成进度。
- 支持调整时长与顺序、删除、清空、三份样例和最近 20 步撤销；超额时仍保留全部事项。
- 方案可在本机保存并导出 TXT。这里只分配时长，不生成具体钟点日程；撤销记录不跨刷新保留。

### 003 概率落雨

- 在 4–12 层钉阵中累计投珠，调节每层向右的概率，观察实际直方图与理论分布。
- 支持暂停、速度调整、即时统计、完整数据表和 CSV 导出。
- 实验使用独立左右选择的二项分布模型，动画不模拟真实碰撞。参考：[NIST 手册](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366i.htm)。
- 刷新或改变层数、概率会清空当前实验，需要保留时可先导出数据。

### 002 故事折叠机

- 从人物、场景、目标、转折四张灵感卡开始写故事，支持三种气质与卡片锁定。
- 提供三分钟写作计时、计字、当前内容恢复、最多 12 篇草稿快照，以及载入、删除的即时撤销。
- 作品可导出 TXT。草稿仅保存在当前浏览器，重要内容请另行留存。

### 001 引力花园

- 按住并拖动牵引星尘，自由作画，或参加 45 秒捕星挑战。
- 支持三种配色、引力调整、暂停、重置与 PNG 留影，本机记录最高分。
- 支持鼠标、触控和键盘操作；本地文件与合集之间可以直接往返。
