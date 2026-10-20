/* Batch 14: 20 hand-designed website templates. */
{const {nav,hero,feats,split,gal,stats,quotes,price,faq,cta,contact,footer,team,cards,menu,steps,text,logos,blog,wa,pg}=B_,A=a_;

addBespoke({id:'padel-nairobi',g:'Sports',tag:'Padel courts',name:'Smash Alley Padel',kw:'padel courts nairobi tennis racket club coaching booking',desc:'Four glass-walled padel courts in Kilimani with coaching, leagues and a juice bar.',
 th:{p:'#d7ff3a',p2:'#1637ff',p3:'#ff4d6d',bg:'#0b0f1e',alt:'#141a30',tx:'#f1f4ff',dark:true,head:'Unbounded',body:'Manrope',radius:16,pop:true,grad:true,deco:true},
 pages:[pg('Home','index',[nav('Smash Alley','Book a court','left'),hero('split','KILIMANI · 4 COURTS · LIGHTS TILL 11PM','Hit it off the glass.','Padel is tennis with walls, played in doubles, learned in one evening. Rent a court, join a Thursday ladder or let Coach Wanjiru fix your bandeja.','Book a court','See prices',[A('circles',1501)],'bg'),
  stats([['4','Glass courts'],['120','Players in the ladder'],['6am','First slot'],['KSh 500','Racket hire']],'primary'),
  cards('overlay','WAYS TO PLAY','Pick your night','',[[A('grid',1502),'Open court','Hire by the hour with three friends.'],[A('person',1503),'Beginner clinic','Tuesdays 7pm, rackets and balls included.'],[A('bars',1504),'Thursday ladder','Move up or down each week, prizes monthly.']],'alt'),
  gal('masonry','Under the lights',[A('circles',1505),A('grid',1506),A('fruit',1507),A('bars',1508)],'bg'),
  price('COURT RATES','Per court, per 90 minutes','Four players share the bill.',[['Off-peak','KSh 3,200','/court','Mon to Fri before 4pm\nFloodlights free'],['Peak','KSh 4,800','/court','Evenings and weekends\nBall tube included',1],['Monthly club','KSh 9,500','/month','Two free hours weekly\nLadder entry']],'alt'),
  faq('Before you book',[['Do I need experience?','No. If you have held any racket you will be rallying in ten minutes.'],['Parking?','Twenty bays behind the courts on Argwings Kodhek Road.'],['Cancellation?','Free until 12 hours before your slot.']],'bg'),
  footer('Smash Alley Padel','Argwings Kodhek Road, Kilimani, Nairobi.')]),
  pg('Book','contact',[nav('Smash Alley','Book a court','left'),contact('Book a court','Pick a day and time and we confirm on WhatsApp within the hour.','play@smashalley.example','+254 720 311 450','Argwings Kodhek Road, Kilimani','Request slot','bg'),footer('Smash Alley Padel','Argwings Kodhek Road, Kilimani, Nairobi.')])]});

addBespoke({id:'halwa-mombasa',g:'Food',tag:'Halwa sweet shop',name:'Jibana Halwa House',kw:'halwa mombasa sweets swahili dessert cardamom kahawa gift box',desc:'Copper-pot Mombasa halwa made daily in Old Town, sold by the box and by the bite.',
 th:{p:'#9a3412',p2:'#e8a317',p3:'#14532d',bg:'#fff6e3',alt:'#fbe6b8',tx:'#3a1d0b',dark:false,head:'Young Serif',body:'Figtree',radius:6,pop:false,grad:false,deco:true},
 pages:[pg('Home','index',[nav('Jibana Halwa','Order a box','center'),hero('arch','OLD TOWN, MOMBASA · SINCE 1952','Stirred for three hours, eaten in three bites','Cornflour, ghee, sugar, cardamom and patience in a copper sufuria. Every batch is stirred by hand on Jibana Road until it shines.','Order a box','The flavours',[A('plate',1511)],'bg'),
  menu('THE FLAVOURS','Five kinds, one rule: no shortcuts','Boxes of 250 g and 500 g.',[['Classic cardamom','Amber, glossy, a little chewy','KSh 600'],['Almond and pistachio','Topped with whole nuts','KSh 900'],['Black halwa','Dark with date syrup','KSh 750'],['Coconut','Fresh grated, soft set','KSh 650'],['Rose','Light pink, with petals','KSh 800']],'alt'),
  split('left','THE POT','A copper sufuria older than the shop','Mzee Jibana bought the pot in 1952. His granddaughters still scrape it clean each night, and the halwa tastes of it.','Visit us',A('cup',1512),'bg'),
  gal('strip','Behind the counter',[A('plate',1513),A('fruit',1514),A('gift',1515),A('lamp',1516)],'alt'),
  quotes('Said at the counter',[['Tastes like Eid in my grandmother house.','Fatma H.','Nairobi'],['I carry two boxes on every flight to Dubai.','Abdul R.','Dubai'],['Best with kahawa chungu.','Tom O.','Kisumu']],'bg'),
  cta('Wedding and Eid orders','Custom trays from 5 kg, with three days notice.','Order a tray','primary'),footer('Jibana Halwa House','Jibana Road, Old Town, Mombasa.')]),
  pg('Order','contact',[nav('Jibana Halwa','Order a box','center'),contact('Order halwa','We deliver in Mombasa the same day and ship by bus to Nairobi.','orders@jibanahalwa.example','+254 722 604 118','Jibana Road, Old Town, Mombasa','Send order'),footer('Jibana Halwa House','Jibana Road, Old Town, Mombasa.')])]});

addBespoke({id:'smokehouse-kisumu',g:'Food',tag:'Fish smokehouse',name:'Dunga Smokehouse',kw:'smoked fish tilapia omena kisumu dunga beach lake victoria',desc:'Tilapia and omena smoked over mango wood on Dunga beach, Kisumu.',
 th:{p:'#e4572e',p2:'#17bebb',p3:'#ffc914',bg:'#1c1a19',alt:'#2a2725',tx:'#f4ede4',dark:true,head:'Anton',body:'Space Mono',radius:0,pop:false,grad:false,deco:true},
 pages:[pg('Home','index',[nav('DUNGA SMOKEHOUSE','Order fish','left'),hero('cover','DUNGA BEACH · KISUMU','CAUGHT AT 5. SMOKED BY 9. ON YOUR PLATE BY NOON.','Tilapia and Nile perch from our own canoes, smoked over mango wood in drum kilns. No freezer in the building.','Order today','Visit the beach',[A('waves',1521)],'bg'),
  stats([['5am','Boats land'],['18 hrs','Lake to smoke'],['40','Women fish smokers'],['3 days','Shelf life']],'primary'),
  cards('grid','THE CATCH','What comes out of the kiln','',[[A('waves',1522),'Smoked tilapia','Whole, KSh 450 to 700 by size.'],[A('hills',1523),'Omena (dagaa)','Sun-dried and smoked, KSh 300 per kilo.'],[A('stones',1524),'Fillet packs','Boneless, vacuum sealed, KSh 1,100 per 500 g.']],'alt'),
  steps('FROM LAKE TO KILN','Four steps, no tricks',[['Land','Boats come in at first light.'],['Clean','Scaled and gutted on the beach.'],['Smoke','Mango wood, slow heat, 3 hours.'],['Pack','Wrapped in banana leaf.']],'bg'),
  gal('mosaic','On the beach',[A('waves',1525),A('beach',1526),A('fruit',1527),A('plate',1528)],'alt'),
  quotes('Customers',[['I have eaten fish all over Kenya. This is it.','Prof. Ouma','Kisumu'],['Delivered to Nairobi cold and perfect.','Mary W.','Kilimani']],'bg'),
  footer('Dunga Smokehouse','Dunga Beach, Kisumu.')]),
  pg('Order','contact',[nav('DUNGA SMOKEHOUSE','Order fish','left'),contact('Place an order','Wholesale for hotels, retail for homes. Bus delivery to Nairobi every Friday.','fish@dungasmoke.example','+254 733 508 212','Dunga Beach, Kisumu','Order'),footer('Dunga Smokehouse','Dunga Beach, Kisumu.')])]});

addBespoke({id:'butterfly-gede',g:'Nature',tag:'Butterfly farm',name:'Gede Butterfly House',kw:'butterfly farm gede arabuko sokoke kipepeo pupae forest visit',desc:'A community butterfly farm at the edge of Arabuko Sokoke forest, open daily for visits.',
 th:{p:'#6d28d9',p2:'#f59e0b',p3:'#10b981',bg:'#fbf8ff',alt:'#ece4fb',tx:'#241442',dark:false,head:'Fraunces',body:'Outfit',radius:28,pop:true,grad:true,deco:true},
 pages:[pg('Home','index',[nav('Gede Butterfly House','Plan a visit','left'),hero('collage','ARABUKO SOKOKE FOREST EDGE · WATAMU ROAD','Two hundred butterflies, one cooling tent','Walk through a netted garden where swallowtails land on your shoulder. Every pupa is raised by farmers who protect the forest.','Plan a visit','Support the farmers',[A('leaf',1531),A('bloom',1532),A('hills',1533)],'bg'),
  feats('WHY IT EXISTS','A living from the forest, left standing',' ',[['🦋','Farmer owned','120 families sell pupae to museums abroad.'],['🌳','Forest kept','Cutting stops where butterflies pay better.'],['🎓','School visits','Free for classes from Kilifi County.']],'cards','alt'),
  split('right','THE GARDEN','Best between 10 and noon','The tent warms up, wings open, and the forest guide names every species for you.','Opening hours',A('bloom',1534),'bg'),
  gal('grid','Wing and petal',[A('leaf',1535),A('bloom',1536),A('circles',1537),A('paint',1538)],'alt'),
  price('TICKETS','Entry','',[['Resident adult','KSh 500','','Guided walk'],['Child','KSh 200','','Under 12'],['Non-resident','USD 12','','Includes forest trail',1]],'bg'),
  faq('Visiting',[['When are the butterflies active?','Warm, sunny mornings, 9am to 1pm.'],['How far from Watamu?','Eight minutes by tuk-tuk, KSh 300.'],['Can we buy pupae?','Only through the export programme, not to visitors.']],'alt'),
  footer('Gede Butterfly House','Gede, Kilifi County.')]),
  pg('Visit','contact',[nav('Gede Butterfly House','Plan a visit','left'),contact('Plan your visit','Large groups and school trips, please book a week ahead.','visit@gedebutterfly.example','+254 712 780 331','Gede Ruins Road, Kilifi County','Request visit','bg'),footer('Gede Butterfly House','Gede, Kilifi County.')])]});

addBespoke({id:'gin-distillery',g:'Drinks',tag:'Craft gin',name:'Rift Botanical Gin',kw:'gin distillery craft spirits juniper botanicals tasting nakuru',desc:'Small-batch gin from Rift Valley botanicals, distilled in a 200-litre copper still.',
 th:{p:'#2f6f5e',p2:'#d4af6a',p3:'#8fb8a8',bg:'#0e1f1b',alt:'#16302a',tx:'#eaf1ec',dark:true,head:'Cormorant Garamond',body:'DM Mono',radius:2,pop:false,grad:true,deco:false},
 pages:[pg('Home','index',[nav('RIFT BOTANICAL','Book a tasting','center'),hero('center','NAIVASHA · BATCH 41 · 600 BOTTLES','Juniper, wild sage and a little fire','Every bottle carries a batch number and the name of the farmer who picked its sage. Distilled slowly, bottled by hand.','Book a tasting','Find a bottle',[],'bg'),
  split('left','THE BOTANICALS','Nine plants within a morning drive','Juniper from Mt Kenya foothills, Ol Kalou wild sage, Kericho lemongrass, Naivasha orange peel and a stick of cinnamon bark.','Read the recipe',A('leaf',1541),'alt'),
  menu('THE RANGE','Three bottles','70 cl, 43% alcohol.',[['Rift Dry','Pine, citrus, crisp finish','KSh 4,200'],['Sage and Honey','Rested in oak for 6 weeks','KSh 4,900'],['Navy Strength','57%, rich and peppery','KSh 5,800']],'bg'),
  gal('strip','The still room',[A('cup',1542),A('leaf',1543),A('lamp',1544),A('stones',1545)],'alt'),
  quotes('From the bar',[['Finally a gin that tastes like where it is from.','Chef Alvin','Karen'],['Our best selling bottle.','The Muthaiga Bar','Nairobi']],'bg'),
  cta('Tasting and tour','Saturdays at 3pm. KSh 2,500 with three pours and snacks.','Book now','primary'),footer('Rift Botanical Gin','Moi South Lake Road, Naivasha.')]),
  pg('Tasting','contact',[nav('RIFT BOTANICAL','Book a tasting','center'),contact('Book a tasting','Groups of 4 to 12. Must be 18 or over.','still@riftbotanical.example','+254 722 190 440','Moi South Lake Road, Naivasha','Reserve'),footer('Rift Botanical Gin','Moi South Lake Road, Naivasha.')])]});

addBespoke({id:'sailing-kilifi',g:'Sports',tag:'Sailing school',name:'Creek Sailing Club',kw:'sailing school kilifi creek dinghy lessons rya youth regatta',desc:'Dinghy lessons for children and adults on Kilifi Creek, with a Sunday club race.',
 th:{p:'#0b3d91',p2:'#f2c14e',p3:'#e63946',bg:'#f7f9fc',alt:'#e1e9f5',tx:'#0b1b3a',dark:false,head:'Libre Caslon Text',body:'Sora',radius:4,pop:false,grad:false,deco:true},
 pages:[pg('Home','index',[nav('Creek Sailing Club','Join a course','left'),hero('cover','KILIFI CREEK · RYA-STYLE COURSES','Learn to sail where the creek meets the Indian Ocean','Five-day courses in Optimist and Laser dinghies, taught by two Kenya Sailing Association instructors. Wind from noon, tea from eight.','Join a course','Race on Sundays',[A('waves',1551)],'bg'),
  stats([['5 days','Beginner course'],['12','Boats in the fleet'],['1982','Club founded'],['8','Max per class']],'primary'),
  steps('YOUR WEEK','Monday to Friday',[['Rig','Knots, parts of the boat, capsize drill.'],['Steer','Reaching and tacking in light wind.'],['Race','Short courses with a hooter.'],['Pass','Certificate and a sunburn.']],'bg'),
  gal('masonry','On the creek',[A('waves',1552),A('beach',1553),A('hills',1554),A('port',1555)],'alt'),
  price('COURSES','Fees','Includes boat, lifejacket and lunch.',[['Juniors 8 to 14','KSh 18,000','/week','Optimist dinghy'],['Adults','KSh 24,000','/week','Laser Pico',1],['Day sail','KSh 4,500','/day','With instructor']],'bg'),
  faq('Questions',[['Can children swim?','They must swim 50 metres. We test on day one.'],['Where do we stay?','Kilifi Bay Hotel is next door; ask for the club rate.']],'alt'),
  footer('Creek Sailing Club','Kilifi Creek, Kilifi.')]),
  pg('Join','contact',[nav('Creek Sailing Club','Join a course','left'),contact('Enrol','Courses run in school holidays and every August.','sail@creeksailing.example','+254 724 130 770','Kilifi Creek, Kilifi','Send enquiry','bg'),footer('Creek Sailing Club','Kilifi Creek, Kilifi.')])]});

addBespoke({id:'skate-park-nbo',g:'Sports',tag:'Skate park',name:'Concrete Sundays',kw:'skate park nairobi skateboard bowl lessons youth ramp',desc:'A volunteer-run skate bowl and street course on a disused Ngong Road lot.',
 th:{p:'#ff5a1f',p2:'#111111',p3:'#ffe14d',bg:'#efece6',alt:'#ddd8cf',tx:'#111111',dark:false,head:'Archivo Black',body:'DM Mono',radius:0,pop:true,grad:false,deco:true},
 pages:[pg('Home','index',[nav('CONCRETE SUNDAYS','Come skate','left'),hero('collage','NGONG ROAD · FREE ENTRY · SUNDAYS 10 TO 6','Four ramps, one bowl, zero ego','Built by skaters from donated concrete, run by volunteers. Bring a board or borrow one. Kids learn from 10, beginners all day.','Come skate','Donate a board',[A('grid',1561),A('circles',1562),A('bars',1563)],'bg'),
  feats('WHAT’S HERE','The park',' ',[['🛹','Bowl','Kidney-shaped, 6 feet deep.'],['🧱','Street course','Rails, ledges, a manual pad.'],['🎓','Lessons','Free, Sundays at 11, helmets on loan.']],'cards','alt'),
  gal('mosaic','Session photos',[A('grid',1564),A('circles',1565),A('bars',1566),A('road',1567)],'bg'),
  stats([['300','Kids taught'],['40','Boards donated'],['0','Entry fee'],['2019','First pour']],'dark'),
  split('right','HELP BUILD','Sponsor a ramp','KSh 25,000 buys a metre of coping. Your name goes on the wall.','Sponsor',A('bars',1568),'alt'),
  footer('Concrete Sundays','Ngong Road, Nairobi.')]),
  pg('Visit','contact',[nav('CONCRETE SUNDAYS','Come skate','left'),contact('Find us','Opposite the Adams Arcade lorry park. Look for the orange wall.','hello@concretesundays.example','+254 711 908 334','Ngong Road, Nairobi','Message us','bg'),footer('Concrete Sundays','Ngong Road, Nairobi.')])]});

addBespoke({id:'escape-room-kampala',g:'Entertainment',tag:'Escape rooms',name:'Locked In Kampala',kw:'escape room kampala puzzle team building birthday game',desc:'Three escape rooms in Kololo, built around Ugandan stories and 60 minutes on the clock.',
 th:{p:'#00e5a8',p2:'#a855f7',p3:'#f43f5e',bg:'#080a12',alt:'#10131f',tx:'#e8ecf7',dark:true,head:'Space Mono',body:'Sora',radius:8,pop:true,grad:true,deco:true},
 pages:[pg('Home','index',[nav('LOCKED IN','Book a room','left'),hero('center','KOLOLO · 3 ROOMS · 60 MINUTES','Can you get out before the drums stop?','Solve the riddles of an abandoned colonial post office, a lost Buganda tomb or a failing space lab. Teams of 2 to 6.','Book a room','Meet the rooms',[],'bg'),
  cards('overlay','THE ROOMS','Choose your trap','',[[A('lamp',1571),'The Post Office','Beginner, 62% escape rate.'],[A('columns',1572),'Kasubi Secret','Hard, 28% escape rate.'],[A('rocket',1573),'Station Nile','Expert, 11% escape rate.']],'alt'),
  steps('HOW IT WORKS','Sixty minutes',[['Brief','Rules and a safety word.'],['Search','Clues are everywhere.'],['Hints','Three free, then 5 minutes each.'],['Debrief','Photo and soda.']],'bg'),
  price('PRICING','Per team','',[['2 players','UGX 120,000','','Any room'],['4 players','UGX 200,000','','Most popular',1],['6 players','UGX 270,000','','Corporate welcome']],'alt'),
  quotes('Escaped (or not)',[['We missed it by 40 seconds. Booking again.','Team Mulago','Hospital staff'],['Great for our office retreat.','Stanbic Kampala','HR']],'bg'),
  footer('Locked In Kampala','Kololo, Kampala.')]),
  pg('Book','contact',[nav('LOCKED IN','Book a room','left'),contact('Book a room','Slots every 90 minutes from 11am to 9pm.','play@lockedin.example','+256 772 440 910','Prince Charles Drive, Kololo','Reserve'),footer('Locked In Kampala','Kololo, Kampala.')])]});

addBespoke({id:'piano-kampala',g:'Education',tag:'Piano teacher',name:'Studio Nakato Piano',kw:'piano lessons kampala teacher abrsm grade exams recital',desc:'One-to-one piano lessons for children and adults, with ABRSM exam preparation in Kampala.',
 th:{p:'#7b2d43',p2:'#c9a227',p3:'#2b2d42',bg:'#fdf8f3',alt:'#f3e6dc',tx:'#2b1a1f',dark:false,head:'Gloock',body:'Lexend',radius:14,pop:false,grad:false,deco:false},
 pages:[pg('Home','index',[nav('Studio Nakato','Book a trial','center'),hero('split','NAKASERO · AGES 5 TO 75','A first lesson is free. Your first piece comes in week two.','Patient, structured piano teaching with Nakato Grace, ABRSM-trained, with students from first note to Grade 8.','Book a trial','Fees',[A('music',1581)],'bg'),
  split('left','THE METHOD','Ear first, then page','We learn songs you love, then the notation behind them. Recitals every term in a real hall.','Read more',A('book',1582),'alt'),
  stats([['22','Years teaching'],['48','Students'],['96%','Exam pass rate'],['3','Recitals a year']],'primary'),
  price('FEES','Per term of 10 lessons','',[['30 minutes','UGX 600,000','','Beginners'],['45 minutes','UGX 850,000','','Grades 1 to 5',1],['60 minutes','UGX 1,100,000','','Grades 6 to 8']],'bg'),
  quotes('Parents',[['My son practises without being asked.','Ruth M.','Parent'],['Learned at 58. Never too late.','Mr. Kizza','Student']],'alt'),
  faq('Common questions',[['Do we need a piano?','A keyboard with weighted keys is fine for year one.'],['Online lessons?','Yes, for students outside Kampala, same fee.']],'bg'),
  footer('Studio Nakato Piano','Nakasero Hill, Kampala.')]),
  pg('Trial','contact',[nav('Studio Nakato','Book a trial','center'),contact('Book a free trial','Mondays to Saturdays after 2pm.','grace@studionakato.example','+256 701 330 118','Nakasero Hill, Kampala','Request trial'),footer('Studio Nakato Piano','Nakasero Hill, Kampala.')])]});

addBespoke({id:'counselling-nbo',g:'Wellness',tag:'Counselling practice',name:'Quiet Room Counselling',kw:'counselling therapy nairobi couples family sessions online',desc:'A small counselling practice in Lavington for individuals, couples and families.',
 th:{p:'#5b7c6f',p2:'#d9a566',p3:'#a3b9ae',bg:'#f5f3ee',alt:'#e6e9e2',tx:'#26332e',dark:false,head:'Instrument Serif',body:'Figtree',radius:20,pop:false,grad:false,deco:false},
 pages:[pg('Home','index',[nav('Quiet Room','Book a session','left'),hero('arch','LAVINGTON · IN PERSON AND ONLINE','A place to say it out loud','Unhurried 50-minute sessions with two registered counsellors. No jargon, no judgement, and a kettle that is always on.','Book a first session','How it works',[A('lamp',1591)],'bg'),
  feats('WHO WE SEE','Three kinds of session',' ',[['🪑','Individuals','Stress, grief, burnout, big decisions.'],['💞','Couples','Communication and trust.'],['👨‍👩‍👧','Families','Teenagers, blended homes.']],'cards','alt'),
  steps('WHAT TO EXPECT','Your first month',[['Call','A 15-minute chat, free.'],['Meet','First session to set goals.'],['Work','Weekly sessions.'],['Review','We check progress at week six.']],'bg'),
  team('Your counsellors',[['Njeri Waweru','Counselling psychologist',1592],['Peter Odhiambo','Marriage and family therapist',1593]],'alt'),
  price('FEES','Per 50-minute session','Sliding scale for students.',[['Individual','KSh 4,000','',''],['Couple','KSh 6,000','','',1],['Student','KSh 1,500','','With ID']],'bg'),
  footer('Quiet Room Counselling','Lavington Green, Nairobi.')]),
  pg('Book','contact',[nav('Quiet Room','Book a session','left'),contact('Book a first session','We reply within one working day. Everything you share is confidential.','book@quietroom.example','+254 733 804 912','Lavington Green, Nairobi','Request session','bg'),footer('Quiet Room Counselling','Lavington Green, Nairobi.')])]});

addBespoke({id:'macadamia-embu',g:'Agriculture',tag:'Macadamia farm',name:'Kirinyaga Nut Co.',kw:'macadamia nuts embu farm export kernels oil cooperative',desc:'Farmer-grown macadamia, cracked and roasted on the slopes of Mt Kenya.',
 th:{p:'#6b4423',p2:'#c28e0e',p3:'#3f6b3a',bg:'#faf4ea',alt:'#eadcc3',tx:'#2d1c0f',dark:false,head:'DM Serif Display',body:'Rubik',radius:10,pop:false,grad:false,deco:true},
 pages:[pg('Home','index',[nav('Kirinyaga Nut Co.','Wholesale enquiry','left'),hero('cover','EMBU COUNTY · 1,800 SMALLHOLDERS','From the slopes of Mt Kenya to your snack bowl','Macadamia grown under shade, dried on raised racks and cracked the same week. Sold as kernels, roasted nuts and cold-pressed oil.','Wholesale enquiry','Buy online',[A('mountain',1601)],'bg'),
  cards('grid','PRODUCTS','Everything from one tree','',[[A('fruit',1602),'Raw kernels','KSh 1,800 per kg, style 1 to 4.'],[A('stones',1603),'Roasted salted','KSh 2,200 per kg.'],[A('cup',1604),'Cold-pressed oil','250 ml, KSh 950.']],'alt'),
  stats([['1,800','Farmers'],['600 t','Per year'],['12','Export markets'],['+18%','Farm-gate premium']],'primary'),
  split('right','FAIR PRICE','Farmers are paid in 7 days','No broker in between. Every sack is weighed at the village buying centre and paid by M-Pesa.','Our farmers',A('field',1605),'bg'),
  gal('strip','Harvest',[A('leaf',1606),A('field',1607),A('hills',1608),A('fruit',1609)],'alt'),
  faq('Wholesale',[['Minimum order?','50 kg for kernels, 25 kg for roasted.'],['Certifications?','KEBS and Global GAP certified.']],'bg'),
  footer('Kirinyaga Nut Co.','Runyenjes, Embu.')]),
  pg('Wholesale','contact',[nav('Kirinyaga Nut Co.','Wholesale enquiry','left'),contact('Wholesale enquiry','Samples ship in a week.','sales@kirinyaganut.example','+254 722 880 541','Runyenjes, Embu County','Request samples'),footer('Kirinyaga Nut Co.','Runyenjes, Embu.')])]});

addBespoke({id:'elgon-caves',g:'Travel',tag:'Cave guides',name:'Kitum Cave Guides',kw:'elgon caves kitum guide mount elgon hike elephants kapsokwony',desc:'Guided walks to Kitum Cave on Mount Elgon, where elephants mine salt at night.',
 th:{p:'#c2410c',p2:'#0f766e',p3:'#fbbf24',bg:'#14110f',alt:'#211c18',tx:'#f5ece2',dark:true,head:'Oswald',body:'Lexend',radius:6,pop:false,grad:true,deco:true},
 pages:[pg('Home','index',[nav('KITUM GUIDES','Book a walk','left'),hero('cover','MOUNT ELGON NATIONAL PARK · KAPSOKWONY GATE','Walk into the cave elephants dug','For centuries, elephants have carved salt out of Kitum with their tusks. Our rangers lead small groups with torches and a lot of stories.','Book a walk','Safety',[A('mountain',1611)],'bg'),
  steps('THE DAY','Gate to cave and back',[['7am','Meet at Chepkitale gate.'],['9am','Forest walk, colobus monkeys.'],['11am','Enter the cave with torches.'],['2pm','Lunch and return.']],'alt'),
  gal('mosaic','Mount Elgon',[A('mountain',1612),A('hills',1613),A('leaf',1614),A('stones',1615)],'bg'),
  price('RATES','Per person','Park fee extra.',[['Day walk','KSh 4,500','','Guide, torch, lunch'],['Two-day','KSh 11,000','','Camp at the forest edge',1],['Researchers','KSh 6,000','','Geology talk']],'alt'),
  faq('Safety',[['Is it safe with elephants?','Always with an armed KWS ranger and never in the cave at night.'],['What to wear?','Boots, a waterproof and a headlamp. We lend torches.']],'bg'),
  footer('Kitum Cave Guides','Kapsokwony, Bungoma.')]),
  pg('Book','contact',[nav('KITUM GUIDES','Book a walk','left'),contact('Book your walk','Groups up to 8.','walk@kitumguides.example','+254 700 905 120','Kapsokwony Town, Bungoma','Book','bg'),footer('Kitum Cave Guides','Kapsokwony, Bungoma.')])]});

addBespoke({id:'vegan-cafe-nbo',g:'Food',tag:'Vegan café',name:'Mboga Kitchen',kw:'vegan cafe nairobi plant based lunch smoothies kilimani',desc:'A plant-based canteen in Kilimani serving Kenyan favourites without the nyama.',
 th:{p:'#3a7d44',p2:'#ff8fab',p3:'#ffd166',bg:'#fffdf5',alt:'#f1f4dc',tx:'#1f3524',dark:false,head:'Baloo 2',body:'Figtree',radius:30,pop:true,grad:false,deco:true},
 pages:[pg('Home','index',[nav('Mboga Kitchen','See the menu','center'),hero('collage','KILIMANI · MON TO SAT · 8AM TO 5PM','Mukimo, sukuma and a lot more green','Plant-based lunches in the Kenyan style. Our mushroom pilau has converted three butchers.','See the menu','Order lunch',[A('fruit',1621),A('plate',1622),A('leaf',1623)],'bg'),
  menu('TODAY','Lunch plates','All include a drink.',[['Mushroom pilau','Fresh kachumbari and lime','KSh 750'],['Bean mukimo','Green peas and pumpkin','KSh 650'],['Coconut ugali bowl','With sukuma and lentils','KSh 600'],['Banana chapati wrap','Spicy chickpeas','KSh 550'],['Green smoothie','Spinach, mango, ginger','KSh 400']],'alt'),
  gal('masonry','Plates',[A('plate',1624),A('fruit',1625),A('bloom',1626),A('cup',1627)],'bg'),
  quotes('Regulars',[['Better than my mum’s, don’t tell her.','Wambui','Kilimani'],['Meat-eaters love it too.','Dennis O.','Accountant']],'alt'),
  cta('Office lunches','Boxes of 10 or more delivered across Kilimani and Upper Hill.','Order boxes','primary'),footer('Mboga Kitchen','Wood Avenue, Kilimani.')]),
  pg('Order','contact',[nav('Mboga Kitchen','See the menu','center'),contact('Order for your office','Order by 10am for noon delivery.','lunch@mbogakitchen.example','+254 745 630 090','Wood Avenue, Kilimani','Send order'),footer('Mboga Kitchen','Wood Avenue, Kilimani.')])]});

addBespoke({id:'vespa-zanzibar',g:'Travel',tag:'Vespa tours',name:'Vespa Mjini',kw:'vespa scooter tour zanzibar stone town spice farm rental',desc:'Guided and self-ride Vespa tours from Stone Town to spice farms and quiet beaches.',
 th:{p:'#f25f5c',p2:'#247ba0',p3:'#ffe066',bg:'#fff8ec',alt:'#ffe8c2',tx:'#20323d',dark:false,head:'Bricolage Grotesque',body:'Outfit',radius:22,pop:true,grad:false,deco:true},
 pages:[pg('Home','index',[nav('Vespa Mjini','Reserve a Vespa','left'),hero('arch','STONE TOWN · VINTAGE-STYLE VESPAS','Ride out of the old town, ice cream optional','Half-day guided loops past clove farms, Jozani forest edge and the beach at Paje. Helmets, snacks and a mechanic in the van.','Reserve a Vespa','Routes',[A('road',1631)],'bg'),
  cards('overlay','ROUTES','Pick a loop','',[[A('fruit',1632),'Spice farm loop','4 hours, KSh 85,000 for two.'],[A('beach',1633),'Paje beach run','6 hours, with lunch, KSh 130,000 for two.'],[A('city',1634),'Stone Town sunset','2 hours, KSh 45,000 for two.']],'alt'),
  steps('BEFORE YOU RIDE','Three rules',[['Licence','Valid motorcycle licence or Zanzibar permit.'],['Helmet','Always on, always buckled.'],['Left side','We drive on the left.']],'bg'),
  gal('strip','On the road',[A('road',1635),A('beach',1636),A('hills',1637),A('city',1638)],'alt'),
  faq('Good to know',[['No licence?','Ride pillion with our guide.'],['Rain?','We shorten the loop, never cancel.']],'bg'),
  footer('Vespa Mjini','Mizingani Road, Stone Town.')]),
  pg('Reserve','contact',[nav('Vespa Mjini','Reserve a Vespa','left'),contact('Reserve a Vespa','Tell us dates and the number of riders.','ride@vespamjini.example','+255 774 308 260','Mizingani Road, Stone Town','Reserve'),footer('Vespa Mjini','Mizingani Road, Stone Town.')])]});

addBespoke({id:'home-loan-broker',g:'Finance',tag:'Mortgage broker',name:'Msingi Home Loans',kw:'mortgage broker nairobi home loan first time buyer kenya bank comparison',desc:'An independent mortgage broker comparing nine Kenyan lenders for first-time buyers.',
 th:{p:'#1f3a5f',p2:'#e07a1f',p3:'#6b8cae',bg:'#f6f8fb',alt:'#e3eaf3',tx:'#13233a',dark:false,head:'Manrope',body:'Manrope',radius:8,pop:false,grad:false,deco:false},
 pages:[pg('Home','index',[nav('Msingi Home Loans','Get a quote','left'),hero('split','NAIROBI · FREE FOR BUYERS','Nine banks. One application. A rate you can defend.','We compare mortgages from KCB, Stanbic, Absa, NCBA, Housing Finance and more. Most buyers save between KSh 400,000 and 1.2 million over the loan.','Get a free quote','How it works',[A('house',1641)],'bg'),
  stats([['9','Lenders compared'],['9.8%','Lowest rate found'],['212','Families housed'],['21 days','Typical approval']],'primary'),
  steps('THE PROCESS','From idea to keys',[['Budget','What you can borrow.'],['Compare','Rates, fees, insurance.'],['Apply','We fill the forms.'],['Close','Valuation, offer, title.']],'bg'),
  split('left','WHY BROKERS','You are not our product','Banks pay us a standard fee, so we have no reason to push a single lender. We publish the comparison to you.','See fees',A('bars',1642),'alt'),
  faq('Questions',[['Deposit needed?','Usually 10 to 20 percent.'],['Salary minimum?','Most lenders want KSh 80,000 take-home.'],['Self-employed?','Yes, with 12 months of statements.']],'bg'),
  footer('Msingi Home Loans','Kilimani, Nairobi. Not financial advice.')]),
  pg('Quote','contact',[nav('Msingi Home Loans','Get a quote','left'),contact('Get a free quote','Takes five minutes. We call you back the same day.','loans@msingi.example','+254 711 440 705','Kilimani, Nairobi','Get quote','bg'),footer('Msingi Home Loans','Kilimani, Nairobi.')])]});

addBespoke({id:'crop-cover-app',g:'Tech',tag:'Crop insurance app',name:'Mvua Cover',kw:'crop insurance app farmers weather index mpesa drought payout kenya',desc:'Weather-index crop insurance paid out by M-Pesa when rainfall falls short.',
 th:{p:'#0ea5e9',p2:'#84cc16',p3:'#0f172a',bg:'#f2f9fd',alt:'#dff0fa',tx:'#0b2538',dark:false,head:'Sora',body:'DM Mono',radius:12,pop:true,grad:true,deco:true},
 pages:[pg('Home','index',[nav('Mvua Cover','Get covered','left'),hero('center','FOR SMALLHOLDERS · FROM KSH 150 PER ACRE','When the rain fails, we pay before the harvest does','Satellite and rain gauge data trigger automatic payouts to your M-Pesa. No loss assessor, no paperwork, no waiting.','Get covered','How payouts work',[],'bg'),
  feats('HOW IT WORKS','Four lines on your phone',' ',[['📱','Dial *483#','Enter your farm location.'],['🌧️','We watch rainfall','Satellite and gauges.'],['⚠️','Shortfall detected','Payout triggered automatically.'],['💸','M-Pesa in 72 hrs','No claim form.']],'cards','alt'),
  stats([['48,000','Farmers covered'],['KSh 94M','Paid out'],['72 hrs','Average payout'],['6','Counties']],'primary'),
  price('PREMIUMS','Per acre, per season','',[['Maize','KSh 150','/acre','Long rains'],['Beans','KSh 120','/acre','Short rains'],['Coffee','KSh 350','/acre','Annual',1]],'bg'),
  faq('Questions',[['Who pays out?','Backed by licensed reinsurance and approved by IRA.'],['What if rain is fine?','Then no payout, like any insurance.']],'alt'),
  footer('Mvua Cover','Westlands, Nairobi.')]),
  pg('Contact','contact',[nav('Mvua Cover','Get covered','left'),contact('Talk to us','Cooperatives and agrovets welcome.','hello@mvuacover.example','+254 20 440 8800','Westlands, Nairobi','Message us','bg'),footer('Mvua Cover','Westlands, Nairobi.')])]});

addBespoke({id:'speaking-coach',g:'Coaching',tag:'Public speaking coach',name:'Sema Wazi Coaching',kw:'public speaking coach nairobi presentation toastmasters workshop confidence',desc:'Workshops and one-to-one coaching for people who dread the microphone.',
 th:{p:'#111827',p2:'#fb923c',p3:'#fde68a',bg:'#fffbf2',alt:'#fdf0d5',tx:'#111827',dark:false,head:'Syne',body:'Figtree',radius:0,pop:true,grad:false,deco:true},
 pages:[pg('Home','index',[nav('SEMA WAZI','Book coaching','left'),hero('split','NAIROBI AND ONLINE · 6 WEEKS','Say it clearly. Say it once.','Six-week coaching for founders, lawyers and preachers who want to be heard, not endured. Real rooms, real audiences, real feedback on video.','Book coaching','Workshops',[A('person',1651)],'bg'),
  feats('WHAT WE FIX','Three habits',' ',[['🎙️','Voice','Breath, pace and the pause.'],['🧠','Structure','One idea, three proofs.'],['🧍','Presence','Stance and eye contact.']],'cards','alt'),
  steps('THE SIX WEEKS','Week by week',[['1 to 2','Voice and body.'],['3 to 4','Story and structure.'],['5','Q&A under pressure.'],['6','Live talk with an audience.']],'bg'),
  price('PROGRAMMES','','',[['Workshop','KSh 8,500','/seat','One Saturday, 12 people'],['6-week group','KSh 38,000','/person','Weekly 2-hour sessions',1],['1-to-1','KSh 90,000','/6 weeks','Private coaching']],'alt'),
  quotes('Results',[['I pitched to investors the week after and closed.','Faith M.','Founder'],['My sermons got shorter and better.','Pastor David','Ruiru']],'bg'),
  footer('Sema Wazi Coaching','Westlands, Nairobi.')]),
  pg('Book','contact',[nav('SEMA WAZI','Book coaching','left'),contact('Book a call','A 20-minute chat about your talk.','coach@semawazi.example','+254 722 118 090','Westlands, Nairobi','Book call','bg'),footer('Sema Wazi Coaching','Westlands, Nairobi.')])]});

addBespoke({id:'archery-karura',g:'Sports',tag:'Archery range',name:'Karura Archers',kw:'archery range nairobi bow lessons forest karura target club',desc:'A forest-edge archery range with lessons, birthday parties and a Saturday club.',
 th:{p:'#386641',p2:'#bc4749',p3:'#f2e8cf',bg:'#f2e8cf',alt:'#e3d5a8',tx:'#2a2a1a',dark:false,head:'Fraunces',body:'Rubik',radius:14,pop:false,grad:false,deco:true},
 pages:[pg('Home','index',[nav('Karura Archers','Book a lesson','center'),hero('cover','KARURA FOREST EDGE · THIKA ROAD GATE','Draw. Aim. Breathe. Release.','Learn recurve archery in a quiet clearing with certified coaches. Equipment provided, ages 8 and up.','Book a lesson','Parties',[A('field',1661)],'bg'),
  cards('grid','PROGRAMMES','Choose how to start','',[[A('circles',1662),'First arrow','1 hour, KSh 2,000.'],[A('person',1663),'Junior club','Saturdays, KSh 6,000 a month.'],[A('balloon',1664),'Birthday party','10 kids, KSh 25,000.']],'alt'),
  stats([['30','Targets'],['14','Years of coaching'],['8+','Minimum age'],['0','Bad days']],'primary'),
  gal('masonry','At the range',[A('field',1665),A('circles',1666),A('leaf',1667),A('hills',1668)],'bg'),
  faq('Before you come',[['What to wear?','Closed shoes, fitted top.'],['Safety?','Range officer on every lane.']],'alt'),
  footer('Karura Archers','Thika Road, Nairobi.')]),
  pg('Book','contact',[nav('Karura Archers','Book a lesson','center'),contact('Book a lesson','Tuesdays to Sundays, 9am to 5pm.','shoot@karuraarchers.example','+254 733 270 410','Thika Road, Nairobi','Book'),footer('Karura Archers','Thika Road, Nairobi.')])]});

addBespoke({id:'coliving-nbo',g:'Property',tag:'Co-living',name:'Kejani Co-living',kw:'coliving nairobi rooms young professionals furnished shared kitchen',desc:'Furnished rooms with shared kitchens and a rooftop, month to month in Kilimani.',
 th:{p:'#6366f1',p2:'#14b8a6',p3:'#fbbf24',bg:'#fafaff',alt:'#eceefb',tx:'#1e1b4b',dark:false,head:'Outfit',body:'Sora',radius:18,pop:true,grad:true,deco:true},
 pages:[pg('Home','index',[nav('Kejani Co-living','See rooms','left'),hero('collage','KILIMANI · MONTH TO MONTH','Your own door, a house full of friends','Furnished rooms, fibre wifi, a weekly cook-up and no deposit that disappears. From KSh 32,000 a month, bills included.','See rooms','Book a viewing',[A('house',1671),A('laptop',1672),A('lamp',1673)],'bg'),
  price('ROOMS','Pick a space','Utilities and wifi included.',[['Cosy','KSh 32,000','/month','12 sqm, shared bath'],['Standard','KSh 42,000','/month','16 sqm, ensuite',1],['Studio','KSh 58,000','/month','Kitchenette']],'alt'),
  feats('INCLUDED','Everything shared that should be',' ',[['📶','Fibre 100 Mbps','Backup power too.'],['🍳','Big kitchen','Weekly community supper.'],['🌇','Rooftop','Sunset views.']],'cards','bg'),
  gal('mosaic','Around the house',[A('house',1674),A('laptop',1675),A('lamp',1676),A('city',1677)],'alt'),
  faq('FAQ',[['Minimum stay?','One month.'],['Deposit?','One month rent, refundable.']],'bg'),
  footer('Kejani Co-living','Kilimani, Nairobi.')]),
  pg('Viewing','contact',[nav('Kejani Co-living','See rooms','left'),contact('Book a viewing','Evenings and weekends welcome.','hi@kejani.example','+254 790 551 140','Kilimani, Nairobi','Book viewing','bg'),footer('Kejani Co-living','Kilimani, Nairobi.')])]});

addBespoke({id:'cheese-limuru',g:'Food',tag:'Artisan cheese',name:'Limuru Cheese Cave',kw:'artisan cheese limuru cheddar gouda dairy cave tasting farm shop',desc:'Aged cheddar, gouda and feta made from Limuru farm milk, matured in a cool stone cave.',
 th:{p:'#d97706',p2:'#365314',p3:'#fef3c7',bg:'#fffaf0',alt:'#f8ead0',tx:'#3b2a10',dark:false,head:'Bodoni Moda',body:'Lexend',radius:4,pop:false,grad:false,deco:true},
 pages:[pg('Home','index',[nav('Limuru Cheese Cave','Order cheese','center'),hero('center','LIMURU · AGED 3 TO 24 MONTHS','Slow milk, slow cheese, no hurry','Twenty farms deliver milk by 6am, the wheel is turned by hand each week, and the cave stays at exactly 12 degrees.','Order cheese','Visit the cave',[],'bg'),
  menu('THE CHEESES','On the board','Prices per 250 g.',[['Mature cheddar','12 months, crumbly and sharp','KSh 1,300'],['Gouda','6 months, caramel notes','KSh 1,100'],['Feta','Brined in herbs','KSh 700'],['Smoked halloumi','Grills well','KSh 850']],'alt'),
  split('right','THE CAVE','A hillside store room turned cellar','Dug into red Limuru soil, the cave keeps its temperature all year without electricity.','Visit',A('stones',1681),'bg'),
  gal('strip','From the cave',[A('stones',1682),A('cup',1683),A('plate',1684),A('fruit',1685)],'alt'),
  cta('Saturday tasting','KSh 1,500 with six cheeses, bread and a glass of wine.','Book a seat','primary'),footer('Limuru Cheese Cave','Limuru, Kiambu County.')]),
  pg('Order','contact',[nav('Limuru Cheese Cave','Order cheese','center'),contact('Order or visit','We courier chilled boxes in Nairobi.','cheese@limurucave.example','+254 722 706 330','Limuru, Kiambu County','Send order'),footer('Limuru Cheese Cave','Limuru, Kiambu County.')])]});
}
