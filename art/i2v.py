# -*- coding: utf-8 -*-
"""Comic V2 · image-to-video samples for a panel, one per model (libtv).

python art/i2v.py p6_victim [--models h3,sd,kling] [--tag v2]   → art/src/video/p6_victim_h3[_v2].mp4
Default model is MiniMax H3 768P (the user's pick after the first three-way test); Seedance 2.5 sample mode (480p)
and Kling 4.0 (720p) stay available for comparisons. 5 s, no sound, from the panel's codex still.
Uses the libtv canvas bound in art/.libtv/project.json (created on first run). Needs `libtv login` first.
"""
import json, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ART = Path(__file__).resolve().parent
OUT = ART / 'src/video'; OUT.mkdir(parents=True, exist_ok=True)
LIBTV = r'D:\CodexData\Tools\LibTV\libtv.exe'
MODELS = {
    'sd': ('Seedance 2.5（样片模式）', ['-s', 'duration=5', '-s', 'enableSound=off', '-s', 'ratio=adaptive']),
    'kling': ('Kling 4.0', ['-s', 'duration=5', '-s', 'resolution=720p']),
    'h3': ('Minimax H3', ['-s', 'duration=5', '-s', 'resolution=768P']),
}
STYLE = ('保持原图的画风：1950 年代美式复古报纸漫画，黑色粗墨线、平涂色块、2D 手绘动画的质感，像老式赛璐璐卡通在动。'
         '不要变成 3D，不要写实，不要加渐变光影、景深虚化或镜头光晕。不要出现任何文字、字幕、对话气泡、拟声词。')
