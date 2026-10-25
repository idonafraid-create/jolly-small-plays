# 1F · No Talk, All Bark · 分镜（待确认）

依据：`js/scenes/bar.js`、`assets/bar.json`（全长 30.03 s，约 117 BPM，`beats` 55 拍）。章节：DOORS 0 · DOWNBEAT 2.0 · ALL BARK 5.0 · THE MARTINI 10.67 · BLACKOUT 22.53 · MISSING 24.03。
关键事件：music 2.0 · chorus 4.07 · bark1 5.0 · spin 10.22 · knock 10.67 · catch 11.27 · bark2 13.14 · wang 14.33 / 15.35 · jolly 16.70（招牌按拍闪）· blackout 22.53 · lights 24.03。
黑暗里发生的事（`bar.js` 第 492–498 行）：停电后 0.35–1.15 s 舞台上 Jojo 身边一对淡蓝眼睛眨两下；1.1–1.5 s 一点粉色闪光从 Jojo 飞到衣帽间（YOYO 藏身处）；灯亮后舞台地上留着一条酒红丝带。

期号：按故事时间排是 **No. 1**（23:47，剧本里本来就是 CH.01，也是网站默认打开的楼层）；按楼层顺序则是 No. 2。下文按 No. 1 写。

## 封面

- 角标：`No. 1` + Jojo 头像 + `10¢`。
- 黄色标语条：**Keep your eye on the tie clip!** / *(Nobody did.)*
- 封面画（codex）：低机位看俱乐部舞台，背后蓝色放射纹背景板：Jojo（乐队的灰西装 + 礼帽）闭眼吹金色萨克斯，领带上的**粉色高跟鞋领带夹**闪着一颗高光；Lyly（深绿西装、珊瑚色领结）抱着低音提琴甩到半空；Madame Lapin 在缎带麦克风前；前景左下一只马提尼杯在空中翻滚、橄榄飞出来；右下角衣帽间柜台，挂着的外套之间露出一个酒红蝴蝶结和一对眼睛。
- CAM 框：`● CAM 1F · LIVE`，放在封面画的**左上角**（`box: [26, 282, 262, 172]`；2F 和 B1 都在右下角）。封面画左上角要留一块安静的区域，右下角衣帽间那组照旧。
- 配色、做旧位置都要和 2F（红黄）、B1（绿紫）不同：配色暂定藏青 + 金 + 珊瑚粉（俱乐部的蓝色放射纹背景板和金色装饰），撕口、咖啡渍、折痕、胶带另选位置（`cover.worn`）。
- 标题飘带：小字 *Live at the Jolly Club:* · 大字 **No Talk, All Bark!**
- STARRING 头像条（7）：Jojo · Lyly · Mme. Lapin · Felix · Walter · Callie · **???**（YOYO 的头像做成纯黑剪影，标 ???。这一期她只露过一对眼睛）

## 刊头 / 结尾

- 刊头：*No Talk, All Bark* · *Starring Jojo on Sax · Lyly on Bass · and the Whole Jolly Club* · `No. 1 · 1F · The Jolly Club`
- 假广告：**Pink Stiletto Tie Clips!** *As worn by Jojo of the Jolly band.* *15¢ · while supplies last · Jolly Novelty Co.* → toast：`Sold out` / `Somebody took the last one.`
- 结尾印章：**Case Open** / *Somebody took the pink stiletto.*
- 结尾按钮：`NEXT ISSUE · BACK ALLEY →`

## 版面：「一架钢琴」

上排中间那一格是一排**琴键**：一张连续的观众全景图被竖缝切成 6 条白键，上沿垂下 4 条短黑键（钢琴 2+3 的排法，E 和 F 之间没有黑键），黑键盖在格缝上。下排中间夹着一格纯黑的停电格。

```
┌──────┬────────────┬─┬─┬─┬─┬─┬─┬──────────┐
│P1 CAM│ P2 开场     │琴│键│ P3│ │ │ │P4 马提尼 │
│      │      ◯I1   │ │ │ │ │ │ │(视频格)  │
├──────┴────────┬───┴─┴┬┴─┴─┴─┴─┴──────────┤
│ P5 第二段副歌   │P6    │ P7 不见了    ◯I2│P8│
│ (舞池全景)      │停电  │              │CAM│
└───────────────┴──────┴──────────────────┴──┘
```

## 逐格

### P1 · CAM 1F（像素截帧）
- t 0，原声 0–2.0。像素剧 t≈1.0 全景，zoom 1.2。
- 文字：① `● CAM 1F · 23:47:00` + 说明框（左下）*23:47. The Jolly Club, Brooklyn. Saturday night.* ② 编者注 *\*House rules: everybody barks along. —Mgmt.*（给 P3 埋伏笔）

