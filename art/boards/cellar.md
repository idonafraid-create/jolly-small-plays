# B1 · The Thing in the Keg Room · 分镜（待确认）

依据：`js/scenes/cellar.js`、`assets/cellar.json`（全长 33.0 s）。章节：DRIP 0 · THE STAIRS 2.6 · SOMETHING 10.2 · CANDLES 12.6 · IT RISES 15.8 · THE BOSS 20.0 · EXIT 27.0。
关键事件：enter 2.6 · bottom 6.6 · pickKeg 8.0 · peek 10.2 · candles 12.6 · drop 15.4 · rise 15.8 · eye 17.0 · reveal 20.0 · chord 23.0 · vo 24.3–25.9（NO BARK. ALL BITE.）· flee 27.0 · miao 28.6 · out 29.2。

造型：1F、后巷、B1 三层里 Jojo 和 Lyly 都是酒吧乐队的打扮（Jojo 灰西装 + 礼帽，Lyly 深绿西装 + 珊瑚色领结、黑白拼色皮鞋），只有 2F 才是侦探风衣和警服（用户 2026-10-24 指正）。参考图 `art/src/sheet_band.png`，提示词块 `JOJOCLUB` / `LYLYCLUB`。

期号：按故事时间排是 **No. 3**（00:06，1F 23:47 → 后巷 23:58 → B1 00:06 → 2F 00:13）；如果维持 HANDOFF 里的楼层顺序则是 No. 1。期号只影响封面角标、刊头、EXHIBIT 字母和"下周预告"，分镜本身不变。下文按 No. 3 写。

## 封面（对折右半页，沿用 2F 的刊头版式）

- 角标：`No. 3` + Lyly 头像 + `10¢`。
- 黄色标语条：**Don't go in the basement!** / *(Lyly went in the basement.)*
- 封面画（codex）：Lyly 站在地窖楼梯脚下吓僵，芥末色墨镜滑到鼻尖，手电光柱斜着劈开黑暗，正好打在地面排水口里一只巨大的黄绿色竖瞳眼睛上；青蓝色触手从画面边缘卷进来；远处一束红光里，YOYO 坐在啤酒箱垒成的王座上抱着小吉他坏笑，四只戴兜帽的老鼠举着蜡烛围成一圈。
- CAM 框：`● CAM B1 · LIVE`
- 标题飘带：小字 *Down in the cellar:* · 大字 **The Thing in the Keg Room!**
- STARRING 头像条（7）：Lyly · YOYO · The Thing · Br. Nibble · Sr. Crumb · Br. Squeak · The Young One

## 刊头 / 结尾

- 刊头：*The Thing in the Keg Room* · *Starring Lyly on Bass · Something in the Drain · and You-Know-Who* · 期号框 `No. 3 · B1 · The Cellar · 10¢ or one donut`
- 假广告（可点）：**Amazing Drain Pets!** *They grow! They obey! Just add milk.* *Only 10¢ · Jolly Novelty Co., Bklyn* → 点击 toast：`Order received` / `Your pet is already in the drain.`
- 结尾印章：**Case Open** / *She runs the basement.*（前三期都盖 CASE OPEN，第四期盖 CASE CLOSED，四本连起来是一个案子）
- 结尾按钮：`GOING UP · 2F ↑`（按时间顺序下一期是 2F）

## 版面：「往下走的楼梯」

左边一整条竖格是楼梯井（读者先顺着它往下走）；右边上下两排之间的横缝不是一条直线，而是**两级台阶**：中间一列在 y≈540 断开，右边一列在 y≈650 断开，从左到右一级比一级低。台阶的边沿用粗墨线画成踏板的样子。

```
┌──────┬───────────────┬───────────────┐
│P1 CAM│ P3 手电格      │ P4 它升起来了   │
│──────│ (签名格)       │ (视频格)        │
│      ├───────────────┤                │
│ P2   │ P5 老板        ├──────┬────────┤
│ 楼梯 │ (反向揭示)      │ P6   │ P7 CAM │
│(竖长)│     ◯I1        │ 逃跑 │ (像素) │
└──────┴───────────────┴──────┴────────┘
```

## 逐格

