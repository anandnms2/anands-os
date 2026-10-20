/* Batch 12: 20 hand-designed website templates. */
{const {nav,hero,feats,split,gal,stats,quotes,price,faq,cta,contact,footer,team,cards,menu,steps,text,logos,blog,wa,pg}=B_,A=a_;

addBespoke({id:'salt-pans-gongoni',g:'Food',tag:'Sea salt producer',name:'Gongoni Chumvi',kw:'sea salt pans malindi flakes kitchen',desc:'Hand-raked sea salt from the Gongoni pans near Malindi.',
 th:{p:'#1f4e6b',p2:'#e8dcc6',p3:'#c8553d',bg:'#fbf9f4',alt:'#eef2f3',tx:'#17252e',dark:false,head:'Gloock',body:'Figtree',radius:4},
 pages:[pg('Home','index',[nav('Gongoni Chumvi','Order salt','center','page:shop'),hero('center','MALINDI · KILIFI COUNTY','Salt the way the tide leaves it','Seawater, sun and a wooden rake. Nothing added, nothing taken out, packed in paper by the families who work the pans.','Order salt','How it is made',[],'alt'),
  steps('FROM SEA TO SHAKER','Twelve days, five steps',[['Pump','Seawater is drawn into shallow clay pans at spring tide.'],['Bake','Sun and wind do the work for 9 to 12 days.'],['Rake','Crystals are raked by hand at dawn.'],['Wash','Rinsed once in brine, never in fresh water.'],['Pack','Weighed into paper bags in Gongoni village.']]),
  split('left','THE PANS','Forty families, one coastline','The co-operative owns 62 pans and splits every sale: half to the family who raked it, a quarter for the school fund, a quarter for new pans.','Meet the families',A('beach',1301),'alt'),
  cards('grid','THE RANGE','Three grains','',[[A('circles',1302),'Fine table salt','Soft, quick to dissolve. 500 g, KSh 250'],[A('stones',1303),'Flaky finishing salt','Crunch on tomatoes and grilled fish. 200 g, KSh 400'],[A('leaf',1304),'Smoked mangrove salt','Cold-smoked over mangrove offcuts. 150 g, KSh 480']]),
  stats([['62','Salt pans'],['40','Families'],['0','Additives'],['KSh 4m','Paid out last year']],'dark'),
  footer('Gongoni Chumvi','Gongoni village, Magarini, Kilifi County.')]),
  pg('Shop','shop',[nav('Gongoni Chumvi','Order salt','center','page:shop'),menu('Price list','Delivery in Kenya from KSh 300. Cafes ask for 10 kg sacks.',[['Fine table salt','500 g paper bag','KSh 250'],['Flaky finishing salt','200 g jar','KSh 400'],['Smoked mangrove salt','150 g tin','KSh 480'],['Gift box of three','All grains, wooden spoon','KSh 1,000'],['Chef sack','10 kg, coarse','KSh 2,600']]),contact('Wholesale and gifts','Tell us your volume and city.','chumvi@gongoni.example','+254 722 310 421','Magarini Road, Gongoni, Kilifi','Send order'),footer('Gongoni Chumvi','Gongoni village, Magarini, Kilifi County.')])]});

addBespoke({id:'seaweed-farm-paje',g:'Agriculture',tag:'Seaweed farming',name:'Mwani Women of Paje',kw:'seaweed farm zanzibar cosmetics women cooperative',desc:'Seaweed grown by 120 women in Paje, sold as food and skincare.',
 th:{p:'#0e7c66',p2:'#f4b942',p3:'#d9534f',bg:'#f3f9f6',alt:'#dff0e8',tx:'#0f2a24',dark:false,head:'Bricolage Grotesque',body:'Manrope',radius:20,pop:true,grad:true},
 pages:[pg('Home','index',[nav('Mwani Paje','Buy products','left','page:shop'),hero('split','PAJE · SOUTH-EAST ZANZIBAR','Grown at low tide by 120 women','Red and green seaweed, planted on ropes and harvested at sunrise. Dried for the kitchen, pressed into soap and blended into skincare.','Shop the range','Visit a farm',[A('waves',1311)],'bg'),
  feats('WHAT WE MAKE','From the lagoon to your shelf',' ',[['🌿','Dried mwani','Culinary flakes for soups, curries and salads.'],['🧼','Seaweed soap','Cold-pressed with coconut oil, no palm.'],['🧴','Face gel','Light, cooling, made in Paje.']],'cards','alt'),
  split('archleft','THE FARMERS','Income that arrives every week','Before the co-operative, farmers sold wet seaweed to middlemen at KSh 20 a kilo. Now they earn four times that and own the drying shed.','Support the co-op',A('beach',1312)),
  gal('masonry','Morning harvest',[A('waves',1313),A('beach',1314),A('person',1315),A('leaf',1316),A('hills',1317)],'alt'),
  quotes('From the lagoon',[['I bought a bicycle for my daughter with the first season.','Mwanaisha J.','Farmer since 2019'],['Our chefs use the flakes in every fish stew.','Hamza R.','Chef, Jambiani'],['The soap is the only one that does not dry my skin.','Kate S.','Guest from Nairobi']],'bg'),
  cta('Walk the seaweed farm with us','Low tide tours at 7am, $12 a person, proceeds go to the school fund.','Book a tour','primary'),
  footer('Mwani Women of Paje','Paje, Zanzibar South.','dark')]),
  pg('Shop','shop',[nav('Mwani Paje','Buy products','left','page:shop'),menu('Shop','Prices in Tanzanian shillings. We post across Tanzania.',[['Dried mwani 100 g','Culinary flakes','TSh 8,000'],['Seaweed soap','Coconut and mwani, 120 g','TSh 6,500'],['Cooling face gel','50 ml tube','TSh 18,000'],['Starter gift basket','Soap, flakes, gel','TSh 30,000']]),contact('Farm tours','Low tide times change daily, so message us the date.','mwani@paje.example','+255 778 220 330','Paje seafront, Zanzibar','Ask about a tour'),footer('Mwani Women of Paje','Paje, Zanzibar South.','dark')])]});

addBespoke({id:'carpentry-school-jinja',g:'Education',tag:'Carpentry school',name:'Nile Timber Skills',kw:'carpentry joinery vocational training jinja workshop',desc:'Six-month practical joinery course in Jinja.',
 th:{p:'#b4561f',p2:'#f2c14e',p3:'#2d3a33',bg:'#f5efe6',alt:'#e8dcc7',tx:'#2b1d12',dark:false,head:'Archivo Black',body:'Karla',radius:2},
 pages:[pg('Home','index',[nav('NILE TIMBER SKILLS','Apply','left'),hero('cover','JINJA · UGANDA','Learn to build furniture people pay for','Six months at the bench with working joiners. Leave with a toolkit, a portfolio and an order book.','Apply for May intake','See the course',[A('field',1321)],'dark'),
  stats([['6','Months'],['82%','Employed in 3 months'],['12','Students per class'],['UGX 1.8m','Full fee']],'primary'),
  steps('THE COURSE','What you build',[['Month 1','Safety, measuring, hand tools, a stool.'],['Months 2-3','Joints, doors, a kitchen cabinet.'],['Months 4-5','Beds, tables and a client commission.'],['Month 6','Pricing, marketing and your own bench.']],'alt'),
  split('right','THE WORKSHOP','Real machines, real timber','Planer, table saw and spindle moulder from day one, under a teacher who has run a workshop for 22 years. Offcuts go to the neighbours as firewood.','Visit on Saturday',A('house',1322)),
  gal('strip','Student work',[A('house',1323),A('lamp',1324),A('frame',1325),A('stones',1326)],'alt'),
  faq('Questions',[['Do I need experience?','No. About half of each class has never held a chisel.'],['Is there a payment plan?','Pay UGX 600,000 up front and the rest in four monthly parts.'],['Can women apply?','Yes. Four of this year’s twelve places went to women.']]),
  footer('Nile Timber Skills','Plot 9, Wanyange Road, Jinja.')]),
  pg('Apply','contact',[nav('NILE TIMBER SKILLS','Apply','left'),contact('Apply for the May intake','Tell us your age, village and why you want to build.','apply@niletimber.example','+256 772 400 118','Plot 9, Wanyange Road, Jinja','Send application'),footer('Nile Timber Skills','Plot 9, Wanyange Road, Jinja.')])]});

addBespoke({id:'kigali-marathon',g:'Events',tag:'Marathon event',name:'Kigali Hills Marathon',kw:'marathon running race kigali event 10k',desc:'A 42 km run through the thousand hills of Kigali.',
 th:{p:'#ffe500',p2:'#111111',p3:'#00a859',bg:'#111111',alt:'#1c1c1c',tx:'#f7f7f2',dark:true,head:'Anton',body:'Lexend',radius:0},
 pages:[pg('Race','index',[nav('KIGALI HILLS','Register','left'),hero('center','SUNDAY 14 JUNE 2027 · 6:00AM','42 KM. 1,850 M OF CLIMB. ONE CITY.','Start at Amahoro Stadium, finish at Kigali Convention Centre. Closed roads, ten water stations and a crowd on every hill.','Register now','Race map',[],'bg'),
  stats([['3,500','Runners'],['42 km','Marathon'],['21 km','Half'],['10 km','Fun run']],'primary'),
  price('ENTRY','Choose your distance','Early-bird prices end 31 January.',[['10 km','$15','','T-shirt\nMedal\nTimed chip'],['Half marathon','$30','','T-shirt\nMedal\nChip and photos',1],['Marathon','$45','','Finisher jacket\nMedal\nFull chip and photos']],'alt'),
  split('left','THE ROUTE','Hard hills, soft finish','Rwanda earned its name the hill-by-hill way. Expect the Kimihurura climb at 28 km and a downhill last 3 km into a stadium roar.','View the map',A('hills',1331)),
  gal('mosaic','Last year',[A('road',1332),A('person',1333),A('mountain',1334),A('city',1335),A('heart',1336),A('hills',1337)],'alt'),
  faq('Runner info',[['Is there a cut-off?','Marathon 6 hours, half 3 hours.'],['Can I collect my bib early?','Yes, Friday and Saturday at Kigali Arena Expo.'],['What about weather?','June is dry. Expect 14°C at the start and 24°C at noon.']]),
  cta('Join 3,500 runners','Bring a friend and each of you gets a free pace group.','Register','primary'),footer('Kigali Hills Marathon','Run for the Rwanda Children’s Fund.','alt')]),
  pg('Contact','contact',[nav('KIGALI HILLS','Register','left'),contact('Race office','Open Monday to Friday, 9am to 5pm.','race@kigalihills.example','+250 788 551 090','KG 11 Ave, Remera, Kigali','Send question'),footer('Kigali Hills Marathon','Run for the Rwanda Children’s Fund.','alt')])]});

addBespoke({id:'hearing-clinic-nbo',g:'Health',tag:'Hearing clinic',name:'Sikia Hearing Care',kw:'hearing aid audiologist ear test nairobi',desc:'Hearing tests and aids with an audiologist in Nairobi.',
 th:{p:'#3b5bdb',p2:'#ffb199',p3:'#2f9e8f',bg:'#fcfcfe',alt:'#eef1fb',tx:'#1b2240',dark:false,head:'Libre Caslon Text',body:'Lexend',radius:14},
 pages:[pg('Home','index',[nav('Sikia Hearing Care','Book a test','left'),hero('arch','LAVINGTON · NAIROBI','Hear the people you love, clearly again','A 40-minute hearing test, a plain-English answer and aids fitted by a registered audiologist. No pressure to buy.','Book a free test','Call us',[A('person',1341)],'bg'),
  feats('SIGNS TO WATCH','Do you recognise any of these?',' ',[['👂','Asking people to repeat','Especially in restaurants and on the phone.'],['📺','TV volume wars','Everyone else says it is too loud.'],['🔔','Missing small sounds','Doorbells, birds, a child calling from another room.']],'cards','alt'),
  steps('YOUR VISIT','What happens in the clinic',[['Talk','Ten minutes about your day and where it is hard.'],['Test','Booth test of tones and words.'],['Explain','We draw your result and explain it simply.'],['Try','Wear demo aids home for 7 days, free.']]),
  price('HEARING AIDS','Honest prices','Includes fitting and 2 years of adjustments.',[['Essential','KSh 85,000','/pair','Behind the ear\nRechargeable\n2-year warranty'],['Comfort','KSh 140,000','/pair','Tiny, almost invisible\nBluetooth to phone\n3-year warranty',1],['Premium','KSh 230,000','/pair','Noise-learning chip\nApp control\n4-year warranty']],'alt'),
  quotes('Patients',[['My granddaughter’s voice is the first thing I noticed.','Mzee Kamau','Age 78'],['No sales talk, just good advice.','Dorcas A.','Teacher'],['Finally enjoying church again.','Peter N.','Retired driver']],'bg'),
  footer('Sikia Hearing Care','2nd Floor, Lavington Mall, Nairobi.')]),
  pg('Book','contact',[nav('Sikia Hearing Care','Book a test','left'),contact('Book a free test','We reply within one working day.','hello@sikia.example','+254 733 080 080','Lavington Mall, 2nd Floor, Nairobi','Request appointment'),faq('Before you come',[['Do I need a referral?','No.'],['Does NHIF cover it?','Partly. We help with the paperwork.']]),footer('Sikia Hearing Care','2nd Floor, Lavington Mall, Nairobi.')])]});

addBespoke({id:'aquarium-shop-nbo',g:'Retail',tag:'Aquarium shop',name:'Rift Valley Aquatics',kw:'aquarium fish tank cichlid pets nairobi',desc:'Cichlids, tanks and setup help in Nairobi.',
 th:{p:'#00b3a6',p2:'#ff7a45',p3:'#7c5cff',bg:'#06232b',alt:'#0b303a',tx:'#e6fbf8',dark:true,head:'Syne',body:'Outfit',radius:16,deco:true,grad:true},
 pages:[pg('Home','index',[nav('Rift Valley Aquatics','Visit the shop','left'),hero('collage','THIKA ROAD · NAIROBI','Lake Malawi, in your living room','Cichlids bred in Naivasha, tanks built to measure and a team who answer WhatsApp at 9pm when the water goes cloudy.','See the fish','Plan a tank',[A('waves',1351),A('bloom',1352),A('circles',1353)],'bg'),
  cards('overlay','THIS WEEK','Fresh in the tanks','',[[A('waves',1354),'Electric yellow cichlid','Bright, hardy and good for beginners. KSh 600'],[A('bloom',1355),'Peacock cichlid','Rainbow males, calm group tanks. KSh 900'],[A('circles',1356),'Neon tetra school','Pack of ten for planted tanks. KSh 800']]),
  split('right','TANK BUILDS','Glass cut for your wall','From a 60-litre desk tank to a 600-litre living-room centrepiece, with stand, filter, lights and cycled water from day one.','Get a quote',A('frame',1357),'alt'),
  steps('SETUP SUPPORT','Never lose a fish to guesswork',[['Plan','We size the tank to your space and budget.'],['Cycle','Two weeks of bacteria bedding before fish go in.'],['Stock','Slow introductions, never more than six at a time.'],['Care','Free water tests every Saturday.']]),
  price('SERVICE','Keep it clean','',[['Monthly clean','KSh 3,500','/visit','Water change\nFilter wash\nGlass polish'],['Full care','KSh 8,000','/month','Weekly visits\nFish health check\nReplace any fish lost',1]],'alt'),
  footer('Rift Valley Aquatics','Thika Road Mall, Ground Floor, Nairobi.')]),
  pg('Visit','contact',[nav('Rift Valley Aquatics','Visit the shop','left'),contact('Visit the shop','Open daily 10am to 7pm, Sundays 11am to 5pm.','fish@riftaquatics.example','+254 701 440 880','Thika Road Mall, Ground Floor, Nairobi','Send a message'),footer('Rift Valley Aquatics','Thika Road Mall, Ground Floor, Nairobi.')])]});

addBespoke({id:'landscape-gardener-karen',g:'Home',tag:'Landscape gardener',name:'Bustani Landscapes',kw:'garden landscaping lawn design karen nairobi',desc:'Garden design and maintenance for Nairobi homes.',
 th:{p:'#386641',p2:'#bc6c25',p3:'#a7c957',bg:'#f9f6ee',alt:'#eef0df',tx:'#1f2a1a',dark:false,head:'Young Serif',body:'Figtree',radius:12},
 pages:[pg('Home','index',[nav('Bustani Landscapes','Book a visit','center'),hero('center','KAREN · RUNDA · LAVINGTON','Gardens that look after themselves','Native planting, drip irrigation and stone paths. Designed by a botanist, built by a crew who have worked together since 2014.','Book a garden visit','',[],'alt'),
  gal('grid','Recent gardens',[A('field',1361),A('bloom',1362),A('stones',1363),A('leaf',1364),A('house',1365),A('hills',1366)]),
  split('arch','OUR WAY','Plant for the rains you have','We choose natives like croton, aloe and kikuyu alternatives that need 60% less water, then feed them with your own compost.','Our plants',A('leaf',1367),'alt'),
  price('PACKAGES','Three ways to start','',[['Design plan','KSh 45,000','','Site visit\nScale drawing\nPlant list'],['Full build','From KSh 350,000','','Design and planting\nIrrigation\n90-day aftercare',1],['Monthly care','KSh 18,000','/month','Weekly crew\nPruning and feeding\nPest checks']]),
  quotes('Clients',[['Our dusty plot is now the reason people stay for dinner.','Wambui & Karim','Karen'],['They arrived on time every Tuesday for two years.','Dr Otieno','Runda']],'alt'),
  faq('Good to know',[['Do you work in small compounds?','Yes, from 80 square metres.'],['How long does a build take?','Most gardens take 3 to 5 weeks.']]),
  footer('Bustani Landscapes','Ngong Road, Karen, Nairobi.')]),
  pg('Contact','contact',[nav('Bustani Landscapes','Book a visit','center'),contact('Book a visit','Free for the first visit within Nairobi.','garden@bustani.example','+254 722 616 900','Ngong Road, Karen, Nairobi'),footer('Bustani Landscapes','Ngong Road, Karen, Nairobi.')])]});

addBespoke({id:'robotics-kids-club',g:'Education',tag:'Kids robotics club',name:'Mzuka Robotics',kw:'kids robotics coding arduino club children',desc:'Saturday robotics classes for children aged 8 to 15.',
 th:{p:'#ff5a36',p2:'#ffd23f',p3:'#2ec4b6',bg:'#fff9ec',alt:'#ffe9c7',tx:'#2a1c3d',dark:false,head:'Baloo 2',body:'Lexend',radius:26,pop:true,deco:true},
 pages:[pg('Home','index',[nav('Mzuka Robotics','Join a class','left'),hero('collage','KILIMANI · NAIROBI · SATURDAYS','Build a robot. Then make it dance.','Kids aged 8 to 15 learn circuits, code and teamwork by building a new machine every term.','Join a class','Watch a demo',[A('rocket',1371),A('laptop',1372),A('circles',1373)],'bg'),
  feats('EACH TERM','Three builds, one trophy',' ',[['🤖','Line follower','Sensors, motors and a track made of tape.'],['🦾','Robot arm','Pick up cups with servos and a joystick.'],['🏆','Sumo battle','The end-of-term tournament, with parents screaming.']],'cards','alt'),
  stats([['180','Kids taught'],['9','Mentors'],['2','Regional medals'],['1:5','Teacher ratio']],'primary'),
  split('left','THE MENTORS','Engineers who still love toys','Our team are working engineers from the university, Safaricom and a solar start-up. They fix bugs patiently and never grab the soldering iron.','Meet them',A('person',1374)),
  price('TERM FEES','Simple pricing','Kit is included and kept by the child.',[['Starter','KSh 14,000','/term','8 Saturdays\nStarter kit\nTournament entry'],['Builder','KSh 22,000','/term','12 Saturdays\nAdvanced kit\nMentor feedback',1]],'alt'),
  faq('Parents ask',[['Does my child need coding skills?','No. We start from zero.'],['What if we miss a class?','Join the next group free of charge.']]),
  footer('Mzuka Robotics','Kilimani Primary School annex, Nairobi.')]),
  pg('Join','contact',[nav('Mzuka Robotics','Join a class','left'),contact('Join a class','Tell us your child’s age and any experience.','join@mzuka.example','+254 710 220 660','Kilimani Primary annex, Nairobi','Request a place'),footer('Mzuka Robotics','Kilimani Primary School annex, Nairobi.')])]});

addBespoke({id:'gokart-track-nyali',g:'Leisure',tag:'Go-kart track',name:'Nyali Apex Karting',kw:'go kart racing track mombasa fun birthday',desc:'A 600 m outdoor kart track in Nyali, Mombasa.',
 th:{p:'#e10600',p2:'#f5f5f5',p3:'#ffc400',bg:'#0e0e10',alt:'#18181b',tx:'#f4f4f4',dark:true,head:'Oswald',body:'Space Mono',radius:0},
 pages:[pg('Track','index',[nav('NYALI APEX','Book a race','left'),hero('cover','NYALI · MOMBASA · OPEN 10AM–10PM','600 METRES. 11 CORNERS. ONE WINNER.','Sodi racing karts, a timing board and a cold drink at the finish. Races from KSh 1,500.','Book a race','Corporate days',[A('car',1381)],'bg'),
  price('RACES','Choose your session','Helmet, suit and gloves included.',[['Sprint','KSh 1,500','/8 laps','1 race\nLap times by SMS'],['Grand Prix','KSh 3,200','/3 races','Qualifying, heat, final\nPodium photo',1],['Endurance','KSh 14,000','/team','60 minutes, teams of four\nPit stops']],'alt'),
  stats([['600 m','Track'],['25','Karts'],['0:41','Lap record'],['4.8','Google rating']],'primary'),
  gal('strip','Race day',[A('car',1382),A('road',1383),A('diamond',1384),A('port',1385)]),
  split('right','PARTIES','Birthdays that smell of rubber','Kids from age 8 on junior karts, adults on 270 cc. Cake table, music and a podium for everyone.','Plan a party',A('balloon',1386),'alt'),
  faq('Rider rules',[['Minimum age?','8 for junior karts, 14 for adult karts.'],['Do I need a licence?','No. A briefing is compulsory.']]),
  footer('Nyali Apex Karting','Links Road, Nyali, Mombasa.')]),
  pg('Book','contact',[nav('NYALI APEX','Book a race','left'),contact('Book a race','Groups of 8 or more get a private heat.','race@nyaliapex.example','+254 721 773 200','Links Road, Nyali, Mombasa','Reserve slot'),footer('Nyali Apex Karting','Links Road, Nyali, Mombasa.')])]});

addBespoke({id:'photo-school-kampala',g:'Education',tag:'Photography school',name:'Pearl Lens Academy',kw:'photography course camera lessons kampala',desc:'Weekend photography courses in Kampala.',
 th:{p:'#222222',p2:'#d4a24c',p3:'#8c8c8c',bg:'#f4f1ea',alt:'#e9e4d8',tx:'#1a1a1a',dark:false,head:'Bodoni Moda',body:'DM Mono',radius:0},
 pages:[pg('Home','index',[nav('Pearl Lens Academy','Enrol','center'),hero('split','NAKASERO · KAMPALA','Learn to see before you click','A twelve-week course in light, composition and storytelling, taught on location around Kampala.','Enrol for January','View the syllabus',[A('camera',1391)],'alt'),
  gal('masonry','Student frames',[A('camera',1392),A('city',1393),A('person',1394),A('hills',1395),A('frame',1396)]),
  steps('THE TWELVE WEEKS','Syllabus',[['Weeks 1-3','Exposure, focus and natural light.'],['Weeks 4-6','Street, portrait and market work.'],['Weeks 7-9','Editing, colour and printing.'],['Weeks 10-12','A ten-image story and a final exhibition.']],'alt'),
  team('Teachers',[['Grace Nakato','Documentary',1397],['Samuel Okello','Portrait',1398],['Aisha Lwanga','Editing',1399]]),
  price('FEES','Tuition','No camera? Borrow one of ours.',[['Weekend','UGX 1.2m','','Sat 9am-1pm\n12 weeks'],['Evening','UGX 1.4m','','Tue and Thu 6-8pm\nExtra print credit',1]],'alt'),
  cta('Open evening, first Friday of each month','See student work and meet the teachers over tea.','Reserve a seat','dark'),footer('Pearl Lens Academy','Plot 12, Acacia Avenue, Kololo, Kampala.')]),
  pg('Enrol','contact',[nav('Pearl Lens Academy','Enrol','center'),contact('Enrol','Send a link to any photos you like.','enrol@pearllens.example','+256 701 118 400','Acacia Avenue, Kololo, Kampala'),footer('Pearl Lens Academy','Plot 12, Acacia Avenue, Kololo, Kampala.')])]});

addBespoke({id:'cold-chain-repair',g:'Business',tag:'Refrigeration repair',name:'Baridi Cold Systems',kw:'refrigeration cold room repair fridge installation',desc:'Cold rooms and fridges installed and repaired across Nairobi.',
 th:{p:'#0077b6',p2:'#90e0ef',p3:'#f77f00',bg:'#ffffff',alt:'#eaf6fb',tx:'#0a2540',dark:false,head:'Rubik',body:'Rubik',radius:8,pop:true},
 pages:[pg('Home','index',[nav('Baridi Cold Systems','Call an engineer','left'),hero('split','INDUSTRIAL AREA · NAIROBI','When the cold room stops, we are there in 3 hours','Cold rooms for butchers, dairies and flower farms. Installation, servicing and 24-hour repair across Nairobi, Thika and Naivasha.','Request a callout','Get a quote',[A('port',1401)],'alt'),
  stats([['3 hrs','Average response'],['310','Cold rooms serviced'],['24/7','Emergency line'],['5 yrs','Compressor warranty']],'dark'),
  feats('WHAT WE DO','Keep it at 2 degrees',' ',[['❄️','Cold room build','Insulated panels, door and unit from 6 to 80 cubic metres.'],['🔧','Repair','Gas leaks, compressors, fans and thermostats.'],['📊','Temperature alarms','SMS alert if your room warms above 5°C.']],'cards'),
  split('left','CASE','A dairy that stopped losing milk','Kiambu Fresh lost 600 litres a week to warm tanks. We fitted a new unit and SMS alarm, and spoilage fell to under 10 litres.','Read more',A('chart',1402),'alt'),
  price('SERVICE PLANS','Annual care','',[['Basic','KSh 36,000','/year','2 visits\nGas top-up'],['Priority','KSh 72,000','/year','4 visits\n2-hour response\nAlarm included',1]]),
  quotes('Customers',[['They came at 11pm on a Saturday and saved our weekend stock.','Joyce M.','Butcher, Githurai'],['The SMS alarm paid for itself in a month.','Peter K.','Dairy, Kiambu']],'alt'),
  footer('Baridi Cold Systems','Enterprise Road, Industrial Area, Nairobi.')]),
  pg('Callout','contact',[nav('Baridi Cold Systems','Call an engineer','left'),contact('Request a callout','Tell us the unit type and what it is doing.','help@baridi.example','+254 733 900 100','Enterprise Road, Industrial Area, Nairobi','Request callout'),footer('Baridi Cold Systems','Enterprise Road, Industrial Area, Nairobi.')])]});

addBespoke({id:'dietitian-nairobi',g:'Health',tag:'Nutritionist',name:'Lishe with Dr Achieng',kw:'dietitian nutrition meal plan diabetes weight nairobi',desc:'Practical nutrition coaching with local food.',
 th:{p:'#c2410c',p2:'#fcd34d',p3:'#4d7c0f',bg:'#fffaf0',alt:'#fdf0d5',tx:'#3b1d0a',dark:false,head:'Fraunces',body:'Manrope',radius:18,grad:true},
 pages:[pg('Home','index',[nav('Lishe','Book a consult','left'),hero('arch','NUTRITION · UPPER HILL · ONLINE','Eat ugali, spinach and fish. Feel better.','Meal plans built around the food you already buy at the market, for blood sugar, weight, pregnancy and energy.','Book a 45-minute consult','See plans',[A('plate',1411)],'bg'),
  split('left','MY APPROACH','No banned foods, no powders','I am a registered dietitian with 11 years in Kenyatta and private practice. We change a plate at a time, using sukuma, omena, millet and beans.','About me',A('fruit',1412),'alt'),
  cards('grid','PROGRAMMES','Choose your focus','',[[A('heart',1413),'Blood sugar','Eight weeks for type 2 diabetes or pre-diabetes.'],[A('fruit',1414),'Weight','Slow, steady, no starving. 12 weeks.'],[A('balloon',1415),'Pregnancy','Trimester-by-trimester guides and shopping lists.']]),
  price('FEES','Consultations','Receipts for insurance claims.',[['Single consult','KSh 5,000','','45 minutes\nWritten plan'],['8-week programme','KSh 24,000','','4 consults\nWeekly WhatsApp check-in\nShopping list',1],['Family plan','KSh 38,000','','Up to 4 people\nKids’ lunchbox ideas']],'alt'),
  quotes('Clients',[['My HbA1c fell from 8.9 to 6.4 and I still eat githeri.','Mwangi N.','Programme graduate'],['She took my mother-in-law’s cooking seriously.','Zawadi K.','Pregnancy plan']]),
  faq('FAQ',[['Do you take insurance?','We issue receipts; most insurers reimburse.'],['Can we meet online?','Yes, by video from anywhere.']],'alt'),
  footer('Lishe with Dr Achieng','Ground Floor, Upper Hill Medical Centre, Nairobi.')]),
  pg('Book','contact',[nav('Lishe','Book a consult','left'),contact('Book a consult','Mornings fill fast, so book a week ahead.','book@lishe.example','+254 720 771 330','Upper Hill Medical Centre, Nairobi','Request a slot'),footer('Lishe with Dr Achieng','Ground Floor, Upper Hill Medical Centre, Nairobi.')])]});

addBespoke({id:'hells-gate-cycling',g:'Travel',tag:'Cycling tours',name:'Naivasha Pedal Tours',kw:'cycling bike tour hells gate naivasha gorge',desc:'Guided bicycle tours through Hell’s Gate National Park.',
 th:{p:'#d1495b',p2:'#edae49',p3:'#00798c',bg:'#fff8ee',alt:'#fbe7c6',tx:'#30323d',dark:false,head:'Space Mono',body:'Manrope',radius:6,pop:true,deco:true},
 pages:[pg('Home','index',[nav('Naivasha Pedal Tours','Book a ride','left'),hero('collage','HELL’S GATE · NAIVASHA','Ride between giraffes and cliffs','No lions here, so you can cycle among zebras, buffalo and warthogs. 4 hours with a guide, a picnic and a gorge hike.','Book a ride','See routes',[A('savanna',1421),A('mountain',1422),A('road',1423)],'bg'),
  cards('overlay','ROUTES','Pick your pace','',[[A('road',1424),'Gorge classic','25 km, easy, 4 hours. $45'],[A('mountain',1425),'Olkaria steam trail','40 km, steam vents and a hot spring. $65'],[A('hills',1426),'Sunset spin','12 km, golden hour, snacks. $30']]),
  steps('YOUR DAY','From Naivasha to the gorge',[['9:00','Meet at the gate and fit your bike.'],['9:30','Ride out past the zebra plains.'],['12:00','Picnic in the gorge shade.'],['13:30','Hike, swim in warm water, ride back.']],'alt'),
  gal('strip','On the trail',[A('savanna',1427),A('road',1428),A('mountain',1429),A('person',1430)]),
  quotes('Riders',[['Cycling past a giraffe is a thing I will never forget.','Lena H.','From Berlin'],['Perfect with kids aged 9 and up.','David O.','Family ride']],'alt'),
  faq('Before you ride',[['Is it safe?','There are no big predators in the park.'],['What is included?','Bike, helmet, guide, lunch and park fees.']]),
  footer('Naivasha Pedal Tours','Elsamere Road, Naivasha.')]),
  pg('Book','contact',[nav('Naivasha Pedal Tours','Book a ride','left'),contact('Book a ride','Mornings only. Message us your date.','ride@pedaltours.example','+254 724 118 119','Elsamere Road, Naivasha','Book now'),footer('Naivasha Pedal Tours','Elsamere Road, Naivasha.')])]});

addBespoke({id:'visa-agent-nbo',g:'Business',tag:'Visa and travel agent',name:'Njia Visa Desk',kw:'visa passport travel agent embassy documents',desc:'Visa applications handled for travellers from Nairobi.',
 th:{p:'#1b3a57',p2:'#f2b705',p3:'#c1121f',bg:'#f6f8fa',alt:'#e6ecf2',tx:'#14202c',dark:false,head:'DM Serif Display',body:'Figtree',radius:10},
 pages:[pg('Home','index',[nav('Njia Visa Desk','Start my visa','left'),hero('center','NAIROBI · CBD · SINCE 2012','Paperwork done properly the first time','Schengen, UK, USA, UAE, India and China visas, with a checklist, an interview rehearsal and a refund if we cause a rejection.','Start my visa','Check requirements',[],'alt'),
  logos('Visas we handle',['Schengen','UK','USA','UAE','India','China','Canada']),
  steps('HOW IT WORKS','From passport to stamp',[['Check','Free 15-minute document check.'],['Fill','We complete the forms and book the appointment.'],['Rehearse','A mock interview for USA and Canada.'],['Collect','Your passport returned to your door.']],'alt'),
  price('FEES','Our fee, excluding embassy charges','',[['UAE e-visa','KSh 4,500','','48-hour turnaround'],['Schengen','KSh 12,000','','Itinerary and insurance\nAppointment booking',1],['UK or USA','KSh 18,000','','Forms, rehearsal and cover letter']]),
  stats([['9,400','Visas handled'],['94%','Approved first time'],['12','Years open'],['4.8','Customer rating']],'primary'),
  faq('Common questions',[['How long does Schengen take?','Typically 15 working days, plus 3 for courier.'],['What if I am rejected?','We refund our fee when our mistake caused it.']],'alt'),
  footer('Njia Visa Desk','Kimathi House, 4th Floor, Nairobi CBD.')]),
  pg('Start','contact',[nav('Njia Visa Desk','Start my visa','left'),contact('Start your visa','Tell us your destination and travel dates.','visas@njia.example','+254 722 004 004','Kimathi House, Kimathi Street, Nairobi','Send request'),footer('Njia Visa Desk','Kimathi House, 4th Floor, Nairobi CBD.')])]});

addBespoke({id:'bogoria-campsite',g:'Travel',tag:'Lakeside campsite',name:'Hot Springs Camp Bogoria',kw:'camping lake bogoria flamingo tent baringo',desc:'Tents, flamingos and geysers on the shore of Lake Bogoria.',
 th:{p:'#e76f51',p2:'#f4a261',p3:'#264653',bg:'#fdf6ec',alt:'#f3e2c9',tx:'#2a2118',dark:false,head:'Instrument Serif',body:'Outfit',radius:14,grad:true},
 pages:[pg('Home','index',[nav('Hot Springs Camp','Book a tent','center'),hero('cover','LAKE BOGORIA · BARINGO COUNTY','Wake up to a million flamingos','Pitch your own tent or sleep in ours. Steaming geysers, a lake that turns pink at dawn and a fire pit that never goes out.','Book a tent','See the camp',[A('hills',1441)],'dark'),
  cards('grid','SLEEP','Three ways to stay','',[[A('mountain',1442),'Bring your tent','KSh 800 per person per night'],[A('house',1443),'Safari tent','Bed, linen, lantern. KSh 4,500 for two'],[A('savanna',1444),'Family tent','Four beds, private fire. KSh 8,000']],'alt'),
  split('archleft','THE LAKE','Geysers and wild figs','Walk 20 minutes to boiling springs, watch flamingos from the hide, and drink Samburu chai from the camp kitchen.','Plan your trip',A('beach',1445)),
  gal('mosaic','Campfire pictures',[A('hills',1446),A('savanna',1447),A('mountain',1448),A('lamp',1449),A('leaf',1450),A('beach',1451)],'alt'),
  quotes('Guests',[['We ate ugali by firelight and slept better than at home.','Ruth W.','Camper'],['The flamingo walk at 6am was worth the drive.','Max P.','From Utrecht']]),
  faq('Practical',[['Road condition?','Tarmac to Mogotio, murram for the last 22 km.'],['Is there food?','Breakfast KSh 600, dinner KSh 1,100.']],'alt'),
  footer('Hot Springs Camp Bogoria','Loboi Gate, Lake Bogoria National Reserve.')]),
  pg('Book','contact',[nav('Hot Springs Camp','Book a tent','center'),contact('Book a tent','Send dates and the number of people.','camp@bogoria.example','+254 733 411 211','Loboi Gate, Baringo County','Check dates'),footer('Hot Springs Camp Bogoria','Loboi Gate, Lake Bogoria National Reserve.')])]});

addBespoke({id:'carbon-tree-nursery',g:'Nonprofit',tag:'Tree planting',name:'Miti Mingi Trees',kw:'tree planting nursery carbon reforestation mount kenya',desc:'Plant trees on Mount Kenya for KSh 150 each.',
 th:{p:'#2d6a4f',p2:'#d8f3dc',p3:'#e9c46a',bg:'#0f2419',alt:'#16352a',tx:'#e8f5ec',dark:true,head:'Cormorant Garamond',body:'Lexend',radius:12},
 pages:[pg('Home','index',[nav('Miti Mingi','Plant a tree','left'),hero('arch','NYERI · MOUNT KENYA FOREST','One hundred and fifty shillings. One tree. A name and a GPS pin.','We grow indigenous seedlings with 24 farming groups and plant them on degraded slopes. Every tree is mapped and checked after 6 months.','Plant trees','See the map',[A('leaf',1461)],'bg'),
  stats([['212,000','Trees planted'],['24','Farmer groups'],['86%','Survival at 12 months'],['KSh 150','Per tree']],'primary'),
  steps('HOW IT WORKS','Your tree, tracked',[['You give','Choose a number of trees and a name.'],['We grow','Seedlings raised in village nurseries.'],['We plant','Rainy-season planting with the group.'],['You see','GPS pin and a photo after 6 months.']],'alt'),
  split('right','THE SPECIES','Native, not neat','Podo, olive, red cedar and cape chestnut. No eucalyptus: it drinks the streams we are trying to save.','See the trees',A('hills',1462)),
  gal('masonry','In the nursery',[A('leaf',1463),A('field',1464),A('person',1465),A('hills',1466),A('bloom',1467)],'alt'),
  price('GIVE','Choose a gift','',[['Family','KSh 1,500','','10 trees'],['Office','KSh 15,000','','100 trees\nTeam planting day',1],['Forest','KSh 150,000','','1,000 trees\nYour own grove sign']]),
  footer('Miti Mingi Trees','Nyeri town, Kenya. Reg. NGO 0451/2018.','dark')]),
  pg('Contact','contact',[nav('Miti Mingi','Plant a tree','left'),contact('Plant with us','Corporate groups can join a planting day.','plant@mitimingi.example','+254 711 300 450','Kimathi Way, Nyeri','Send message'),footer('Miti Mingi Trees','Nyeri town, Kenya. Reg. NGO 0451/2018.','dark')])]});

addBespoke({id:'mitumba-boutique',g:'Retail',tag:'Second-hand fashion',name:'Gikomba Gold',kw:'mitumba thrift second hand clothes vintage fashion',desc:'Hand-picked mitumba, washed and styled, online and in Nairobi.',
 th:{p:'#ff2e63',p2:'#08d9d6',p3:'#252a34',bg:'#fff5f0',alt:'#ffe2d6',tx:'#252a34',dark:false,head:'Unbounded',body:'Figtree',radius:30,pop:true,deco:true,grad:true},
 pages:[pg('Home','index',[nav('Gikomba Gold','Shop drop','left','page:shop'),hero('collage','DROPS EVERY THURSDAY · 7PM','Gikomba finds, picked by people with taste','We open the bales at dawn, keep the best 4% and wash, mend and photograph every piece. Denim from KSh 800.','Shop this drop','Follow on Instagram',[A('shop',1471),A('gift',1472),A('scissors',1473)],'bg'),
  cards('grid','THIS DROP','Pieces you will not find twice','',[[A('shop',1474),'90s denim jackets','KSh 1,800'],[A('scissors',1475),'Silk shirts','KSh 1,200'],[A('gift',1476),'Leather belts','KSh 600']]),
  stats([['4%','Of each bale kept'],['2,800','Pieces sold'],['100%','Washed and mended'],['0','Plastic bags']],'dark'),
  steps('HOW IT WORKS','From bale to your door',[['Hunt','Dawn at the Gikomba bale market.'],['Fix','Washed, mended, ironed.'],['Drop','Live on Thursday at 7pm.'],['Deliver','Nairobi same day, rest of Kenya 2 days.']],'alt'),
  quotes('Customers',[['My favourite jacket ever, KSh 1,500.','Brenda A.','Student, Nairobi'],['Fits like it was tailored.','Collins M.','Designer']]),
  footer('Gikomba Gold','Shop at 4th Street, Eastleigh, Nairobi.')]),
  pg('Shop','shop',[nav('Gikomba Gold','Shop drop','left','page:shop'),menu('Pay and delivery','Pay with M-Pesa on order. Returns within 48 hours.',[['Denim jackets','Sizes S to XL','KSh 1,800'],['Silk shirts','Assorted colours','KSh 1,200'],['Leather belts','Handmade','KSh 600'],['Nairobi delivery','Same day by boda','KSh 250']]),contact('Order by message','Send the item name and your area.','shop@gikombagold.example','+254 700 660 770','4th Street, Eastleigh, Nairobi','Order'),footer('Gikomba Gold','Shop at 4th Street, Eastleigh, Nairobi.')])]});

addBespoke({id:'tyre-shop-mombasa-rd',g:'Auto',tag:'Tyre shop',name:'Rubber Road Tyres',kw:'tyres wheel alignment balancing garage mombasa road',desc:'Tyres, alignment and balancing along Mombasa Road.',
 th:{p:'#ffc300',p2:'#ff5733',p3:'#3a3a3a',bg:'#f2f2f0',alt:'#e0e0dc',tx:'#1b1b1b',dark:false,head:'Archivo Black',body:'Rubik',radius:4},
 pages:[pg('Home','index',[nav('RUBBER ROAD TYRES','Get a price','left','page:contact'),hero('center','MOMBASA ROAD · SOUTH B · OPEN 7AM–8PM','Four new tyres fitted in 45 minutes','Bridgestone, Michelin, Dunlop and honest second-hand sets, with free balancing and a 6-month puncture promise.','Get a price','Call now',[],'bg'),
  price('POPULAR SIZES','Fitted prices','Includes fitting, valves and balancing.',[['195/65 R15','KSh 9,800','','Each, new'],['205/55 R16','KSh 12,500','','Each, new',1],['265/65 R17 SUV','KSh 21,000','','Each, new']],'alt'),
  feats('SERVICES','Everything under one roof',' ',[['🛞','Alignment','Laser alignment from KSh 2,000.'],['⚖️','Balancing','Included with every new tyre.'],['🔩','Puncture repair','KSh 300 and done in 10 minutes.']],'cards'),
  stats([['25 yrs','On Mombasa Road'],['45 min','For four tyres'],['6 mo','Puncture promise'],['300+','Cars a week']],'dark'),
  quotes('Drivers',[['Fast, fair and no surprise charges.','Hassan Y.','Uber driver'],['They sold me used tyres and told me to come back in a year.','Mercy L.','Customer']],'alt'),
  footer('Rubber Road Tyres','Mombasa Road, opposite Capital Centre, Nairobi.')]),
  pg('Prices','contact',[nav('RUBBER ROAD TYRES','Get a price','left'),contact('Get a price','Send your tyre size from the sidewall.','tyres@rubberroad.example','+254 733 515 515','Mombasa Road, opposite Capital Centre','Send size'),footer('Rubber Road Tyres','Mombasa Road, opposite Capital Centre, Nairobi.')])]});

addBespoke({id:'ngoma-drum-school',g:'Music',tag:'Drum school',name:'Ngoma Rhythm House',kw:'drums percussion djembe ngoma lessons kampala',desc:'Learn traditional and modern drumming in Kampala.',
 th:{p:'#7b2d26',p2:'#f2a65a',p3:'#264027',bg:'#f8efe2',alt:'#ecd9bc',tx:'#2e1a14',dark:false,head:'Young Serif',body:'Karla',radius:50,deco:true},
 pages:[pg('Home','index',[nav('Ngoma Rhythm House','Join a class','center'),hero('arch','NAMIREMBE · KAMPALA','Feel the Buganda drum in your chest','Learn ngoma, djembe and cajón with musicians who have played the royal court and the Kampala jazz clubs.','Join a class','Hear a class',[A('music',1481)],'bg'),
  cards('overlay','INSTRUMENTS','Choose your drum','',[[A('music',1482),'Engalabi','Long drum of the Buganda kingdom.'],[A('circles',1483),'Djembe','West African hand drum, great for groups.'],[A('stones',1484),'Cajón','Sit on it and play. Perfect for guitar bands.']],'alt'),
  split('right','THE TEACHERS','Rhythm passed hand to hand','Master drummer Mukasa learned from his grandfather in Bulange. He teaches the old patterns without notation: you listen, you copy, you play.','About Mukasa',A('person',1485)),
  price('CLASSES','Fees','Drums provided in class.',[['Group','UGX 120,000','/month','Saturday 3pm\n8 students max'],['Private','UGX 60,000','/lesson','One hour\nBring a friend free',1],['School visit','UGX 400,000','','Workshop for 40 pupils']],'alt'),
  quotes('Students',[['I came for a hobby and now I play weddings.','Deborah N.','Student'],['My son stopped being shy.','Mr Kizito','Parent']]),
  footer('Ngoma Rhythm House','Namirembe Hill Road, Kampala.')]),
  pg('Join','contact',[nav('Ngoma Rhythm House','Join a class','center'),contact('Join a class','First class is free. Come and listen.','drums@ngomahouse.example','+256 752 600 700','Namirembe Hill Road, Kampala','Reserve a seat'),footer('Ngoma Rhythm House','Namirembe Hill Road, Kampala.')])]});

addBespoke({id:'self-storage-westlands',g:'Business',tag:'Self-storage',name:'Hifadhi Storage',kw:'self storage units warehouse containers nairobi moving',desc:'Clean, locked storage units in Nairobi from KSh 4,000 a month.',
 th:{p:'#00a6a6',p2:'#ef476f',p3:'#073b4c',bg:'#ffffff',alt:'#eef5f6',tx:'#073b4c',dark:false,head:'Sora',body:'Manrope',radius:16,grad:true},
 pages:[pg('Home','index',[nav('Hifadhi Storage','Reserve a unit','left'),hero('split','WESTLANDS · EMBAKASI · KAREN','Room for what you cannot fit at home','Private units from a locker to a garage, with 24-hour cameras, a guard and your own padlock. No deposit, month to month.','Reserve a unit','See sizes',[A('house',1491)],'bg'),
  price('SIZES','Pick a unit','Prices per month, VAT included.',[['Locker 1 m²','KSh 4,000','','Boxes, a bike, documents'],['Room 6 m²','KSh 14,500','','One-bedroom flat',1],['Garage 15 m²','KSh 32,000','','Three-bedroom house']],'alt'),
  feats('WHY HIFADHI','Safe, dry, easy',' ',[['🔒','Your own lock','Only you hold the key.'],['📹','24-hour cameras','And a guard on every gate.'],['🚚','Free trolleys','Drive right up to the door.']],'cards'),
  steps('MOVING IN','Easy as 1, 2, 3',[['Choose','Select a size online.'],['Pay','M-Pesa or card.'],['Move','Collect your key the same day.']],'alt'),
  gal('grid','Inside',[A('house',1492),A('grid',1493),A('port',1494),A('lamp',1495)]),
  faq('FAQ',[['Minimum rental?','One month.'],['Can I store a car?','Yes, in the garage-size units.'],['Is there a late fee?','A 5-day grace period, then 5%.']],'alt'),
  footer('Hifadhi Storage','Mogadishu Road, Embakasi, Nairobi.')]),
  pg('Reserve','contact',[nav('Hifadhi Storage','Reserve a unit','left'),contact('Reserve a unit','Pick the branch and size you prefer.','units@hifadhi.example','+254 790 220 020','Mogadishu Road, Embakasi, Nairobi','Reserve'),footer('Hifadhi Storage','Mogadishu Road, Embakasi, Nairobi.')])]});

}