### P2 · DOWNBEAT
- t 2.0，原声 2.0–5.0。
- 画（codex）：舞台全景：Jojo 闭眼吹萨克斯，领带上小小的粉色高跟鞋领带夹；Lyly 拍低音提琴、舌头伸出来；Madame Lapin（白兔，金色亮片长裙、珍珠项链）唱歌；Bruno（棕熊）打鼓；Old Chester（灰贵宾犬，戴眼镜）弹三角钢琴；背景板上的霓虹招牌不画字。
- 文字：① 说明框（左上）*Jojo plays sax at the Jolly on Saturdays.* ② 拟声 `BWAAP!`（萨克斯）+ `THWUMP!`（贝斯）③ 编者注 *\*He still does not talk. —Ed.*
- 运镜：最后一步**推进到领带夹**，直接接 I1。

### I1 · THE TIE CLIP（圆形小插框，压在 P2 右缘）
- 从 P2 裁领带夹，zoom 6，`audio: 'keep'`。
- 文字：拟声 `TING!`（小）+ 奶油色说明框 *Remember this tie clip.*（No. 4 的结尾正好是 Jojo 把它夹回去，首尾呼应）

### P3 · ALL BARK（签名格之一：镜头弹钢琴）
- t 5.0，原声 5.0–10.2。
- 画（codex，宽幅观众全景，切成 6 条）：一排客人全都仰头"汪"：Mr. Hamm（猪，银行家，圆顶礼帽）· Siam（暹罗猫，黑裙珍珠，端着马提尼）· Crowley（乌鸦，软呢帽，叼雪茄）· Prof. Hoot（猫头鹰，从晚报后面探出头）· Vinnie & Sal（两只老鼠，扑克牌飞起来）· Moe（快睡着的狗）。
- 黑键上横贯一条歌词飘带：*♪ No talk. All bark. ♪*
- 运镜（新）：**踩着拍子跳格**。这一格自动播放：镜头每 2 拍（约 1.03 s，用 `bar.json` 的真实拍点）跳到右边下一条白键，到哪条，那位客人的气泡就弹出来；6 条走完再拉开看整排。点击可以快进。
  - Mr. Hamm：*OINK— er, BARK!*
  - Siam：*...bark.*（猫，面无表情）
  - Crowley：*CAW— BARK!*
  - Prof. Hoot：*WHO— BARK!*
  - Vinnie & Sal：*BARK! BARK!*
  - Moe：*zzz... bark.*（悄悄话样式）
- 编者注：*\*Non-dogs bark at their own risk. —Ed.*

### P4 · THE MARTINI（视频格，MiniMax H3 768P）
- t 10.22，原声 10.2–13.1。
- 画（codex）：舞台上 Lyly 抱着低音提琴转到一半，琴身横扫过去，刮到狐狸服务生 Felix 的银托盘；马提尼杯飞在半空；Jojo 照样闭眼吹萨克斯，只抬起左爪等着接。
- 视频：琴转 → 刮到托盘 → 杯子划一道弧 → Jojo 闭着眼接住，继续吹。提示词写死：Jojo **右爪始终按在萨克斯上，只有左爪去接杯子**；Lyly 两爪都在琴颈上；Felix 一只爪子端托盘。
- 运镜（新）：视频播放时镜头**跟着杯子走**：先贴着托盘，顺着弧线平移到 Jojo 的爪子，接住后再拉开成整格。
- 文字（按视频时间）：`WHUMP!`（琴刮到托盘）→ `whee—`（杯子）→ `plink.`（接住）；② 说明框（右下）*No talk.*（像素剧原台词）③ 编者注 *\*Not a drop spilled. Felix was not tipped. —Ed.*
- 备案：如果 H3 接杯子做不好，改成静帧 + 代码让一个马提尼杯沿弧线飞，镜头照样跟。

### P5 · THE JOLLY WAVEBAND（舞池全景）
- t 16.7，原声 16.6–22.5。
- 画（codex，宽）：黑白棋盘格舞池，Duke & Kitty、Hopper & Fifi 两对在跳；舞台上 Lyly 高抬腿；左边吧台，海象酒保 Walter 擦杯子；卡座里 Bea 和 Dot 共用一根吸管；Prof. Hoot 在看报；吧台后面一扇小黑门（通往地窖）。
- 代码：霓虹招牌上叠一层 `THE JOLLY` 字样，**按原声拍点一亮一暗**（像素剧从 16.7 s 起就是这样闪的）。
- 文字：① 说明框（左上）*By the second chorus, the whole room was barking.* ② 编者注指着小黑门 *\*That door goes to the cellar. Remember it. —Ed.*（No. 3 兑现）
- 彩蛋：Prof. Hoot 手里晚报的头条用代码写一行很小的字 *STILETTO STOLEN!*——事情还没发生，报纸先登了。
- 运镜：慢速横移扫过舞池。

