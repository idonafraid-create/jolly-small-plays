# AL · Rain Check · 分镜（待确认）

依据：`js/scenes/alley.js`、`assets/alley.json`（全长 32.89 s）。章节：FREIGHT 0 · TRASH NIGHT 3.4 · THE SOLO 10.8 · LIGHTNING 18.04 · THE BELL 22.39 · LAST TRAIN 26.09。
关键事件：train1 0.4（快车）· doorOpen 3.4 · hiss 5.9 · bagsDrop 6.8 · catsJump 7.1 · bark 7.6 · jojoOut 9.3 · solo 10.8 · flash1 18.04 · flash2 19.54（铃铛掉下）· bellLand 21.39 · pick 22.39 · opera 23.19 · catsGo 23.59 · blind 23.79（楼上百叶窗一闪）· point 25.19 · train2 26.09（慢车）· 三只猫约 30.4 s 跳上守车后廊。

期号：按故事时间排是 **No. 2**（23:58）；按楼层顺序则是 No. 3。下文按 No. 2 写。

## 封面

- 角标：`No. 2` + Lyly 头像 + `10¢`。
- 黄色标语条：**Who dropped the bell...?** / *and why are the cats leaving town?*
- 封面画（codex）：雨夜后巷。后门光秃秃的灯泡下 Jojo 闭眼吹萨克斯，Lyly 坐在木箱上；三只野猫蹲在绿色垃圾箱盖上；高处黑铁防火梯被一道闪电照亮，最顶上一只撑伞小猫的剪影；铁丝网后面货车车头灯的光柱穿过雨幕；前景半空里一只小金铃正往下掉。
- 刊名副标题（每期按题材换，用户 2026-10-24 定）：2F DETECTIVE COMICS · B1 CTHULHU COMICS · 1F SWING COMICS · 本期暂定 **ALLEY CAT COMICS**（做这期时再请用户定）。
- CAM 框：`● CAM ALLEY · LIVE`，放在封面画的**右上角**（`box: [712, 282, 262, 172]`；2F、B1 在右下，1F 在左上）。封面画右上角要留一块安静的区域，防火梯和闪电往中间挪。
- 配色、做旧位置都要和前三期不同：配色暂定雨夜的石板灰蓝 + 霓虹粉 + 信号灯橙，撕口、咖啡渍、折痕、胶带另选位置（`cover.worn`），可以多一块被雨打湿的水渍。
- 标题飘带：小字 *Out back of the Jolly:* · 大字 **Rain Check!**
- STARRING 头像条（7）：Jojo · Lyly · YOYO · Tubbs · Patch · Ghost · Old Blue

## 刊头 / 结尾

- 刊头：*Rain Check* · *Starring Jojo on Sax · Lyly on Bass · Three Alley Cats · and You-Know-Who* · `No. 2 · Back Alley`
- 假广告：**Rain Checks!** *Good for one (1) dry night.* *5¢ · not valid in Brooklyn · Jolly Weather Co.* → toast：`Rain check issued` / `Valid: never.`
- 结尾印章：**Case Open** / *She went upstairs.*
- 结尾按钮：`NEXT ISSUE · B1 ↓`

## 版面：「铁轨」

上排四格，第三、四格之间的格缝本身就是**一道锯齿形闪电**。下排右边三格是铁丝网后面的铁轨侧视，三格的铁轨画在同一高度，最后那列慢车是一层单独的抠图，从左往右开过三格、压过格缝、最后开出纸边。

```
┌──────┬──────────┬───────────╱╲──────┐
│P1 CAM│ P2 倒垃圾 │ P3 独奏    ╲ P4 闪电│
│      │ (视频格)  │           ╱ (仰拍) │
├──────┴──◯◯I1─┬─┴──────┬────╲───┬────┤
│ P5 铃铛       │ P6a    │ P6b    │P6c ▣I2│
│               │ 等车   │ 起跳   │ 上车  │
│               │══════ 慢车抠图层 ═════════▶ 开出纸边
└──────────────┴────────┴────────┴───────┘
```

## 逐格

### 开场：快车擦过整页（翻开封面后的第一下）
- 封面翻开、整页出现时，一列快车（和下排慢车用同一张抠图）在约 0.7 秒内从左到右擦过上排，`WHOOOOM` + 一串 `clack-clack`，整页抖一下；随后整页开始下雨（代码画的细斜雨，只落在格子里）。
- 这层雨在所有镜头移动时都比画面移动得快，形成前后景视差，不用 codex 分层出图。