PROMPTS = {
    'p6_victim': (
        '固定机位，镜头完全不动。'
        '第 0–1 秒：地毯上白色粉笔轮廓里躺着的粉色毛绒玩具兔子一动不动，只有一只长耳朵轻轻抽动一下。'
        '第 1–2 秒：兔子像弹簧一样猛地坐起来，上半身直立，两只长耳朵甩到空中又落下，黑色豆豆眼睁开，两只手臂张开，像在说“惊喜！”。'
        '右边戴礼帽的灰色猫头鹰摄影师吓得往后一仰，羽毛炸开，相机的闪光灯闪了一下白光；左边门口的老乌龟吓得把头缩进龟壳。'
        '第 2–3 秒：背景窗户外面的防火梯上，一只很小的银灰色虎斑小猫从窗台下面冒出头来：她头上有一个大大的酒红色丝绒蝴蝶结，'
        '嘴角抹着红色口红，两只前爪一起握住一把黑色小雨伞的伞柄，把伞撑在头顶。她只有两只前爪，全程两只爪子都握着伞柄，不松手、不挥手。'
        '第 3–5 秒：兔子坐着得意地左右摆动耳朵，小猫在窗外对着屋里眨一只眼睛、笑，身体随着笑轻轻晃一下。窗外一直下着雨，霓虹灯微微闪烁。'),
    'b1_rise': (
        '固定机位，镜头完全不动。'
        '第 0–1.5 秒：地上圆形铁排水篦子下面那只巨大的黄绿色眼睛从半睁慢慢完全睁开，黑色竖瞳收窄，篦子里的绿光变亮。'
        '第 1–4 秒：六条青蓝色条纹触手（粉色吸盘、紫色尖端）从篦子的缝隙里慢慢往上升起，越升越高，在空中缓慢扭动、打卷，吸盘朝外。'
        '背景里穿藏青警服的棕色斗牛犬警察吓得浑身发抖，黄色圆框墨镜从鼻梁上慢慢滑到鼻尖。她只有右爪握着手电筒，光柱一直照着篦子，'
        '左爪一直张开空着、不拿任何东西；地上倒着的银色小酒桶一动不动。'
        '第 4–5 秒：触手停在高处轻轻摇摆，眼睛眨一下。周围的蜡烛火苗轻轻跳动。'),
    'f1_martini': (
        '固定机位，镜头完全不动。'
        '第 0–0.8 秒：右边穿深绿西装、打珊瑚色领结的棕色恶霸犬抱着巨大的木色低音提琴猛地向左一甩，琴身横扫过来，擦到左下角狐狸服务生手里银托盘的边缘。'
        '第 0.8–2 秒：托盘上的马提尼杯被弹起来，在空中翻转一圈，划一道向上的弧线，飞向舞台上吹萨克斯的白色斗牛犬。'
        '第 2–3 秒：白色斗牛犬眼睛一直闭着、继续吹萨克斯，右爪始终按在萨克斯的按键上，只伸出左爪在空中稳稳接住马提尼杯，一滴没洒。'
        '狐狸服务生吓得往后一缩，盯着空托盘发愣。'
        '第 3–5 秒：斗牛犬左爪拿着杯子、闭着眼继续吹萨克斯轻轻摇摆；贝斯手把提琴转回身前，两只爪子都在琴颈和琴弦上继续拍弦。'
        '每个角色只有两只前爪：斗牛犬右爪在萨克斯上、左爪接杯子；贝斯手两只爪子都在提琴上；狐狸只用一只爪子托托盘。'),
    'b1_rise_v2': (
        '固定机位，镜头完全不动。'
        '第 0–1.5 秒：地上圆形铁排水篦子下面那只巨大的黄绿色眼睛从半睁慢慢完全睁开，黑色竖瞳收窄，篦子里的绿光变亮。'
        '第 1–4 秒：六条青蓝色条纹触手（粉色吸盘、紫色尖端）从篦子的缝隙里慢慢往上升起，越升越高，在空中缓慢扭动、打卷，吸盘朝外。'
        '背景里穿深绿西装、打珊瑚色领结的棕色恶霸犬（乐队贝斯手）吓得浑身发抖，黄色圆框墨镜从鼻梁上慢慢滑到鼻尖。她只有右爪握着手电筒，光柱一直照着篦子，'
        '左爪一直张开空着、不拿任何东西；地上倒着的银色小酒桶一动不动。'
        '第 4–5 秒：触手停在高处轻轻摇摆，眼睛眨一下。周围的蜡烛火苗轻轻跳动。'),
}
PROMPTS['f1_martini_v2'] = PROMPTS['f1_martini']          # the same shot, redrawn with the bass in one piece
PROMPTS['p7_stiletto'] = (
    '镜头基本不动，只在最后两秒极慢地推近一点点。'
    '第 0–1.2 秒：戴灰色礼帽、穿卡其色风衣的白色斗牛犬侦探闭着眼睛，用画面里那只右爪把粉色高跟鞋形状的领带夹按在黑色领带上，'
    '咔地夹好；领带夹上闪过一颗白色四角星的小亮光。'
    '第 1.2–2.4 秒：他慢慢睁开眼睛，眼皮半垂，眼神很酷，正对着镜头看。他画面右边那只眼睛周围的黑色眼线状斑块保持在原位，不要移到另一只眼。'
    '第 2.4–3.8 秒：同一只右爪离开领带，抬到礼帽帽檐，用两根手指把帽檐轻轻往下一压，同时微微点一下头。'
    '第 3.8–5 秒：他保持这个酷酷的眼神，一边眉毛微微挑起，嘴角带一点得意的笑，但嘴巴始终紧闭、不说话、不露牙。'
    '画面里只有他的一只爪子（右爪），另一只手臂一直不出现。背景墙上的霓虹红光轻轻闪。')
# the case file: V1, the composite (a pencil drawing, not the comic's ink), and V2, YOYO's snapshot from the coat check
SKETCH = ('保持原图的画风：白纸上的石墨铅笔素描，灰黑色的线条、交叉排线和纸面质感全程不变，像这张素描本身活了一下。'
          '不要上色，不要变成 3D 或照片，不要加光影、景深或镜头光晕。纸和画的位置、大小不动。不要出现任何文字。')
STYLES = {'cfx_sketch': SKETCH}
PROMPTS['cfx_sketch'] = (
    '固定机位，镜头完全不动。白纸上一张铅笔素描画像：戴大蝴蝶结、蕾丝领子和小铃铛的虎斑小猫，正面。'
    '第 0–1.5 秒：画像完全静止。'
    '第 1.5–2.5 秒：小猫画面右边那只眼睛慢慢眨一下（闭上再睁开），画面左边那只眼睛一直睁着不动。'
    '第 2.5–3.5 秒：嘴角往上翘，露出一个狡猾、得意的小笑，嘴巴闭着不张开；头上的大蝴蝶结轻轻抖一下。'
    '第 3.5–5 秒：表情慢慢回到第一帧的样子，最后一秒和第一帧完全一样，静止不动。')
