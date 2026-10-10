// Execution checkpoints follow the original 26-phase order. Fly is local travel;
// each region change goes through a port. Requirements describe field abilities.
window.guideData.travelPorts = {
  unova: '飞云市码头', kanto: '枯叶市码头', johto: '浅葱市码头',
  hoenn: '凯那市码头', sinnoh: '野原市水边的跨区船员'
};

window.guideData.contentSources = {
  walkthrough: { title: 'PokeMMO 论坛 · 五地区剧情流程', url: 'https://forums.pokemmo.com/index.php?/topic/76529-storyline-guide-kanto-johto-hoenn-sinnoh-unova-complete-walkthrough-all-items-hidden-items/' },
  parallel: { title: 'PokeMMO 论坛 · 平行通关补充参考', url: 'https://forums.pokemmo.com/index.php?/topic/187806-complete-all-regions-with-a-single-team-simultaneously-guide/' },
  caps: { title: 'Game Master Enzo · 五地区等级上限（2024-04-11）', url: 'https://forums.pokemmo.com/index.php?/topic/177407-i-need-to-know-the-highest-level-you-can-reach-before-beat-the-league-in-the-five-regions/' },
  fly: { title: '管理员 Rache · 关东飞翔徽章条件', url: 'https://forums.pokemmo.com/index.php?/topic/52719-cant-use-fly-cs/&comment=1028110&do=findComment' },
  travel: { title: 'PokeMMO 论坛 · 跨区与秘传技能说明', url: 'https://forums.pokemmo.com/index.php?/topic/58660-question-about-changing-regions/&comment=1174493&do=findComment' }
};