### P1 · CAM ALLEY（像素截帧）
- t 0，原声 0–3.4。像素剧 t≈1.0（快车正从铁丝网后面经过）。
- 文字：① `● CAM ALLEY · 23:58:00` + 说明框（左下）*23:58. Out back of the Jolly. Raining, naturally.* ② 指向电线上乌鸦的小标签 *Edgar sees everything.*

### P2 · TRASH NIGHT（视频格，MiniMax H3 768P）
- t 3.4，原声 3.4–9.3。
- 画（codex）：Lyly 穿乐队的深绿西装（白衬衫、珊瑚色领结、黑白拼色皮鞋、黄色圆墨镜），两只爪子各拎一个黑色垃圾袋，正要甩上绿色垃圾箱；箱盖上三只野猫弓背哈气：Tubbs（大橘虎斑，黑马甲）、Patch（独眼黑猫）、Ghost（白猫，石板灰外套）；雨、后门灯泡、水洼。
- 视频：两袋垃圾砸到箱盖上，三只猫哈气后朝三个方向跳开，Lyly 冲它们吠。提示词写死：每只爪子各拎一个袋子，扔掉之后两爪都空着。
- 文字（按视频时间）：`HSSSS!` → `FWUMP.`（袋子落下）→ Lyly 的大喊气泡 *ALL BARK.\**；② 编者注 *\*Scram. —Translated from the Bark. —Ed.*（No. 4 里同款"翻译自狗语"的梗）

### P3 · THE SOLO
- t 10.8，原声 9.3–18.0。
- 画（codex，宽）：后门开着，Jojo（乐队的灰西装、礼帽，领带上别着粉色高跟鞋领带夹）站在灯泡下的雨里闭眼吹萨克斯；Lyly 坐在木箱上跟着点头；三只猫并排坐成一排当观众，跟着摇；绿白条纹雨棚下，流浪艺人 Old Blue 坐在倒扣的木箱上吹口琴；砖墙上的粉色霓虹，井盖冒白汽。
- 代码：砖墙上用酒红喷漆字体叠一行涂鸦 *YOYO 200% ♡*（像素剧墙上真有这行字，也和 No. 4 镜子上的口红签名呼应）；萨克斯的音符从格子里飘出去越过格缝。
- 文字：① 说明框（左上）*Then Jojo played the solo.* ② 折角说明框 *Even the cats stayed.* ③ 编者注 *\*Old Blue joined in. Nobody asked Old Blue. —Ed.*
- 运镜：约 4 秒的慢速横移（从左到右扫过整格），前景雨和音符的速度不同。

### 闪电格缝 + P4 · LIGHTNING（签名格之一）
- t 18.04，原声 17.6–21.4。
- 画（codex，竖）：仰拍，顺着湿漉漉的黑铁防火梯一直往上看；最顶上，闪电照亮的天空里一只撑伞小猫的剪影，单眼眨着；她项圈上的小金铃正往下掉；画面下角是 Jojo 的礼帽和 Lyly 警帽的背影，两人仰头看。
  - 和 No. 4 的闪电格区分：No. 4 是在屋里隔着窗看出去、用亮暗两版交替；这里是从地面仰拍，而且用**负片**。
- 代码：
  ① 原声到 18.04 s 自动触发：P3 和 P4 之间那道锯齿格缝**本身发白光**（格缝就是闪电），整页闪光，镜头**荷兰角倾斜 6° 加震动**，大拟声 `KRA-KOOM!` 横跨格缝；P4 在两次闪光帧里印成负片（油墨反相），然后回到正片。
  ② 深色说明框 *Suspect · YOYO*〈小字〉*Sighted: fire escape, 23:58*
  ③ 原声到 19.54 s 第二道闪电，铃铛开始掉（见下一条）。
- 编者注：*\*She likes fire escapes. See No. 4. —Ed.*

### 铃铛掉落的路线（新运镜：拿格缝当台阶）
- 一个代码画的小金铃从 P4 顶上掉下来，落到上下两排之间的横格缝上，**沿着格缝一路往左弹跳**（`ting · ting · ting`，每弹一下字小一号），弹到左边再掉进 P5 的水洼里 `TING!`。镜头全程跟着铃铛走，正好把远在右上角的 P4 和左下角的 P5 连起来。

