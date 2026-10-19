/* Batch 7: 20 hand-designed website templates. */
{const {nav,hero,feats,split,gal,stats,quotes,price,faq,cta,contact,footer,team,cards,menu,steps,text,logos,blog,wa,pg}=B_,A=a_;

addBespoke({id:'nyama-choma-grill',g:'Food',tag:'Nyama choma joint',name:'Choma Corner Kisumu',kw:'nyama choma grill goat barbecue pub kisumu',desc:'Charcoal-roasted goat, beef and tilapia by the kilo in Kisumu.',
 th:{p:'#d9381e',p2:'#f2b134',p3:'#7a1f10',bg:'#1a0f0b',alt:'#26150f',tx:'#f7e9d7',dark:true,head:'Oswald',body:'Figtree',radius:4,pop:true},
 pages:[pg('Home','index',[nav('CHOMA CORNER','Order by the kilo','left'),hero('cover','KISUMU · MILIMANI ROAD · 11AM TO LATE','Goat, charcoal and a cold Tusker','Whole goat ribs roasted three hours over mukau charcoal, chopped on a wooden board with kachumbari, ugali and roasted maize.','See the menu','Reserve a table',[A('plate',801)],'alt'),
  menu('Off the grill','Priced per kilo. Sides included. Cash or M-Pesa till 889 201.',[['Goat ribs','Slow roasted, salt and lemon','KES 1,400 /kg'],['Beef short ribs','Marinated overnight in garlic','KES 1,100 /kg'],['Whole tilapia','From the lake this morning','KES 650'],['Matumbo','Tripe, stewed then grilled','KES 500'],['Ugali and kachumbari','Serves two','KES 150']],'bg'),
  gal('mosaic','Friday nights',[A('plate',802),A('city',803),A('circles',804),A('cup',805)],'alt'),
  split('left','THE FIRE','Three hours, no shortcuts','Our butcher is two doors down and the charcoal comes from Siaya. We never use gas, never par-cook and never hurry. Come hungry, the wait is part of it.','Book a group',A('hills',806),'bg'),
  quotes('From the benches',[['Best goat in Nyanza, argue with me.','Otieno W.','Regular since 2019'],['We came for a birthday and stayed till midnight.','Akinyi P.','Group of 14']],'alt'),
  cta('Birthday or wake after-party? Book the back yard','Seats up to 60. Free parking, live Benga on Saturdays.','Reserve the yard','primary'),footer('Choma Corner Kisumu','Milimani Road, Kisumu.')]),
  pg('Contact','contact',[nav('CHOMA CORNER','Order by the kilo','left'),contact('Find the smoke','Tell us how many and what time.','eat@chomacorner.example','+254 722 801 802','Milimani Road, Kisumu','Reserve'),footer('Choma Corner Kisumu','Milimani Road, Kisumu.')])]});

addBespoke({id:'beadwork-collective',g:'Shop',tag:'Beadwork collective',name:'Enkang Beads',kw:'maasai beadwork jewellery women collective crafts kajiado',desc:'Beaded collars, cuffs and belts by 40 Maasai women in Kajiado.',
 th:{p:'#c8102e',p2:'#1d4ed8',p3:'#f5b800',bg:'#fffaf0',alt:'#f6e7c8',tx:'#2b1209',dark:false,head:'Gloock',body:'Manrope',radius:0,pop:false,deco:true},
 pages:[pg('Home','index',[nav('Enkang Beads','Shop beadwork','center'),hero('split','KAJIADO · MADE BY 40 WOMEN','Every colour is a sentence','Red for bravery, blue for water, white for peace. Each collar takes eight days of stitching and is signed by its maker.','Shop collars','Our story',[A('diamond',811)],'bg'),
  stats([['40','Women artisans'],['8 days','Per collar'],['70%','Of price to maker'],['12','Countries shipped']],'primary'),
  cards('overlay','THE RANGE','Wear a story','',[[A('circles',812),'Collars','From KES 6,500. Wide, flat, 11 rows of beads.'],[A('diamond',813),'Cuffs','From KES 1,800. Stackable and light.'],[A('frame',814),'Belts and sandals','From KES 4,200. Leather and glass bead.']],'alt'),
  split('archleft','MEET MAMA NAISULA','Fifty years at the needle','Naisula taught the first workshop under an acacia in 2014. Today the collective has its own shed, a solar light and a savings group that paid for three girls to finish school.','Read her story',A('person',815),'bg'),
  price('SHIPPING','Posted from Nairobi','',[['Kenya','KES 400','/order','2 to 3 days\nM-Pesa on order'],['East Africa','KES 1,200','/order','5 days\nTracked'],['Worldwide','KES 3,800','/order','7 to 12 days\nDHL',1]],'alt'),
  faq('Questions',[['Is it real glass bead?','Yes, Czech glass beads, never plastic.'],['Can I order a custom colour?','Yes, allow three weeks and a 50% deposit.']]),
  footer('Enkang Beads','Kitengela, Kajiado County.')]),
  pg('Contact','contact',[nav('Enkang Beads','Shop beadwork','center'),contact('Order or visit','Come to the shed on Saturdays, 10 to 4.','shop@enkangbeads.example','+254 711 811 812','Kitengela, Kajiado','Send'),footer('Enkang Beads','Kitengela, Kajiado County.')])]});

addBespoke({id:'kampala-walks',g:'Travel',tag:'Walking tours',name:'Kampala on Foot',kw:'walking tours city kampala history guide boda markets',desc:'Guided walks through Kampala’s markets, hills and history.',
 th:{p:'#e0a100',p2:'#1a1a1a',p3:'#c1121f',bg:'#f6f0e2',alt:'#ebe1c8',tx:'#1a1a1a',dark:false,head:'Young Serif',body:'DM Sans',radius:8},
 pages:[pg('Home','index',[nav('Kampala on Foot','Join a walk','left'),hero('collage','SEVEN HILLS · THREE HOURS · ONE GUIDE','Know the city by its streets','Walk through Owino, climb Namirembe and eat a rolex on the corner where it was invented. Small groups, stories you won’t find online.','Pick a walk','Private groups',[A('city',821),A('road',822),A('hills',823)],'bg'),
  steps('THREE WALKS','Where we go',[['Owino and the Old Taxi Park','Fabric, spare parts and the loudest 4 hectares in Uganda.'],['Hills of Kings','Namirembe, Kasubi and Mengo with a historian.'],['Rolex Trail','Five street kitchens, one very full stomach.']],'alt'),
  split('right','YOUR GUIDES','Born on these hills','All guides grew up within 5 km of the start point and trained with the Uganda Tourism Board. They know who sells the best chapati and which alley to skip.','Meet the guides',A('person',824),'bg'),
  gal('masonry','On the road',[A('city',825),A('road',826),A('fruit',827),A('hills',828)],'alt'),
  price('PRICES','Three ways to walk','',[['Single walk','UGX 60,000','/person','3 hours\nWater and snacks'],['Rolex Trail','UGX 85,000','/person','All food included\nVegetarian option',1],['Private group','UGX 350,000','/group','Up to 8 people\nYour route']],'bg'),
  cta('Next walk leaves Saturday 8am','Meet at Constitution Square. Only 12 places per walk.','Hold my place'),footer('Kampala on Foot','Constitution Square, Kampala.')]),
  pg('Book','contact',[nav('Kampala on Foot','Join a walk','left'),contact('Book a walk','Tell us your date and group size.','walk@kampalaonfoot.example','+256 772 821 822','Constitution Square, Kampala','Book'),footer('Kampala on Foot','Constitution Square, Kampala.')])]});

addBespoke({id:'gorilla-lodge',g:'Travel',tag:'Gorilla lodge',name:'Mist Ridge Lodge, Bwindi',kw:'gorilla trekking lodge bwindi uganda luxury forest',desc:'Eight forest cottages on the edge of Bwindi Impenetrable Forest.',
 th:{p:'#2f4a32',p2:'#c9a24b',p3:'#8a3b2a',bg:'#f3f1e8',alt:'#e3e6d6',tx:'#17231a',dark:false,head:'Cormorant Garamond',body:'Figtree',radius:2,pop:false},
 pages:[pg('Home','index',[nav('Mist Ridge','Check dates','center'),hero('arch','BUHOMA, BWINDI · 2,100 M','Sixty minutes with a mountain gorilla','Eight stone and thatch cottages, a fire at every door and trackers who have followed the Nkuringo family for fifteen years.','Check availability','Gorilla permits',[A('mountain',831)],'bg'),
  split('left','THE STAY','Forest on one side, valley on the other','Each cottage has a log stove, a bath facing the mist and a porch for the 5am bird chorus. Dinner is three courses from the lodge garden.','See the cottages',A('hills',832),'alt'),
  stats([['8','Cottages only'],['15 yrs','Same trackers'],['$1,500','Permit, per person'],['10%','To the Batwa school']],'primary'),
  gal('strip','In the forest',[A('leaf',833),A('mountain',834),A('lamp',835),A('hills',836)],'bg'),
  price('RATES','Per person, full board, 2 sharing','Low season Mar to May and Nov.',[['Low season','$420','/night','Full board\nGuided nature walk'],['High season','$610','/night','Full board\nBatwa cultural visit',1],['Trek package','$3,900','/3 nights','Permit included\nTransfers from Kigali']],'alt'),
  quotes('Guest book',[['She looked at me for a full minute. I have never been so quiet.','Helen A.','London'],['The hot water bottle at turn-down. Perfect after the climb.','Marcus T.','Cape Town']],'bg'),
  footer('Mist Ridge Lodge','Buhoma, Kanungu District, Uganda.')]),
  pg('Enquire','contact',[nav('Mist Ridge','Check dates','center'),contact('Plan your trek','We help with permits, flights and the road from Kampala.','stay@mistridge.example','+256 774 831 832','Buhoma, Kanungu','Enquire'),footer('Mist Ridge Lodge','Buhoma, Kanungu District, Uganda.')])]});

addBespoke({id:'cocoa-bar',g:'Food',tag:'Bean-to-bar chocolate',name:'Mukono Cocoa Co.',kw:'chocolate cocoa bean to bar uganda factory',desc:'Single-origin dark chocolate made from Bundibugyo cocoa.',
 th:{p:'#5a2a1a',p2:'#e8a33d',p3:'#a3c14a',bg:'#fbf3e8',alt:'#f0dcc2',tx:'#2b1409',dark:false,head:'Fraunces',body:'Lexend',radius:14,pop:true,deco:true},
 pages:[pg('Home','index',[nav('Mukono Cocoa','Shop bars','left'),hero('split','BUNDIBUGYO BEANS · MADE IN MUKONO','Chocolate that knows its farmer','Two ingredients, cocoa and cane sugar. We ferment, roast and conch every batch ourselves from 120 smallholder farms.','Shop the bars','Visit the factory',[A('fruit',841)],'bg'),
  cards('grid','THE BARS','Five shades of dark','',[[A('fruit',842),'70% Classic','Fudge, red berry. UGX 14,000'],[A('leaf',843),'85% Intense','Smoke and tobacco. UGX 15,000'],[A('cup',844),'Coffee nib','With Mt Elgon coffee. UGX 16,000'],[A('bloom',845),'Vanilla 62%','Local vanilla pods. UGX 16,000']],'alt'),
  steps('BEAN TO BAR','Nine days from pod to wrapper',[['Ferment','Six days in cedar boxes.'],['Roast','Small batches of 20 kg.'],['Conch','72 hours until silky.'],['Wrap','Hand-wrapped, signed by batch.']],'bg'),
  split('arch','FAIR','Farmers earn 2.4× market','We pay a premium over the Kampala price and publish the number every quarter.','See the accounts',A('field',846),'alt'),
  quotes('Tasting notes',[['Better than the Swiss bar I brought from the airport.','Peter K.','Subscriber'],['The coffee nib bar is dangerous.','Ruth N.','Kampala']],'bg'),
  cta('Factory tours every Saturday at 11am','UGX 25,000 with tasting of five bars.','Book a tour','primary'),footer('Mukono Cocoa Co.','Seeta Road, Mukono.')]),
  pg('Contact','contact',[nav('Mukono Cocoa','Shop bars','left'),contact('Wholesale and tours','We supply cafés, hotels and gift shops.','hello@mukonococoa.example','+256 701 841 842','Seeta Road, Mukono','Send'),footer('Mukono Cocoa Co.','Seeta Road, Mukono.')])]});

addBespoke({id:'dawa-delivery',g:'Health',tag:'Pharmacy delivery app',name:'Dawa Doorstep',kw:'pharmacy medicine delivery app telemedicine nairobi',desc:'Licensed pharmacists, 60-minute medicine delivery in Nairobi.',
 th:{p:'#0e9f6e',p2:'#0f172a',p3:'#38bdf8',bg:'#ffffff',alt:'#effaf5',tx:'#0f172a',dark:false,head:'Lexend',body:'Figtree',radius:24,grad:true},
 pages:[pg('Home','index',[nav('Dawa Doorstep','Get the app','left'),hero('center','PPB LICENSED · NAIROBI','Medicine at your door in 60 minutes','Send a prescription photo, a pharmacist checks it and a rider brings your order sealed, with a receipt your insurer accepts.','Download for Android','How it works',[A('phone',851)],'bg'),
  logos('Insurers accepted',['AAR','Jubilee','Madison','Britam','NHIF'],'alt'),
  steps('HOW IT WORKS','Four taps',[['Snap','Photo of your prescription.'],['Check','A pharmacist calls if anything is unclear.'],['Pay','M-Pesa, card or insurance.'],['Receive','Sealed bag, ID checked at the door.']],'bg'),
  feats('WHY US','Safe first, then fast','',[['🛡️','Licensed only','Every pharmacy partner holds a current PPB licence.'],['❄️','Cold chain','Insulin and vaccines ride in temperature-logged boxes.'],['🔁','Refill reminders','A text a week before you run out.']],'cards','alt'),
  stats([['38','Partner pharmacies'],['52 min','Median delivery'],['4.8','Play Store rating']],'primary'),
  faq('Common questions',[['Do you need a prescription?','For prescription-only medicines, yes. Over the counter items need none.'],['Delivery fee?','KES 150 within Nairobi, free above KES 3,000.']],'bg'),
  cta('First delivery free','Use code DAWA1 at checkout.','Get the app'),footer('Dawa Doorstep','Westlands, Nairobi. PPB licensed.')]),
  pg('Support','contact',[nav('Dawa Doorstep','Get the app','left'),contact('Talk to a pharmacist','Open 7am to 10pm daily.','care@dawadoorstep.example','+254 20 700 851','Westlands, Nairobi','Message'),footer('Dawa Doorstep','Westlands, Nairobi. PPB licensed.')])]});

addBespoke({id:'montessori-nursery',g:'Education',tag:'Nursery school',name:'Little Acacia Nursery',kw:'nursery preschool montessori kids daycare',desc:'A Montessori nursery for ages 2 to 6 in Karen.',
 th:{p:'#f2711c',p2:'#2a9d8f',p3:'#e9c46a',bg:'#fffaf2',alt:'#ffeccf',tx:'#3a2a1a',dark:false,head:'Baloo 2',body:'Outfit',radius:28,pop:true,deco:true},
 pages:[pg('Home','index',[nav('Little Acacia','Book a visit','center'),hero('collage','KAREN · AGES 2 TO 6','Where small hands do big work','A calm, bright Montessori nursery with a vegetable garden, a sandpit and teachers who kneel to talk to your child.','Book a visit','Daily rhythm',[A('balloon',861),A('bloom',862),A('book',863)],'bg'),
  feats('OUR APPROACH','Child-led, adult-guided','',[['🌱','Garden days','Every child waters and picks something each week.'],['🔤','Sand-paper letters','Reading starts with touch, not worksheets.'],['👭','Mixed ages','Older children teach younger ones.']],'cards','alt'),
  split('right','A DAY AT ACACIA','7:30 to 3:30, unhurried','Free work cycle, snack they prepare themselves, outdoor play, story circle. No screens, no stars and stickers.','See the timetable',A('hills',864),'bg'),
  stats([['1:7','Teacher ratio'],['12 yrs','Open in Karen'],['94%','Join top primary schools']],'primary'),
  price('FEES','Per term','',[['Half day','KES 68,000','/term','7:30 to 12:00\nSnack included'],['Full day','KES 96,000','/term','7:30 to 3:30\nHot lunch',1],['Siblings','−10%','','On the second child']],'alt'),
  quotes('Parents',[['My son now tidies his own room. I have questions.','Wanjiru M.','Parent'],['She came home asking for a watering can.','David O.','Parent']],'bg'),
  footer('Little Acacia Nursery','Karen Road, Nairobi.')]),
  pg('Visit','contact',[nav('Little Acacia','Book a visit','center'),contact('Come and see','Tours Tuesdays and Thursdays at 9am.','hello@littleacacia.example','+254 733 861 862','Karen Road, Nairobi','Book tour'),footer('Little Acacia Nursery','Karen Road, Nairobi.')])]});

addBespoke({id:'iten-running-camp',g:'Sport',tag:'Running camp',name:'Iten High Altitude Camp',kw:'running camp iten marathon altitude training athletes kenya',desc:'Two to six week training camps at 2,400 m in Iten.',
 th:{p:'#00b050',p2:'#ff6a00',p3:'#111111',bg:'#f7f7f2',alt:'#e8efe2',tx:'#111111',dark:false,head:'Archivo Black',body:'DM Mono',radius:0,pop:false},
 pages:[pg('Home','index',[nav('ITEN CAMP','Apply','left'),hero('cover','ITEN · 2,400 M · ELGEYO MARAKWET','Run where the fastest run','Train beside Olympic champions on red dirt roads. Coaches, rooms, meals and recovery in one house at the edge of the Rift.','Apply for a camp','See the week',[A('mountain',871)],'alt'),
  stats([['2,400 m','Altitude'],['11','World-class coaches'],['40 km','Of dirt trails'],['6','Runners per room max']],'primary'),
  steps('A TRAINING WEEK','Monday to Sunday',[['Mon','Easy 12 km at dawn, strength after lunch.'],['Wed','Track at Kamariny Stadium.'],['Fri','Fartlek on the Tambach hill.'],['Sun','Long run 30 km, then rest.']],'bg'),
  gal('grid','Camp life',[A('road',872),A('hills',873),A('plate',874),A('circles',875)],'alt'),
  price('PRICES','Includes room, 3 meals, coaching','',[['2 weeks','$890','/person','Shared room\nFull programme'],['4 weeks','$1,590','/person','Shared room\nPhysio included',1],['6 weeks','$2,250','/person','Private room\nRace entry help']],'bg'),
  faq('Before you fly',[['Do I need to be fast?','No. Groups run by pace, from 7 min/km to 3:20.'],['Airport pickup?','Yes, from Eldoret, $40 each way.']],'alt'),
  footer('Iten High Altitude Camp','Kamariny Road, Iten.')]),
  pg('Apply','contact',[nav('ITEN CAMP','Apply','left'),contact('Apply for a camp','Tell us your best 10 km and your dates.','run@itencamp.example','+254 722 871 872','Kamariny Road, Iten','Apply'),footer('Iten High Altitude Camp','Kamariny Road, Iten.')])]});

addBespoke({id:'garden-wedding-venue',g:'Events',tag:'Wedding venue',name:'Jacaranda Gardens',kw:'wedding venue garden outdoor ceremony naivasha reception',desc:'A lakeside garden wedding venue in Naivasha for up to 250 guests.',
 th:{p:'#7b5ea7',p2:'#d4a373',p3:'#9bb89a',bg:'#fdfaf6',alt:'#f1ebf4',tx:'#2d2236',dark:false,head:'Libre Caslon Text',body:'Manrope',radius:10,pop:false},
 pages:[pg('Home','index',[nav('Jacaranda Gardens','Check a date','center'),hero('arch','NAIVASHA · LAKESIDE','Say yes under a thousand blossoms','Two acres of lawn, a lake view ceremony deck and a glass reception hall for 250. In October the jacarandas do the decorating.','Check a date','Request the brochure',[A('bloom',881)],'bg'),
  gal('mosaic','Real weddings',[A('bloom',882),A('hills',883),A('heart',884),A('lamp',885)],'alt'),
  split('left','WHAT’S INCLUDED','The whole day, in one place','Tables, linen, a sound system, a bridal suite, a groom’s cottage and a coordinator who stays until the last dance.','See the package',A('house',886),'bg'),
  price('PACKAGES','Venue hire, Friday to Sunday','',[['Garden ceremony','KES 180,000','','Up to 80 guests\nCeremony deck'],['Full day','KES 420,000','','Up to 250\nCoordinator, bridal suite',1],['Weekend','KES 780,000','','Two nights on site\nBreakfast the next day']],'alt'),
  quotes('Just married',[['The lake went gold at exactly the right moment.','Ivy & Brian','June wedding'],['Our grandmother cried from the front row.','Sarah & Kim','March wedding']],'bg'),
  faq('Planning',[['Can we bring our caterer?','Yes, from our approved list or yours with a KES 15,000 fee.'],['Rain plan?','The glass hall is always held for you.']],'alt'),
  footer('Jacaranda Gardens','South Lake Road, Naivasha.')]),
  pg('Enquire','contact',[nav('Jacaranda Gardens','Check a date','center'),contact('Check your date','Weekends book 14 months ahead.','events@jacaranda.example','+254 722 881 882','South Lake Road, Naivasha','Check'),footer('Jacaranda Gardens','South Lake Road, Naivasha.')])]});

addBespoke({id:'diani-villa',g:'Travel',tag:'Beach villa rental',name:'Villa Kobe, Diani',kw:'villa rental diani beach private pool holiday home',desc:'A private five-bedroom villa 200 steps from Diani Beach.',
 th:{p:'#0097a7',p2:'#ff7043',p3:'#ffd166',bg:'#fffdf8',alt:'#e0f4f1',tx:'#0b3138',dark:false,head:'Bricolage Grotesque',body:'DM Sans',radius:32,pop:true,grad:true},
 pages:[pg('Home','index',[nav('Villa Kobe','Check dates','left'),hero('collage','DIANI BEACH · SLEEPS 10','Your own pool, 200 steps from the sea','Five en-suite bedrooms, a chef who comes at 8am, a pool lit at night and a hammock for every guest.','Check dates','Take the tour',[A('beach',891),A('house',892),A('waves',893)],'bg'),
  feats('INCLUDED','Nothing to organise','',[['🍳','Chef and housekeeper','Breakfast cooked every morning.'],['🏊','Pool and garden','12 m pool, solar heated.'],['🚗','Transfers','Ukunda airstrip and Moi airport pickup.']],'cards','alt'),
  split('archleft','THE HOUSE','Coral stone and makuti thatch','Built in 2019 with local craftsmen. Wide verandas, outdoor shower in every room, a rooftop for sundowners.','Photo gallery',A('house',894),'bg'),
  price('NIGHTLY RATES','Whole villa','',[['Green season','$480','/night','Apr to Jun'],['Peak','$890','/night','Dec 20 to Jan 5',1],['Shoulder','$640','/night','Jul to Nov']],'alt'),
  quotes('Guest reviews',[['Ten of us, one holiday, zero arguments.','The Mwangis','Easter'],['The chef’s coconut fish ruined restaurants for us.','Lena & Ola','Dec']],'bg'),
  cta('Easter is 70% booked','Hold your dates for 48 hours, no deposit.','Hold my dates'),footer('Villa Kobe','Diani Beach Road, Kwale.')]),
  pg('Enquire','contact',[nav('Villa Kobe','Check dates','left'),contact('Ask about dates','We reply within the hour.','stay@villakobe.example','+254 700 891 892','Diani Beach Road','Ask'),footer('Villa Kobe','Diani Beach Road, Kwale.')])]});

addBespoke({id:'paint-colour-shop',g:'Shop',tag:'Paint shop',name:'Rangi Paints Thika',kw:'paint shop colour mixing hardware decorators thika',desc:'Computer colour matching and wall paint for homes and builders in Thika.',
 th:{p:'#e63946',p2:'#1d3557',p3:'#f1c40f',bg:'#ffffff',alt:'#f1f5f9',tx:'#1d3557',dark:false,head:'Rubik',body:'Rubik',radius:12,pop:true},
 pages:[pg('Home','index',[nav('Rangi Paints','Get a quote','left'),hero('split','THIKA ROAD · SINCE 2004','Bring a petal, we’ll match the wall','Our scanner reads any sample, a tile, a cushion, a flower, and mixes the exact tin in six minutes.','Match a colour','Price list',[A('paint',901)],'bg'),
  cards('grid','TINS','Choose your finish','',[[A('paint',902),'Matt emulsion','4 L from KES 2,400. Bedrooms and ceilings.'],[A('house',903),'Silk','4 L from KES 3,100. Living rooms, easy to wipe.'],[A('shop',904),'Weather guard','20 L from KES 14,500. Outdoor walls, 10 year guarantee.']],'alt'),
  steps('HOW MUCH?','Paint calculator in four lines',[['Measure','Length times height of each wall.'],['Subtract','Doors and windows.'],['Divide','One litre covers 10 m² per coat.'],['Add 10%','For touch-ups later.']],'bg'),
  stats([['1,800','Colours in the book'],['6 min','To mix a match'],['20 yrs','In Thika']],'primary'),
  quotes('Painters say',[['No more batch differences, ever.','Fundi Kamau','Decorator'],['They mixed the exact green of my mother’s kitchen.','Esther W.','Homeowner']],'alt'),
  footer('Rangi Paints Thika','Kenyatta Highway, Thika.')]),
  pg('Contact','contact',[nav('Rangi Paints','Get a quote','left'),contact('Get a quote','Send room sizes and a photo.','shop@rangipaints.example','+254 711 901 902','Kenyatta Highway, Thika','Request'),footer('Rangi Paints Thika','Kenyatta Highway, Thika.')])]});

addBespoke({id:'water-tank-maker',g:'Industry',tag:'Water tank manufacturer',name:'Maji Mingi Tanks',kw:'water tank plastic manufacturer rainwater harvesting kenya',desc:'Rotomoulded water tanks from 500 to 20,000 litres, delivered across Kenya.',
 th:{p:'#0a5ca8',p2:'#00c2d1',p3:'#ffb703',bg:'#f4f9fc',alt:'#dcecf6',tx:'#08243d',dark:false,head:'Space Mono',body:'Manrope',radius:6,pop:false,grad:true},
 pages:[pg('Home','index',[nav('MAJI MINGI','Get delivery price','left'),hero('cover','ATHI RIVER · DELIVERED IN 48 HOURS','A tank that outlasts the roof it fills from','UV-stabilised, food-grade, 10 year warranty. From 500 litres for a kiosk to 20,000 for a school.','See sizes','Rainwater guide',[A('waves',911)],'alt'),
  price('SIZES','Delivered within Nairobi','Prices include a free delivery within 30 km.',[['1,000 L','KES 11,500','','Vertical\nBlack or green'],['5,000 L','KES 49,000','','Vertical\n10 year warranty',1],['10,000 L','KES 92,000','','Vertical\nFree install advice']],'bg'),
  split('left','RAIN CALCULATOR','A 100 m² roof gives 80,000 litres a year','At 1,000 mm of rain a year, even a small iron sheet roof fills a 5,000 L tank four times. We’ll size gutters and first-flush filters for you.','Get a design',A('hills',912),'alt'),
  stats([['38,000','Tanks installed'],['10 yrs','Warranty'],['47','Counties delivered']],'primary'),
  faq('Questions',[['Black or green?','Black blocks light and stops algae, our recommendation.'],['Do you install stands?','Yes, steel or concrete from KES 7,000.']],'bg'),
  cta('Schools and farms: bulk prices from 5 tanks','Ask for the 2026 trade list.','Request trade list'),footer('Maji Mingi Tanks','Athi River Industrial Area.')]),
  pg('Contact','contact',[nav('MAJI MINGI','Get delivery price','left'),contact('Order or enquire','Give your county and tank size.','sales@majimingi.example','+254 20 911 912','Athi River Industrial Area','Request price'),footer('Maji Mingi Tanks','Athi River Industrial Area.')])]});

addBespoke({id:'greenhouse-tomatoes',g:'Farm',tag:'Greenhouse farm',name:'Kijani Greenhouse Farms',kw:'greenhouse tomatoes farm kiambu drip hydroponic supplier',desc:'Greenhouse tomatoes, capsicum and cucumbers for supermarkets and hotels.',
 th:{p:'#d62828',p2:'#386641',p3:'#fcbf49',bg:'#fcfbf3',alt:'#e8f0dc',tx:'#1f2a17',dark:false,head:'Figtree',body:'Figtree',radius:16,pop:true,deco:true},
 pages:[pg('Home','index',[nav('Kijani Farms','Wholesale','center'),hero('arch','LIMURU · 14 GREENHOUSES','Tomatoes picked at red, not shipped at green','We grow under drip irrigation, spray less and harvest daily at 6am. Supermarkets get them by noon.','Wholesale prices','Farm visit',[A('fruit',921)],'bg'),
  cards('overlay','THE HARVEST','What we grow','',[[A('fruit',922),'Tomatoes','Anna F1. KES 70 /kg wholesale.'],[A('leaf',923),'Capsicum','Red, yellow, green. KES 120 /kg.'],[A('field',924),'Cucumbers','Long English type. KES 60 /kg.']],'alt'),
  steps('FIELD TO SHELF','Under 8 hours',[['06:00','Picked and graded.'],['08:00','Cooled and crated.'],['09:30','On the van to Nairobi.'],['12:00','On the shelf.']],'bg'),
  stats([['14','Greenhouses'],['2 t','Daily harvest'],['70%','Less water than open field']],'primary'),
  split('right','FARM VISITS','Pick your own on the first Saturday','Bring the children and a basket. KES 500 each, tomatoes by the bag, and a roasted maize on the way out.','Join a visit',A('hills',925),'alt'),
  faq('Trade',[['Minimum order?','50 kg, delivered Tuesday to Saturday.'],['Payment terms?','Cash on delivery, or 14 days for established accounts.']],'bg'),
  footer('Kijani Greenhouse Farms','Limuru, Kiambu County.')]),
  pg('Trade','contact',[nav('Kijani Farms','Wholesale','center'),contact('Open a trade account','Hotels, supermarkets and caterers welcome.','sales@kijanifarms.example','+254 722 921 922','Limuru, Kiambu','Request'),footer('Kijani Greenhouse Farms','Limuru, Kiambu County.')])]});

addBespoke({id:'swahili-cooking-class',g:'Food',tag:'Cooking class',name:'Pilau & Pepper Cooking School',kw:'swahili cooking class mombasa old town spices food tour',desc:'Hands-on Swahili cooking classes in a Mombasa Old Town courtyard.',
 th:{p:'#b4411c',p2:'#e9b44c',p3:'#1f6f5c',bg:'#fbf1e1',alt:'#f3dfbd',tx:'#35180d',dark:false,head:'DM Serif Display',body:'Figtree',radius:8,pop:false,deco:true},
 pages:[pg('Home','index',[nav('Pilau & Pepper','Book a class','center'),hero('split','OLD TOWN, MOMBASA · 4 HOURS','Learn to cook the coast, in a coast kitchen','Grind your own masala, fold samosas and simmer biryani with Mama Zuhura in her family courtyard off Mbarak Hinawy Road.','Book a class','See the menu',[A('plate',931)],'bg'),
  menu('This week’s class menu','Four dishes, eaten together at the end.',[['Biryani ya Kuku','Rice, chicken and fried onion layers','Main'],['Mkate wa Mayai','Egg-stuffed fried flatbread','Starter'],['Samaki wa Kupaka','Fish in coconut and tamarind','Side'],['Mahamri & chai','Cardamom doughnuts, spiced tea','Sweet']],'alt'),
  gal('masonry','In the courtyard',[A('plate',932),A('cup',933),A('fruit',934),A('lamp',935)],'bg'),
  split('archleft','YOUR TEACHER','Mama Zuhura, 41 years at the stove','She learned from her grandmother, cooked for dhow captains and now teaches visitors that cardamom goes in last.','About Zuhura',A('person',936),'alt'),
  price('CLASSES','Per person, lunch included','',[['Morning class','$55','','9 to 1\nMarket visit'],['Spice tour + class','$75','','8 to 2\nBuy spices at cost',1],['Private','$220','/group','Up to 4 people']],'bg'),
  quotes('Students',[['I now own a pestle. My life changed.','Karin S.','Stockholm'],['Best meal of our two weeks in Kenya.','Dev & Mira','Mumbai']],'alt'),
  footer('Pilau & Pepper Cooking School','Mbarak Hinawy Road, Old Town, Mombasa.')]),
  pg('Book','contact',[nav('Pilau & Pepper','Book a class','center'),contact('Book your place','Max 8 people per class. Tell us any allergies.','cook@pilaupepper.example','+254 722 931 932','Mbarak Hinawy Road, Mombasa','Book'),footer('Pilau & Pepper Cooking School','Mbarak Hinawy Road, Old Town, Mombasa.')])]});

addBespoke({id:'karate-dojo',g:'Sport',tag:'Karate dojo',name:'Shotokan Dojo Nakuru',kw:'karate dojo martial arts kids classes nakuru belt',desc:'Traditional Shotokan karate for children and adults in Nakuru.',
 th:{p:'#111111',p2:'#d00000',p3:'#c9c9c9',bg:'#f5f3ee',alt:'#e6e2d8',tx:'#111111',dark:false,head:'Syne',body:'DM Mono',radius:0,pop:false},
 pages:[pg('Home','index',[nav('SHOTOKAN NAKURU','Free trial','left'),hero('center','NAKURU · TRAINING SINCE 1998','Respect is the first kata','Disciplined, joyful training for ages 5 to 65. Three black belts teach every class and no one is ever rushed to a belt.','Book a free class','Class times',[],'bg'),
  steps('THE BELTS','From white to black in about five years',[['White to yellow','First six months. Stance and basics.'],['Orange to green','Kata and controlled sparring.'],['Brown','Teaching younger students.'],['Black','Shodan, with a national grading panel.']],'alt'),
  gal('strip','Dojo days',[A('person',941),A('circles',942),A('columns',943),A('person',944)],'bg'),
  price('CLASSES','Monthly','',[['Kids 5 to 12','KES 2,500','','Tue and Thu 5pm\nUniform KES 1,800'],['Teens and adults','KES 3,500','','Mon, Wed, Fri 6:30pm',1],['Family of 3','KES 7,500','','Any class mix']],'alt'),
  faq('Parents ask',[['Is it safe?','Light contact only below brown belt. Mouth guards and pads are required.'],['Will my child become aggressive?','The opposite. We start every class with a bow and a talk on respect.']],'bg'),
  cta('Next belt grading: 14 November','Open to families. Free entry, tea and mandazi after.','Come and watch'),footer('Shotokan Dojo Nakuru','Kenyatta Avenue, Nakuru.')]),
  pg('Join','contact',[nav('SHOTOKAN NAKURU','Free trial','left'),contact('Book a free class','No uniform needed for the first week.','osu@shotokannakuru.example','+254 733 941 942','Kenyatta Avenue, Nakuru','Book'),footer('Shotokan Dojo Nakuru','Kenyatta Avenue, Nakuru.')])]});

addBespoke({id:'plant-nursery',g:'Shop',tag:'Plant nursery',name:'Mbegu Plant Nursery',kw:'plant nursery garden indoor plants landscaping trees nairobi',desc:'Indoor plants, fruit trees and garden design in Ngong.',
 th:{p:'#2d6a4f',p2:'#e76f51',p3:'#95d5b2',bg:'#fafaf5',alt:'#e4efe4',tx:'#142b20',dark:false,head:'Instrument Serif',body:'Outfit',radius:22,pop:true},
 pages:[pg('Home','index',[nav('Mbegu','Visit the nursery','left'),hero('collage','NGONG ROAD · OPEN DAILY 8 TO 5','Green things, grown here','Monstera, avocado saplings, bougainvillea and 400 other plants raised in our own shade houses, not trucked in from Thailand.','Browse plants','Garden design',[A('leaf',951),A('bloom',952),A('field',953)],'bg'),
  cards('grid','FAVOURITES','Start with these','',[[A('leaf',954),'Snake plant','From KES 600. Survives anything.'],[A('fruit',955),'Hass avocado','Grafted, KES 450. Fruit in 3 years.'],[A('bloom',956),'Bougainvillea','KES 800. Colour all year.'],[A('leaf',957),'Monstera','KES 2,500. Big leaves.']],'alt'),
  split('left','GARDEN DESIGN','From bare compound to a place you want to sit','We visit, measure, draw and plant. Typical balcony garden KES 25,000, compound makeover from KES 120,000.','Book a site visit',A('hills',958),'bg'),
  stats([['400+','Plant varieties'],['9 yrs','Growing in Ngong'],['6,000','Trees planted for schools']],'primary'),
  faq('Plant care',[['How often to water indoor plants?','Once the top 3 cm of soil is dry, usually weekly.'],['Do you deliver?','Yes, KES 800 in Nairobi, free above KES 8,000.']],'bg'),
  footer('Mbegu Plant Nursery','Ngong Road, Nairobi.')]),
  pg('Visit','contact',[nav('Mbegu','Visit the nursery','left'),contact('Visit or ask','Bring a photo of your space and we’ll suggest plants.','grow@mbegu.example','+254 722 951 952','Ngong Road, Nairobi','Ask'),footer('Mbegu Plant Nursery','Ngong Road, Nairobi.')])]});

addBespoke({id:'used-car-yard',g:'Auto',tag:'Used car yard',name:'Barabara Motors Mombasa',kw:'used cars yard dealership mombasa japan import vitz',desc:'Inspected used Toyotas and Subarus, direct from Japan, in Mombasa.',
 th:{p:'#ff4b00',p2:'#0e1b2c',p3:'#ffd23f',bg:'#eef1f4',alt:'#dde3ea',tx:'#0e1b2c',dark:false,head:'Anton',body:'Rubik',radius:6,pop:true},
 pages:[pg('Home','index',[nav('BARABARA MOTORS','View stock','left'),hero('cover','NYALI · MOMBASA · 120 CARS ON THE YARD','Every car inspected, every mileage proven','Auction sheets shown before you pay. Free 90-day engine and gearbox cover. Ready for transfer in 24 hours.','View stock','Finance options',[A('car',961)],'alt'),
  cards('grid','THIS WEEK','Fresh on the yard','',[[A('car',962),'Toyota Vitz 2017','72,000 km. KES 1,090,000'],[A('car',963),'Subaru Forester 2015','88,000 km. KES 1,850,000'],[A('car',964),'Mazda Demio 2018','41,000 km. KES 1,150,000']],'bg'),
  steps('HOW WE BUY','Three checks before it hits the yard',[['Auction sheet','Grade 4 or better only.'],['Mileage','Cross-checked with Japan export certificate.'],['Mechanic','Our 62-point check before sale.']],'alt'),
  stats([['3,100','Cars sold'],['90 days','Mechanical cover'],['24 hrs','To transfer']],'primary'),
  price('FINANCING','Pay over time with our partner banks','',[['Cash','0%','','Discount KES 20,000'],['Bank loan','13.5%','/yr','60 months\nFrom 20% deposit',1],['Sacco','11%','/yr','Members only']],'bg'),
  faq('Buyer tips',[['Can I bring my own mechanic?','Always. Test drives are free.'],['Do you take trade-ins?','Yes, same-day valuation.']],'alt'),
  footer('Barabara Motors','Links Road, Nyali, Mombasa.')]),
  pg('Visit','contact',[nav('BARABARA MOTORS','View stock','left'),contact('Visit the yard','Open Monday to Saturday, 8:30 to 6.','sales@barabara.example','+254 722 961 962','Links Road, Nyali','Ask'),footer('Barabara Motors','Links Road, Nyali, Mombasa.')])]});

addBespoke({id:'ticket-app',g:'Tech',tag:'Event ticketing app',name:'Tiketi Pap',kw:'event ticketing app tickets mpesa concerts qr organisers',desc:'Sell event tickets with M-Pesa and scan entry with any phone.',
 th:{p:'#7c3aed',p2:'#f43f5e',p3:'#22d3ee',bg:'#0b0618',alt:'#150d2a',tx:'#f3ecff',dark:true,head:'Unbounded',body:'Sora',radius:20,grad:true,pop:true},
 pages:[pg('Home','index',[nav('Tiketi','Start selling','left'),hero('center','FOR ORGANISERS IN KENYA, UGANDA, TANZANIA','Sell out the room. Not the paperwork.','Create an event in 4 minutes, collect M-Pesa, Airtel Money and cards, and check people in with the camera on any phone.','Create an event','See a demo',[A('music',971)],'bg'),
  stats([['2.1M','Tickets sold'],['4 min','To publish an event'],['0','Fake tickets']],'primary'),
  feats('FOR ORGANISERS','Everything on one dashboard','',[['📲','Mobile money','STK push at checkout. Settlement next day.'],['🔍','QR scan','Offline scanning works without signal.'],['📊','Live sales','See who bought and from which link.']],'cards','alt'),
  price('PRICING','No monthly fee','You pay only when you sell.',[['Free events','KES 0','','Unlimited tickets'],['Paid events','4.5%','+ KES 20','Per ticket\nPaid by buyer or you',1],['Big shows','Custom','','Dedicated support\nPriority settlement']],'bg'),
  quotes('Organisers',[['We sold 3,800 tickets for Kilifi Sunset in a weekend.','Jomo A.','Festival director'],['Door queue went from 40 minutes to 6.','Grace T.','Gala host']],'alt'),
  faq('FAQ',[['When do I get my money?','Next business day by M-Pesa or bank.'],['What if there’s no internet at the gate?','Scan offline, sync later.']],'bg'),
  cta('Run your next event on Tiketi','First event, zero fees.','Create an event'),footer('Tiketi Pap','Kilimani, Nairobi.')]),
  pg('Contact','contact',[nav('Tiketi','Start selling','left'),contact('Talk to us','Planning a big show? We’ll set it up with you.','hi@tiketipap.example','+254 700 971 972','Kilimani, Nairobi','Contact'),footer('Tiketi Pap','Kilimani, Nairobi.')])]});

addBespoke({id:'plastic-upcycle',g:'Eco',tag:'Plastic recycling',name:'Taka Mpya Upcycle',kw:'plastic recycling upcycle pavers sustainability eco dar es salaam',desc:'Turning plastic waste into paving blocks, benches and fence posts in Dar es Salaam.',
 th:{p:'#9bf542',p2:'#ff7a00',p3:'#5de0e6',bg:'#0f1411',alt:'#18211b',tx:'#e8f2e4',dark:true,head:'Space Mono',body:'Lexend',radius:3,pop:false,deco:true},
 pages:[pg('Home','index',[nav('TAKA MPYA','Sell us plastic','left'),hero('split','KINYEREZI · DAR ES SALAAM','Today’s bottle is tomorrow’s paving stone','We collect 18 tonnes of plastic a month from 600 waste pickers and press it into blocks that last 40 years.','Sell plastic','Buy blocks',[A('stones',981)],'bg'),
  stats([['18 t','Plastic a month'],['600','Waste pickers paid'],['TZS 600','Per kg to pickers']],'primary'),
  steps('THE LOOP','From bin to bench',[['Collect','Pickers weigh in at 14 depots.'],['Wash','Sorted by type, shredded.'],['Press','Melted and moulded into blocks.'],['Install','Paving, benches, fence posts.']],'alt'),
  cards('overlay','PRODUCTS','Built from waste','',[[A('stones',982),'Paving blocks','TZS 6,500 each. Heavy duty.'],[A('columns',983),'Fence posts','TZS 18,000. Do not rot or burn.'],[A('house',984),'Park benches','TZS 280,000. Seats four.']],'bg'),
  split('right','FOR BUSINESSES','Take back your own waste','We supply collection bins, a monthly weigh report and a certificate you can use in sustainability reports.','Ask for a pilot',A('city',985),'alt'),
  faq('Questions',[['Which plastics do you take?','PET, HDPE and LDPE. No PVC.'],['Are the blocks safe?','Tested for load and fire by TBS.']],'bg'),
  footer('Taka Mpya Upcycle','Kinyerezi, Dar es Salaam.')]),
  pg('Contact','contact',[nav('TAKA MPYA','Sell us plastic','left'),contact('Work with us','Pickers, buyers and partners all welcome.','info@takampya.example','+255 713 981 982','Kinyerezi, Dar es Salaam','Send'),footer('Taka Mpya Upcycle','Kinyerezi, Dar es Salaam.')])]});

addBespoke({id:'board-game-cafe',g:'Food',tag:'Board game café',name:'Zamu Board Game Café',kw:'board game cafe cards chess kigali coffee games',desc:'Two hundred board games, good coffee and snacks in Kigali.',
 th:{p:'#f4a261',p2:'#264653',p3:'#e76f51',bg:'#fff8ec',alt:'#fbe7c6',tx:'#264653',dark:false,head:'Young Serif',body:'Baloo 2',radius:18,pop:true,deco:true},
 pages:[pg('Home','index',[nav('Zamu Café','Reserve a table','center'),hero('arch','KIGALI · KACYIRU','It’s your turn. Order a coffee first.','Two hundred board games, a hosts team who teach every rule and a kitchen that sends out pizza between rounds.','Reserve a table','See the games',[A('cup',991)],'bg'),
  feats('HOW IT WORKS','Pay for the table, not the game','',[['🎲','200 games','From Catan to Kigali-made Imbaraga.'],['🧑‍🏫','Game hosts','Someone teaches you in five minutes.'],['🍕','Food and coffee','Rwandan beans, wood-fired pizza.']],'cards','alt'),
  price('TABLE FEES','Per person','',[['Weekday','RWF 1,500','','All day, any game'],['Weekend','RWF 2,500','','Includes a drink',1],['Group of 8+','RWF 1,800','','Private room, 3 hours']],'bg'),
  gal('mosaic','Game night',[A('circles',992),A('grid',993),A('cup',994),A('person',995)],'alt'),
  quotes('Regulars',[['We came for one hour and stayed four.','Aline M.','Tuesday regular'],['Great for team nights, no awkward icebreakers.','Eric N.','Company host']],'bg'),
  cta('Thursday is tournament night','Free entry, prizes from local makers.','Join the next one','primary'),footer('Zamu Board Game Café','KG 11 Ave, Kacyiru, Kigali.')]),
  pg('Visit','contact',[nav('Zamu Café','Reserve a table','center'),contact('Reserve a table','Groups of 8 or more: book the private room.','play@zamu.example','+250 788 991 992','KG 11 Ave, Kacyiru','Reserve'),footer('Zamu Board Game Café','KG 11 Ave, Kacyiru, Kigali.')])]});
}