window.guideData.routePlans = {
  u1: { start: '新角色从鹿子镇开始。', finish: '帆巴第五馆完成，与白露对战后取得飞翔。', arrival: '首次到达关东，从真新镇开局。', requirements: ['居合斩（三曜馆后在真菰研究所领取，再去梦之遗迹）'], reminders: ['每个新城市先进入宝可梦中心，建立后续返回点。'], sources: [] },
  k1: { start: '真新镇开局，先推进船票和圣特安努号。', finish: '枯叶第三馆完成；自行车兑换券已在华蓝兑换。', arrival: '首次到达城都，从若叶镇开局。', requirements: ['居合斩（圣特安努号船长处取得）', '可用飞翔便于回华蓝；不能使用时走地下道返回'], reminders: ['枯叶徽章是关东飞翔的使用条件；还需同行宝可梦会飞翔，或具备对应通路工具。关东本地 HM02 在 16 号路树后房屋，可在到达彩虹后补领。'], sources: ['fly', 'travel'] },
  j1: { start: '若叶镇开局，经吉花前往桔梗。', finish: '缘朱第四馆完成，取得冲浪并走到浅葱市。', arrival: '首次到达丰缘，从未白镇开局。', requirements: ['居合斩（橡树林事件）', '冲浪（缘朱舞场事件）'], reminders: ['本段先到浅葱建立返回点；灯塔送药与湛蓝、浅葱道馆留给后续阶段。'], sources: ['walkthrough'] },
  h1: { start: '未白镇开局，经古辰领取初始伙伴。', finish: '橙华第五馆后继续天气研究所，完成茵郁第六馆。', arrival: '首次到达神奥，从双叶镇开局。', requirements: ['碎岩（紫堇取得）', '冲浪（橙华第五馆后取得）', '得文侦测镜（120 号路剧情）'], reminders: ['橙华是第五馆，茵郁才是第六馆；完成新增的第 10、11 步后再转区。'], sources: ['parallel'] },
  s1: { start: '双叶镇开局，进入神奥各城市时记录返回点。', finish: '野原第五馆完成；帷幕仓库的飞翔已领取。', arrival: '回关东后前往华蓝市，开始岩山隧道线。', requirements: ['居合斩（百代剧情）', '飞翔（帷幕仓库）'], reminders: ['家缘、帷幕、野原分别是本攻略神奥的第三、四、五馆。'], sources: [] },
  k2: { start: '从枯叶返回华蓝，沿 9、10 号路出发。', finish: '穿过岩山隧道，取得茶，完成彩虹第四馆。', arrival: '回城都浅葱市，进入灯塔取药线。', requirements: ['居合斩', '闪光（黑暗洞穴照明）'], reminders: ['岩山隧道使用下方 1F／B1F 分层图；总览图不表示洞内通路。'], sources: [] },
  j2: { start: '从浅葱市灯塔顶层接取送药任务。', finish: '湛蓝第五馆完成，秘药已取，馆外领取飞翔。', arrival: '回合众帆巴市，继续 6 号路。', requirements: ['冲浪（40、41 号水路）'], reminders: ['先保留秘药；灯塔送药和浅葱第六馆在下一次城都阶段完成。'], sources: ['parallel'] },
  u2: { start: '回帆巴，向西经 6 号路进入电石洞穴。', finish: '天堂塔顶敲钟后，完成吹寄第六馆。', arrival: '回城都浅葱市，将秘药交给灯塔顶层馆主。', requirements: ['飞翔用于回港'], reminders: ['先去天堂塔完成馆主剧情，再回吹寄挑战道馆。'], sources: [] },
  j3: { start: '回浅葱灯塔送秘药，再挑战浅葱第六馆。', finish: '愤怒之湖、火箭队基地与卡吉第七馆完成。', arrival: '回神奥野原市，继续追踪银河队。', requirements: ['已取得秘药（城都第 7 阶段）', '冲浪'], reminders: ['入段上限为 39；浅葱馆后为 41，卡吉馆后为 46。'], sources: ['caps'] },
  s2: { start: '回野原追踪银河队，取得秘药后前往随意镇。', finish: '神和镇剧情结束、冲浪可用，完成水脉第六馆。', arrival: '回合众吹寄市，前往螺丝山。', requirements: ['秘药（清除 210 号路可达鸭）', '冲浪（神和镇剧情后，用于 218 号路）', '清除浓雾（可选照明）'], reminders: ['神奥秘药与城都秘药属于不同剧情；不要把两次取药合并。'], sources: ['parallel'] },
  u3: { start: '回吹寄，经 7 号路进入螺丝山。', finish: '抵达雪花市，完成第七馆。', arrival: '回丰缘茵郁市，沿 120、121 号路去水静。', requirements: [], reminders: ['螺丝山以当前开放的主路为准，遇岔路先确认出口方向。'], sources: [] },
  h2: { start: '从茵郁市沿 120、121 号路去水静。', finish: '送火山、岩浆队本部和水舰队本部剧情完成，打完绿岭第七馆。', arrival: '回合众雪花市，进入龙螺旋之塔。', requirements: ['冲浪', '怪力（用于岩浆队本部）'], reminders: ['送火山之后先处理凹凸山道的岩浆队本部，再到凯那码头触发潜水艇事件。'], sources: ['parallel'] },
  u4: { start: '回雪花市向北进入龙螺旋之塔。', finish: '古代城堡与七宝博物馆剧情结束，完成双龙第八馆。', arrival: '回城都满金市，处理电视台事件。', requirements: [], reminders: ['古代城堡后必须到七宝博物馆完成剧情，再走圆桶桥去双龙。'], sources: ['parallel'] },
  j4: { start: '回满金市，先取得火箭队队服。', finish: '电视台事件完成，经冰之通道取得攀瀑，完成烟墨与龙之穴剧情。', arrival: '回神奥水脉市，触发图书馆和湖区剧情。', requirements: ['冲浪', '怪力（冰之通道）', '潮旋（龙之穴）'], reminders: ['城都八馆后上限仍为 48；凤王剧情完成后才升到 55。'], sources: ['caps'] },
  s3: { start: '回水脉市图书馆三楼，触发湖区事件。', finish: '立志湖、心齐湖事件完成；217 号路取得攀岩，打完雪峰第七馆。', arrival: '回关东彩虹市，处理火箭队游戏厅。', requirements: ['怪力（天冠山北行通路）'], reminders: ['立志湖与心齐湖是两个不同目的地；最后从神和镇走雪地去雪峰。'], sources: [] },
  k3: { start: '回彩虹市游戏厅，调查海报并进入地下基地。', finish: '西尔佛公司与金黄道馆完成，随后完成浅红道馆和通路能力检查。', arrival: '回丰缘绿岭市，推进宇宙中心和潜水线。', requirements: ['茶（金黄市关卡）', '宝可梦之笛（卡比兽路障）', '自行车（自行车道）'], reminders: ['这里的“5—6”表示本路线的第五、第六枚徽章；本攻略先金黄、后浅红。'], sources: ['parallel'] },
  h3: { start: '回绿岭市，先完成宇宙中心事件。', finish: '海底洞窟、觉醒祠堂、天空之柱事件完成，打完琉璃第八馆。', arrival: '回城都若叶镇找博士，再去缘朱舞场。', requirements: ['冲浪', '潜水（宇宙中心事件后到大吾家取得）', '怪力、碎岩（海底洞窟）'], reminders: ['天空之柱在 131 号水路北侧；不要把琉璃市与天空之柱当成同一入口。'], sources: [] },
  j5: { start: '从若叶镇博士家补完剧情，再去缘朱市舞场。', finish: '舞场事件和铃铛塔凤王剧情对战完成。', arrival: '回关东真新镇，经 21 号水路到红莲岛。', requirements: ['已完成烟墨与龙之穴剧情'], reminders: ['铃铛塔逐层路线尚未配核对过的分层图；不要用烧焦塔代替。'], sources: [] },
  k4: { start: '从真新镇向南冲浪，经 21 号水路抵达红莲岛。', finish: '宝可梦屋取得秘密钥匙，完成红莲道馆。', arrival: '回神奥雪峰市，前往睿智湖。', requirements: ['冲浪', '秘密钥匙（宝可梦屋）'], reminders: ['红莲岛在真新镇正南；浅红市在关东南部偏东，两者不能混淆。'], sources: [] },
  s4: { start: '回雪峰，经睿智湖剧情后前往帷幕仓库。', finish: '银河队大厦、天冠山、反转世界事件完成，打完滨海第八馆。', arrival: '回关东常磐市，挑战最后一馆。', requirements: ['银河队钥匙', '冲浪、怪力、攀岩'], reminders: ['滨海灯塔是与馆主对话的剧情点，正式道馆战在道馆内。'], sources: ['parallel'] },
  k5: { start: '回常磐市，确认已有其余七枚关东徽章。', finish: '常磐最后一馆完成，关东八枚徽章齐全。', arrival: '回城都若叶镇，向东冲浪开始联盟段。', requirements: ['关东其余七枚徽章'], reminders: ['后续联盟按城都 → 合众 → 丰缘 → 神奥 → 关东排列。'], sources: [] },
  j6: { start: '从若叶镇向东冲浪，经 27 号路、都城瀑布和 26 号路。', finish: '城都冠军之路、四天王与冠军完成。', arrival: '回合众双龙市，向北走 10 号路。', requirements: ['冲浪、攀瀑、怪力', '已完成凤王剧情；联盟前上限 55'], reminders: ['此底图未覆盖城都联盟：只标若叶镇出发点。冠军之路分层图仍待核对。'], sources: [] },
  u5: { start: '从双龙市向北，经 10 号路与八徽章检查进入冠军之路。', finish: '四天王、N 的城堡和魁奇思剧情战完成。', arrival: '回丰缘绿岭市，经 127、128 号水路到彩幽。', requirements: ['合众八枚徽章；联盟前上限 56'], reminders: ['N 城堡的对战与传说宝可梦事件按当前游戏提示完成；不把不同版本的触发顺序写成固定步骤。'], sources: [] },
  h4: { start: '从绿岭向南经 127、128 号水路，再向东抵达彩幽市。', finish: '冠军之路、四天王与冠军完成。', arrival: '回神奥滨海市，领取攀瀑后进入 223 号水路。', requirements: ['冲浪、攀瀑、怪力、碎岩', '闪光（洞穴照明）；联盟前上限 58'], reminders: ['彩幽入口有瀑布，进入冠军之路前先确认攀瀑可用。'], sources: [] },
  s5: { start: '滨海市北侧与蜜柑对话领取攀瀑，沿 223 号水路北上。', finish: '穿过冠军之路，联盟入口对手战、四天王与冠军完成。', arrival: '回关东常磐市，向西进入 22 号路。', requirements: ['冲浪、攀瀑、怪力、碎岩、攀岩', '神奥八枚徽章；联盟前上限 60'], reminders: ['首次联盟路线不进入通关后开放的支洞。'], sources: ['parallel'] },
  k6: { start: '常磐市向西走 22 号路，对手战后经 23 号路检查徽章。', finish: '冠军之路、关东四天王与冠军完成，五地区主线收官。', arrival: '五地区主线完成。', requirements: ['冲浪、怪力', '关东八枚徽章；联盟前上限 62'], reminders: ['推石失误时重新进洞重置机关，再按分层图继续。'], sources: [] }
};
