// Local example assets; only curated maps contain authored steps.
window.MAP_TEMPLATE_DATA = {
  "version": 1,
  "title": "合众路线地图模板",
  "initialMap": "striaton-city-spring-bw",
  "maps": [
    {
      "id": "unova-overview",
      "title": "合众总览",
      "category": "总览",
      "src": "../assets/maps/Unova.png",
      "width": 4096,
      "height": 2688,
      "source": "https://pokemmo.info/maps",
      "markers": [
        {
          "id": "town-nuvema-town-spring-bw",
          "label": "鹿子镇",
          "x": 90.6,
          "y": 94,
          "kind": "exit",
          "targetMap": "nuvema-town-spring-bw"
        },
        {
          "id": "town-accumula-town-spring-bw",
          "label": "唐草镇",
          "x": 90.6,
          "y": 82,
          "kind": "exit",
          "targetMap": "accumula-town-spring-bw"
        },
        {
          "id": "town-striaton-city-spring-bw",
          "label": "三曜市",
          "x": 89,
          "y": 70,
          "kind": "exit",
          "targetMap": "striaton-city-spring-bw"
        },
        {
          "id": "town-nacrene-city-spring-bw",
          "label": "七宝市",
          "x": 79.3,
          "y": 70,
          "kind": "exit",
          "targetMap": "nacrene-city-spring-bw"
        },
        {
          "id": "town-castelia-city-map-bw",
          "label": "飞云市",
          "x": 51.5,
          "y": 77.3,
          "kind": "exit",
          "targetMap": "castelia-city-map-bw"
        },
        {
          "id": "town-nimbasa-city-spring-bw",
          "label": "雷文市",
          "x": 51.5,
          "y": 54.1,
          "kind": "exit",
          "targetMap": "nimbasa-city-spring-bw"
        },
        {
          "id": "town-driftveil-city-spring-bw",
          "label": "帆巴市",
          "x": 28.9,
          "y": 54.1,
          "kind": "exit",
          "targetMap": "driftveil-city-spring-bw"
        },
        {
          "id": "town-mistralton-city-spring-b",
          "label": "吹寄市",
          "x": 15.6,
          "y": 39.8,
          "kind": "exit",
          "targetMap": "mistralton-city-spring-b"
        },
        {
          "id": "town-icirrus-city-spring-bw",
          "label": "雪花市",
          "x": 28.9,
          "y": 25.5,
          "kind": "exit",
          "targetMap": "icirrus-city-spring-bw"
        },
        {
          "id": "town-opelucid-city-b",
          "label": "双龙市",
          "x": 51.5,
          "y": 25.5,
          "kind": "exit",
          "targetMap": "opelucid-city-b"
        }
      ],
      "steps": [],
      "paths": []
    },
    {
      "id": "striaton-city-spring-bw",
      "title": "三曜市",
      "category": "城镇",
      "src": "../assets/atlas/striaton-city-spring-bw.png",
      "width": 1366,
      "height": 482,
      "source": "https://archives.bulbagarden.net/wiki/File:Striaton_City_Spring_BW.png",
      "markers": [
        {
          "id": "school",
          "label": "三曜学校",
          "kind": "battle",
          "x": 52.1,
          "y": 35.5,
          "labelSide": "bottom"
        },
        {
          "id": "gym",
          "label": "三曜道馆",
          "kind": "goal",
          "x": 71.2,
          "y": 34,
          "labelSide": "top"
        },
        {
          "id": "lab",
          "label": "真菰研究所",
          "kind": "item",
          "x": 76.2,
          "y": 40.5,
          "labelSide": "bottom"
        },
        {
          "id": "dreamyard-exit",
          "label": "梦之遗迹入口",
          "kind": "exit",
          "x": 92.5,
          "y": 20,
          "labelSide": "top"
        }
      ],
      "steps": [
        {
          "id": "city-school",
          "markerId": "school",
          "title": "与黑连对战",
          "action": "先进入 PC 左侧的学校，与黑连对话并完成对战。完成后出门，去 PC 右侧的三曜道馆。",
          "mediaId": "school-interior",
          "interiorMap": "striaton-school-interior"
        },
        {
          "id": "city-gym",
          "markerId": "gym",
          "title": "完成第一馆挑战",
          "action": "进入 PC 右侧的三曜道馆。门口领取美味水，完成馆内机关和馆主挑战。",
          "mediaId": "gym-entry",
          "interiorMap": "striaton-gym-bw"
        },
        {
          "id": "city-lab-first",
          "markerId": "lab",
          "title": "上楼领取居合斩",
          "action": "馆后跟随真菰，从最右侧房屋的北侧入口进入，上楼领取居合斩。然后出门向东北去梦之遗迹。",
          "mediaId": "fennel",
          "interiorMap": ""
        },
        {
          "id": "city-dreamyard",
          "markerId": "dreamyard-exit",
          "title": "完成等离子团剧情",
          "action": "从东北侧出口进入梦之遗迹，用居合斩开路，完成梦娜与等离子团事件。之后返回真菰研究所。",
          "mediaId": "dreamyard",
          "interiorMap": "dreamyard-ruins-spring-bw"
        },
        {
          "id": "city-lab-return",
          "markerId": "lab",
          "title": "返回研究所交接",
          "action": "回到刚才的研究所，上楼与真菰交接梦之遗迹剧情。完成后离开，从城市西北侧前往 3 号路。",
          "mediaId": "fennel",
          "interiorMap": ""
        }
      ],
      "paths": []
    },
    {
      "id": "striaton-school-interior",
      "title": "三曜学校内部",
      "category": "室内",
      "src": "assets/striaton-school-interior.png",
      "width": 256,
      "height": 256,
      "source": "https://archives.bulbagarden.net/wiki/File:Striaton_Trainers_School_interior_BWB2W2.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "striaton-gym-bw",
      "title": "三曜道馆",
      "category": "道馆",
      "src": "../assets/atlas/striaton-gym-bw.png",
      "width": 448,
      "height": 704,
      "source": "https://archives.bulbagarden.net/wiki/File:Striaton_Gym_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "dreamyard-ruins-spring-bw",
      "title": "梦之遗迹",
      "category": "其他区域",
      "src": "../assets/atlas/dreamyard-ruins-spring-bw.png",
      "width": 896,
      "height": 743,
      "source": "https://archives.bulbagarden.net/wiki/File:Dreamyard_Ruins_Spring_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "nuvema-town-spring-bw",
      "title": "鹿子镇",
      "category": "城镇",
      "src": "../assets/atlas/nuvema-town-spring-bw.png",
      "width": 512,
      "height": 576,
      "source": "https://archives.bulbagarden.net/wiki/File:Nuvema_Town_Spring_BW.png",
      "markers": [
        {
          "id": "nuvema-town-spring-bw-1",
          "label": "玩家家",
          "kind": "story",
          "x": 45.5,
          "y": 43.2
        },
        {
          "id": "nuvema-town-spring-bw-2",
          "label": "白露家",
          "kind": "story",
          "x": 26.8,
          "y": 67.2
        },
        {
          "id": "nuvema-town-spring-bw-3",
          "label": "博士实验室",
          "kind": "story",
          "x": 29.9,
          "y": 21
        },
        {
          "id": "nuvema-town-spring-bw-4",
          "label": "1 号路",
          "kind": "exit",
          "x": 64.5,
          "y": 3.3
        }
      ],
      "steps": [
        {
          "id": "nuvema-town-spring-bw-step-1",
          "markerId": "nuvema-town-spring-bw-1",
          "title": "领取伙伴并完成开局对战",
          "action": "在中央蓝顶房屋内领取初始伙伴，与白露、黑连对战；下楼与妈妈对话后出门。",
          "mediaId": "",
          "interiorMap": ""
        },
        {
          "id": "nuvema-town-spring-bw-step-2",
          "markerId": "nuvema-town-spring-bw-2",
          "title": "完成出发对话",
          "action": "进入左下方蓝顶房屋，完成白露与父亲的出发对话，再去实验室。",
          "mediaId": "",
          "interiorMap": ""
        },
        {
          "id": "nuvema-town-spring-bw-step-3",
          "markerId": "nuvema-town-spring-bw-3",
          "title": "完成博士剧情",
          "action": "进入左上方橙顶实验室，与博士对话并完成图鉴相关剧情。",
          "mediaId": "",
          "interiorMap": ""
        },
        {
          "id": "nuvema-town-spring-bw-step-4",
          "markerId": "nuvema-town-spring-bw-4",
          "title": "离镇向北前进",
          "action": "从东北侧出口进入 1 号路，完成捕捉教学后继续向唐草镇前进。",
          "mediaId": "",
          "interiorMap": ""
        }
      ],
      "paths": []
    },
    {
      "id": "unova-route-2-spring-bw",
      "title": "2号路",
      "category": "道路",
      "src": "../assets/atlas/unova-route-2-spring-bw.png",
      "width": 1024,
      "height": 1024,
      "source": "https://archives.bulbagarden.net/wiki/File:Unova_Route_2_Spring_BW.png",
      "markers": [
        {
          "id": "unova-route-2-spring-bw-1",
          "label": "训练家",
          "kind": "battle",
          "x": 28,
          "y": 39.5
        },
        {
          "id": "unova-route-2-spring-bw-2",
          "label": "训练家",
          "kind": "battle",
          "x": 80,
          "y": 10.5
        }
      ],
      "steps": [
        {
          "id": "unova-route-2-spring-bw-step-1",
          "markerId": "unova-route-2-spring-bw-1",
          "title": "道路转弯处的训练家",
          "action": "领取跑步鞋后沿道路向北，在第一个转弯处完成训练家对战（合众 NPC 4）。",
          "mediaId": "",
          "interiorMap": ""
        },
        {
          "id": "unova-route-2-spring-bw-step-2",
          "markerId": "unova-route-2-spring-bw-2",
          "title": "出口前与白露对战",
          "action": "继续沿主路向北，在三曜市入口前完成白露对战（合众 NPC 5），随后进城。",
          "mediaId": "",
          "interiorMap": ""
        }
      ],
      "paths": []
    },
    {
      "id": "unova-route-1-spring-bw",
      "title": "1号路",
      "category": "道路",
      "src": "../assets/atlas/unova-route-1-spring-bw.png",
      "width": 1024,
      "height": 1544,
      "source": "https://archives.bulbagarden.net/wiki/File:Unova_Route_1_Spring_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "accumula-town-spring-bw",
      "title": "唐草镇",
      "category": "城镇",
      "src": "../assets/atlas/accumula-town-spring-bw.png",
      "width": 700,
      "height": 620,
      "source": "https://archives.bulbagarden.net/wiki/File:Accumula_Town_Spring_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "unova-route-3-spring-bw",
      "title": "3号路",
      "category": "道路",
      "src": "../assets/atlas/unova-route-3-spring-bw.png",
      "width": 1536,
      "height": 820,
      "source": "https://archives.bulbagarden.net/wiki/File:Unova_Route_3_Spring_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "wellspring-cave-1f-bw",
      "title": "地下水脉洞穴1F",
      "category": "其他区域",
      "src": "../assets/atlas/wellspring-cave-1f-bw.png",
      "width": 528,
      "height": 440,
      "source": "https://archives.bulbagarden.net/wiki/File:Wellspring_Cave_1F_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "nacrene-city-spring-bw",
      "title": "七宝市",
      "category": "城镇",
      "src": "../assets/atlas/nacrene-city-spring-bw.png",
      "width": 1024,
      "height": 450,
      "source": "https://archives.bulbagarden.net/wiki/File:Nacrene_City_Spring_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "nacrene-gym-library-bw",
      "title": "七宝道馆图书馆",
      "category": "道馆",
      "src": "../assets/atlas/nacrene-gym-library-bw.png",
      "width": 400,
      "height": 560,
      "source": "https://archives.bulbagarden.net/wiki/File:Nacrene_Gym_Library_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "nacrene-gym-basement-bw",
      "title": "七宝道馆地下室",
      "category": "道馆",
      "src": "../assets/atlas/nacrene-gym-basement-bw.png",
      "width": 208,
      "height": 352,
      "source": "https://archives.bulbagarden.net/wiki/File:Nacrene_Gym_Basement_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "pinwheel-forest-spring-bw",
      "title": "矢车森林",
      "category": "其他区域",
      "src": "../assets/atlas/pinwheel-forest-spring-bw.png",
      "width": 1856,
      "height": 973,
      "source": "https://archives.bulbagarden.net/wiki/File:Pinwheel_Forest_Spring_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "castelia-city-map-bw",
      "title": "飞云市街区全图",
      "category": "城镇",
      "src": "../assets/atlas/castelia-city-map-bw.png",
      "width": 1130,
      "height": 1070,
      "source": "https://archives.bulbagarden.net/wiki/File:Castelia_City_Map_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "castelia-gym-bw",
      "title": "飞云道馆",
      "category": "道馆",
      "src": "../assets/atlas/castelia-gym-bw.png",
      "width": 640,
      "height": 768,
      "source": "https://archives.bulbagarden.net/wiki/File:Castelia_Gym_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "unova-route-4-bw",
      "title": "4号路",
      "category": "道路",
      "src": "../assets/atlas/unova-route-4-bw.png",
      "width": 1024,
      "height": 1641,
      "source": "https://archives.bulbagarden.net/wiki/File:Unova_Route_4_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "nimbasa-city-spring-bw",
      "title": "雷文市",
      "category": "城镇",
      "src": "../assets/atlas/nimbasa-city-spring-bw.png",
      "width": 441,
      "height": 209,
      "source": "https://archives.bulbagarden.net/wiki/File:Nimbasa_City_Spring_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "nimbasa-gym-bw",
      "title": "雷文道馆",
      "category": "道馆",
      "src": "../assets/atlas/nimbasa-gym-bw.png",
      "width": 1216,
      "height": 832,
      "source": "https://archives.bulbagarden.net/wiki/File:Nimbasa_Gym_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "driftveil-city-spring-bw",
      "title": "帆巴市",
      "category": "城镇",
      "src": "../assets/atlas/driftveil-city-spring-bw.png",
      "width": 1504,
      "height": 820,
      "source": "https://archives.bulbagarden.net/wiki/File:Driftveil_City_Spring_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "cold-storage-bw",
      "title": "冷冻仓库",
      "category": "其他区域",
      "src": "../assets/atlas/cold-storage-bw.png",
      "width": 529,
      "height": 555,
      "source": "https://archives.bulbagarden.net/wiki/File:Cold_Storage_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "driftveil-gym-bw",
      "title": "帆巴道馆",
      "category": "道馆",
      "src": "../assets/atlas/driftveil-gym-bw.png",
      "width": 368,
      "height": 560,
      "source": "https://archives.bulbagarden.net/wiki/File:Driftveil_Gym_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "driftveil-gym-bottom-bw",
      "title": "帆巴道馆馆主层",
      "category": "道馆",
      "src": "../assets/atlas/driftveil-gym-bottom-bw.png",
      "width": 240,
      "height": 336,
      "source": "https://archives.bulbagarden.net/wiki/File:Driftveil_Gym_Bottom_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "unova-route-6-spring-bw",
      "title": "6号路",
      "category": "道路",
      "src": "../assets/atlas/unova-route-6-spring-bw.png",
      "width": 1024,
      "height": 820,
      "source": "https://archives.bulbagarden.net/wiki/File:Unova_Route_6_Spring_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "chargestone-cave-bw",
      "title": "电石洞穴各层",
      "category": "其他区域",
      "src": "../assets/atlas/chargestone-cave-bw.png",
      "width": 256,
      "height": 192,
      "source": "https://archives.bulbagarden.net/wiki/File:Chargestone_Cave_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "mistralton-city-spring-b",
      "title": "吹寄市",
      "category": "城镇",
      "src": "../assets/atlas/mistralton-city-spring-b.png",
      "width": 1024,
      "height": 1230,
      "source": "https://archives.bulbagarden.net/wiki/File:Mistralton_City_Spring_B.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "celestial-tower-1f-bwb2w2",
      "title": "天堂塔1F",
      "category": "其他区域",
      "src": "../assets/atlas/celestial-tower-1f-bwb2w2.png",
      "width": 435,
      "height": 440,
      "source": "https://archives.bulbagarden.net/wiki/File:Celestial_Tower_1F_BWB2W2.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "celestial-tower-rooftop-bwb2w2",
      "title": "天堂塔顶层",
      "category": "其他区域",
      "src": "../assets/atlas/celestial-tower-rooftop-bwb2w2.png",
      "width": 582,
      "height": 550,
      "source": "https://archives.bulbagarden.net/wiki/File:Celestial_Tower_Rooftop_BWB2W2.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "mistralton-gym-bw",
      "title": "吹寄道馆",
      "category": "道馆",
      "src": "../assets/atlas/mistralton-gym-bw.png",
      "width": 576,
      "height": 828,
      "source": "https://archives.bulbagarden.net/wiki/File:Mistralton_Gym_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "unova-route-7-spring-bw",
      "title": "7号路",
      "category": "道路",
      "src": "../assets/atlas/unova-route-7-spring-bw.png",
      "width": 1024,
      "height": 820,
      "source": "https://archives.bulbagarden.net/wiki/File:Unova_Route_7_Spring_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "twist-mountain-1f-bw",
      "title": "螺丝山1F",
      "category": "其他区域",
      "src": "../assets/atlas/twist-mountain-1f-bw.png",
      "width": 1200,
      "height": 1001,
      "source": "https://archives.bulbagarden.net/wiki/File:Twist_Mountain_1F_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "twist-mountain-2f-bw",
      "title": "螺丝山2F",
      "category": "其他区域",
      "src": "../assets/atlas/twist-mountain-2f-bw.png",
      "width": 1201,
      "height": 923,
      "source": "https://archives.bulbagarden.net/wiki/File:Twist_Mountain_2F_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "twist-mountain-3f-bw",
      "title": "螺丝山3F",
      "category": "其他区域",
      "src": "../assets/atlas/twist-mountain-3f-bw.png",
      "width": 1199,
      "height": 968,
      "source": "https://archives.bulbagarden.net/wiki/File:Twist_Mountain_3F_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "icirrus-city-spring-bw",
      "title": "雪花市全图",
      "category": "城镇",
      "src": "../assets/atlas/icirrus-city-spring-bw.png",
      "width": 1024,
      "height": 849,
      "source": "https://archives.bulbagarden.net/wiki/File:Icirrus_City_Spring_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "icirrus-gym-bw",
      "title": "雪花道馆全图",
      "category": "道馆",
      "src": "../assets/atlas/icirrus-gym-bw.png",
      "width": 1422,
      "height": 1026,
      "source": "https://archives.bulbagarden.net/wiki/File:Icirrus_Gym_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "dragonspiral-tower-1f-bwb2w2",
      "title": "龙螺旋之塔1F",
      "category": "其他区域",
      "src": "../assets/atlas/dragonspiral-tower-1f-bwb2w2.png",
      "width": 352,
      "height": 493,
      "source": "https://archives.bulbagarden.net/wiki/File:Dragonspiral_Tower_1F_BWB2W2.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "dragonspiral-tower-2f-bwb2w2",
      "title": "龙螺旋之塔2F",
      "category": "其他区域",
      "src": "../assets/atlas/dragonspiral-tower-2f-bwb2w2.png",
      "width": 464,
      "height": 486,
      "source": "https://archives.bulbagarden.net/wiki/File:Dragonspiral_Tower_2F_BWB2W2.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "dragonspiral-tower-3f-bwb2w2",
      "title": "龙螺旋之塔3F",
      "category": "其他区域",
      "src": "../assets/atlas/dragonspiral-tower-3f-bwb2w2.png",
      "width": 761,
      "height": 1129,
      "source": "https://archives.bulbagarden.net/wiki/File:Dragonspiral_Tower_3F_BWB2W2.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "dragonspiral-tower-4f-bwb2w2",
      "title": "龙螺旋之塔4F",
      "category": "其他区域",
      "src": "../assets/atlas/dragonspiral-tower-4f-bwb2w2.png",
      "width": 508,
      "height": 725,
      "source": "https://archives.bulbagarden.net/wiki/File:Dragonspiral_Tower_4F_BWB2W2.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "dragonspiral-tower-5f-bwb2w2",
      "title": "龙螺旋之塔5F",
      "category": "其他区域",
      "src": "../assets/atlas/dragonspiral-tower-5f-bwb2w2.png",
      "width": 483,
      "height": 483,
      "source": "https://archives.bulbagarden.net/wiki/File:Dragonspiral_Tower_5F_BWB2W2.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "dragonspiral-tower-6f-bwb2w2",
      "title": "龙螺旋之塔6F",
      "category": "其他区域",
      "src": "../assets/atlas/dragonspiral-tower-6f-bwb2w2.png",
      "width": 845,
      "height": 933,
      "source": "https://archives.bulbagarden.net/wiki/File:Dragonspiral_Tower_6F_BWB2W2.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "dragonspiral-tower-7f-bwb2w2",
      "title": "龙螺旋之塔7F",
      "category": "其他区域",
      "src": "../assets/atlas/dragonspiral-tower-7f-bwb2w2.png",
      "width": 618,
      "height": 760,
      "source": "https://archives.bulbagarden.net/wiki/File:Dragonspiral_Tower_7F_BWB2W2.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "desert-resort-bw",
      "title": "荒野名胜区",
      "category": "其他区域",
      "src": "../assets/atlas/desert-resort-bw.png",
      "width": 1578,
      "height": 1157,
      "source": "https://archives.bulbagarden.net/wiki/File:Desert_Resort_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "relic-castle-1f-l-bw",
      "title": "古代城堡1F左区",
      "category": "其他区域",
      "src": "../assets/atlas/relic-castle-1f-l-bw.png",
      "width": 408,
      "height": 364,
      "source": "https://archives.bulbagarden.net/wiki/File:Relic_Castle_1F_L_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "relic-castle-b1f-b2f-b3f-l-bw",
      "title": "古代城堡B1F—B3F左区",
      "category": "其他区域",
      "src": "../assets/atlas/relic-castle-b1f-b2f-b3f-l-bw.png",
      "width": 408,
      "height": 348,
      "source": "https://archives.bulbagarden.net/wiki/File:Relic_Castle_B1F_B2F_B3F_L_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "relic-castle-b4f-b5f-l-bw",
      "title": "古代城堡B4F—B5F左区",
      "category": "其他区域",
      "src": "../assets/atlas/relic-castle-b4f-b5f-l-bw.png",
      "width": 408,
      "height": 364,
      "source": "https://archives.bulbagarden.net/wiki/File:Relic_Castle_B4F_B5F_L_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "opelucid-city-b",
      "title": "双龙市",
      "category": "城镇",
      "src": "../assets/atlas/opelucid-city-b.png",
      "width": 1024,
      "height": 820,
      "source": "https://archives.bulbagarden.net/wiki/File:Opelucid_City_B.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "opelucid-gym-b",
      "title": "双龙道馆",
      "category": "道馆",
      "src": "../assets/atlas/opelucid-gym-b.png",
      "width": 825,
      "height": 700,
      "source": "https://archives.bulbagarden.net/wiki/File:Opelucid_Gym_B.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "victory-road-bw",
      "title": "合众冠军之路全图",
      "category": "其他区域",
      "src": "../assets/atlas/victory-road-bw.png",
      "width": 1920,
      "height": 1375,
      "source": "https://archives.bulbagarden.net/wiki/File:Victory_Road_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "pok-mon-league-bw",
      "title": "合众联盟",
      "category": "其他区域",
      "src": "../assets/atlas/pok-mon-league-bw.png",
      "width": 256,
      "height": 192,
      "source": "https://archives.bulbagarden.net/wiki/File:Pok%C3%A9mon_League_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    },
    {
      "id": "n-castle-throne-room-bw",
      "title": "N城堡王座大厅",
      "category": "其他区域",
      "src": "../assets/atlas/n-castle-throne-room-bw.png",
      "width": 464,
      "height": 789,
      "source": "https://archives.bulbagarden.net/wiki/File:N_Castle_Throne_Room_BW.png",
      "markers": [],
      "steps": [],
      "paths": []
    }
  ],
  "media": [
    {
      "id": "school-interior",
      "src": "assets/striaton-school-interior.png",
      "title": "学校内部全图",
      "caption": "黑／白共用学校内部地形图。进入学校后与黑连对话并对战；可替换为自己的 PokeMMO 实景截图。"
    },
    {
      "id": "school-entry",
      "src": "../assets/docx/image9.png",
      "title": "学校入口实景",
      "caption": "原文 PokeMMO 截图：这是学校入口外景。"
    },
    {
      "id": "gym-entry",
      "src": "../assets/docx/image10.png",
      "title": "道馆入口内景",
      "caption": "原文 PokeMMO 截图：进入三曜道馆后领取美味水。"
    },
    {
      "id": "fennel",
      "src": "../assets/docx/image11.png",
      "title": "研究所内与真菰对话",
      "caption": "原文 PokeMMO 截图：上楼与真菰交谈。"
    },
    {
      "id": "dreamyard",
      "src": "../assets/docx/image12.png",
      "title": "梦之遗迹剧情实景",
      "caption": "原文 PokeMMO 截图：梦之遗迹中的梦娜剧情。"
    }
  ],
  "completed": []
};
