# 音效升级计划（待用户确认下载）

现状：
- 漫画里的音效（翻页 swish、印刷 clack、拟声字落下 thump、气泡 pop、口红 squeak、ting、汽笛、雷）全是 `js/comic.js` 的 `Foley` 用振荡器和噪声现场合成的，听起来像电子"哔啵"。
- 像素剧的原声由 `tools/build_audio.py` 生成：音乐是 JOLLY MV 的分轨；雷、雨、水滴、碰杯、门吱呀、火车、汽笛、嘘声这些是合成的；只有开关灯、铃铛、狗叫、印章、咕噜、吉他砸弦等十几处用了真录音（`D:\ClaudeAbout\JOLLY MV\10_music\sfx\`，CC0，来源见那里的 `CREDITS.md`）。

## 第一步：不用下载，先用手上已有的 CC0 录音替换漫画里的合成音效

| 漫画里的用途 | 现在 | 换成（已有文件） |
| --- | --- | --- |
| 印刷转场 | 合成 clack | `listen_dl/printer1.mp3` / `printer3.mp3`（针式打印机走纸） |
| 结尾 CASE OPEN / CLOSED 印章 | 合成 thump | `cand_v2/S1_stamp.mp3`（2F 像素剧里已在用） |
| 铃铛、TING!（1F 领带夹、后巷铃铛） | 合成正弦 | `bells/bell_4_closeup.wav`、`candidates/C3_single_bell.mp3` |
| 1F 停电 CLICK / 来电 | 合成 thump | `listen_dl/switch_off.mp3`、`switch2.mp3` |
| 2F 闪光灯 | 无声 | `camera_flash.mp3` |
| B1 YOYO 那格的咕噜 | 无 | `listen_dl/purr_short.mp3` |

## 第二步：从 freesound 下载 CC0 音效（需要用户同意）

方式和《别说话，听。》那次一样：用 Openverse 检索、只取 CC0 1.0，下载 freesound 免登录的高质量 MP3 预览版，每个 10–300 KB，合计约 36 个、约 3 MB，放到 `v2/assets/sfx/`，在同目录写 `CREDITS.md`（文件名、原标题、作者、授权、原页面）。CC0 不要求署名，但照旧记下来源。

| 用途 | 候选（作者 · 时长 · 大小 · 原页面） |
| --- | --- |
| 翻开 / 合上封面 | Page Turn（davidbain · 2.0s · 42KB）https://freesound.org/people/davidbain/sounds/136778 ；Page Turn (2)（OwlStorm · 1.8s）https://freesound.org/people/OwlStorm/sounds/151221 ；Page Turn 1（gfrog · 1.7s）https://freesound.org/people/gfrog/sounds/144110 |
| 镜头移动 / 甩镜头 | Little Whoosh 3（ch_ase · 2.5s）https://freesound.org/people/ch_ase/sounds/423798 ；Cartoony whooshes（BranRainey · 2.3s）https://freesound.org/people/BranRainey/sounds/142348 ；Deep Whoosh #1（Kinoton · 3.2s）https://freesound.org/people/Kinoton/sounds/351256 |
| 对白气泡弹出 | cartoon poppyup appearances 0002 / 0004（martian · 1.9 / 2.6s）https://freesound.org/people/martian/sounds/19285 、/19287 ；Pop!（oldedgar · 3.1s）https://freesound.org/people/oldedgar/sounds/97978 |
| 拟声字砸下来 | Human recorded punch（MaoDin204 · 1.9s · 10KB）https://freesound.org/people/MaoDin204/sounds/717513 |
| 印刷机（备选） | printing press room rythmic machine sounds（kyles · 12.3s）https://freesound.org/people/kyles/sounds/637767 |
| 2F 口红写镜子 | marker-whiteboard-squeak02 / 01（newagesoup · 2.8 / 5.2s）https://freesound.org/people/newagesoup/sounds/335955 、/335956 |
| 后巷闪电 | thunder-crack 3（Veiler · 0.4s）https://freesound.org/people/Veiler/sounds/545748 ；thunder1 / thunder2（nednednerb · 8 / 10s）https://freesound.org/people/nednednerb/sounds/38244 、/38245 |
| 火车汽笛 | Train Horn long blast / 2 Toots（JotrainG · 2.0 / 1.2s）https://freesound.org/people/JotrainG/sounds/647667 、/647666 |
| 火车经过 | Long-haul train passing by very fast（dersinnsspace · 12s）https://freesound.org/people/dersinnsspace/sounds/417660 ；Train passing at high speed（Sandermotions · 12.3s）https://freesound.org/people/Sandermotions/sounds/530296 |
| 后巷雨 | Light Rain Atmosphere（florianreichelt · 9.1s）https://freesound.org/people/florianreichelt/sounds/455093 |
| 后巷猫哈气 | catHisses / catHisses2（Zabuhailo · 2.3 / 2.0s）https://freesound.org/people/Zabuhailo/sounds/146960 、/146962 |
| 1F 琴键格：猪 | Pig - Grunt 5 (deep)（JarredGibb · 2.5s）https://freesound.org/people/JarredGibb/sounds/233173 |
| 1F 琴键格：乌鸦 | crow CAWS（storyofthelie · 2.2s）https://freesound.org/people/storyofthelie/sounds/649580 ；Caw.ogg（egomassive · 1.9s）https://freesound.org/people/egomassive/sounds/536732 |
| 1F 琴键格：猫头鹰 | Hoot_1（2104797 · 1.5s）https://freesound.org/people/deleted_user_2104797/sounds/164651 ；owl hooting（Gerent · 3.5s）https://freesound.org/people/Gerent/sounds/558396 |
| 1F 琴键格：暹罗猫 | Cat Meow（d.n.audio.uk · 2.0s）https://freesound.org/people/d.n.audio.uk/sounds/264507 ；Cat meow（philsapphire · 1.5s）https://freesound.org/people/philsapphire/sounds/256452 |
| 1F 接住马提尼 | Wine glass clink deeper（lmr9 · 2.3s）https://freesound.org/people/lmr9/sounds/178178 ；Glass Clinking 2（antwash · 1.9s）https://freesound.org/people/antwash/sounds/118563 |
| B1 水滴 | Water Drip 01（erkanozan · 0.3s）https://freesound.org/people/erkanozan/sounds/51754 ；Water Drips/drops（acmkyne · 5.2s）https://freesound.org/people/acmkyne/sounds/273331 |
| 门 / 楼梯吱呀 | Wooden door creaking（TheBuilder15 · 3.4s）https://freesound.org/people/TheBuilder15/sounds/367052 ；Door - Creak 02（JarredGibb · 1.4s）https://freesound.org/people/JarredGibb/sounds/219492 |

琴键格那几位客人的叫声（猪哼、乌鸦、猫头鹰、猫）会叠一点狗叫，做成"OINK— er, BARK!"那种叫到一半改口的效果。

## 第三步：像素剧的原声

在 `tools/build_audio.py` 里把合成的雷、雨、水滴、碰杯、门吱呀、火车经过、汽笛、猫哈气换成上面的录音，重新生成四层的 `assets/*.m4a`（只是音效层，音乐和事件时间点不变，`*.json` 的时间表不受影响）。生成后需要人工听一遍四层。

## 不做的

- 不用需要登录或付费的音效站（Epidemic、Artlist、Splice 等），也不用 CC-BY-NC 的文件。
- 漫画的合成音效保留为兜底：录音加载失败时退回合成音。
