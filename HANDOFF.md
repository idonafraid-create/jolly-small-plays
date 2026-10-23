# HANDOFF · JOLLY Small Plays（jolly2）

最后更新：2026-10-24

## 现状

- 线上：https://idonafraid-create.github.io/jolly-small-plays/
- 仓库：https://github.com/idonafraid-create/jolly-small-plays （public，GitHub Pages 从 `main` 根目录发布，有 `.nojekyll`）
- 本地：`D:\ClaudeAbout\small-plays\jolly2`（就是这个仓库的工作目录）
- 四个场景都能切换播放；深色 / 浅色主题、滚轮缩放、拖拽平移、线索收集都可用。2026-10-24 线上用无头浏览器检查过：四个楼层都能加载，没有脚本或网络错误。

这是一个像素风 2:1 等距 WebGL 短剧合集。主角是 JOJO / LYLY / YOYO，人设和配乐来自 `D:\ClaudeAbout\JOLLY MV`（用户自己的 Suno 曲目）。

## 本地运行

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory D:/ClaudeAbout/small-plays
```

打开 `http://127.0.0.1:8765/jolly2/index.html`。`D:\ClaudeAbout\.claude\launch.json` 里有同名配置 `small-plays`，Claude 桌面端可用 `preview_start` 启动。

URL 参数：`?scene=bar|alley|cellar|motel`，`?t=12`（起始秒），`?theme=light|dark`，`?capture`（截帧模式，固定 480×270，隐藏 UI）。

键盘：`1`–`4` 切楼层，空格播放/暂停，`←/→` 跳 2 秒，`R` 重播，`0` 重置视角，`+/-` 缩放，`P` 截图。

## 目录

| 路径 | 作用 |
| --- | --- |
| `index.html` | 页面、HUD、样式和主题变量（默认深色，`[data-theme="light"]` 切浅色） |
| `js/engine.js` | Stage（低分辨率渲染 + 后期：sRGB、30 级量化、Bayer 抖动、闪光、观剧镜）、相机缩放平移、几何与贴图工具、Biped 骨架、雨、湿地反射、光束、外围地面 `makeSurround` |
| `js/cast.js` | 三位主角、动物 NPC 工厂、道具 |
| `js/acts.js` | 通用动作（坐、喝、聊天、跳舞、走路径…） |
| `js/main.js` | 场景注册与切换（电梯门转场）、播放、输入、名字标签、线索档案、截图、主题 |
| `js/scenes/*.js` | 四个场景，每个导出 `{ fit, target, audio, cues, build() }` |
| `assets/*.m4a` / `*.json` | 各场景音频与节拍/事件时间表（`.wav` 是中间文件，已被 `.gitignore` 排除） |
| `tools/build_audio.py` | 用 JOLLY MV 分轨 + 合成音效生成音频和 cues（numpy / soundfile / librosa / scipy） |
| `tools/capture.py` | Playwright 截帧：`stills <scene> t…` 出图到 `out/stills`，`video <scene>` 出 mp4（需本地服务器） |

## 场景

| 顺序 | 场景 | 文件 | 剧情要点 | 线索 |
| --- | --- | --- | --- | --- |
| B1 | 地下室 · The Thing in the Keg Room | `cellar.js` | Lyly 下楼拿酒桶，手电光束；排水口里的眼睛和触手，听命于 YOYO | 口红 |
| 1F | 酒吧 · No Talk, All Bark | `bar.js` | 乐队演奏、21 个 NPC、服务生送马提尼、停电、粉色高跟鞋失踪 | 丝带 |
| AL | 后巷 · Rain Check | `alley.js` | 细斜雨、铁丝网外的铁路、两趟货车、三只猫跳上守车离开 | 铃铛 |
| 2F | 203 房 · The Case of the Pink Stiletto | `motel.js` | 侦探 Jojo 用观剧镜查案、闪电、镜子上的 "YOYO 200%"、"受害者"坐起来 | 高跟鞋 |

## 必须知道的约定

- 编舞是时间 `t` 的纯函数（可任意 seek、可逐帧截取），不要引入依赖帧间状态的动画。
- 每个场景的 `fit {w, h}` 决定默认取景大小，`target` 是画面中心。缩放范围在 `Stage.ZOOM_MIN/MAX`（0.55–3.0）。
- 后巷铁轨长度 `ZE = HD + MARGIN - 0.3`（4.8）与 `tools/build_audio.py` 里的 `ALLEY_HD` 联动，决定火车经过的音画同步。改一个必须同时改另一个，并重新生成音频。
- 主题存在 localStorage 的 `jolly-theme`，线索进度存在 `jolly-case-v1`。页面底色由 `stage.setPaper()` 同步给后期着色器，保证画布外的纸色和页面完全一致。
- 主角头顶名字是 DOM 文字（Silkscreen 20px），名字下方旋转的倒三角是 3D 物体。YOYO 藏在衣帽间时用 `noMarker` 隐藏倒三角。
- 字体：左上角品牌用 Pinyon Script，标题用 Playfair Display，正文用 IBM Plex Mono，像素字用 Silkscreen。

## 用户已确认的偏好

- 外围只做"意思意思"：只延续场景自身的地面，做一圈约 1 米的窄边，颜色压暗，点缀极少。不要街景、汽车、树、长椅这类抢镜的东西（地下室原来那版也被认为太多）。
- 后巷的雨要细、斜、淅淅沥沥。铁路要真实：有铁丝网隔开，墙只到铁丝网为止，轨道和火车是加倍后的尺寸。
- 名字标签小而清楚，配角色色的旋转倒三角。场景不用一样大，人物大小也可以按场景不同。
- 页面不要让场景占满，底部 UI 要宽松。默认深色。

## 更新与发布

改完后在本目录提交并推送 `main`，Pages 约 1 分钟后自动更新：

```bash
git -C D:/ClaudeAbout/small-plays/jolly2 push
```

查看构建状态：`gh api repos/idonafraid-create/jolly-small-plays/pages/builds/latest --jq .status`。仓库的提交身份配置在仓库级别（`idonafraid`）。

## 尚未验证 / 待办

- 900px 以下窄屏布局未实测。
- 音画同步只做过程序层面的对齐，没有人工逐场听过最新版本。
- Claude 桌面端内置浏览器的站点权限挡住了 `github.io`。线上验证可用 Chrome，或用 Playwright 无头打开。
- 上级目录 `D:\ClaudeAbout\small-plays` 里还有 `basketball.html`（原视频复刻）和 `jolly/`（JOLLY #1 单场景版），都没有部署。