### P5 · THE BELL
- t 22.39，原声 21.4–26.0。
- 画（codex）：Lyly 蹲在雨里，右爪从水洼里捏起一只小金铃端详；旁边 Jojo 举起金色观剧镜，望向墙上高处一扇亮着灯的窗；背景里三只猫正往铁丝网的破洞溜。
- 文字：① Lyly 的小气泡 *...her bell.* ② Jojo 举起观剧镜 →
- 运镜（新）：**推进镜片接下一格**。镜头推进观剧镜的两片镜片，镜片放大后直接变成 I1 的两个圆（HANDOFF 待办里提的"镜片变成下一格的双圆"，用在这里正好，也给 No. 4 的观剧镜格做预告）。

### I1 · THROUGH THE GLASSES（双圆小插框，压在 P5 右上角的格缝上）
- 从 P4 的画里裁那扇亮灯的窗；代码让百叶窗啪地闪一下（像素剧 23.79 s）。
- 文字：① 拟声 `flick.` ② Lyly 的大喊气泡 *She went upstairs!* + 一个手写箭头标签 *↑ 2F · Room 203 (No. 4)*

### P6a / P6b / P6c · LAST TRAIN（签名格之二：火车穿过格子）
- t 26.09，原声 26.0–32.9。三格都是铁丝网后的铁轨侧视，铁轨画在同一高度。
  - P6a：三只猫从铁丝网破洞钻出来，蹲在轨道边，一起朝左边看（车来的方向）；
  - P6b：三只猫腾空跃起，扑向画面里还空着的位置（守车后廊马上就会开到这里）；
  - P6c：空轨道，雨，电线杆上 Edgar 扑翅膀。
- 抠图层：整列货车（车头、两节棚车、守车）用一张纯色底的 codex 图抠出来；守车有两个版本：后廊空的、后廊上坐着三只猫（Tubbs 抬爪致意，Ghost 挥手，Patch 回头看）。
- 运镜（新）：**锁定守车横向跟拍**。货车从左边开进 P6a，镜头锁在守车上一路往右，P6a → P6b → P6c 从镜头底下滑过去；守车**一过 P6b 和 P6c 之间的格缝，后廊上就多了三只猫**（格缝外用空守车，格缝内用带猫的守车，两层各自按格子裁切）——跨过一道格缝，时间就往后跳了一步。最后火车开出纸边，开进页面外面的黑暗里。
- 文字：① P6a 说明框（左上）*The cats had a train to catch.* ② 车来时汽笛 `WHOOO!` + 跟在车尾的一串 `clack-clack` ③ P6c 说明框（右下）*Tubbs, Patch and Ghost took the last train out of Brooklyn.*

### I2 · CAM ALLEY（结尾像素截帧，压在 P6c 右上角）
- t 30.4，原声 30.4–32.9。像素剧 t≈32.5（空荡荡的雨巷）。
- 文字：① `● CAM ALLEY · 23:58:33` + 说明框 *Filed at 23:58:33. Three witnesses left town.* ② **EXHIBIT B**（铃铛）：已收集 ✓；没收集显示 *▶ It's only there for a second.* 回到 21.4 s（像素剧里铃铛只有 21.39–22.39 这一秒能点）③ 编者注 *Next Sunday: the cellar.*

## 本期签名

- 签名格：锯齿闪电格缝（P3/P4）+ 火车穿格子（P6a–c）。
- 新运镜：快车擦页开场、雨的前后景视差、荷兰角加震动、负片闪光、铃铛沿格缝弹跳的跟拍、推进镜片接双圆、锁定守车横向跟拍、开出纸边。

## 出图清单（codex，确认后才跑）

| job | 内容 | 比例 |
| --- | --- | --- |
| `sheet_alley` | 本期配角设定图：Tubbs、Patch、Ghost、Old Blue、Edgar、Nibs | 3:2 |
| `cover_alley` | 封面画 | 4:3 |
| `al_trash` | P2，同时是视频首帧 | 3:2 |
| `al_solo` | P3 独奏 | 3:2 |
| `al_lightning` | P4 仰拍防火梯（I1 的窗从这里裁） | 2:3 竖 |
| `al_bell` | P5 铃铛 | 3:2 |
| `al_track_a` / `_b` / `_c` | P6 三格铁轨（铁轨同一高度） | 1:1 |
| `al_train` / `al_train_cats` | 货车侧视抠图（纯色底），守车有猫 / 没猫两版 | 3:2 |

参考图：两张主角设定图 + `sheet_alley.png` + 像素截帧（t 1.0 / 7.0 / 15 / 18.1 / 22.5 / 31）。`_blocks.md` 新增 `ALLEY` 场景块和 `ALLEYCATS` 角色块。
图生视频：`al_trash` → H3 768P → `assets/comic/alley/p2.mp4`。
