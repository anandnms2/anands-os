/* Batch 13: 20 hand-designed website templates. */
{const {nav,hero,feats,split,gal,stats,quotes,price,faq,cta,contact,footer,team,cards,menu,steps,text,logos,blog,wa,pg}=B_,A=a_;

addBespoke({id:'kayak-naivasha',g:'Sports',tag:'Lake kayak hire',name:'Hippo Point Paddles',kw:'kayak canoe lake naivasha paddle birds hire',desc:'Kayak and canoe hire on Lake Naivasha, with a guide who knows where the hippos sleep.',
 th:{p:'#0c8f8a',p2:'#ffb703',p3:'#fb5607',bg:'#f6fbfa',alt:'#d9f0ee',tx:'#0a2e33',dark:false,head:'Lexend',body:'Figtree',radius:24,pop:true},
 pages:[pg('Home','index',[nav('Hippo Point Paddles','Book a paddle','left'),hero('cover','LAKE NAIVASHA · CRESCENT ISLAND SIDE','Paddle slowly. The lake is not in a hurry.','Single and double kayaks, a trained guide and a packed breakfast. We keep a safe 50 metres from the hippos and a long list of birds.','Book a morning','See prices',[A('waves',1401)],'alt'),
  stats([['6:30','Sunrise departures'],['60+','Bird species seen'],['2 hrs','Guided paddle'],['0','Capsizes this year']],'primary'),
  steps('HOW A MORNING GOES','From jetty to breakfast',[['Brief','Life jackets, a paddle lesson and the hippo rules.'],['Glide','Along papyrus edges at first light.'],['Watch','Fish eagles, pelicans, kingfishers.'],['Eat','Mandazi, eggs and chai on the shore.']],'bg'),
  gal('mosaic','On the water',[A('waves',1402),A('hills',1403),A('leaf',1404),A('beach',1405)],'alt'),
  price('PRICES','Pay by the paddle','Includes guide, life jacket and dry bag.',[['Single kayak','KSh 2,500','/2 hrs','Guide and breakfast\nLife jacket'],['Double kayak','KSh 4,200','/2 hrs','Two paddlers\nPhoto stop at the papyrus',1],['Group of 8+','KSh 2,000','/person','Two guides\nBoat-side picnic']],'bg'),
  faq('Good to know',[['Can I come if I cannot swim?','Yes. Everyone wears a life jacket and the lake edge is shallow.'],['What if it rains?','We move the paddle to 4pm or refund you in full.'],['Where do we meet?','Hippo Point gate, 9 km from Naivasha town on the Moi South Lake Road.']],'alt'),
  footer('Hippo Point Paddles','Moi South Lake Road, Naivasha.')]),
  pg('Book','contact',[nav('Hippo Point Paddles','Book a paddle','left'),contact('Book your paddle','Tell us the date, group size and whether you want sunrise or sunset.','paddle@hippopoint.example','+254 710 440 601','Hippo Point Gate, Moi South Lake Road, Naivasha','Request a slot','bg'),footer('Hippo Point Paddles','Moi South Lake Road, Naivasha.')])]});

addBespoke({id:'taarab-orchestra',g:'Music',tag:'Taarab orchestra',name:'Mji Mkongwe Taarab',kw:'taarab orchestra zanzibar oud qanun wedding concert',desc:'A 14-piece taarab orchestra from Stone Town, for weddings and concert halls.',
 th:{p:'#c9a24a',p2:'#7a1e3a',p3:'#e9dcc0',bg:'#140b10',alt:'#21121a',tx:'#f3e9d6',dark:true,head:'Bodoni Moda',body:'Cormorant Garamond',radius:0},
 pages:[pg('Home','index',[nav('Mji Mkongwe Taarab','Book the orchestra','center'),hero('center','STONE TOWN · SINCE 1987','The sound of a Zanzibar wedding night','Oud, qanun, violins and a voice that makes the whole courtyard sigh. Fourteen musicians, sung in Swahili and Arabic.','Book us for your night','Listen',[],'bg'),
  split('right','THE ORCHESTRA','Three generations on one stage','Founded by Bi Zuhura in her Mkunazini courtyard, now led by her grandson on the oud. We still rehearse every Thursday where it began.','Meet the players',A('music',1411),'alt'),
  gal('strip','Nights we remember',[A('music',1412),A('lamp',1413),A('columns',1414),A('diamond',1415)],'bg'),
  feats('WE PLAY AT','Where the music is needed',' ',[['💍','Weddings','Full orchestra from KSh 450,000, with sound.'],['🎭','Concerts','Dhow Countries Music Academy and festival stages.'],['🕌','Eid nights','Open-air family concerts on Forodhani.']],'alt'),
  quotes('Heard in the courtyard',[['Grandmothers danced who had not stood in years.','Maryam S.','Wedding, Malindi'],['The qanun solo was worth the whole ticket.','Prof. J. Kidwai','Concert, Dar es Salaam'],['They learned our song in one rehearsal.','Hamad & Aisha','Wedding, Stone Town']],'bg'),
  cta('Reserve your date','Weekend dates before Ramadan go first.','Check availability','primary'),footer('Mji Mkongwe Taarab','Mkunazini, Stone Town, Zanzibar.')]),
  pg('Booking','contact',[nav('Mji Mkongwe Taarab','Book the orchestra','center'),contact('Check a date','Tell us the occasion, the venue and how many guests.','taarab@mjimkongwe.example','+255 777 220 118','Mkunazini Street, Stone Town','Send enquiry'),footer('Mji Mkongwe Taarab','Mkunazini, Stone Town, Zanzibar.')])]});

addBespoke({id:'ostrich-kajiado',g:'Agriculture',tag:'Ostrich farm',name:'Kajiado Ostrich Ranch',kw:'ostrich farm kajiado eggs leather meat visit',desc:'A working ostrich ranch an hour south of Nairobi: eggs, meat, leather and weekend visits.',
 th:{p:'#b4532a',p2:'#2e4a62',p3:'#e8b84a',bg:'#fbf3e6',alt:'#f0e0c8',tx:'#2c1b12',dark:false,head:'Rubik',body:'Work Sans',radius:12,pop:false},
 pages:[pg('Home','index',[nav('Kajiado Ostrich Ranch','Plan a visit','left'),hero('split','KAJIADO · 70 KM FROM NAIROBI','Big birds. Bigger breakfast.','One ostrich egg feeds eight people. Come see the chicks, hold an egg and walk the paddocks with a ranger.','Plan a visit','Order eggs',[A('savanna',1421)],'bg'),
  stats([['380','Ostriches'],['45','Eggs a week'],['2 kg','One egg, boiled 90 min'],['Sat–Sun','Open days']],'alt'),
  cards('overlay','ON THE RANCH','What we do','',[[A('circles',1422),'Fresh eggs','KSh 1,800 each, cracked with a saw and served for a crowd.'],[A('savanna',1423),'Weekend visits','Chick nursery, paddock walk and lunch, KSh 1,200.'],[A('field',1424),'Ostrich meat','Lean fillet and mince at the Karen farm shop.']],'bg'),
  split('left','WHY OSTRICH','Lean meat, low water, long-lived leather','Ostriches need a tenth of the water a cow does. The meat is red and lean, and the hide is tanned in Ngong for belts and handbags.','Read how we farm',A('hills',1425),'alt'),
  faq('Visitor questions',[['Can children ride the birds?','No. We feed them, we do not ride them.'],['Can I buy a chick?','Only to licensed farmers, with a training day first.'],['What should I wear?','Closed shoes and a hat. Paddocks are dusty.']],'bg'),
  footer('Kajiado Ostrich Ranch','Off Namanga Road, Kajiado County.')]),
  pg('Visit','contact',[nav('Kajiado Ostrich Ranch','Plan a visit','left'),contact('Plan your visit','Weekends 9am to 4pm. Groups of 10+ please book a week ahead.','visit@ostrichranch.example','+254 733 902 114','Namanga Road, 12 km past Kitengela','Book visit'),footer('Kajiado Ostrich Ranch','Off Namanga Road, Kajiado County.')])]});

addBespoke({id:'wheelchair-workshop',g:'Health',tag:'Wheelchair workshop',name:'Gurudumu Mobility',kw:'wheelchair workshop prosthetics disability mobility nairobi',desc:'Locally welded wheelchairs and tricycles for rough roads, built and repaired in Eastleigh.',
 th:{p:'#1d4ed8',p2:'#ffc400',p3:'#0f172a',bg:'#ffffff',alt:'#eef3ff',tx:'#0f172a',dark:false,head:'Archivo Black',body:'Manrope',radius:8,pop:true},
 pages:[pg('Home','index',[nav('Gurudumu Mobility','Get a chair','left'),hero('split','EASTLEIGH, NAIROBI','A wheelchair built for the roads you actually have','Strong steel frames, puncture-proof tyres and a seat cut to your body. Made by wheelchair users, fitted in one visit.','Book a fitting','See the models',[A('person',1431)],'alt'),
  feats('WHAT MAKES THEM DIFFERENT','Built on potholes, not showrooms',' ',[['🛞','Rough-road wheels','26-inch wheels with solid rubber tyres. No pumps, no punctures.'],['📏','Custom fit','Seat width, depth and back height measured on the day.'],['🔧','Free repairs for a year','Walk in any weekday, we weld it back.']]),
  price('MODELS','Prices in Kenya shillings','Sponsored chairs available through partner charities.',[['Everyday','KSh 28,000','','Folding steel frame\nSolid tyres\nFitted same day'],['Active','KSh 46,000','','Lightweight, cambered wheels\nSport armrests',1],['Hand-cycle tricycle','KSh 62,000','','Hand-pedalled, 3 gears\nCargo rack']],'alt'),
  stats([['1,900','Chairs built'],['11','Workshop staff, 8 chair users'],['14','Counties served'],['12 mo','Free repairs']],'dark'),
  quotes('From riders',[['I now get to the market on my own.','Grace W.','Machakos'],['My Active has done 3 years on murram roads.','Samuel K.','Boda mechanic'],['They measured twice and it fits like a glove.','Mama Tito','Kibera']]),
  cta('Cannot visit us?','We run fitting days in Kisumu, Mombasa and Eldoret each quarter.','See the fitting calendar'),footer('Gurudumu Mobility','Ninth Street, Eastleigh, Nairobi.')]),
  pg('Contact','contact',[nav('Gurudumu Mobility','Get a chair','left'),contact('Book a fitting','Weekdays 8am to 5pm. Step-free access and tea on the house.','fit@gurudumu.example','+254 722 118 940','Ninth Street, Eastleigh, Nairobi','Request fitting'),footer('Gurudumu Mobility','Ninth Street, Eastleigh, Nairobi.')])]});

addBespoke({id:'rooftop-bar-kampala',g:'Nightlife',tag:'Rooftop bar',name:'Sundowner 7th',kw:'rooftop bar kampala cocktails sunset dj nightlife',desc:'A seventh-floor cocktail bar above Kololo with Kampala’s widest sunset.',
 th:{p:'#ff4f8b',p2:'#7c5cff',p3:'#00e0c6',bg:'#0b0a1a',alt:'#15122e',tx:'#f4f1ff',dark:true,head:'Unbounded',body:'DM Sans',radius:16,grad:true},
 pages:[pg('Home','index',[nav('SUNDOWNER 7TH','Reserve a table','left'),hero('arch','KOLOLO, KAMPALA · 7TH FLOOR','The city is better from up here','Gin made in Jinja, passion-fruit everything, and a DJ from 8pm. The sun drops at 6:52 and we cheer every time.','Reserve a table','See the menu',[A('city',1441)],'bg'),
  menu('Signature cocktails','All UGX, served until 1am.',[['Nile Spritz','Jinja gin, passion fruit, tonic, basil','UGX 32,000'],['Kololo Sour','Rum, tamarind, lime, egg white','UGX 35,000'],['Mama Rocks','Waragi, ginger beer, lemongrass','UGX 28,000'],['Rolex Bites','Mini chapati rolls, two ways','UGX 18,000']],'alt'),
  gal('masonry','After dark',[A('city',1442),A('bloom',1443),A('lamp',1444),A('music',1445),A('circles',1446)],'bg'),
  steps('A WEEK UP HERE','What is on',[['Wednesday','Ladies’ night, first cocktail free.'],['Friday','Afrobeats DJ from 8pm.'],['Saturday','Live sax at sunset.'],['Sunday','Rooftop brunch, 11am to 4pm.']],'alt'),
  cta('Tables for Friday go fast','Reserve by Wednesday for a window seat at golden hour.','Reserve now'),footer('Sundowner 7th','Plot 7, Acacia Avenue, Kololo, Kampala.')]),
  pg('Reserve','contact',[nav('SUNDOWNER 7TH','Reserve a table','left'),contact('Reserve a table','Tell us the date, time and how many are coming. Dress: smart casual.','tables@sundowner7.example','+256 772 003 070','7th Floor, Plot 7 Acacia Avenue, Kololo','Reserve','alt'),footer('Sundowner 7th','Plot 7, Acacia Avenue, Kololo, Kampala.')])]});

addBespoke({id:'sushi-bar-nairobi',g:'Food',tag:'Sushi bar',name:'Ichi Nairobi',kw:'sushi japanese restaurant nairobi tilapia omakase',desc:'A twelve-seat sushi counter in Lavington using Lake Victoria fish.',
 th:{p:'#d7263d',p2:'#1a1a1a',p3:'#bfae92',bg:'#f7f4ee',alt:'#ece7dc',tx:'#1a1a1a',dark:false,head:'Instrument Serif',body:'Outfit',radius:2},
 pages:[pg('Home','index',[nav('Ichi 一','Book a seat','center'),hero('center','LAVINGTON · TWELVE SEATS','Fish from the lake. Rice from the chef’s hands.','Chef Kenji trained in Osaka for nine years before moving to Nairobi. Tonight’s menu is whatever came off the boats in Kisumu this morning.','Book a seat','Omakase menu',[],'bg'),
  split('left','THE COUNTER','Eight courses, no menu cards','You sit, you drink green tea, and you eat what the chef puts in front of you. Tilapia, Nile perch, tuna from Mombasa and Kenyan wasabi leaf.','Book omakase',A('plate',1451),'alt'),
  menu('Omakase','Two seatings, 6:30pm and 8:45pm.',[['Counter omakase','Eight courses','KSh 9,500'],['Sake pairing','Four small pours','KSh 4,200'],['Lunch set','Five nigiri, miso, tamago, Tue to Fri','KSh 3,200'],['Tea ceremony add-on','Hand-whisked matcha','KSh 800']],'bg'),
  gal('strip','The plate',[A('plate',1452),A('fruit',1453),A('waves',1454),A('cup',1455)],'alt'),
  faq('Before you come',[['Do you take walk-ins?','Only if a seat is free after 8:45pm.'],['Vegetarian?','Yes, with 48 hours’ notice.'],['Children?','Over 10 years, with the early seating.']],'bg'),
  footer('Ichi 一','James Gichuru Road, Lavington, Nairobi.')]),
  pg('Book','contact',[nav('Ichi 一','Book a seat','center'),contact('Book a seat','Tell us the date, seating and any allergies.','book@ichi.example','+254 700 990 118','James Gichuru Road, Lavington','Request seat'),footer('Ichi 一','James Gichuru Road, Lavington, Nairobi.')])]});

addBespoke({id:'rwenzori-guides',g:'Travel',tag:'Mountain guides',name:'Moon Mountain Guides',kw:'rwenzori hiking trek guides uganda mountains kasese',desc:'Locally owned guides for the Rwenzori Central Circuit and day hikes from Kasese.',
 th:{p:'#2f6f4e',p2:'#e6d3a3',p3:'#c1440e',bg:'#f1f3ee',alt:'#dfe6dc',tx:'#16231b',dark:false,head:'Oswald',body:'Karla',radius:3},
 pages:[pg('Home','index',[nav('MOON MOUNTAIN GUIDES','Plan a trek','left'),hero('cover','KASESE · RWENZORI MOUNTAINS','Seven days above the clouds','Moss forests, giant lobelias and glaciers on the equator. Led by Bakonzo guides who grew up under these peaks.','Plan a trek','Day hikes',[A('mountain',1461)],'alt'),
  stats([['7','Days, Central Circuit'],['4,500 m','Highest camp'],['1:2','Guides per client'],['120','Porters employed']],'dark'),
  cards('grid','CHOOSE YOUR WALK','Three ways in','',[[A('mountain',1462),'Central Circuit','7 days, $1,450, with Margherita Peak optional.'],[A('leaf',1463),'Kilembe Trail','3 days, $480, bamboo forest and Lake Mahoma.'],[A('hills',1464),'Cultural day hike','1 day, $60, honey, coffee and a village lunch.']],'bg'),
  split('right','FAIR TO PORTERS','Everyone carries a limited load','Porters carry 20 kg at most, wear proper boots and share the tip pool equally. We pay them even if the weather turns us back.','Our porter policy',A('mountain',1465),'alt'),
  faq('Trek questions',[['How fit do I need to be?','If you can hike 6 hours on a hill, you can do the circuit.'],['Is it cold?','Below zero at night. We hire sleeping bags and gaiters.'],['Best season?','December to February and June to August.']],'bg'),
  footer('Moon Mountain Guides','Margherita Street, Kasese, Uganda.')]),
  pg('Enquire','contact',[nav('MOON MOUNTAIN GUIDES','Plan a trek','left'),contact('Plan your trek','Tell us the month, group size and experience.','trek@moonmountain.example','+256 782 443 219','Margherita Street, Kasese','Send plan'),footer('Moon Mountain Guides','Margherita Street, Kasese, Uganda.')])]});

addBespoke({id:'voice-over-studio',g:'Media',tag:'Voice-over studio',name:'Sauti Booth',kw:'voice over recording studio radio ads dubbing swahili',desc:'Swahili, English and Luganda voice talent and a soundproof booth in Kilimani.',
 th:{p:'#ff6b35',p2:'#f7c59f',p3:'#4ecdc4',bg:'#16161d',alt:'#20202b',tx:'#f5f1ea',dark:true,head:'Space Mono',body:'DM Mono',radius:6},
 pages:[pg('Home','index',[nav('SAUTI/BOOTH','Get a quote','left'),hero('split','KILIMANI, NAIROBI','Your script, in a voice people trust','Radio ads, e-learning, audiobooks and film dubbing. 40 voice artists, one treated booth and 24-hour turnaround on short scripts.','Get a quote','Hear demos',[A('music',1471)],'bg'),
  logos('Voices heard on',['Pwani FM','Kiss TV','M-Safiri','Duka Digital','Radio Jambo']),
  feats('SERVICES','What we record',' ',[['📻','Radio and TV ads','30 and 60 second spots in Sheng, Swahili or English.'],['🎧','Audiobooks','Studio narration, edited and mastered to ACX standard.'],['🎬','Dubbing','Lip-synced Swahili dubs for series and documentaries.']],'alt'),
  price('RATES','Per finished minute','Talent fee, studio and edit included.',[['Ad spot','KSh 15,000','/spot','30 or 60 sec\n2 retakes'],['E-learning','KSh 4,500','/min','Clean edit\nPronunciation check',1],['Audiobook','KSh 9,000','/hr','Chapter files\nMastered']],'bg'),
  steps('HOW A JOB RUNS','Script in, audio out',[['Send','Script and a reference by email or WhatsApp.'],['Cast','Three voice samples in 4 hours.'],['Record','Remote direct, or come to the booth.'],['Deliver','WAV and MP3 in 24 hours.']],'alt'),
  footer('SAUTI/BOOTH','Argwings Kodhek Road, Kilimani, Nairobi.')]),
  pg('Quote','contact',[nav('SAUTI/BOOTH','Get a quote','left'),contact('Get a quote','Paste your script or tell us the word count and language.','hello@sautibooth.example','+254 711 305 662','Argwings Kodhek Road, Kilimani','Send script'),footer('SAUTI/BOOTH','Argwings Kodhek Road, Kilimani, Nairobi.')])]});

addBespoke({id:'fablab-kisumu',g:'Technology',tag:'Makerspace',name:'Dala FabLab',kw:'fablab makerspace 3d printing laser cutter kisumu electronics',desc:'A community fab lab with 3D printers, laser cutters and soldering benches on the Kisumu lakefront.',
 th:{p:'#00b37e',p2:'#ffdd00',p3:'#ff4d6d',bg:'#f4f4f0',alt:'#e6e8e1',tx:'#101a15',dark:false,head:'DM Mono',body:'Inter',radius:0,pop:true},
 pages:[pg('Home','index',[nav('dala/fablab','Join the lab','left'),hero('collage','KISUMU · LAKEFRONT','If you can sketch it, you can build it here','Laser cutters, 3D printers, CNC and a very good coffee. Open to students, farmers and startups.','Join the lab','Book a machine',[A('grid',1481),A('circles',1482),A('laptop',1483)],'bg'),
  feats('THE KIT','What is on the benches',' ',[['🖨️','4 x 3D printers','PLA, PETG and resin. KSh 15 per gram.'],['⚡','Laser cutter','60 x 40 cm bed, wood and acrylic.'],['🔌','Electronics bench','Soldering, Arduino and sensor stock.']],'alt','cards'),
  split('right','MADE HERE','A solar dryer, a mosquito trap, a prosthetic hand','Members built a rice dryer for Ahero farmers and a low-cost water-level sensor for Lake Victoria fisheries.','See projects',A('solar',1484)),
  price('MEMBERSHIP','Three ways to use the lab','Student ID gets 40% off.',[['Day pass','KSh 500','/day','Bench time\nTool induction'],['Maker','KSh 3,500','/month','Unlimited bench\n2 hrs laser/month',1],['Startup','KSh 12,000','/month','Private bay\nStorage\nMentor hour']],'alt'),
  faq('New here?',[['Do I need experience?','No. Every first visit starts with a free 45-minute induction.'],['Can I sell what I make?','Yes, it is yours.'],['Kids?','Saturday junior sessions, ages 10 to 15.']]),
  footer('dala/fablab','Kibuye Road, Kisumu.')]),
  pg('Visit','contact',[nav('dala/fablab','Join the lab','left'),contact('Visit the lab','Mon to Sat, 9am to 8pm. Come for a free induction.','lab@dala.example','+254 722 776 190','Kibuye Road, near Dunga Beach, Kisumu','Book induction'),footer('dala/fablab','Kibuye Road, Kisumu.')])]});

addBespoke({id:'kikoy-lamu',g:'Retail',tag:'Kikoy weavers',name:'Pate Kikoy Weavers',kw:'kikoy weaving lamu cotton towels scarves shop',desc:'Handwoven cotton kikoys from Lamu, in stripes dyed with local indigo and tamarind.',
 th:{p:'#274690',p2:'#e8a33d',p3:'#c8553d',bg:'#fff9ee',alt:'#f5e9cf',tx:'#1b2438',dark:false,head:'Libre Caslon Text',body:'Karla',radius:6},
 pages:[pg('Home','index',[nav('Pate Kikoy','Shop kikoys','center','page:shop'),hero('arch','LAMU ISLAND · HANDWOVEN','Stripes that remember the tide','Pure cotton, woven on foot-pedal looms by eight weavers in Pate. Beach wrap, towel, scarf or tablecloth, they all started here.','Shop kikoys','Visit the looms',[A('beach',1491)],'alt'),
  gal('strip','Colours of the month',[A('waves',1492),A('bloom',1493),A('circles',1494),A('stones',1495)],'bg'),
  cards('grid','WHAT WE WEAVE','Four ways to wear one','',[[A('beach',1496),'Classic wrap','Light, 100 x 170 cm. KSh 1,800'],[A('grid',1497),'Beach towel','Thicker weave. KSh 2,400'],[A('frame',1498),'Table runner','Hand-fringed. KSh 1,500'],[A('bloom',1499),'Baby swaddle','Soft-washed. KSh 1,200']],'alt'),
  split('left','THE LOOMS','Eight weavers, one rule: no rush','A kikoy takes two days on the loom. Indigo is dipped three times, fixed with salt and dried on the roof in Pate town.','Our story',A('stones',1500)),
  quotes('Sent from happy shoulders',[['Washed twenty times and still softer than new.','Rachel O.','Nairobi'],['Our hotel ordered 60 for the pool.','Amani Beach Lodge','Watamu'],['The indigo is gorgeous.','Isla P.','Edinburgh']],'alt'),
  footer('Pate Kikoy','Pate Island, Lamu County.')]),
  pg('Shop','shop',[nav('Pate Kikoy','Shop kikoys','center','page:shop'),menu('Price list','We ship across East Africa. Hotels ask for a wholesale list.',[['Classic wrap','100 x 170 cm','KSh 1,800'],['Beach towel','Heavy weave','KSh 2,400'],['Table runner','Hand-fringed','KSh 1,500'],['Baby swaddle','Pre-washed','KSh 1,200'],['Wholesale (10+)','Mixed colours','KSh 1,350 each']]),contact('Place an order','Tell us colours and a delivery town.','order@patekikoy.example','+254 721 003 551','Pate town, Lamu','Order'),footer('Pate Kikoy','Pate Island, Lamu County.')])]});

addBespoke({id:'pool-builder',g:'Construction',tag:'Swimming pool builder',name:'Blue Palm Pools',kw:'swimming pool construction maintenance diani nairobi',desc:'Design, build and maintenance of home and hotel pools along the coast and in Nairobi.',
 th:{p:'#0a84c6',p2:'#ffd166',p3:'#06d6a0',bg:'#ffffff',alt:'#e9f6fd',tx:'#062b40',dark:false,head:'Syne',body:'Figtree',radius:14,grad:true},
 pages:[pg('Home','index',[nav('Blue Palm Pools','Get a design','left'),hero('cover','NAIROBI · DIANI · NANYUKI','A pool that looks like it was always there','Concrete, tiled and plunge pools built in 6 to 10 weeks, with a 5-year structural guarantee.','Get a design','See projects',[A('waves',1511)],'alt'),
  steps('HOW WE BUILD','Six weeks from sketch to splash',[['Site visit','We measure, test soil and sketch ideas.'],['3D design','You see the pool in your own garden.'],['Dig and cast','Reinforced concrete shell.'],['Tile and plumb','Hand-set tiles, quiet pumps.'],['Fill and handover','Water test and care lesson.']],'bg'),
  gal('mosaic','Recent pools',[A('waves',1512),A('house',1513),A('leaf',1514),A('beach',1515),A('bloom',1516)],'alt'),
  price('GUIDE PRICES','What it costs','Excludes landscaping and VAT.',[['Plunge pool','KSh 1.2m','','3 x 4 m\nHeating optional'],['Family pool','KSh 3.4m','','4 x 8 m\nLights and cover',1],['Monthly care','KSh 18,000','/month','Weekly clean\nChemicals']],'bg'),
  stats([['240','Pools built'],['5 yr','Structure guarantee'],['6–10 wks','Build time'],['12','Hotels maintained']],'primary'),
  faq('Questions',[['Do you handle permits?','Yes, including NEMA and county approvals.'],['Salt or chlorine?','Both. We recommend salt for family pools.'],['Maintenance contract?','Optional, monthly, cancel anytime.']],'alt'),
  footer('Blue Palm Pools','Ngong Road, Nairobi and Diani Beach Road.')]),
  pg('Design','contact',[nav('Blue Palm Pools','Get a design','left'),contact('Get a design','Share your plot size and what you picture.','pools@bluepalm.example','+254 733 481 090','Ngong Road, Nairobi','Request design'),footer('Blue Palm Pools','Ngong Road, Nairobi and Diani Beach Road.')])]});

addBespoke({id:'lunch-box-delivery',g:'Food',tag:'Office lunch delivery',name:'Sufuria Lunch Club',kw:'lunch box delivery office nairobi pilau meals subscription',desc:'Home-style lunch boxes delivered to Westlands and Upper Hill offices by noon.',
 th:{p:'#e85d04',p2:'#ffba08',p3:'#370617',bg:'#fffaf0',alt:'#ffe9c2',tx:'#2b1608',dark:false,head:'Baloo 2',body:'Rubik',radius:30,pop:true},
 pages:[pg('Home','index',[nav('Sufuria Lunch Club','Order lunch','left'),hero('collage','WESTLANDS · UPPER HILL · NGONG ROAD','Lunch like mama made, at your desk by 12:30','Choose your week on Sunday, we cook fresh every morning. Pilau Tuesdays, githeri Thursdays, always a kachumbari.','See this week’s menu','Order for the team',[A('plate',1521),A('fruit',1522),A('cup',1523)],'bg'),
  menu('This week','Boxes include rice or ugali, protein, veg and a fruit.',[['Mon · Chicken stew & rice','Coconut and tomato','KSh 380'],['Tue · Beef pilau','Pili pili on the side','KSh 400'],['Wed · Fish fillet & ugali','Sukuma and lemon','KSh 450'],['Thu · Githeri & avocado','Vegan','KSh 320'],['Fri · Nyama choma box','Kachumbari, chapati','KSh 520']],'alt'),
  stats([['3,100','Boxes a week'],['12:30','Latest arrival'],['0','Plastic cutlery'],['72','Offices']],'primary'),
  price('SUBSCRIBE','Save with a weekly plan','Pause or skip any day by 9pm.',[['5-day plan','KSh 1,900','/week','Mon to Fri\nFree delivery'],['Team of 10','KSh 3,500','/day','One invoice\nMix and match',1],['Single box','KSh 420','','No commitment']],'bg'),
  quotes('From the pantry',[['Our whole floor eats at the same time again.','Wanjiru N.','HR, Westlands'],['Better than the canteen, cheaper too.','Peter A.','Accountant'],['Allergen notes on every box.','Sandra M.','Law firm']],'alt'),
  footer('Sufuria Lunch Club','Kitchen on Mombasa Road, deliveries across Nairobi.')]),
  pg('Order','contact',[nav('Sufuria Lunch Club','Order lunch','left'),contact('Start your week','Tell us your office, floor and headcount.','eat@sufuria.example','+254 700 120 330','Mombasa Road kitchen','Start plan'),footer('Sufuria Lunch Club','Kitchen on Mombasa Road, deliveries across Nairobi.')])]});

addBespoke({id:'kids-adventure-park',g:'Kids',tag:'Adventure park',name:'Tree Tops Kids Park',kw:'kids adventure park ropes zip line birthday party kigali',desc:'Rope courses, zip lines and birthday parties for children in Kigali’s Nyarutarama.',
 th:{p:'#3ba935',p2:'#ff9f1c',p3:'#2ec4b6',bg:'#f8fff2',alt:'#e1f5d3',tx:'#173010',dark:false,head:'Baloo 2',body:'Outfit',radius:28,pop:true},
 pages:[pg('Home','index',[nav('Tree Tops','Book a party','center'),hero('center','NYARUTARAMA, KIGALI','Climb it. Swing it. Zip it.','Ten rope courses at three heights for ages 3 to 14. Trained marshals on every route and a snack bar for tired parents.','Book a party','Prices',[],'alt'),
  cards('overlay','THE COURSES','Pick a height','',[[A('leaf',1531),'Seedlings (3–6 yrs)','Low nets and a baby zip line, 1 m up.'],[A('hills',1532),'Climbers (7–10)','Rope bridges and a tunnel slide, 4 m up.'],[A('mountain',1533),'Canopy (11–14)','Tree-to-tree zip line, 8 m up.']],'bg'),
  feats('SAFETY','Fun, with a harness',' ',[['🧗','Trained marshals','1 per 6 children, first-aid certified.'],['🪢','Auto-belay lines','No clips to forget.'],['🍉','Parents lounge','Coffee, wifi, shade.']],'alt'),
  price('PRICES','Pay per visit','Siblings get 20% off.',[['Day entry','RWF 8,000','','All courses, 3 hours'],['Birthday party','RWF 180,000','','12 kids, cake, host',1],['School trip','RWF 5,500','/child','Min 30 kids']],'bg'),
  gal('masonry','Happy faces',[A('balloon',1534),A('gift',1535),A('leaf',1536),A('heart',1537)],'alt'),
  footer('Tree Tops','KG 9 Ave, Nyarutarama, Kigali.')]),
  pg('Book','contact',[nav('Tree Tops','Book a party','center'),contact('Book your day','Open Wed to Sun, 9am to 6pm.','play@treetops.example','+250 788 410 911','KG 9 Ave, Nyarutarama','Book now'),footer('Tree Tops','KG 9 Ave, Nyarutarama, Kigali.')])]});

addBespoke({id:'private-ambulance',g:'Health',tag:'Private ambulance',name:'Haraka Response',kw:'ambulance emergency evacuation nairobi paramedics 24 hour',desc:'24-hour private ambulance and paramedic cover in Nairobi and the Rift Valley.',
 th:{p:'#d00000',p2:'#ffffff',p3:'#1d3557',bg:'#ffffff',alt:'#f4f6f9',tx:'#14213d',dark:false,head:'Rubik',body:'Inter',radius:6},
 pages:[pg('Home','index',[nav('HARAKA RESPONSE','Call 0722 000 999','left','page:contact'),hero('split','24 HOURS · NAIROBI & RIFT VALLEY','Help in under 15 minutes','Fully equipped ICU ambulances, trained paramedics and direct lines to 11 hospitals. Save the number before you need it.','Call 0722 000 999','Corporate cover',[A('road',1541)],'bg'),
  stats([['14 min','Average city response'],['9','Ambulances'],['24/7','Dispatch'],['11','Partner hospitals']],'primary'),
  feats('WHAT WE DO','Care on the road',' ',[['🚑','Emergency response','Nairobi, Kiambu, Kajiado, Machakos.'],['🏥','Hospital transfers','Between facilities with a doctor on board.'],['🎪','Event cover','Marathons, weddings, concerts.']],'alt'),
  steps('WHEN YOU CALL','What happens next',[['Call','Dispatcher stays on the line.'],['Send','Nearest ambulance dispatched with GPS.'],['Treat','Paramedics stabilise on scene.'],['Deliver','Hospital pre-alerted.']],'bg'),
  price('MEMBERSHIP','Annual cover','Per household. Callouts included.',[['Individual','KSh 6,000','/year','Unlimited city callouts'],['Family','KSh 11,000','/year','Up to 6 people',1],['Company','KSh 650','/staff','Min 20 staff']],'alt'),
  footer('HARAKA RESPONSE','Mombasa Road, Nairobi. Dispatch 0722 000 999.')]),
  pg('Contact','contact',[nav('HARAKA RESPONSE','Call 0722 000 999','left'),contact('Join or enquire','For emergencies always call 0722 000 999.','ops@haraka.example','+254 722 000 999','Mombasa Road, Nairobi','Send enquiry'),footer('HARAKA RESPONSE','Mombasa Road, Nairobi.')])]});

addBespoke({id:'lake-ferry-victoria',g:'Transport',tag:'Lake ferry',name:'MV Nyanza Crossing',kw:'ferry lake victoria mwanza bukoba boat tickets',desc:'Daily passenger and cargo ferry between Mwanza and Bukoba on Lake Victoria.',
 th:{p:'#00538a',p2:'#f4a259',p3:'#bc4b51',bg:'#f7fafc',alt:'#e3edf4',tx:'#0d2538',dark:false,head:'Fraunces',body:'DM Sans',radius:8},
 pages:[pg('Home','index',[nav('MV Nyanza','Book a ticket','left'),hero('cover','MWANZA ⇄ BUKOBA','Sleep across the lake','Overnight sailings, every day but Sunday. Cabins, reclining seats, a hot kitchen and a deck for the sunrise.','Book a ticket','Timetable',[A('waves',1551)],'alt'),
  steps('THE TRIP','Mwanza to Bukoba in 9 hours',[['Board','Gate opens 5:00pm.'],['Sail','Departs 7:00pm sharp.'],['Dine','Fish and ugali until 10pm.'],['Arrive','Bukoba port at 4:00am.']],'bg'),
  price('TICKETS','Fares in Tanzanian shillings','Children under 5 travel free.',[['Economy seat','TSh 24,000','','Reclining seat\nBag allowance 20 kg'],['2-berth cabin','TSh 65,000','','Own door\nFresh linen',1],['Vehicle','TSh 120,000','','Cars up to 4 m']],'alt'),
  split('right','CARGO','Bananas, coffee and cement, both ways','The lower deck carries 110 tonnes. Traders book a week ahead for the Friday sailing.','Cargo rates',A('port',1552)),
  faq('Passenger info',[['Is there food?','Yes, a hot kitchen and a tea bar on deck two.'],['Lifejackets?','For every passenger, checked at each sailing.'],['Can I pay by M-Pesa?','Yes, and Tigo Pesa and card.']],'alt'),
  footer('MV Nyanza','Mwanza South Port, Tanzania.')]),
  pg('Book','contact',[nav('MV Nyanza','Book a ticket','left'),contact('Book your sailing','Send your date, ports and number of passengers.','tickets@nyanza.example','+255 754 002 118','Mwanza South Port','Request tickets'),footer('MV Nyanza','Mwanza South Port, Tanzania.')])]});

addBespoke({id:'maasai-boma-visit',g:'Culture',tag:'Cultural village visit',name:'Olkirimbai Boma',kw:'maasai cultural visit village mara community tourism',desc:'A community-run Maasai village visit near the Mara where every ticket funds the school.',
 th:{p:'#b3261e',p2:'#1e3a8a',p3:'#f2b134',bg:'#fbf5e9',alt:'#f1e2c3',tx:'#2b1a10',dark:false,head:'Young Serif',body:'Work Sans',radius:4},
 pages:[pg('Home','index',[nav('Olkirimbai Boma','Visit us','center'),hero('center','NEAR SEKENANI GATE · MAASAI MARA','Come as a guest. Leave as a friend.','Meet the families of Olkirimbai, learn beadwork, walk the herd and eat with us. Run by the village council, never by a tour company.','Plan a visit','Where the money goes',[],'alt'),
  split('left','HOW IT WORKS','Tickets go to the village, not a middleman','60% to the host families, 25% to the school, 15% to the grazing committee. A public ledger hangs in the village office.','See the ledger',A('savanna',1561)),
  steps('A VISIT','Two hours with us',[['Welcome','Songs and the adumu jumping dance.'],['Learn','Fire-making, milking and beadwork.'],['Walk','Herding with the young warriors.'],['Eat','Maize meal and goat stew.']],'alt'),
  price('TICKETS','Per person','Under 12 half price.',[['Visit','$20','','Full tour, 2 hrs'],['Beadwork class','$35','','Make a bracelet and take it home',1],['Overnight stay','$70','','Dinner, bed, breakfast']],'bg'),
  quotes('Guests wrote',[['No staged show. Just people sharing their day.','Hanna','Berlin'],['My kids still talk about the cattle.','David','Nairobi'],['Our guide was so funny.','Mei','Singapore']],'alt'),
  footer('Olkirimbai Boma','Off Sekenani–Talek road, Narok County.')]),
  pg('Visit','contact',[nav('Olkirimbai Boma','Visit us','center'),contact('Plan a visit','Tell us your date and group size. Drivers can call ahead.','boma@olkirimbai.example','+254 723 811 702','Sekenani Gate road, Narok','Send request'),footer('Olkirimbai Boma','Off Sekenani–Talek road, Narok County.')])]});

addBespoke({id:'bamboo-works',g:'Craft',tag:'Bamboo furniture',name:'Mianzi Works',kw:'bamboo furniture workshop kisii chairs sustainable',desc:'Furniture and fencing made from treated bamboo grown by smallholders near Kisii.',
 th:{p:'#6a8d3a',p2:'#d9b26f',p3:'#3d2c1e',bg:'#f6f3e9',alt:'#e9e4cf',tx:'#222a14',dark:false,head:'Gloock',body:'Outfit',radius:10,deco:'dots'},
 pages:[pg('Home','index',[nav('Mianzi Works','See catalogue','left'),hero('arch','KISII · GROWN, CUT, MADE','Furniture that grows back','Bamboo reaches full height in four years, not forty. We treat it with borax, never with chemicals, and join it without a single nail.','See the catalogue','Visit the workshop',[A('leaf',1571)],'alt'),
  cards('grid','CATALOGUE','Pieces for home and garden','',[[A('frame',1572),'Lounge chair','KSh 14,500'],[A('house',1573),'Dining set (6)','KSh 68,000'],[A('lamp',1574),'Pendant lamps','KSh 3,800'],[A('leaf',1575),'Garden fencing','KSh 900 per metre']],'bg'),
  split('right','THE SUPPLY CHAIN','180 farmers, fair prices','We pay KSh 450 per culm, double the going rate, and plant two shoots for every one cut.','Meet the farmers',A('field',1576),'alt'),
  stats([['4 yrs','To full growth'],['180','Farmers'],['0','Nails used'],['35%','Less carbon than hardwood']],'dark'),
  gal('masonry','In homes',[A('frame',1577),A('lamp',1578),A('leaf',1579)],'bg'),
  footer('Mianzi Works','Kisii–Migori Road, Kisii County.')]),
  pg('Order','contact',[nav('Mianzi Works','See catalogue','left'),contact('Order or visit','Delivery across Kenya, 3 to 4 weeks.','sales@mianzi.example','+254 725 640 112','Kisii–Migori Road','Send order'),footer('Mianzi Works','Kisii–Migori Road, Kisii County.')])]});

addBespoke({id:'watch-repair-mombasa',g:'Services',tag:'Watch repair',name:'Old Town Watchmaker',kw:'watch repair mombasa vintage clocks restoration',desc:'Repair and restoration of mechanical watches and wall clocks in Mombasa’s Old Town.',
 th:{p:'#8c6b2f',p2:'#1c1c1c',p3:'#b5483a',bg:'#f4efe4',alt:'#e8dfcb',tx:'#201a10',dark:false,head:'Cormorant Garamond',body:'Libre Caslon Text',radius:0},
 pages:[pg('Home','index',[nav('Old Town Watchmaker','Bring a watch','center'),hero('center','NDIA KUU ROAD, MOMBASA · SINCE 1961','Time, set right','Three generations of repair for Seiko, Omega, Rolex and the old Swiss pocket watch in the drawer.','Bring a watch','Prices',[],'bg'),
  feats('WHAT WE FIX','Mechanical, quartz and clock',' ',[['⌚','Service','Full clean, oil and timing test. KSh 4,500.'],['🕰️','Wall and mantel clocks','House calls in Old Town.'],['🔋','Batteries and straps','While you wait, KSh 400.']],'alt'),
  split('left','THE BENCH','Parts made by hand when none exist','Mzee Hussein turns missing staffs and pinions on a lathe older than he is. Every repair carries a 12-month guarantee.','Read our story',A('diamond',1581),'bg'),
  steps('HOW IT WORKS','Four steps',[['Bring','Free inspection and quote.'],['Repair','Typically 7 to 14 days.'],['Test','24 hours on the timing machine.'],['Collect','Cleaned, polished, guaranteed.']],'alt'),
  faq('Common questions',[['Do you buy old watches?','We value and buy mechanical pieces.'],['How much for a Rolex service?','From KSh 18,000.'],['Do you ship?','Within East Africa by insured courier.']],'bg'),
  footer('Old Town Watchmaker','Ndia Kuu Road, Old Town, Mombasa.')]),
  pg('Visit','contact',[nav('Old Town Watchmaker','Bring a watch','center'),contact('Visit the bench','Mon to Sat, 9am to 5pm.','time@oldtownwatch.example','+254 722 605 440','Ndia Kuu Road, Old Town','Ask a question'),footer('Old Town Watchmaker','Ndia Kuu Road, Old Town, Mombasa.')])]});

addBespoke({id:'survey-agency',g:'Business',tag:'Survey & data collection',name:'Dodoso Field Data',kw:'survey data collection research enumerators mobile kenya uganda',desc:'Mobile data collection and enumerator teams for NGOs, researchers and brands.',
 th:{p:'#5b3df5',p2:'#00d1b2',p3:'#ffb347',bg:'#fbfaff',alt:'#eeebff',tx:'#1a1540',dark:false,head:'Sora',body:'Manrope',radius:14,grad:true},
 pages:[pg('Home','index',[nav('dodoso','Request a quote','left'),hero('split','NAIROBI · KAMPALA · DAR','Field data you can trust, back in 48 hours','1,200 trained enumerators, Kobo and ODK on every phone, and GPS-stamped interviews. Household surveys, price monitoring and mystery shopping.','Request a quote','See a sample report',[A('chart',1591)],'bg'),
  logos('Trusted by',['UNICEF','Mercy Corps','Kantar Kenya','Equity Bank','Africa Research Hub']),
  feats('SERVICES','What we collect',' ',[['📱','Household surveys','Representative samples in 40 counties.'],['🛒','Price monitoring','Weekly market prices in 120 towns.'],['🕵️','Mystery shopping','Retail and bank branch checks.']],'alt'),
  stats([['1,200','Enumerators'],['94%','Interview GPS match'],['48 hrs','Typical turnaround'],['3','Countries']],'primary'),
  steps('QUALITY','Four checks on every interview',[['Train','Two-day certification.'],['Pilot','50 test interviews.'],['Audit','Audio spot checks on 10%.'],['Clean','Data cleaned and delivered in SPSS, Stata or CSV.']],'bg'),
  footer('dodoso','Westlands, Nairobi.')]),
  pg('Quote','contact',[nav('dodoso','Request a quote','left'),contact('Tell us your study','Sample size, locations and timeline.','field@dodoso.example','+254 733 402 118','The Mirage, Westlands','Request quote'),footer('dodoso','Westlands, Nairobi.')])]});

addBespoke({id:'wig-boutique',g:'Beauty',tag:'Wig boutique',name:'Taji Wigs',kw:'wig boutique lace front human hair nairobi styling',desc:'Human-hair lace-front wigs custom-styled in a Westlands studio.',
 th:{p:'#b4236b',p2:'#f4c542',p3:'#2a0f2e',bg:'#fff6fa',alt:'#fde0ee',tx:'#2a0f2e',dark:false,head:'DM Serif Display',body:'Outfit',radius:24,pop:true,grad:true},
 pages:[pg('Home','index',[nav('Taji Wigs','Book a fitting','center'),hero('collage','WESTLANDS · BY APPOINTMENT','The crown you walk in with','Raw Brazilian and Vietnamese hair, lace fitted to your hairline, plucked, bleached and styled by hand. Ready in 5 days.','Book a fitting','See the range',[A('person',1601),A('scissors',1602),A('bloom',1603)],'alt'),
  cards('overlay','THE RANGE','Lengths and textures','',[[A('person',1604),'Bone straight','14 to 28 inch. From KSh 18,000'],[A('bloom',1605),'Body wave','Soft, long-lasting. From KSh 22,000'],[A('circles',1606),'Deep curl','Natural bounce. From KSh 24,000']],'bg'),
  steps('YOUR FITTING','From head to crown',[['Measure','Head size and hairline photo.'],['Choose','Texture, density and colour.'],['Style','Cut and set to your face.'],['Aftercare','Wash guide and a free refresh at 6 weeks.']],'alt'),
  price('EXTRAS','Make it yours','',[['Custom colour','KSh 5,000','','Highlights, ombre'],['Wig install','KSh 3,500','','Glueless or glued',1],['Revamp','KSh 4,000','','Wash and restyle']],'bg'),
  quotes('Reviews',[['My lace is invisible!','Njeri K.','Bride'],['Three years on and still full.','Mercy A.','Lawyer'],['She styled it for my graduation.','Zawadi','Student']],'alt'),
  footer('Taji Wigs','Lantana Road, Westlands, Nairobi.')]),
  pg('Book','contact',[nav('Taji Wigs','Book a fitting','center'),contact('Book a fitting','Tue to Sat, 10am to 6pm. Please arrive with clean hair.','taji@tajiwigs.example','+254 714 220 808','Lantana Road, Westlands','Book fitting'),footer('Taji Wigs','Lantana Road, Westlands, Nairobi.')])]});
}