### P6 · BLACKOUT（签名格之二：整页停电）
- t 22.53，原声 22.5–24.03。这一格本身是纯黑，不用出图。
- 运镜（新）：**硬切**。全本其他地方都是缓动，只有这里镜头瞬间切到 P6，同一瞬间整张报纸的灯全灭（整页压黑），只剩会发光的东西：
  ① `CLICK.`（浅色字）；P6 里一对淡蓝眼睛眨两下（和像素剧同一时间点）；
  ② 一点粉色闪光 `zip!` 从 P6 飞出，越过漆黑的整页，钻进 I2 衣帽间的位置；镜头带运动模糊**甩过去跟着它**；
  ③ 原声到 24.03 s 自动来电：整页灯闪三下才亮稳（照搬像素剧的闪烁），镜头回到 P7。
- 读者在黑暗里已经看到东西飞去了哪里，Jojo 不知道。

### P7 · MISSING
- t 24.03，原声 24.0–27.5。
- 画（codex）：灯刚亮，Jojo **头一回睁大双眼**，低头看自己的领带：领带夹没了；脚边舞台地板上躺着一条酒红丝绒丝带；后面 Lyly 下巴掉下来；Madame Lapin 晕倒在 Bruno 怀里；满场客人毛都炸起来。
- 文字：① 说明框（左上）*When the lights came back...* ② 底部大字横幅（两色，和像素剧一样）*WHO TOOK THE* / *PINK STILETTO?* ③ 编者注 *\*Jojo opened both eyes. First time since 1951. —Ed.*
- 运镜：最后一步**带运动模糊甩到 I2**。

### I2 · COAT CHECK（圆形小插框）
- 单独出一张小图：衣帽间柜台，挂杆上的外套还在晃；奶油色猫 Callie（蓝色贝雷帽）耸肩；两件外套之间露出酒红蝴蝶结的一角，还有一点粉色反光。`audio: 'keep'`。
- 文字：编者注 *\*Callie saw nothing. Callie is a cat. —Ed.*

### P8 · CAM 1F（结尾像素截帧）
- t 27.5，原声 27.0–30.0。像素剧 t≈28，zoom 对准舞台。
- 文字：① `● CAM 1F · 23:47:30` + 说明框 *Reported at 23:47:30. No witnesses.* ② **EXHIBIT A**（丝带）：已收集 ✓ / 没收集 *▶ Find it in the footage* 回到 24.03 s ③ 编者注 *Next Sunday: the back alley.*

## 本期签名

- 签名格：P6 整页停电（硬切 + 只剩发光物 + 闪光飞向衣帽间 + 来电闪烁）。
- 新运镜：踩拍子跳琴键（P3）、跟着飞行的杯子平移（P4）、硬切（P6）、黑暗中甩镜头（P6 → I2 的方向）、带运动模糊甩到小插框（P7 → I2）。

## 出图清单（codex，确认后才跑）

| job | 内容 | 比例 |
| --- | --- | --- |
| `sheet_club` | 本期配角设定图一：Felix、Madame Lapin、Walter、Callie、Bruno、Old Chester | 3:2 |
| `sheet_crowd` | 设定图二：Mr. Hamm、Siam、Crowley、Prof. Hoot、Vinnie、Sal、Moe | 3:2 |
| `cover_bar` | 封面画 | 4:3 |
| `f1_stage` | P2 舞台（I1 从这里裁） | 3:2 |
| `f1_bark` | P3 观众全景，切琴键用 | 3:2（只用中间横条） |
| `f1_martini` | P4，同时是视频首帧 | 1:1 |
| `f1_dance` | P5 舞池 | 3:2 |
| `f1_missing` | P7 灯亮之后 | 3:2 |
| `f1_coats` | I2 衣帽间 | 1:1 |

参考图：两张主角设定图 + 本期两张设定图 + 像素截帧（t 1.0 / 3 / 11 / 17 / 25 / 28）。`_blocks.md` 新增 `CLUB` 房间块、`CLUBSTAFF` / `CROWD` 角色块。
图生视频：`f1_martini` → H3 768P → `assets/comic/bar/p4.mp4`。
