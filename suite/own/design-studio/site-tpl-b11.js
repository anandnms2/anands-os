/* Batch 11: 20 hand-designed website templates. */
{const {nav,hero,feats,split,gal,stats,quotes,price,faq,cta,contact,footer,team,cards,menu,steps,text,logos,blog,wa,pg}=B_,A=a_;

addBespoke({id:'camel-milk-isiolo',g:'Food',tag:'Camel milk',name:'Ngamia Fresh',kw:'camel milk isiolo garissa dairy pastoralist chilled',desc:'Chilled camel milk and suusac from pastoralist herders around Isiolo.',
 th:{p:'#b5651d',p2:'#f2c879',p3:'#3f6b73',bg:'#fff8ec',alt:'#f6e4c5',tx:'#3b2412',dark:false,head:'Fraunces',body:'Lexend',radius:10,pop:false,deco:true},
 pages:[pg('Home','index',[nav('Ngamia Fresh','Order a crate','left'),hero('cover','ISIOLO · MERTI ROAD','Milk from the herds that walk the north','Raw-chilled and pasteurised camel milk bought at fair prices from 60 Borana and Samburu herding families.','Order from Nairobi','How it travels',[A('savanna',1101)]),
  stats([['60','Herding families paid weekly'],['6 hrs','Milking to cold room'],['Ksh 250','Per litre, delivered'],['0','Additives, ever']],'alt'),
  split('left','WHY CAMEL','Low in lactose, high in iron and vitamin C','Many customers who struggle with cow milk drink it without trouble. We never claim it cures anything, we just keep it cold and honest.','Read the lab sheet',A('hills',1102)),
  cards('grid','THE RANGE','Three things from one animal','',[[A('cup',1103),'Fresh milk','1 litre bottle, Ksh 250. Pasteurised at 72C.'],[A('stones',1104),'Suusac','Smoked fermented milk, Ksh 300 per 500 ml.'],[A('circles',1105),'Camel milk soap','Ksh 450 a bar, made in Isiolo by a women group.']],'bg'),
  steps('FROM DUNE TO DOORSTEP','The cold chain',[['Dawn milking','Women herders milk into steel cans.'],['Cooler truck','Collected by 9am, 4C all the way.'],['Nairobi hubs','Pick up at Lavington, Kilimani or Rongai.']],'alt'),
  faq('Questions',[['Is it safe raw?','We only sell pasteurised, the raw-chilled line is for customers who sign a waiver.'],['How long does it keep?','Seven days unopened in a fridge.'],['Do you deliver outside Nairobi?','Nanyuki and Nakuru on Thursdays.']]),
  footer('Ngamia Fresh','Isiolo town, Kenya.')]),
  pg('Contact','contact',[nav('Ngamia Fresh','Order a crate','left'),contact('Order or visit','Weekly crates close on Tuesday at 6pm.','hello@ngamia.example','+254 722 410 118','Merti Road, Isiolo','Place order'),footer('Ngamia Fresh','Isiolo town, Kenya.')])]});

addBespoke({id:'tuktuk-stonetown',g:'Travel',tag:'Tuk-tuk tours',name:'Pweza Tuk-Tuk Tours',kw:'zanzibar stone town tuk tuk tour spice forodhani',desc:'Painted tuk-tuk tours through Stone Town, markets and spice farms in Zanzibar.',
 th:{p:'#ff3d7f',p2:'#ffe14d',p3:'#16b8a6',bg:'#fff9ec',alt:'#d9f4ef',tx:'#1d1630',dark:false,head:'Bricolage Grotesque',body:'Outfit',radius:22,pop:true,grad:true,deco:true},
 pages:[pg('Home','index',[nav('Pweza Tuk-Tuk','Book a ride','center'),hero('collage','STONE TOWN · ZANZIBAR','Three wheels, one octopus, zero traffic stress','We paint our tuk-tuks in neon and take you through Darajani market, Forodhani and the spice farms with a guide who grew up in Mji Mkongwe.','Book a tour','See routes',[A('road',1111),A('city',1112),A('fruit',1113)]),
  cards('overlay','ROUTES','Pick your loop','',[[A('city',1114),'Old Town in 2 hours','US$ 35 each. Doors, Sultan palace, Freddie Mercury house.'],[A('fruit',1115),'Spice farm day','US$ 55. Cloves, vanilla, lunch under a mango tree.'],[A('waves',1116),'Sunset to Forodhani','US$ 25. Ends with seafood skewers on us.']],'bg'),
  quotes('Riders say',[['Our driver Juma knew every shopkeeper. We got a free coconut at three stops.','Lena K.','Berlin'],['Loud, fun, and the kids refused to get out.','Amit P.','Mumbai']],'alt'),
  split('archleft','THE TUK-TUKS','Each one is painted by a different local artist','Seven vehicles, seven artists, from Swahili proverbs to a giant octopus. Rides are priced per tuk-tuk for up to four.','Meet the fleet',A('paint',1117)),
  gal('strip','Fresh from the road',[A('road',1118),A('paint',1119),A('city',1120),A('beach',1121)],'bg'),
  cta('Cruise ships dock on Tuesdays and Fridays','Book ahead and we will be at the port gate with a sign.','Reserve a driver'),footer('Pweza Tuk-Tuk Tours','Mizingani Road, Stone Town.')]),
  pg('Contact','contact',[nav('Pweza Tuk-Tuk','Book a ride','center'),contact('Tell us your day','Pickup from hotels in Stone Town, Nungwi and Paje.','ride@pweza.example','+255 777 410 223','Mizingani Road, Stone Town','Ask for a ride'),footer('Pweza Tuk-Tuk Tours','Mizingani Road, Stone Town.')])]});

addBespoke({id:'maternity-clinic',g:'Health',tag:'Maternity clinic',name:'Mama Afya Maternity',kw:'maternity clinic antenatal delivery midwife nairobi kasarani',desc:'Midwife-led antenatal care and delivery in Kasarani, Nairobi.',
 th:{p:'#d46a8a',p2:'#f3b6a4',p3:'#5a8f8a',bg:'#fffafa',alt:'#fbe9ec',tx:'#3d2231',dark:false,head:'Young Serif',body:'Figtree',radius:24,pop:false,deco:true},
 pages:[pg('Home','index',[nav('Mama Afya','Book antenatal','center'),hero('split','KASARANI · NAIROBI','Nine months of care by people who know your name','Midwife-led antenatal visits, a quiet delivery suite with a birthing pool, and a nurse who calls you after discharge.','Book first visit','Tour the suite',[A('heart',1121)],'alt'),
  feats('WHAT WE DO','Care from the first scan to the sixth week','',[['heart','Antenatal care','Monthly then fortnightly visits, with scans on site.'],['house','Birth suite','Two private rooms, a birthing pool and a family bed.'],['person','Postnatal home visits','A midwife at your door on days 3, 7 and 14.']],'cards','bg'),
  split('right','THE TEAM','Six midwives, two obstetricians on call','Sister Rose Achieng has delivered over 2,000 babies. Our obstetricians are at the clinic within 20 minutes at any hour.','Meet the team',A('person',1122)),
  price('PACKAGES','Clear prices before you start','All packages include SHA and private cover claims.',[['Antenatal only','Ksh 28,000','','8 visits\n2 scans\nBlood tests']  ,['Normal delivery','Ksh 95,000','','Antenatal care\n2-night stay\nBaby check',1],['C-section','Ksh 180,000','','Theatre and surgeon\n4-night stay\nHome visits']],'alt'),
  quotes('Mothers say',[['I felt heard for the first time in a clinic.','Wambui N.','Mum of two'],['They let my husband catch the baby.','Faith O.','First-time mum']],'bg'),
  faq('Before you book',[['Do you accept insurance?','Yes: SHA, Jubilee, AAR and Madison.'],['Is there parking?','Free, with a guard day and night.']],'alt'),
  footer('Mama Afya Maternity','Thika Road, Kasarani, Nairobi.')]),
  pg('Contact','contact',[nav('Mama Afya','Book antenatal','center'),contact('Book or ask a midwife','We answer calls 24 hours.','care@mamaafya.example','+254 733 410 662','Thika Road, Kasarani, Nairobi','Request a call'),footer('Mama Afya Maternity','Thika Road, Kasarani, Nairobi.')])]});

addBespoke({id:'paragliding-kerio',g:'Sport',tag:'Paragliding',name:'Kerio Sky Wings',kw:'paragliding tandem flights kerio valley elgeyo escarpment iten',desc:'Tandem paragliding off the Elgeyo escarpment above the Kerio Valley.',
 th:{p:'#ff6a1a',p2:'#ffe94a',p3:'#37c9ef',bg:'#0b1d2e',alt:'#12304a',tx:'#eaf6ff',dark:true,head:'Unbounded',body:'Sora',radius:6,pop:true,grad:true,deco:false},
 pages:[pg('Home','index',[nav('KERIO SKY','Fly tandem','left','page:fly'),hero('cover','ELGEYO ESCARPMENT · 2,400 M','Step off. The valley does the rest.','Tandem flights with KPA-certified pilots over the Kerio Valley, 1,200 metres of air under your boots.','Book a flight','Watch a launch',[A('mountain',1131)]),
  stats([['1,200 m','Vertical drop'],['25 min','Average flight'],['3,400+','Flights since 2018'],['0','Serious incidents']],'primary'),
  steps('YOUR DAY','From car park to canyon',[['Briefing','Weather check at 8am, 15 minutes of ground practice.'],['Launch','Three steps, then you are airborne.'],['Landing','Soft landing at Tot, tea and your GoPro files.']],'bg'),
  gal('mosaic','Seen from above',[A('mountain',1132),A('hills',1133),A('savanna',1134),A('field',1135)],'alt'),
  price('FLIGHTS','Pick your height','Prices per person, includes transport from Iten.',[['Scenic','Ksh 9,500','','15 minute flight\nPhotos included'],['Classic','Ksh 14,000','','25 minute flight\nVideo included',1],['Thermal','Ksh 22,000','','45 minutes chasing thermals\nPilot choice']],'bg'),
  faq('Safety, plainly',[['What weight limits?','Between 40 and 110 kg.'],['What if the wind is wrong?','We reschedule free, or refund in full.'],['Can I fly with a bad knee?','Ask us first. Landings are soft but not zero impact.']],'alt'),
  footer('Kerio Sky Wings','Kapsowar Road, Iten.')]),
  pg('Fly','fly',[nav('KERIO SKY','Fly tandem','left','page:fly'),contact('Hold a flight date','Flying season runs November to March, mornings are best.','fly@keriosky.example','+254 700 220 884','Kapsowar Road, Iten','Hold my date'),footer('Kerio Sky Wings','Kapsowar Road, Iten.')])]});

addBespoke({id:'vanilla-uganda',g:'Farm',tag:'Vanilla exporter',name:'Mabira Vanilla Co.',kw:'vanilla beans uganda mukono export cured farmers',desc:'Hand-pollinated, sun-cured vanilla beans from smallholders near Mukono.',
 th:{p:'#3b2a1a',p2:'#c8a15a',p3:'#7a8f4a',bg:'#f6efe0',alt:'#e9dcc0',tx:'#2a1e12',dark:false,head:'Bodoni Moda',body:'DM Mono',radius:0,pop:false,deco:false},
 pages:[pg('Home','index',[nav('MABIRA VANILLA','Request samples','center'),hero('center','MUKONO · UGANDA','Every flower is pollinated by hand, in a four-hour window','We pay 380 smallholders for green pods and cure them slowly for 5 months: killing, sweating, drying, conditioning.','Request samples','Download spec sheet',[A('leaf',1141)]),
  text('OUR CURING','Five months from pod to bean','Green beans are blanched at 63C, sweated in wool-lined boxes for a week, sun-dried on racks for six hours a day and conditioned in sealed tins. The result: 1.6% vanillin, 28 to 32% moisture, no sulphites.','narrow','alt'),
  cards('grid','GRADES','Three cuts, three buyers','',[[A('stones',1142),'Grade A gourmet','16–20 cm, oily and pliable. US$ 380 per kg FOB.'],[A('leaf',1143),'Grade B extraction','12–16 cm, drier. US$ 190 per kg FOB.'],[A('circles',1144),'Cuts and powder','For baking and brands. US$ 120 per kg.']],'bg'),
  split('right','FAIR PAY','Farmers get 62% of the FOB price','Prices are posted every Monday at the Mukono buying shed and paid by MTN MoMo within the day.','See our price board',A('field',1145),'alt'),
  logos('Shipped to',['Hamburg · Kaffeehaus Nord','Brussels · Maison Fève','Toronto · Dufflet','Dubai · Spice Souk Co.'],'bg'),
  stats([['380','Partner farmers'],['4.2 t','Cured last season'],['8','Countries'],['Org.','Certified']],'primary'),
  footer('Mabira Vanilla Co.','Kasawo Road, Mukono, Uganda.')]),
  pg('Contact','contact',[nav('MABIRA VANILLA','Request samples','center'),contact('Request a 50 g sample','Sample packs ship by DHL within 3 days.','trade@mabiravanilla.example','+256 772 410 905','Kasawo Road, Mukono','Request pack'),footer('Mabira Vanilla Co.','Kasawo Road, Mukono, Uganda.')])]});

addBespoke({id:'remit-app',g:'Tech',tag:'Remittance app',name:'Tuma Cross',kw:'remittance money transfer app diaspora mpesa uk usa send money kenya',desc:'Send money from the UK and US to M-Pesa in seconds, with flat fees.',
 th:{p:'#00c27a',p2:'#7ff0c0',p3:'#ffb020',bg:'#071a14',alt:'#0d2a21',tx:'#e6fff5',dark:true,head:'Manrope',body:'Manrope',radius:16,pop:true,grad:true,deco:false},
 pages:[pg('Home','index',[nav('tuma/cross','Get the app','left'),hero('split','LONDON → NAIROBI · 14 SECONDS','Send £100. Mama gets Ksh 16,380. No surprises.','Flat £1.99 fee and the mid-market rate. Pay by card or bank transfer, money lands in M-Pesa, Airtel or any Kenyan bank.','Send money','See the rate',[A('phone',1151)]),
  stats([['£1.99','Flat fee'],['14 sec','Median delivery'],['0.4%','Over mid-market rate'],['280k','Families served']],'primary'),
  feats('HOW IT WORKS','Four taps and done','',[['phone','Pick a recipient','Save mum, rent, school fees.'],['bars','Lock the rate','The rate you see is the rate you get, for 30 minutes.'],['heart','Instant notification','Your family gets an SMS in Swahili or English.']],'steps','bg'),
  cards('grid','OTHER ROUTES','We also send to','',[[A('city',1152),'Kampala','MTN MoMo and Airtel Money.'],[A('beach',1153),'Dar es Salaam','M-Pesa Tanzania and CRDB.'],[A('hills',1154),'Kigali','MoMo and Bank of Kigali.']],'alt'),
  quotes('Customers',[['Used to cost me £12 each time. Now it is under £2.','Kevin M.','Nurse, Leeds'],['My brother in Eldoret gets it before I put my phone down.','Anita W.','Student, Boston']],'bg'),
  faq('Fine print, readable',[['Is it regulated?','FCA authorised in the UK and a licensed money service business in the US.'],['Limits?','£5,000 per transfer after ID checks.']],'alt'),
  footer('Tuma Cross','Authorised by the FCA. Registered office: 41 Brick Lane, London.')]),
  pg('Contact','contact',[nav('tuma/cross','Get the app','left'),contact('Talk to a human','Support lines open 7 days from 7am to 11pm EAT.','help@tumacross.example','+44 20 7946 0412','Brick Lane, London E1','Send message'),footer('Tuma Cross','Authorised by the FCA. Registered office: 41 Brick Lane, London.')])]});

addBespoke({id:'tanzanite-gems',g:'Retail',tag:'Gemstone dealer',name:'Merelani Gem House',kw:'tanzanite gemstones arusha jewellery rough cut certificate',desc:'Certified tanzanite and tsavorite from Arusha, sold loose and set.',
 th:{p:'#8b7bff',p2:'#c7b6ff',p3:'#d4a853',bg:'#0e0b24',alt:'#171340',tx:'#efeaff',dark:true,head:'Gloock',body:'Figtree',radius:2,pop:false,deco:true},
 pages:[pg('Home','index',[nav('Merelani Gem House','Enquire','center'),hero('arch','ARUSHA · SINCE 1998','Blue-violet from a single hillside on earth','Tanzanite is mined only at Merelani, 70 km from Arusha. We buy from licensed miners and cut every stone in our own workshop.','See loose stones','Book a viewing',[A('diamond',1161)]),
  gal('masonry','In the vault',[A('diamond',1162),A('stones',1163),A('circles',1164),A('diamond',1165),A('bloom',1166)],'alt'),
  split('left','THE FOUR Cs, PLAINLY','Color first, then everything else','AAA tanzanite shows deep blue with violet flashes. We grade under D65 light and give you a lab report for every stone over 1 carat.','Read our grading guide',A('stones',1167)),
  cards('grid','CATEGORIES','What we keep in stock','',[[A('diamond',1168),'Loose tanzanite','From US$ 300 per carat for AAA.'],[A('circles',1169),'Tsavorite garnet','Green, rarer than emerald, from US$ 900 a carat.'],[A('heart',1170),'Rings and pendants','Set in 18k gold by our Arusha goldsmith.']],'bg'),
  steps('BUYING','From inquiry to pickup',[['Send a budget','And a shape you love.'],['Receive a video','Three stones under real light.'],['Pay and insure','Shipped insured via DHL or collect at the shop.']],'alt'),
  quotes('Clients',[['The stone was better than the photo, which never happens.','Marcus T.','Texas'],['They reset my grandmother ring in a week.','Zawadi M.','Arusha']],'bg'),
  footer('Merelani Gem House','Sokoine Road, Arusha.')]),
  pg('Contact','contact',[nav('Merelani Gem House','Enquire','center'),contact('Request a private viewing','By appointment, Monday to Saturday.','gems@merelani.example','+255 754 410 301','Sokoine Road, Arusha','Request viewing'),footer('Merelani Gem House','Sokoine Road, Arusha.')])]});

addBespoke({id:'cctv-installer',g:'Services',tag:'CCTV installer',name:'EagleEye Security Systems',kw:'cctv camera installation alarm electric fence nairobi mombasa',desc:'CCTV, alarm and electric fence installation for homes and shops across Nairobi.',
 th:{p:'#0057d9',p2:'#ffcc00',p3:'#22c55e',bg:'#f4f6fa',alt:'#e1e8f5',tx:'#0f1b33',dark:false,head:'Archivo Black',body:'Rubik',radius:4,pop:false,deco:false},
 pages:[pg('Home','index',[nav('EAGLEEYE','Free site survey','left'),hero('split','NAIROBI · KIAMBU · MACHAKOS','See your shop from your phone, wherever you are','Four-camera HD kits installed in one day, with night vision and alerts straight to WhatsApp.','Book a free survey','See packages',[A('grid',1171)]),
  logos('Protecting',['Naivas Ruaka','Kileleshwa Gardens','Ngong Racecourse Bakery','Thindigua Estates'],'alt'),
  price('KITS','Fixed prices, installation included','Prices include cabling, 1 TB storage and a year of support.',[['Home 4','Ksh 38,000','','4 x 2MP cameras\nPhone app\nNight vision'],['Shop 8','Ksh 69,000','','8 x 5MP cameras\n2 TB storage\nAlarm panel',1],['Estate pro','Ksh 145,000+','','16 cameras\nPlate recognition\nControl room link']],'bg'),
  feats('ALSO FITTED','Not just cameras','',[['lamp','Electric fence','From Ksh 1,300 per metre, energiser included.'],['house','Alarm panels','Siren plus guard response in 8 minutes.'],['bars','Access control','Fingerprint and card readers for offices.']],'cards','alt'),
  split('right','WHY US','Technicians, not subcontractors','Every installer is on our payroll, KRA registered and wearing an ID. Warranty is in writing.','See our certificates',A('person',1172)),
  faq('Common questions',[['How long does install take?','4-camera kits: one day. Estates: 3 to 5.'],['What if the power goes?','Every kit has a UPS good for 4 hours.']],'bg'),
  footer('EagleEye Security Systems','Ngong Road, Nairobi.')]),
  pg('Contact','contact',[nav('EAGLEEYE','Free site survey','left'),contact('Book a free site survey','We come with a laptop and a tape measure.','survey@eagleeye.example','+254 711 880 192','Ngong Road, Nairobi','Book survey'),footer('EagleEye Security Systems','Ngong Road, Nairobi.')])]});

addBespoke({id:'zanzibar-doors',g:'Craft',tag:'Carved doors',name:'Mlango wa Zanzibar',kw:'zanzibar carved door woodworking mahogany swahili craft stone town',desc:'Hand-carved Zanzibar doors and chests, made in Stone Town workshops.',
 th:{p:'#6b3a1e',p2:'#d9a441',p3:'#2f5d4d',bg:'#f3e6cf',alt:'#e6d1ab',tx:'#2c180c',dark:false,head:'Libre Caslon Text',body:'Instrument Serif',radius:0,pop:false,deco:true},
 pages:[pg('Home','index',[nav('Mlango wa Zanzibar','Commission a door','center'),hero('arch','STONE TOWN · SINCE 1962','A door says who lives behind it','Three generations of the Hamad family carve doors in teak and mahogany, with brass studs and the Quranic verses or lotus borders you choose.','Commission a door','Visit the workshop',[A('columns',1181)]),
  split('left','THE CARVING','One door, ten weeks, two carvers','Chiselled by hand from Indian teak or local mninga. No machines touch the face of the door.','See the tools',A('frame',1182),'alt'),
  gal('grid','Doors we have made',[A('frame',1183),A('columns',1184),A('stones',1185),A('house',1186)],'bg'),
  price('PRICES','What a door costs','Shipped worldwide in a crate, with customs paper.',[['Chest or panel','US$ 650','','Carved lotus border\nFifty cm square'],['Standard door','US$ 2,400','','Single leaf 200 x 90 cm\nBrass studs',1],['Double door','US$ 4,900','','Full courtyard pair\nIron hinges']],'alt'),
  quotes('Owners',[['Our guests photograph it before they ring the bell.','Hilda G.','Lamu guesthouse'],['It arrived in Toronto without a scratch.','Peter S.','Toronto']],'bg'),
  footer('Mlango wa Zanzibar','Kiponda Street, Stone Town.')]),
  pg('Contact','contact',[nav('Mlango wa Zanzibar','Commission a door','center'),contact('Commission a piece','Send your doorway size and the style you like.','hamad@mlango.example','+255 777 128 440','Kiponda Street, Stone Town','Send request'),footer('Mlango wa Zanzibar','Kiponda Street, Stone Town.')])]});

addBespoke({id:'cricket-club',g:'Sport',tag:'Cricket club',name:'Ruaraka Cricket Club',kw:'cricket club nairobi nets youth league ruaraka',desc:'Nairobi cricket club with Saturday league, colts nets and a clubhouse bar.',
 th:{p:'#1a3d8f',p2:'#e8c547',p3:'#c8102e',bg:'#faf8f1',alt:'#e9eef9',tx:'#0e1b3a',dark:false,head:'DM Serif Display',body:'Lexend',radius:4,pop:false,deco:false},
 pages:[pg('Home','index',[nav('Ruaraka CC','Join the club','left','page:join'),hero('cover','EST. 1961 · NAIROBI','Saturdays belong to the square','Two senior sides in the Nairobi Premier League, Colts nets on Tuesdays and Thursdays and a bar that closes when the last over does.','Join the club','Fixtures',[A('field',1191)]),
  stats([['3','Senior XIs'],['140','Colts under 16'],['6','League titles'],['Ksh 8,000','Annual senior fee']],'primary'),
  cards('grid','THE CLUB','Three ways to play','',[[A('person',1192),'Senior league','Saturday and Sunday, 40-over matches.'],[A('field',1193),'Colts','Ages 7 to 16, Tuesday and Thursday 4:30pm.'],[A('heart',1194),'Social cricket','Friday evening beer and nets, no commitments.']],'bg'),
  split('right','THE GROUND','A square groundsman Peter has prepared for 22 years','Six wickets, a covered scorers box and floodlights for the T20 Friday series.','Hire the pavilion',A('hills',1195),'alt'),
  quotes('Members',[['I came to bowl and stayed for the samosas.','Nikhil S.','Opening bowler'],['My daughter plays for the Colts under 12.','Jane K.','Parent']],'bg'),
  faq('Joining',[['Do I need my own kit?','Helmets and pads are shared, bring whites for matches.'],['Do you have women side?','Yes: Tuesday training and a league side.']],'alt'),
  footer('Ruaraka Cricket Club','Outer Ring Road, Ruaraka, Nairobi.')]),
  pg('Join','join',[nav('Ruaraka CC','Join the club','left','page:join'),contact('Join Ruaraka CC','Come to a net session, no booking needed.','secretary@ruarakacc.example','+254 722 604 410','Outer Ring Road, Ruaraka, Nairobi','Send details'),footer('Ruaraka Cricket Club','Outer Ring Road, Ruaraka, Nairobi.')])]});

addBespoke({id:'agrovet-shop',g:'Farm',tag:'Agrovet shop',name:'Shamba Dawa Agrovet',kw:'agrovet farm inputs seeds fertilizer vet drugs animal feed meru',desc:'Seeds, fertilizer, vet drugs and advice for farmers in Meru and Tharaka.',
 th:{p:'#2f7d32',p2:'#f4b400',p3:'#8d5524',bg:'#fbfbf2',alt:'#e8f2d8',tx:'#1b2b17',dark:false,head:'Oswald',body:'Rubik',radius:8,pop:true,deco:false},
 pages:[pg('Home','index',[nav('SHAMBA DAWA','Ask an agronomist','left'),hero('collage','MERU TOWN · TIMAU ROAD','Everything for the shamba, with advice that is free','Certified seed, fertilizer, vet drugs and feed, plus a qualified agronomist on the counter from 7am.','Visit the shop','See price list',[A('field',1201),A('fruit',1202),A('paw',1203)]),
  cards('overlay','AISLES','What is on the shelves','',[[A('leaf',1204),'Seed','Certified maize, beans, kale and Hass avocado seedlings.'],[A('field',1205),'Fertilizer','DAP, CAN and foliar feed. 50kg from Ksh 3,900.'],[A('paw',1206),'Animal health','Dewormers, vaccines, dairy meal.']],'bg'),
  menu('PRICE BOARD','Updated every Monday',[['Maize seed H614, 2 kg','Kenya Seed','Ksh 650'],['DAP fertilizer, 50 kg','','Ksh 4,100'],['Dairy meal, 70 kg','Unga Farm Care','Ksh 2,850'],['Knapsack sprayer, 16 L','','Ksh 3,200']],'alt'),
  split('left','FREE ADVICE','Bring a leaf, leave with a plan','Agronomist Mary Gacheri reads soil tests, diagnoses pest damage from a photo and writes a spraying calendar for your acreage.','Send a photo',A('person',1207)),
  steps('PAY AT HARVEST','Credit for registered farmers',[['Register','ID and a delivery slip from your buyer.'],['Take inputs','Up to Ksh 40,000 worth.'],['Settle at harvest','Within 120 days, no interest.']],'bg'),
  wa('Ask on WhatsApp','Send a photo of the problem.','Message Mary','254722410770','Hello, I need advice about my crop.','alt'),
  footer('Shamba Dawa Agrovet','Timau Road, Meru.')]),
  pg('Contact','contact',[nav('SHAMBA DAWA','Ask an agronomist','left'),contact('Visit or call','Open Monday to Saturday, 7am to 6pm.','shop@shambadawa.example','+254 722 410 770','Timau Road, Meru','Send message'),footer('Shamba Dawa Agrovet','Timau Road, Meru.')])]});

addBespoke({id:'unga-miller',g:'Food',tag:'Maize miller',name:'Jembe Posho Mill',kw:'maize flour posho mill unga wholesale kitale grain',desc:'Kitale maize miller selling sifted flour to shops, schools and hotels.',
 th:{p:'#d49a00',p2:'#8a2d0b',p3:'#2e7d4f',bg:'#fffaf0',alt:'#f8e9bd',tx:'#2c1a05',dark:false,head:'Anton',body:'Figtree',radius:2,pop:false,deco:false},
 pages:[pg('Home','index',[nav('JEMBE POSHO','Wholesale prices','left'),hero('cover','KITALE · TRANS NZOIA','Maize from Trans Nzoia, milled the same week','Sifted and unsifted flour in 2, 5, 10 and 50 kg bags, with weights we will let you check on any scale.','Get prices','Visit the mill',[A('field',1211)]),
  stats([['40 t','Milled per day'],['120','Farmers we buy from'],['18 hr','Field to bag, max'],['0','Short-weighted bags']],'primary'),
  menu('WHOLESALE LIST','Prices per bag, Kitale gate',[['Jembe Sifted 2 kg x 12','','Ksh 1,380'],['Jembe Sifted 10 kg','','Ksh 1,190'],['Posho Dona 50 kg','','Ksh 4,800'],['Wimbi (millet) 2 kg x 12','','Ksh 1,560']],'alt'),
  split('left','BUYING','We pay farmers on delivery','Bring your maize to the gate, we test moisture and pay by M-Pesa before the lorry leaves.','See buying hours',A('field',1212)),
  feats('CUSTOMERS','Who we supply','',[['shop','Duka and supermarkets','Pallet delivery to Eldoret, Kakamega and Nakuru.'],['book','Schools','Termly contracts with fixed price.'],['plate','Hotels','Fine flour for ugali in 25kg sacks.']],'cards','bg'),
  faq('Trade questions',[['Minimum order?','Ten bags for local, a truck for upcountry.'],['KEBS marked?','Yes, certificate number on every bag.']],'alt'),
  footer('Jembe Posho Mill','Kitale-Webuye Road, Kitale.')]),
  pg('Contact','contact',[nav('JEMBE POSHO','Wholesale prices','left'),contact('Request a quote','Tell us the weight, the town and the days you receive.','sales@jembeposho.example','+254 720 311 480','Kitale-Webuye Road, Kitale','Request quote'),footer('Jembe Posho Mill','Kitale-Webuye Road, Kitale.')])]});

addBespoke({id:'school-bus-service',g:'Services',tag:'School bus',name:'Salama Kids Shuttle',kw:'school bus transport kids shuttle nairobi gps tracking parents',desc:'Safe, GPS-tracked school bus routes across Nairobi with a nurse on board.',
 th:{p:'#f9b200',p2:'#1d3f72',p3:'#e5484d',bg:'#fffdf4',alt:'#fff0c2',tx:'#1d2433',dark:false,head:'Baloo 2',body:'Lexend',radius:20,pop:true,grad:false,deco:true},
 pages:[pg('Home','index',[nav('Salama Kids','Reserve a seat','center','page:routes'),hero('split','NAIROBI WEST · SOUTH · EASTLANDS','Your child, on a bus you can watch','Yellow buses with seat belts, speed limiters and a live map in the parent app. A conductor greets every child by name.','See routes','Parent app demo',[A('car',1221)],'alt'),
  feats('SAFETY','Rules we never bend','',[['heart','Seat belt per child','Checked by the conductor at every stop.'],['person','Trained crew','Driver with PSV badge plus a first-aider.'],['road','Speed limited at 60','Alerts to our office if exceeded.']],'cards','bg'),
  stats([['62','Buses'],['2,300','Pupils daily'],['0','Missed drop-offs this year'],['24','Partner schools']],'primary'),
  split('right','THE APP','See the bus at the next corner','Parents get an alert when their child boards and 5 minutes before pickup.','Download the app',A('phone',1222)),
  price('FARES','Monthly, per child','Sibling discount 15%.',[['Zone A','Ksh 5,500','/month','Within 6 km of school'],['Zone B','Ksh 7,800','/month','6 to 15 km',1],['Zone C','Ksh 10,200','/month','Beyond 15 km']],'alt'),
  quotes('Parents',[['I stopped checking the clock at 4pm.','Judith A.','Kilimani'],['My son loves the conductor, Mr Otieno.','Hassan I.','Eastleigh']],'bg'),
  footer('Salama Kids Shuttle','Mombasa Road, Nairobi.')]),
  pg('Routes','routes',[nav('Salama Kids','Reserve a seat','center','page:routes'),contact('Check your route','Tell us the estate and school and we reply the same day.','routes@salamakids.example','+254 733 902 114','Mombasa Road, Nairobi','Check route'),footer('Salama Kids Shuttle','Mombasa Road, Nairobi.')])]});

addBespoke({id:'mwea-rice',g:'Farm',tag:'Rice co-operative',name:'Mwea Pishori Growers',kw:'mwea pishori rice irrigation scheme kirinyaga farmers wholesale',desc:'Aromatic Mwea Pishori rice from the irrigation scheme, sold direct.',
 th:{p:'#4c6b2a',p2:'#e6d18a',p3:'#b4532a',bg:'#f8f5ea',alt:'#ebe5c8',tx:'#23301a',dark:false,head:'Gloock',body:'Manrope',radius:14,pop:false,deco:true},
 pages:[pg('Home','index',[nav('Mwea Pishori','Buy direct','center'),hero('center','KIRINYAGA · MWEA SCHEME','The rice that smells like Sunday','Pishori grown in the volcanic soil of Mwea, harvested by 2,400 member farmers and milled in Wanguru.','Order a sack','Visit the paddies',[A('field',1231)]),
  split('left','THE GRAIN','Long, aromatic, slightly sticky','Pishori means fragrant in Swahili. Cooked with a few cloves it becomes pilau worthy of a wedding.','Recipes',A('plate',1232),'alt'),
  cards('grid','SIZES','From your kitchen to the hotel','',[[A('plate',1233),'2 kg','Ksh 460, for the home.'],[A('shop',1234),'10 kg','Ksh 2,150, the family bag.'],[A('road',1235),'50 kg','Ksh 10,200, for restaurants and chamas.']],'bg'),
  steps('GROWING','Four months of water',[['Nursery','Seeds sown in May.'],['Transplant','By hand into flooded paddies.'],['Harvest','Late September.'],['Mill','Dried to 13% before polishing.']],'alt'),
  stats([['2,400','Member farmers'],['9,000 t','Per season'],['Ksh 95','Paid per kg paddy'],['1969','Scheme founded']],'primary'),
  quotes('Cooks say',[['Best pilau rice in Nairobi, I buy it by the sack.','Mama Zainab','Caterer, Eastleigh']],'bg'),
  footer('Mwea Pishori Growers','Wanguru, Kirinyaga County.')]),
  pg('Contact','contact',[nav('Mwea Pishori','Buy direct','center'),contact('Order direct','Delivery to Nairobi every second Friday.','orders@mweapishori.example','+254 713 440 820','Wanguru, Kirinyaga County','Place order'),footer('Mwea Pishori Growers','Wanguru, Kirinyaga County.')])]});

addBespoke({id:'fire-safety',g:'Services',tag:'Fire safety',name:'Moto Stop Fire Safety',kw:'fire extinguisher fire safety training inspection certificates nairobi',desc:'Fire extinguisher servicing, alarms and safety training for Nairobi offices and factories.',
 th:{p:'#d92b1c',p2:'#1c1c1c',p3:'#ffb800',bg:'#ffffff',alt:'#f5f1ec',tx:'#161616',dark:false,head:'Anton',body:'Archivo Black',radius:0,pop:false,deco:false},
 pages:[pg('Home','index',[nav('MOTO STOP','Request inspection','left'),hero('cover','NAIROBI · ATHI RIVER · THIKA','If it burns, we have already planned for it','Extinguisher refills, alarm systems and DOSHS-recognised fire marshal training for factories, schools and offices.','Book an audit','Download checklist',[A('city',1241)]),
  feats('SERVICES','Four things we do every day','',[['lamp','Extinguishers','Supply, refill and annual tagging.'],['bars','Alarm systems','Addressable panels and sounders.'],['person','Marshal training','Half-day, certificates issued.'],['house','Evacuation plans','Floor maps with exits and muster points.']],'cards','alt'),
  stats([['1,100+','Buildings serviced'],['4 hr','Emergency refill, Nairobi'],['DOSHS','Approved contractor'],['18','Trained technicians']],'primary'),
  price('TRAINING','Marshal course','Per person, 20 or more at your premises.',[['Basic','Ksh 2,500','','Theory and extinguisher practice'],['Full marshal','Ksh 4,800','','Plus evacuation drill\nCertificate',1],['Annual contract','Ksh 95,000','','Inspect, refill and drill twice a year']],'bg'),
  faq('For facility managers',[['How often must we service?','Every 12 months, and recharge after any use.'],['Do you issue compliance reports?','Yes, ready for insurers and the county.']],'alt'),
  footer('Moto Stop Fire Safety','Enterprise Road, Industrial Area, Nairobi.')]),
  pg('Contact','contact',[nav('MOTO STOP','Request inspection','left'),contact('Book an audit','We reply within 2 working hours.','audit@motostop.example','+254 724 118 330','Enterprise Road, Industrial Area','Request audit'),footer('Moto Stop Fire Safety','Enterprise Road, Industrial Area, Nairobi.')])]});

addBespoke({id:'sign-painter',g:'Craft',tag:'Sign painter',name:'Rangi Signs & Murals',kw:'sign painter hand painted shop signs murals wall art nairobi',desc:'Hand-painted shop signs, murals and boda boda lettering in Nairobi.',
 th:{p:'#0b7a75',p2:'#ff9f1c',p3:'#e63946',bg:'#f6f1e7',alt:'#ffe7bd',tx:'#102a2a',dark:false,head:'Bricolage Grotesque',body:'DM Mono',radius:0,pop:true,deco:true},
 pages:[pg('Home','index',[nav('Rangi Signs','Get a quote','left'),hero('collage','GIKOMBA · NAIROBI','Painted by hand because machines cannot wobble on purpose','Shop fascias, matatu names, school murals and wedding banners lettered by Otieno and his three apprentices.','Get a quote','Our walls',[A('paint',1251),A('shop',1252),A('bloom',1253)]),
  gal('masonry','Walls and boards',[A('paint',1254),A('shop',1255),A('car',1256),A('city',1257),A('bloom',1258)],'alt'),
  menu('PRICE LIST','Typical jobs',[['Shop fascia (3m)','Lettering plus border','Ksh 7,500'],['Boda helmet or bike name','','Ksh 1,000'],['Wall mural, per sq metre','','Ksh 2,400'],['School wall (alphabet)','','Ksh 28,000']],'bg'),
  split('left','THE PROCESS','Chalk, then enamel, then clear coat','Weatherproof paint lasts at least five years on iron sheet and three on plaster.','See the process',A('paint',1259),'alt'),
  quotes('Clients',[['Our shop gets three more customers a day since the board.','Salim H.','Hardware, Kariobangi']],'bg'),
  cta('Booked for two weeks ahead','Send a photo of your wall and we reply with a price today.','Send a photo'),footer('Rangi Signs & Murals','Gikomba Market, Nairobi.')]),
  pg('Contact','contact',[nav('Rangi Signs','Get a quote','left'),contact('Send a photo of your wall','Measurements help, a sketch helps more.','rangi@rangisigns.example','+254 710 227 604','Gikomba Market, Nairobi','Send photo'),footer('Rangi Signs & Murals','Gikomba Market, Nairobi.')])]});

addBespoke({id:'kombucha-brewer',g:'Food',tag:'Kombucha brewer',name:'Chachu Kombucha',kw:'kombucha fermented tea probiotic drink nairobi kegs brewery',desc:'Small-batch kombucha brewed with Kericho tea and local fruit, in bottles and kegs.',
 th:{p:'#9bd53a',p2:'#ff7bac',p3:'#ffd23f',bg:'#14201b',alt:'#1d2f27',tx:'#f1ffe3',dark:true,head:'Syne',body:'Sora',radius:30,pop:true,grad:true,deco:false},
 pages:[pg('Home','index',[nav('chachu','Find a bottle','center'),hero('center','NGONG ROAD · LIVE CULTURE','Tea that grew up fizzy','Kericho black tea, a fourteen-day ferment and passion fruit from Kisii. Raw, unpasteurised and gone in a week at Karen farmers market.','Find a stockist','Taste the range',[A('fruit',1261)]),
  cards('overlay','FLAVOURS','Four on tap this month','',[[A('fruit',1262),'Passion & mint','Ksh 350 for 330 ml.'],[A('leaf',1263),'Ginger fire','Ksh 350. Not for the shy.'],[A('bloom',1264),'Hibiscus','Ksh 350. Sour and ruby red.']],'bg'),
  steps('THE BREW','Fourteen days',[['Brew tea','Single-estate Kericho.'],['First ferment','Eight days with the SCOBY.'],['Flavour','Fresh fruit, six more days.']],'alt'),
  stats([['14','Days per batch'],['<0.5%','Alcohol'],['38','Cafes on tap'],['120 L','Brewed weekly']],'primary'),
  split('right','KEGS','Put us on tap','Cafes get a 20-litre keg, a tap tower and a free fridge sticker. Keg rental Ksh 4,000, refill Ksh 6,500.','Wholesale sheet',A('cup',1265)),
  faq('Fizzy questions',[['Is it safe when pregnant?','Please ask your doctor.'],['Why is it cloudy?','Because it is alive.']],'alt'),
  footer('Chachu Kombucha','Ngong Road, Karen, Nairobi.')]),
  pg('Contact','contact',[nav('chachu','Find a bottle','center'),contact('Stockists and wholesale','Weekly deliveries on Tuesday and Friday.','brew@chachu.example','+254 790 410 233','Ngong Road, Karen','Send message'),footer('Chachu Kombucha','Ngong Road, Karen, Nairobi.')])]});

addBespoke({id:'newborn-photo',g:'Photography',tag:'Newborn photographer',name:'Little Light Studio',kw:'newborn photography baby portraits maternity shoot nairobi studio',desc:'Newborn, bump and first-year portraits in a calm Westlands studio.',
 th:{p:'#8fa5c4',p2:'#f2d7cf',p3:'#c4a77d',bg:'#fcf8f4',alt:'#f1ebe4',tx:'#38404f',dark:false,head:'Cormorant Garamond',body:'Figtree',radius:30,pop:false,deco:false},
 pages:[pg('Home','index',[nav('Little Light','Book a session','center'),hero('arch','WESTLANDS · NAIROBI','The first fortnight, kept forever','Gentle newborn sessions in a warm, quiet studio. We swaddle, we wait, and we never rush a sleeping baby.','Book your session','See the gallery',[A('heart',1271)]),
  gal('mosaic','From recent mornings',[A('heart',1272),A('bloom',1273),A('person',1274),A('lamp',1275)],'alt'),
  split('left','HOW WE WORK','Three hours, with feeding breaks','Sessions take place between day 5 and day 14. The studio is kept at 26 degrees and we bring blankets in your colours.','What to bring',A('lamp',1276)),
  price('SESSIONS','Simple packages','Ten edited images per session, delivered in a private gallery.',[['Bump','Ksh 12,000','','45 minutes\nOutfit changes\n5 images'],['Newborn','Ksh 24,000','','3 hours\nProps and family shots\n15 images',1],['First year','Ksh 55,000','','Three sessions\nNewborn, sitting, one year']],'bg'),
  quotes('Parents',[['We got a baby who slept through all of it.','Esther & Dan','Lavington'],['The siblings photo is on our wall.','Priya M.','Parklands']],'alt'),
  faq('Good to know',[['When should I book?','During your second trimester.'],['Is it safe for the baby?','Yes: parents stay in the room, and we never pose in unsafe ways.']],'bg'),
  footer('Little Light Studio','Mpaka Road, Westlands.')]),
  pg('Contact','contact',[nav('Little Light','Book a session','center'),contact('Reserve your session','Tell us the due date and we hold a two-week window.','hello@littlelight.example','+254 701 330 912','Mpaka Road, Westlands','Hold dates'),footer('Little Light Studio','Mpaka Road, Westlands.')])]});

addBespoke({id:'auction-house',g:'Retail',tag:'Auction house',name:'Kibo & Sons Auctioneers',kw:'auction house furniture antiques lots bidding nairobi valuation',desc:'Monthly auctions of art, furniture and estate lots at Kibo & Sons, Nairobi.',
 th:{p:'#7b1e2b',p2:'#b8923a',p3:'#26453a',bg:'#f7f2e9',alt:'#ece3d1',tx:'#231612',dark:false,head:'Libre Caslon Text',body:'Manrope',radius:0,pop:false,deco:false},
 pages:[pg('Home','index',[nav('KIBO & SONS','Consign a lot','left','page:consign'),hero('split','NAIROBI · EST. 1974','Next sale: Saturday 14 November, 11 am','Two hundred lots from the estates of Karen and Muthaiga: Persian rugs, Kamba carvings, Zanzibar chests and a 1962 Peugeot.','View the catalogue','Register to bid',[A('frame',1281)],'alt'),
  cards('grid','FEATURED LOTS','This month on the block','',[[A('frame',1282),'Lot 41 · Zanzibar chest','Est. Ksh 90,000 to 120,000'],[A('paint',1283),'Lot 77 · Gakunga oil','Est. Ksh 250,000 to 350,000'],[A('lamp',1284),'Lot 112 · Brass lamp pair','Est. Ksh 40,000 to 60,000']],'bg'),
  steps('BIDDING','Three ways to bid',[['In the room','Register with ID, collect a paddle.'],['By phone','A clerk calls you at the lot.'],['Online','Live stream with bidding from any phone.']],'alt'),
  split('right','SELLING','Free valuations on Tuesdays','Bring photos or the object. Commission is 12% for sellers, 15% buyer premium.','Book a valuation',A('stones',1285)),
  stats([['1,800','Lots sold last year'],['92%','Sell-through'],['Ksh 40M','Hammer total'],['3 days','Seller payout']],'primary'),
  faq('First time at an auction?',[['Do I pay a deposit?','Ksh 20,000 refundable, to register.'],['Can you ship?','Yes, we pack and ship worldwide.']],'bg'),
  footer('Kibo & Sons Auctioneers','Waiyaki Way, Westlands.')]),
  pg('Consign','consign',[nav('KIBO & SONS','Consign a lot','left','page:consign'),contact('Consign or ask a valuation','Send photos and any history you know.','valuations@kiboauction.example','+254 722 101 974','Waiyaki Way, Westlands','Send details'),footer('Kibo & Sons Auctioneers','Waiyaki Way, Westlands.')])]});

addBespoke({id:'container-homes',g:'Construction',tag:'Container homes',name:'Boxed Living Mombasa',kw:'shipping container homes offices modular builder mombasa kilifi',desc:'Shipping-container homes, offices and kiosks built in Mombasa and delivered anywhere.',
 th:{p:'#e5532d',p2:'#232b36',p3:'#5fd0c4',bg:'#eceff1',alt:'#dfe5e8',tx:'#1b232b',dark:false,head:'Space Mono',body:'Outfit',radius:0,pop:false,deco:false},
 pages:[pg('Home','index',[nav('BOXED/LIVING','Get a quote','left'),hero('cover','CHANGAMWE · MOMBASA','A home from a 40-foot box, in 12 weeks','We cut, insulate, plumb and wire used shipping containers in our yard, then crane them onto your plot.','See floor plans','Visit the yard',[A('house',1291)]),
  cards('grid','MODELS','Pick a starting box','',[[A('house',1292),'Studio 20ft','Ksh 1.6M. One room, bath and kitchenette.'],[A('house',1293),'Family 2x40','Ksh 5.4M. Three bedrooms, open living.'],[A('shop',1294),'Kiosk and office','From Ksh 750,000. Roller shutter included.']],'alt'),
  steps('BUILD','Twelve weeks, four milestones',[['Design','Floor plan and NCA approvals.'],['Cut and weld','Openings, frames, insulation.'],['Fit out','Floors, plumbing, wiring, paint.'],['Deliver','Crane and set on footings.']],'bg'),
  gal('strip','From the yard',[A('house',1295),A('city',1296),A('grid',1297),A('road',1298)],'alt'),
  split('left','COASTAL PROOF','Treated against salt and rust','Sandblasted, epoxy primed and painted with marine-grade coatings. Roofs are raised to keep interiors cool.','Read the spec',A('waves',1299),'bg'),
  price('PAYMENTS','Stage payments','Pay as the box takes shape.',[['Deposit','30%','','On signing'],['Mid-build','40%','','On fit-out start',1],['Delivery','30%','','On handover']],'alt'),
  footer('Boxed Living Mombasa','Changamwe Road, Mombasa.')]),
  pg('Contact','contact',[nav('BOXED/LIVING','Get a quote','left'),contact('Tell us about your plot','Location, use and a rough budget.','build@boxedliving.example','+254 705 440 118','Changamwe Road, Mombasa','Get quote'),footer('Boxed Living Mombasa','Changamwe Road, Mombasa.')])]});

}