### P1 · CAM B1（像素截帧，压在楼梯格左上角的监控小框）
- 章节 t 0，原声 0–2.6。像素剧 t≈1.8（灯泡闪、老鼠窜过），zoom 1.4。
- 文字：① 标签 `● CAM B1 · 00:06:00` + 说明框（左下）*Six minutes past midnight. The cellar of the Jolly.* ② 拟声 `drip.`（小、不震）+ 指着一只老鼠的小标签 *Just a rat.*（照搬像素剧悬停时的名字）
- 运镜：从封面翻开后直接落在这个小框上（监控视角开场）。

### P2 · THE STAIRS（竖长格，楼梯井）
- 章节 t 2.6，原声 2.6–10.2。
- 画（codex，竖版 2:3）：俯视窄木楼梯，顶上开着的门漏进暖光；楼梯脚下 Lyly 左臂夹着小酒桶、右爪举手电，光柱在石板地上切出一个锥形；拱形壁龛里的酒架、滴水的铜管、电线吊着的灯泡。
- 文字：① 说明框（左上）*Between sets, Lyly was sent down for one keg.* ② 镜头走到楼梯底时，Lyly 哼歌的小气泡 *♪ No talk... all bark... ♪*（No. 1 的歌，跨期彩蛋）③ 说明框（右下）*How hard could it be?*
- 运镜（新）：**摇臂下降**。进格时镜头先贴着门口的暖光，再用约 3 秒顺着楼梯往下移到 Lyly，最后才收成整格。读者"跟着她下楼"。

### P3 · SOMETHING / CANDLES（签名格：读者拿着手电）
- 章节 t 10.2，原声 10.2–15.4。
- 画（codex，横版 3:2，**整间地窖打亮了画**）：中央的圆形排水篦子、口红画的召唤阵和爪印符号、八根白蜡烛、四只戴酒红兜帽的小老鼠（红眼睛，各举一根蜡烛）、篦子里探出一截触手尖、地上一支口红；拱形酒架、木桶；最远的角落里，啤酒箱王座上只有一对眼睛和一个酒红蝴蝶结（YOYO 躲在暗处）。
- 代码：同一张画印两版（亮 / 几乎全黑），平时显示黑版，**手电光圈**挖开一个柔边圆露出亮版。光圈跟着鼠标走；鼠标不动 1.5 秒后自己飘到这一步的目标。触屏没有悬停，就按步骤自动扫。
- 文字：
  ① 光圈落在篦子上：说明框（奶油色、斜边）*Something down here was awake.* + 篦子边小拟声 `blub.`
  ② 蜡烛一根根点亮（按原声 12.6 起每 0.38 s 一根，和像素剧一致），每根蜡烛自己再开一个小光圈，兜帽老鼠逐个出现；拟声 `fft · fft · fft`；说明框 *Then somebody lit the candles.*
  ③ 光圈移到口红：深色说明框（2F 线索格的样式）*Clue · Lipstick*〈小字〉*Wine red. Paw-sized.*
- 彩蛋：只有读者自己把手电照到最远的角落，才会看到 YOYO 的眼睛和蝴蝶结，同时冒出她的小悄悄话气泡 *shh.*

### P4 · IT RISES（视频格，MiniMax H3 768P）
- 章节 t 15.4，原声 15.4–20.0。
- 画（codex，横版）：贴地的低机位，从排水口后面看：圆形篦子里一只巨大的黄绿色眼睛、黑色竖瞳正在睁开，绿光往上冒，六条青蓝色触手（粉色吸盘、紫色尖）从篦子四周升起打卷；背景里 Lyly 僵住，右爪举手电，酒桶正从左臂滑落，墨镜滑到鼻尖；灯泡已经灭了。
- 视频：0–1.5 s 眼睛睁开；1–4 s 触手升起、摇摆；墨镜继续往下滑，Lyly 发抖。提示词写死：Lyly 只有右爪握手电，左爪空着；固定机位。
- 文字（按视频时间出）：`THUD.`（酒桶落地）→ `SHLORRRP!`（触手）→ Lyly 的尖叫气泡 `!!!`；② 编者注 *\*Not in the job description. —Ed.*
- 运镜（新）：**顺着动作线走**。视频播完后，一条触手（代码画的 SVG，平涂青蓝 + 粉色吸盘 + 墨线，和 2F 的口红爪印同一做法）从 P4 左下角伸出画框，越过台阶形的格缝，一路弯进 P5；镜头沿着这条触手滑下去，停在它的尖端。

