// Coordinates describe visible landmarks on the exact local image, not region-map positions.
// Goal markers alone do not imply that every intervening trainer must be battled.
(function attachMapNotes() {
  const notes = {};
  const goal = (x, y, label = '馆主位置') => ({ id: 'G', x, y, label, kind: 'goal', detail: '完成本步所述机关与剧情后，到此挑战馆主。其余战斗以步骤中的原文编号及已标注走法为准。' });
  const gyms = {
    'azalea-gym-hgss': [50, 22], 'blackthorn-gym-hgss': [50, 7],
    'canalave-gym-4f-dppt': [51.5, 4], 'castelia-gym-bw': [50, 9],
    'celadon-gym-frlg': [50, 23], 'cerulean-gym-frlg': [50, 33],
    'cianwood-gym-hgss': [50.5, 69], 'cinnabar-gym-frlg': [18.5, 19],
    'dewford-gym-e': [20, 11], 'ecruteak-gym-hgss': [31, 10],
    'eterna-gym-pt': [50, 14], 'fortree-gym-e': [77, 10],
    'fuchsia-gym-frlg': [50, 61], 'goldenrod-gym-hgss': [47, 27],
    'hearthome-gym-pt': [50, 18], 'lavaridge-gym-1f-e': [79.4, 42.4],
    'mahogany-gym-hgss': [52, 8], 'mauville-gym-e': [50, 11],
    'mistralton-gym-bw': [50, 16], 'mossdeep-gym-e': [92.5, 21],
    'nacrene-gym-basement-bw': [50, 60], 'nimbasa-gym-bw': [50, 15],
    'olivine-gym-hgss': [50, 17], 'opelucid-gym-b': [45.5, 6],
    'oreburgh-gym-dppt': [50, 23], 'pastoria-gym-dppt': [50, 10],
    'petalburg-gym-e': [50, 6], 'pewter-gym-frlg': [50, 35],
    'rustboro-gym-e': [50, 10], 'saffron-gym-frlg': [50, 46],
    'snowpoint-gym-pt': [50, 8], 'sootopolis-gym-1f-e': [50, 10],
    'striaton-gym-bw': [50, 14], 'sunyshore-gym-third-room-dppt': [50, 13],
    'veilstone-gym-pt': [47, 15], 'vermilion-gym-frlg': [50, 11],
    'violet-gym-hgss': [50, 40], 'viridian-gym-frlg': [11, 10]
  };
  for (const [id, [x, y]] of Object.entries(gyms)) notes[id] = { mode: '目标标注', points: [goal(x, y)] };
  const places = {
    'accumula-town-spring-bw': [[80, 54, 'PC 门口博士对话', 'story'], [50, 56, '等离子团集会广场', 'story']],
    'celestic-town-pt': [[50, 41, '壁画洞口', 'story']],
    'cerulean-city-frlg': [[66, 53, '华蓝道馆', 'goal'], [28, 70, '自行车店', 'item'], [49, 8, '北上 24 号路', 'exit']],
    'cherrygrove-city-hgss': [[80, 23, 'PC', 'heal'], [99, 53, '出城道路', 'exit']],
    'cianwood-city-hgss': [[31, 62, '湛蓝道馆；馆后门外领飞翔', 'goal'], [52, 86, '药店；领取秘药', 'item'], [75, 85, 'PC', 'heal']],
    'cinnabar-island-frlg': [[35, 20, '宝可梦屋入口', 'story'], [85, 23, '红莲道馆', 'goal'], [60, 58, 'PC', 'heal']],
    'dewford-town-e': [[43, 87, '武斗道馆', 'goal'], [15, 52, 'PC', 'heal'], [58, 49, '船只停靠处', 'exit']],
    'ecruteak-city-hgss': [[58, 34, '舞场入口', 'story'], [33.5, 24.5, '烧焦塔入口', 'story'], [34, 80, '缘朱道馆', 'goal']],
    'fortree-city-e': [[55, 53, '道馆；先清除隐形路障', 'goal'], [96, 72, '向东去 120 号路找大吾', 'exit'], [15, 33, 'PC', 'heal']],
    'goldenrod-city-hgss': [[19.2, 44, '广播塔', 'story'], [79.2, 25, '满金道馆', 'goal'], [78.8, 72.5, '自行车店', 'item']],
    'hearthome-city-pt': [[80, 39, '家缘道馆', 'goal'], [27, 39, 'PC', 'heal'], [50, 85, '城市南侧出口', 'exit']],
    'mauville-city-e': [[21.2, 25, '紫堇道馆', 'goal'], [57, 28, 'PC', 'heal'], [92, 23, '自行车店', 'item'], [82.5, 72, '碎岩领取房间', 'item']],
    'mistralton-city-spring-b': [[23, 12.5, '吹寄道馆', 'goal'], [70, 49, 'PC', 'heal'], [83, 36, '向北接 7 号路', 'exit']],
    'mossdeep-city-e': [[79.5, 38.6, '宇宙中心', 'story'], [24.4, 25.2, '大吾家；事件后领取潜水', 'item'], [48, 23, '绿岭道馆', 'goal']],
    'nacrene-city-spring-bw': [[57, 27, '博物馆／七宝道馆入口', 'story'], [46, 69, 'PC', 'heal'], [2, 45, '西侧通往矢车森林', 'exit']],
    'new-bark-town-hgss': [[39, 32, '博士实验室', 'story'], [56, 74, '玩家家', 'story'], [97, 52, '东侧冲浪出发点', 'exit']],
    'nimbasa-city-spring-bw': [[92, 63, '摩天轮剧情点', 'story'], [80, 58, '雷文道馆入口', 'goal'], [22, 75, 'PC', 'heal']],
    'oldale-town-e': [[35, 82, 'PC', 'heal'], [50, 7, '北上 103 号路', 'exit']],
    'olivine-city-hgss': [[72.5, 59, '灯塔入口', 'story'], [23, 27, '浅葱道馆', 'goal'], [38.3, 92, '港口入口', 'exit']],
    'opelucid-city-b': [[34, 29, '双龙道馆入口', 'goal'], [63, 68, 'PC', 'heal']],
    'oreburgh-city-dppt': [[67, 96, '矿坑入口；先找馆主', 'story'], [41, 33, '黑金道馆', 'goal'], [74, 33, 'PC', 'heal']],
    'pallet-town-frlg': [[68, 65, '博士实验室', 'story'], [31, 30, '玩家家', 'story'], [43, 7, '北上 1 号路', 'exit'], [36, 95, '南下 21 号水路', 'exit']],
    'pastoria-city-pt': [[21, 44, '野原道馆', 'goal'], [38, 27, 'PC', 'heal']],
    'petalburg-city-e': [[52, 29, '橙华道馆', 'goal'], [70, 55, 'PC', 'heal'], [22, 20, '满充家；第五馆后领取冲浪', 'item']],
    'sandgem-town-pt': [[24.6, 36, '博士实验室', 'story'], [55, 34, 'PC', 'heal']],
    'slateport-city-e': [[78, 44, '海洋博物馆', 'story'], [67.5, 73, '船厂；先找负责人', 'story'], [68.8, 60, '码头建筑入口', 'exit'], [50, 32, 'PC', 'heal']],
    'solaceon-town-pt': [[37, 52, 'PC', 'heal'], [29, 2, '北上 210 号路', 'exit']],
    'sootopolis-city-e': [[52, 54, '琉璃道馆', 'goal'], [52, 28, '觉醒祠堂入口', 'story'], [73, 53, 'PC', 'heal']],
    'sunyshore-city-pt': [[21, 15, '滨海道馆', 'goal'], [85, 79, '灯塔；先找馆主对话', 'story'], [39.5, 11, '北侧沙滩；领取攀瀑后走水路', 'exit']],
    'twinleaf-town-pt': [[65, 35, '对手家', 'story'], [65, 68, '玩家家', 'story'], [50, 2, '北上 201 号路', 'exit']],
    'veilstone-city-pt': [[19.5, 55, '帷幕道馆', 'goal'], [71, 55, 'PC', 'heal']],
    'vermilion-city-frlg': [[30, 64, '枯叶道馆；入口需要居合斩', 'goal'], [26, 45, '爱好者俱乐部；自行车兑换券', 'item'], [49, 91, '圣特安努号码头通路', 'exit'], [32, 17, 'PC', 'heal']],
    'viridian-city-frlg': [[76, 26, '常磐道馆；八馆阶段进入', 'goal'], [55, 65, 'PC', 'heal'], [7, 47, '西侧 22 号路方向', 'exit']]
  };
  for (const [id, rows] of Object.entries(places)) notes[id] = { mode: '地点标注', points: rows.map(([x,y,label,kind],index) => ({id: String(index+1),x,y,label,kind,detail:label})) };

  // These numbers are the order of actions, not a catalogue of buildings.
  // Door positions were checked against the user's annotated maps and the
  // exact local BW map. Keep references here rather than guessing from roofs.
  notes['nuvema-town-spring-bw'] = {
    mode: '按顺序办事',
    source: 'https://forums.pokemmo.com/index.php?/topic/187806-complete-all-regions-with-a-single-team-simultaneously-guide/',
    points: [
      {id:'1',x:45.5,y:43.2,label:'玩家家：领取伙伴并完成开局对战',kind:'story',detail:'在中央蓝顶房屋内领取初始伙伴，与白露、黑连对战；下楼与妈妈对话后出门。'},
      {id:'2',x:26.8,y:67.2,label:'白露家：完成出发对话',kind:'story',detail:'进入左下方蓝顶房屋，完成白露与父亲的出发对话，再去实验室。'},
      {id:'3',x:29.9,y:21,label:'博士实验室：完成博士剧情',kind:'story',detail:'进入左上方橙顶实验室，与博士对话并完成图鉴相关剧情。'},
      {id:'4',x:64.5,y:3.3,label:'1 号路：离镇向北前进',kind:'exit',detail:'从东北侧出口进入 1 号路，完成捕捉教学后继续向唐草镇前进。'}
    ]
  };
  notes['unova-route-2-spring-bw'] = {
    mode: '必打 NPC 顺序',
    source: 'https://forums.pokemmo.com/index.php?/topic/76529-storyline-guide-kanto-johto-hoenn-sinnoh-unova-complete-walkthrough-all-items-hidden-items/',
    points: [
      {id:'1',x:28,y:39.5,label:'必打：道路转弯处的训练家',kind:'battle',detail:'领取跑步鞋后沿道路向北，在第一个转弯处完成训练家对战（合众 NPC 4）。'},
      {id:'2',x:80,y:10.5,label:'必打：出口前与白露对战',kind:'battle',detail:'继续沿主路向北，在三曜市入口前完成白露对战（合众 NPC 5），随后进城。'}
    ]
  };
  notes['striaton-city-spring-bw'] = {
    mode: '按顺序办事',
    source: 'https://forums.pokemmo.com/index.php?/topic/187806-complete-all-regions-with-a-single-team-simultaneously-guide/',
    secondarySource: 'https://bulbapedia.bulbagarden.net/wiki/Striaton_City',
    points: [
      {id:'1',x:52.1,y:35.5,label:'学校：先与黑连对战',kind:'battle',detail:'先进入 PC 左侧的学校，与黑连对话并完成对战，让道馆开放。'},
      {id:'2',x:71.2,y:34,label:'三曜道馆：完成第一馆挑战',kind:'goal',detail:'离开学校，进入 PC 右侧的道馆；领取美味水，完成机关及馆主挑战。'},
      {id:'3',x:76.2,y:49.5,label:'真菰研究所：领取居合斩',kind:'item',detail:'馆后跟随真菰，到最右侧建筑的北侧入口，上楼领取居合斩；遗迹剧情后仍回这里交接。'},
      {id:'4',x:92.5,y:20,label:'梦之遗迹：处理等离子团剧情',kind:'exit',detail:'从东北侧道路前往梦之遗迹，使用居合斩开路并完成等离子团事件；之后回研究所推进剧情，再走 3 号路。'}
    ]
  };

  // A reused city map shows only this step's actions; arrival shows the full
  // four-stop plan. Physical point IDs remain stable across the visit.
  const striatonStep = ids => ({
    ...notes['striaton-city-spring-bw'],
    points: notes['striaton-city-spring-bw'].points.filter(point => ids.includes(point.id))
  });
  window.guideData.stepMapNotes = {
    u1: {
      3: {'striaton-city-spring-bw': striatonStep(['1'])},
      4: {'striaton-city-spring-bw': striatonStep(['2'])},
      5: {'striaton-city-spring-bw': striatonStep(['3','4'])}
    }
  };

  notes['cianwood-gym-hgss'].points.push({id:'S',x:38,y:25,label:'瀑布开关',kind:'switch',detail:'先沿阶梯走到左上方，操作开关停止瀑布，再回中央挑战馆主。'});
  notes['cinnabar-gym-frlg'].note = '答对各房间的问题可开启门并绕过训练家；红色战斗并非全部强制。地图只标馆主，随机/题目机关以当前游戏为准。';
  notes['vermilion-gym-frlg'].note = '垃圾桶开关位置会随机变化，不固定绘制“第几个桶”。找到第一个后，第二个在相邻桶中。';
  notes['driftveil-gym-bw'] = { mode: '电梯方向参考', note: '绿色箭头下降、紫色箭头上升。馆主在单独的最底层图，不在这张平台图里。', points: [] };
  notes['driftveil-gym-bottom-bw'] = { mode: '目标标注', points:[goal(50, 19)] };

  // Keep the existing cross-floor instructions alongside their annotated maps.
  for (const [phaseId, guides] of Object.entries(window.guideData.routeGuides)) {
    let mapNumber = 0;
    for (const guide of guides) {
      guide.maps.forEach((map, index) => {
        notes[`community-${phaseId}-${mapNumber++}`] = {
          mode: '社区分层走法', points: [], note: `${map.description} ${guide.caution}`,
          ...(index === 0 ? {walkthrough: guide.steps, source: guide.source} : {})
        };
      });
    }
  }

  notes['icirrus-city-spring-bw'] = {
    mode:'进城到道馆路线',
    note:'春季地形参考。先完成螺丝山出口对话，再按青色路线去道馆；需要回复时走蓝色支线进 PC。北侧龙螺旋之塔留到后续 u4 阶段。',
    points:[
      {id:'1',x:17.2,y:76.4,label:'螺丝山出口',kind:'entry',detail:'从山洞出来，完成博士的出口对话。'},
      {id:'2',x:27.3,y:61.2,label:'上台阶进入城内主路',kind:'story',detail:'沿岸边路向东，然后沿楼梯上到高处。'},
      {id:'3',x:19.4,y:12.5,label:'雪花道馆入口',kind:'goal',detail:'沿主路北上，到左上山壁内的道馆入口。'},
      {id:'P',x:38.3,y:51.4,label:'PC 回复（可选）',kind:'heal',detail:'需要回复时在上楼梯后的岔路向右；回复后原路回主路。'}
    ],
    paths:[
      {kind:'route',points:[[17.2,76.4],[20.8,77.7],[27.2,77.7],[27.2,66.2],[27.2,56.5],[27.2,51.8],[27.2,38.2],[32.1,38.2],[32.1,18.7],[24.2,17.4],[19.4,16.5],[19.4,13.5]]},
      {kind:'optional',points:[[27.2,56.5],[38.3,56.5],[38.3,52.8]]}
    ],
    walkthrough:[
      '从 1 螺丝山出口完成对话，沿岸边小路向东。',
      '到 2 沿台阶向上；PC 在右侧，回复后回主路。',
      '沿主路北上，再向左进 3 雪花道馆。城内道具与支线不影响本段目标。'
    ],
    source:'https://forums.pokemmo.com/index.php?/topic/73906-unova-storyline-guide/'
  };
  notes['icirrus-gym-bw'] = {
    mode:'滑冰分段走法',
    note:'红色 1—6 是此图的沿途训练家，G 是馆主；S1—S3 是开关。按下方每一段的方向滑到停住再输入下一方向。编号是本图编号，原文另记为合众 NPC 64—70。',
    points:[
      {id:'E',x:31.1,y:95,label:'道馆入口',kind:'entry',detail:'先与入口引导员对话领取美味水，沿阶梯向上。'},
      {id:'1',x:39,y:80.8,label:'第一名训练家',kind:'battle',detail:'从入口向上滑，经弯板转到左侧蓝格；向右滑到平台并对战。'},
      {id:'S1',x:39,y:76.2,labelX:42.5,labelY:76.2,label:'第一处红色开关',kind:'switch',detail:'从训练家 1 向上踩开关，旋转弯板；向左滑回弯板，到上方平台。'},
      {id:'2',x:39,y:69.3,label:'第二名训练家',kind:'battle',detail:'在第一片冰面的右上平台对战；之后向右跨跳台。'},
      {id:'3',x:70.1,y:63,label:'第三名训练家',kind:'battle',detail:'落在第二片冰面左下平台后对战，然后依次向右、上、右、上滑。'},
      {id:'4',x:80.7,y:49.8,label:'第四名训练家',kind:'battle',detail:'第二片冰面上方平台对战。随后向下、右，绕到右侧实地，从箭头向左滑入弯板。'},
      {id:'S2',x:85.8,y:55.6,label:'第二处红色开关',kind:'switch',detail:'弯板把你送到右下蓝格；向上到开关并踩下，改变弯板方向。'},
      {id:'5',x:39,y:45.3,label:'第五名训练家',kind:'battle',detail:'回到上方平台，向左利用旋转后的弯板，再向左跨跳台到第三片冰面的右下平台，对战。'},
      {id:'6',x:25.9,y:35,label:'第六名训练家',kind:'battle',detail:'从平台向左，利用第三处弯板转向；依次向上、右、上、右，再向上到训练家处对战。'},
      {id:'S3',x:28.5,y:34.7,labelX:29.5,labelY:30,label:'第三处红色开关',kind:'switch',detail:'对战 6 后向右踩开关；依次右、下、左、下、左、上滑，抵达北侧台阶。'},
      {id:'G',x:31.1,y:10.6,label:'馆主哈奇库',kind:'goal',detail:'沿北侧台阶上去挑战馆主。胜利后沿左侧长滑道返回入口，出门完成白露、黑连对话。'}
    ],
    // Only the unambiguous jumps, stairs and exit are connected. Curved ice
    // movement is described explicitly above rather than drawn through walls.
    paths:[
      {kind:'route',points:[[40.2,68.8],[43.3,68.8],[46.5,66.6],[57,66.6],[62.7,63.5],[68.5,63.5]]},
      {kind:'route',points:[[70,49],[64,49],[59,45.5],[48,45.5],[44,48],[40,48]]},
      {kind:'route',points:[[31.1,21.3],[31.1,17.2],[31.1,12.8]]},
      {kind:'optional',points:[[20.2,23.8],[16,30],[13,45],[12.7,68],[15.2,84],[20.8,90]]}
    ],
    walkthrough:[
      '第一片冰面：入口向上 → 弯板 → 左侧蓝格 → 右到 1。打完后向上踩 S1，再向左经弯板到 2；打完 2 向右跨跳台到 3。',
      '第二片冰面：打完 3 依次右 → 上 → 右 → 上到 4。打完 4 下 → 右到实地，绕石块，从箭头向左进弯板到右下蓝格；向上踩 S2。',
      '回到 4 所在上方平台，再向左经旋转后的弯板到左上蓝格，向左跨跳台到 5。',
      '第三片冰面：打完 5 向左进弯板，再上 → 右 → 上 → 右 → 上到 6。打完 6 向右踩 S3，再右 → 下 → 左 → 下 → 左 → 上，沿阶梯到 G。',
      '打完 G 走左侧长滑道出馆，完成门外剧情，本轮按顺序转丰缘。图中青色只连接跳台和台阶；冰面输入顺序见以上分段。'
    ],
    source:'https://forums.pokemmo.com/index.php?/topic/73906-unova-storyline-guide/',
    secondarySource:'https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Black_and_White/Part_9'
  };
  window.guideData.mapNotes = notes;
})();