PROMPTS['cf_scrap_sax'] = (
    '固定机位，镜头完全不动。从衣帽间两件挂着的大衣中间的缝隙往外偷看，远处舞台的一束圆形白色追光下，'
    '穿灰西装、戴灰色礼帽的白色斗牛犬闭着眼睛吹金色萨克斯。'
    '第 0–5 秒：斗牛犬全程闭着眼、两只爪子一直按在萨克斯的按键上，身体随着音乐左右轻轻摆，礼帽跟着微微晃；'
    '追光的光柱里有几粒小灰尘慢慢飘。'
    '第 2–3 秒：前景左边那件大衣轻轻晃一下，缝隙变窄一点又恢复。'
    '斗牛犬画面右边那只眼睛周围的黑色眼线状斑块保持在原位。他只有两只前爪，都在萨克斯上。')
PROMPTS['al_trash'] = (
    '固定机位，镜头完全不动。夜里下着细雨。'
    '第 0–1.2 秒：左边穿深绿西装、打珊瑚色领结、戴黄色圆墨镜的棕色恶霸犬，两只爪子各拎一个黑色垃圾袋，把两个袋子从肩后一起甩出去，砸到右边绿色垃圾箱的盖子上。'
    '扔出去之后她两只爪子都空了，不再拿任何东西。'
    '第 1.2–2.2 秒：垃圾箱盖上弓着背哈气的三只猫（橘色大虎斑猫穿黑马甲、戴眼罩的黑猫穿棕外套、白猫穿灰外套）被吓得朝三个方向跳开：一只跳向左上，一只跳向右边，一只跳下地面。'
    '第 2.2–5 秒：恶霸犬叉着腰、张大嘴冲着跑开的猫吠叫，身体往前一冲；雨一直下，地上水洼泛起涟漪，后门灯泡微微闪。'
    '每个角色只有两只前爪。')


def lt(*args, check=True):
    r = subprocess.run([LIBTV, *args], cwd=ART, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if check and r.returncode != 0: raise RuntimeError(f'{args[:3]}: {r.stdout[-400:]} {r.stderr[-400:]}')
    return r.stdout


def state(node):
    try: d = json.loads(lt('node', node, check=False))['data']
    except Exception: return None, 0
    t = d.get('taskInfo') or {}
    return t.get('status'), len(d.get('url') or [])


def run_until_done(node):
    st, n = state(node)
    if st == 2 and n: return True
    if st != 1: lt('node', node, '--run', check=False)
    for _ in range(240):                       # up to an hour
        st, n = state(node)
        if st == 2 and n: return True
        if st == 3: return False
        time.sleep(15)
    return False


def one(job, key, row, tag=''):
    name = f'{job}_{key}' + (f'_{tag}' if tag else '')
    if (OUT / f'{name}.mp4').exists(): return name, 'skip'
    model, sets = MODELS[key]
    img = f'img_{job}'
    if f'"{name}"' not in lt('node', 'list'):
        lt('node', '--x', '700', '--y', str(row * 600), 'create', name, '-t', 'video', '--left', img,
           '-s', f'model={model}', '-s', 'modeType=singleImage2video', *sets, '--prompt', PROMPTS[job] + STYLES.get(job, STYLE))
    t0 = time.time(); ok = run_until_done(name)
    if ok:
        lt('download', '-n', name, '-o', str(OUT), '--without-ai-watermark', '--vip')
    return name, f"{'ok' if ok else 'FAIL'} {round((time.time() - t0) / 60, 1)} min"


if __name__ == '__main__':
    args = sys.argv[1:]
    opt = lambda k, d: args[args.index(k) + 1] if k in args else d
    job, keys, tag = args[0], opt('--models', 'h3').split(','), opt('--tag', '')
    if not (ART / '.libtv/project.json').exists():
        made = lt('project', 'create', 'JOLLY Small Plays · Comic V2')
        uuid = next(w for w in made.replace('"', ' ').split() if len(w) == 32 and all(c in '0123456789abcdef' for c in w))
        lt('project', 'use', uuid)
    if f'"img_{job}"' not in lt('node', 'list'):
        lt('upload', f'img_{job}', '-f', str(ART / f'src/{job}.png'), '--x', '0', '--y', '0')
    with ThreadPoolExecutor(3) as ex:
        for name, st in ex.map(lambda a: one(job, *a, tag), [(k, i) for i, k in enumerate(keys)]): print(name, st, flush=True)