### P5 · THE BOSS（反向揭示 + 原声卡点）
- 章节 t 20.0，原声 20.0–27.0。
- 画（codex，横版）：YOYO 坐在红色啤酒箱垒的王座上，酒红丝绒坐垫，小吉他搁在腿上，一只爪子像摸小狗一样摸着卷到她面前的触手尖；黄铜烛台上三根蜡烛；头顶一束红色追光；四只兜帽老鼠在两边鞠躬，最小的那只举着蜡烛欢呼。
- 运镜（新）：**先特写再拉开**。镜头接着触手尖，先停在 YOYO 的爪子和触手上（她小声说 *Good boy.*），然后慢慢拉开露出整个王座。
- 文字：
  ① 进格：YOYO 悄悄话 *Good boy.* → 拉开后说明框 *The Thing had a boss.*
  ② **跟原声走**（不靠点击）：23.0 s 和弦响时，整页闪红光、大拟声 `KRRANNG!`、音符从吉他放射出去、老鼠欢呼；24.3 s YOYO 的爆炸气泡 *No bark.*，25.4 s 第二个 *All bite.*（和像素剧的人声对齐）
  ③ 编者注 *\*She went UPSTAIRS eight minutes ago (No. 2). Don't ask. —Ed.*

### I1 · THE YOUNG ONE（小插框，圆形，压在台阶转角）
- 从 P5 的画里裁：最小的兜帽老鼠举着蜡烛欢呼。`audio: 'keep'`。
- 文字：编者注 *\*Candle duty is a paid position. —Ed.*

### P6 · EXIT（落下的手电在转）
- 章节 t 27.0，原声 27.0–29.2。
- 画（codex）：Lyly 在一团尘土里冲上楼梯，两臂高举，警帽飞掉；手电扔在地上，光柱横躺在石板上；酒桶滚到了王座脚下。
- 代码：和 P3 一样印亮 / 暗两版，扔在地上的手电在**转圈**：一道旋转的光楔像灯塔一样扫过整格，扫到哪里亮哪里（照搬像素剧 droppedTorch 的转速曲线）。
- 文字：① Lyly 的尖叫气泡 `YIPE!` + 顺着楼梯排开的速度字 `ZOOM` ② 说明框（右下）*Lyly left the keg. And the flashlight.*

### P7 · CAM B1（结尾像素截帧）
- 章节 t 28.6，原声 28.6–33.0。像素剧 t≈31.5，zoom 2.2 对准王座（YOYO 在红光里眨眼，触手在下沉）。
- 文字：① 标签 `● CAM B1 · 00:06:33` + 说明框 *Filed at 00:06:33. Nobody went back for the keg.* + 指向 YOYO 的小气泡 *miao.* ② **EXHIBIT C**（口红）：已收集显示 ✓；没收集显示 *▶ Find it in the footage* 回到 12.6 s ③ 编者注 *Next Sunday: Room 203.*

## 本期签名

- 签名格：P3 读者自己拿手电照地窖（鼠标 = 手电）。
- 签名运镜：P6 地上转圈的手电像灯塔一样扫格子；P2 摇臂下楼。
- 新运镜：摇臂下降（P2）、顺着触手越过格缝（P4→P5）、先特写再拉开（P5）、原声卡点（P5）。

## 出图清单（codex，确认后才跑）

| job | 内容 | 比例 |
| --- | --- | --- |
| `sheet_cellar` | 本期配角设定图：The Thing（眼睛 + 触手）、四只兜帽老鼠、普通灰老鼠；YOYO 抱小吉他的姿态 | 3:2 |
| `cover_cellar` | 封面画 | 4:3 |
| `b1_stairs` | P2 楼梯 | 2:3 竖 |
| `b1_cellar` | P3 整间地窖（打亮） | 3:2 |
| `b1_rise` | P4，同时是视频首帧 | 3:2 |
| `b1_boss` | P5 王座（I1 从这里裁） | 3:2 |
| `b1_exit` | P6 逃跑 | 1:1 |

参考图：`sheet_leads.png`、`sheet_support.png`、`sheet_cellar.png`、像素截帧（t 1.8 / 13.5 / 21 / 31.5，用完删）。`_blocks.md` 新增 `CELLAR` 房间块和 `THING` / `CULT` 角色块。
图生视频：`b1_rise` → H3 768P → `assets/comic/cellar/p4.mp4`，按实际画面对齐拟声时间。
