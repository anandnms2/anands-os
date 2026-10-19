/* Batch 2: 20 more hand-designed website templates. */
{const {nav,hero,feats,split,gal,stats,quotes,price,faq,cta,contact,footer,team,cards,menu,steps,text,logos,blog,wa,pg}=B_,A=a_;

addBespoke({id:'mobile-vet',g:'Health',tag:'Mobile vet',name:'Paws on Wheels Vet',kw:'vet animals dog cat clinic home visit',desc:'A vet who comes to your gate in Karen and Runda.',
 th:{p:'#0f8b6d',p2:'#ff9f1c',p3:'#2d3a8c',bg:'#f6fbf8',alt:'#dff2ea',tx:'#10302a',dark:false,head:'Baloo 2',body:'Figtree',radius:22,pop:true},
 pages:[pg('Home','index',[nav('Paws on Wheels','Book a visit','left'),hero('split','NAIROBI · KAREN · RUNDA · LAVINGTON','The vet that parks outside your gate','Vaccines, check-ups, microchips and sick-day visits in your own garden. Calmer pets, no matatu-and-carrier stress.','Book a visit','See prices',[A('paw',201)],'alt'),
  feats('HOME VISITS','Why owners switch',' ',[['🚐','We come to you','Fully equipped van, visits in a 20 km radius.'],['🐕','Gentler for pets','No waiting room, no strange smells, no panic.'],['📋','Records on WhatsApp','Vaccine card and notes sent the same day.']]),
  price('PRICES','Honest, flat visit fees','Medication and lab work billed at cost.',[['Check-up','KES 3,500','/visit','Full exam\nWeight and diet advice\nVaccine card update'],['Vaccine day','KES 5,800','/visit','Core vaccines\nDeworming\nFlea and tick plan',1],['Senior care','KES 7,500','/visit','Blood panel\nJoint check\nPain plan']],'alt'),
  split('archleft','DR. WANJIKU','Twelve years treating the animals Nairobi loves','From Labradors to rescue kittens and one very opinionated parrot, Dr. Wanjiku Kamau runs every visit herself.','Meet the vet',A('person',202)),
  quotes('Happy owners',[['Biscuit usually hides under the car. Today she slept through her jab.','Naomi G.','Karen'],['They came at 7pm on a Sunday for our sick puppy.','Rajiv P.','Lavington'],['Clear prices, kind hands.','Esther W.','Runda']]),
  cta('Pet not eating? Call before noon','We do same-day visits Monday to Saturday.','Call the van'),footer('Paws on Wheels Vet','Mobile practice, Karen, Nairobi.','dark')]),
  pg('Contact','contact',[nav('Paws on Wheels','Book a visit','left'),contact('Book a visit','Tell us your estate, your pet and what is wrong.','vet@pawswheels.example','+254 733 201 202','Karen Road, Nairobi','Request visit'),footer('Paws on Wheels Vet','Mobile practice, Karen, Nairobi.','dark')])]});

addBespoke({id:'vintage-furniture',g:'Retail',tag:'Vintage furniture',name:'Mtindo Mkongwe',kw:'vintage antique furniture restored teak chairs',desc:'Restored teak and mahogany furniture, one of each.',
 th:{p:'#7a2e1d',p2:'#c9a24b',p3:'#3d4a3a',bg:'#f1e8da',alt:'#e5d7bf',tx:'#2b1a12',dark:false,head:'Gloock',body:'Libre Caslon Text',radius:2,pop:false},
 pages:[pg('Shop','index',[nav('Mtindo Mkongwe','Visit the barn','center'),hero('cover','MSASANI · DAR ES SALAAM','Old wood. New stories.','We rescue teak and mahogany pieces from colonial houses, mend them by hand and sell each one once.','See this week’s pieces','',[A('lamp',211)],'alt'),
  cards('overlay','NEW IN','Just out of the workshop','',[[A('lamp',212),'Zanzibar chest','Brass-bound camphor chest, 1930s. TSh 1,450,000'],[A('house',213),'Planter’s chair','Teak with cane seat, restored. TSh 680,000'],[A('frame',214),'Mirror cabinet','Mahogany, bevelled glass. TSh 920,000']]),
  steps('THE WORKSHOP','From wreck to heirloom',[['Found','Bought from estates in Tanga and Mombasa.'],['Stripped','Old varnish off, worm treated, joints re-glued.'],['Finished','Hand-rubbed beeswax, never spray lacquer.']],'alt'),
  split('right','ABOUT','Three carpenters and a very patient polisher','Mzee Salum has repaired furniture for fifty years. His apprentices now learn on every piece that comes through the gate.','Our story',A('stones',215)),
  quotes('Customers',[['The chest looks like it has always lived in our hallway.','Fatma & Greg','Mikocheni'],['They found me a matching pair of chairs in six weeks.','Dr. Nyerere','Oyster Bay']],'alt'),
  footer('Mtindo Mkongwe','Showroom open Tuesday to Saturday, 10am to 5pm.','dark')]),
  pg('Visit','contact',[nav('Mtindo Mkongwe','Visit the barn','center'),contact('Visit the barn','Delivery across Dar es Salaam from TSh 40,000.','pieces@mtindo.example','+255 712 211 215','Haile Selassie Road, Msasani','Send enquiry'),footer('Mtindo Mkongwe','Showroom open Tuesday to Saturday, 10am to 5pm.','dark')])]});

addBespoke({id:'bookshop-cafe',g:'Food',tag:'Bookshop cafe',name:'Ukurasa Books & Brew',kw:'books bookshop cafe reading coffee club',desc:'Bookshop, coffee and a Thursday reading club in Kampala.',
 th:{p:'#1f4e5f',p2:'#e07a5f',p3:'#f2cc8f',bg:'#fbf6ee',alt:'#f0e6d3',tx:'#1d2b30',dark:false,head:'Young Serif',body:'Manrope',radius:12,pop:true},
 pages:[pg('Home','index',[nav('Ukurasa','Join book club','left'),hero('center','NAKASERO HILL · KAMPALA','Turn the page, order a latte','12,000 books, mostly African writers, and a cafe that closes only when the last chapter does.','Browse the shelves','Book club',[],'bg'),
  gal('strip','Inside the shop',[A('book',221),A('cup',222),A('lamp',223),A('frame',224)]),
  split('left','THE SHELVES','Stories from Lagos to Lusaka','A whole wall for East African fiction, a children’s corner with floor cushions and a table of staff picks that changes every Monday.','See staff picks',A('book',225),'alt'),
  menu('From the counter','Coffee from Mount Elgon, cakes baked daily.',[['Flat white','Elgon beans','UGX 9,000'],['Cardamom chai','Spiced, with jaggery','UGX 7,000'],['Banana bread','Warm, with butter','UGX 8,000'],['Reader’s lunch','Soup, roll and a pot of tea','UGX 22,000']]),
  steps('THURSDAYS','Book club, 6:30pm',[['Pick','One title a month, voted on by members.'],['Read','Copies at 15% off for the group.'],['Talk','Wine, tea and honest opinions.']],'alt'),
  quotes('Readers',[['I came in for a pen and left with four novels.','Grace A.','Regular'],['Best quiet table in Kampala.','Brian S.','Writer']]),
  footer('Ukurasa Books & Brew','Plot 8, Acacia Avenue, Kampala.')]),
  pg('Contact','contact',[nav('Ukurasa','Join book club','left'),contact('Say hello','Ask us to find a title or host your launch.','read@ukurasa.example','+256 772 221 225','Acacia Avenue, Kampala'),footer('Ukurasa Books & Brew','Plot 8, Acacia Avenue, Kampala.')])]});

addBespoke({id:'urban-farm',g:'Food',tag:'Urban farm',name:'Mboga Rooftop Farm',kw:'urban farm vegetables rooftop organic box delivery',desc:'Rooftop vegetables delivered within hours of picking.',
 th:{p:'#3a7d20',p2:'#f4d03f',p3:'#e0561c',bg:'#fbfdf5',alt:'#e7f1d3',tx:'#14240c',dark:false,head:'Fraunces',body:'Rubik',radius:30,pop:true,deco:true},
 pages:[pg('Home','index',[nav('Mboga Rooftop','Order a box','left'),hero('collage','WESTLANDS · NAIROBI','Picked at 6am, on your table by lunch','We grow lettuce, kale, tomatoes and herbs on three rooftops in Westlands. No pesticides, no long trucks.','Order a box','See what is growing',[A('leaf',231),A('fruit',232),A('bloom',233)],'bg'),
  stats([['3','Rooftops'],['2 hrs','Field to door'],['0','Chemical sprays'],['180','Weekly boxes']],'dark'),
  price('VEG BOXES','Pick a box size','Delivered Tuesday, Thursday and Saturday.',[['Small','KES 1,200','/week','7 seasonal items\nGood for 1 to 2\nFree delivery in Westlands'],['Family','KES 2,100','/week','12 items plus herbs\nGood for 4\nFree delivery',1],['Chef','KES 3,800','/week','20 items\nMicrogreens\nPick your own greens']]),
  split('archleft','THE FARMERS','Eight growers, one very tall ladder','Our team turned unused car-park roofs into soil beds with rainwater tanks and compost from nearby restaurants.','Visit the rooftop',A('field',234),'alt'),
  faq('Questions',[['Is it certified organic?','We are in KOAN certification and share our growing log openly.'],['Can I pause the box?','Yes, up to the evening before delivery.'],['Do you supply restaurants?','Yes, ask for the trade menu.']]),
  cta('Next week’s box closes Sunday 8pm','Sign up now and we add free basil.','Order my box','primary'),footer('Mboga Rooftop Farm','Rhapta Road, Westlands, Nairobi.','dark')]),
  pg('Contact','contact',[nav('Mboga Rooftop','Order a box','left'),contact('Order or visit','Rooftop tours first Saturday of the month.','box@mboga.example','+254 722 231 234','Rhapta Road, Westlands','Send order'),footer('Mboga Rooftop Farm','Rhapta Road, Westlands, Nairobi.','dark')])]});

addBespoke({id:'braid-studio',g:'Beauty',tag:'Hair braiding',name:'Taji Braids',kw:'hair braids salon natural locs twists',desc:'Knotless braids, twists and locs in Kololo.',
 th:{p:'#d4145a',p2:'#ffbe0b',p3:'#3a0ca3',bg:'#fff5f8',alt:'#ffe0ea',tx:'#2a0a18',dark:false,head:'Bodoni Moda',body:'Outfit',radius:50,pop:true,grad:true},
 pages:[pg('Home','index',[nav('Taji Braids','Book a seat','center'),hero('arch','KOLOLO · KAMPALA','Crown yourself','Knotless braids, Senegalese twists, faux locs and healthy natural-hair care, done gently by people who love hair.','Book a seat','See styles',[A('scissors',241)],'bg'),
  gal('masonry','The lookbook',[A('person',242),A('bloom',243),A('diamond',244),A('person',245),A('circles',246),A('scissors',247)]),
  menu('Styles and prices','Hair included for most styles. Times are average.',[['Knotless medium','5 to 6 hours','UGX 150,000'],['Senegalese twists','4 hours','UGX 120,000'],['Faux locs','6 hours','UGX 180,000'],['Cornrows, simple','2 hours','UGX 50,000'],['Natural wash & treat','90 minutes','UGX 60,000']],'alt'),
  feats('OUR PROMISE','Gentle on your edges',' ',[['🪮','Never too tight','We stop and redo, always.'],['🍃','Plant-based oils','Shea, castor and coconut, nothing harsh.'],['☕','Seat comfort','Tea, WiFi and a phone charger at every chair.']],'plain','alt'),
  quotes('Clients',[['Eight hours and I never felt a pull.','Shanitah N.','Knotless'],['My daughter loves her Saturday cornrows.','Mary K.','Mum']]),
  cta('Sunday slots fill by Wednesday','Pay a UGX 30,000 deposit to hold yours.','Hold my slot'),footer('Taji Braids','Acacia Mall, second floor, Kololo.','dark')]),
  pg('Book','contact',[nav('Taji Braids','Book a seat','center'),contact('Book your seat','Send the style and a reference photo.','crown@taji.example','+256 701 241 247','Acacia Mall, Kololo, Kampala','Request slot'),footer('Taji Braids','Acacia Mall, second floor, Kololo.','dark')])]});

addBespoke({id:'airport-transfers',g:'Travel',tag:'Airport transfers',name:'Karibu Rides',kw:'airport transfer taxi driver pickup JKIA',desc:'Fixed-price meet-and-greet transfers at Nairobi airport.',
 th:{p:'#ffcc00',p2:'#111111',p3:'#e63946',bg:'#111111',alt:'#1c1c1c',tx:'#f5f5f5',dark:true,head:'Archivo Black',body:'Lexend',radius:4,pop:false},
 pages:[pg('Home','index',[nav('KARIBU RIDES','Book a pickup','left'),hero('cover','JKIA · WILSON · MOMBASA ROAD','Your driver, your name on a sign','Land at Jomo Kenyatta, walk out, find a smiling driver with water and a charger. Fixed prices, flight-tracked pickups.','Book a pickup','See fixed prices',[A('road',251)],'alt'),
  menu('Fixed prices','One price per car, not per person. All tolls included.',[['JKIA to Westlands','Up to 3 passengers','$22'],['JKIA to Karen','Up to 3 passengers','$28'],['JKIA to Naivasha','Up to 6 passengers','$95'],['JKIA to Nairobi National Park','Up to 4, safari car','$40']]),
  steps('HOW IT WORKS','Book once, relax',[['Book','Give us your flight number.'],['We track','Driver adjusts to delays, no extra fee.'],['Meet','Name board at arrivals, bags carried.'],['Ride','Cold water, WiFi and a charger.']],'alt'),
  stats([['24/7','Pickups'],['12,000','Rides done'],['0','Missed flights'],['4.9','Rating']],'primary'),
  quotes('Travellers',[['Landed at 2am, driver was there with my name.','Chidi O.','Lagos'],['The price was the price. No haggling.','Sarah W.','London']],'alt'),
  footer('Karibu Rides','Licensed by KCAA. Pickup bay 3, JKIA.','dark')]),
  pg('Book','contact',[nav('KARIBU RIDES','Book a pickup','left'),contact('Book a pickup','Pay on arrival or by card on the day.','rides@karibu.example','+254 711 251 252','Embakasi, Nairobi','Book now'),footer('Karibu Rides','Licensed by KCAA. Pickup bay 3, JKIA.','dark')])]});

addBespoke({id:'water-ngo',g:'Non-profit',tag:'Water NGO',name:'Maji Safi Foundation',kw:'water borehole charity donate community ngo',desc:'Clean water wells for villages in Dodoma region.',
 th:{p:'#0077b6',p2:'#f77f00',p3:'#023e8a',bg:'#ffffff',alt:'#e8f4fa',tx:'#07263b',dark:false,head:'Lexend',body:'Lexend',radius:8,pop:false},
 pages:[pg('Home','index',[nav('Maji Safi Foundation','Donate','left'),hero('split','DODOMA · TANZANIA','Every well ends a four-hour walk','Since 2012 we have drilled 84 boreholes and trained village committees to keep them running for decades.','Give clean water','See our wells',[A('waves',261)],'alt'),
  stats([['84','Boreholes drilled'],['61,000','People served'],['94%','Still flowing'],['$38','Per person']],'dark'),
  cards('grid','WHERE YOUR MONEY GOES','Three kinds of gift','',[[A('hills',262),'$38 · One person','Clean water for life, with filter and tap.'],[A('field',263),'$450 · One family plot','A shallow well and hand pump for 12 households.'],[A('waves',264),'$9,500 · A village','Borehole, solar pump, storage tank and training.']]),
  split('right','HOW WE WORK','The village owns the well, we just help dig','Each community picks a water committee, pays a small monthly fee and learns to repair its own pump.','Read the model',A('person',265),'alt'),
  quotes('Voices from the village',[['My daughter now goes to school in the morning.','Mama Zuhura','Chamwino'],['The pump has not broken in six years.','Mzee Petro','Bahi']]),
  cta('Give $38 and one person drinks clean water for life','Every shilling is audited and published yearly.','Donate now','primary'),footer('Maji Safi Foundation','Registered NGO No. 00NGO/R/4821, Dodoma.','dark')]),
  pg('Contact','contact',[nav('Maji Safi Foundation','Donate','left'),contact('Get in touch','Visit a village with us, or ask for our audited report.','give@majisafi.example','+255 26 000 4821','Area D, Dodoma','Send message'),footer('Maji Safi Foundation','Registered NGO No. 00NGO/R/4821, Dodoma.','dark')])]});

addBespoke({id:'tailor-house',g:'Fashion',tag:'Bespoke tailor',name:'Fundi Savile Tailors',kw:'tailor suit bespoke kitenge fashion made to measure',desc:'Made-to-measure suits and kitenge in Nairobi.',
 th:{p:'#14213d',p2:'#c8a05a',p3:'#7b2d26',bg:'#f7f3ea',alt:'#ece4d2',tx:'#141414',dark:false,head:'Cormorant Garamond',body:'DM Sans',radius:0,pop:false},
 pages:[pg('Home','index',[nav('Fundi Savile','Book a fitting','center'),hero('center','RIVER ROAD · NAIROBI · SINCE 1974','A suit is measured once and worn for life','Three generations of cutters, wool from Biella and Dar-made kitenge for the wedding, the office and the long dinner.','Book a fitting','',[],'bg'),
  split('left','THE CRAFT','Forty hours in every jacket','Hand-padded lapels, working cuffs and buttonholes sewn one by one. We cut a paper pattern for you and keep it for good.','How we cut',A('scissors',271),'alt'),
  price('SUITS','Prices in Kenyan shillings','Two fittings included.',[['Two-piece suit','KES 45,000','','Italian wool\n3 weeks\nTwo fittings'],['Wedding party','KES 38,000','/each','Groom free with 5 suits\nMatching waistcoats\nAlterations',1],['Kitenge shirt','KES 4,500','','Your cloth or ours\n5 days\nSlim or classic']]),
  gal('mosaic','The workroom',[A('scissors',272),A('frame',273),A('diamond',274),A('person',275),A('circles',276),A('lamp',277)]),
  quotes('Gentlemen say',[['My father wore Fundi. Now I do and my son will.','Peter M.','Banker'],['Turned my wedding in three weeks without a stitch out of place.','Joel O.','Groom']],'alt'),
  footer('Fundi Savile Tailors','1st floor, Mtaa wa Tom Mboya, Nairobi.','dark')]),
  pg('Visit','contact',[nav('Fundi Savile','Book a fitting','center'),contact('Book a fitting','Monday to Saturday, 9am to 6pm.','cut@fundisavile.example','+254 702 271 277','Tom Mboya Street, Nairobi'),footer('Fundi Savile Tailors','1st floor, Mtaa wa Tom Mboya, Nairobi.','dark')])]});

addBespoke({id:'makeup-artist',g:'Beauty',tag:'Makeup artist',name:'Amara Glow Studio',kw:'makeup artist bridal beauty glam face',desc:'Bridal and editorial makeup in Lagos and Nairobi.',
 th:{p:'#b5179e',p2:'#f9c74f',p3:'#4cc9f0',bg:'#1a0b1f',alt:'#27122e',tx:'#fbeaff',dark:true,head:'Bodoni Moda',body:'Sora',radius:100,grad:true,deco:true,pop:true},
 pages:[pg('Portfolio','index',[nav('Amara Glow','Book a look','center'),hero('arch','BRIDAL · EDITORIAL · EVENTS','Your skin, only louder','Skin-first makeup for dark and deep tones, matched shade by shade. Brides, shoots and birthdays across Nairobi.','Book a look','See the portfolio',[A('person',281)],'bg'),
  gal('masonry','Recent faces',[A('person',282),A('bloom',283),A('person',284),A('circles',285),A('diamond',286),A('person',287)],'alt'),
  menu('Services','Prices from the studio. Travel across Nairobi added.',[['Bridal trial and day','Two sessions, lashes included','KES 38,000'],['Glam session','Evening or photoshoot','KES 9,500'],['Bridal party member','Per person, on location','KES 6,000'],['Makeup lesson','Two hours, one-to-one','KES 12,000']]),
  split('right','THE ARTIST','Shade-matched in six undertones','Amara trained in Lagos and London and mixes foundation by hand, so your skin never looks grey or flat in photos.','About Amara',A('paint',288),'alt'),
  quotes('Brides',[['I looked like me, only glowing.','Wanjiru K.','Bride, 2026'],['She finished my full party in ninety minutes.','Debra A.','Bridesmaid']]),
  cta('Wedding dates book 6 months ahead','Send your date and we confirm in a day.','Check my date'),footer('Amara Glow Studio','Studio in Kilimani, Nairobi.','dark')]),
  pg('Book','contact',[nav('Amara Glow','Book a look','center'),contact('Book a look','Tell us the date, the place and the mood.','glow@amara.example','+254 705 281 288','Argwings Kodhek Road, Kilimani','Send request'),footer('Amara Glow Studio','Studio in Kilimani, Nairobi.','dark')])]});

addBespoke({id:'print-press',g:'Business',tag:'Printing press',name:'Kalamu Press',kw:'printing press brochures business cards banners books',desc:'Fast offset and digital printing in Kisumu.',
 th:{p:'#e4002b',p2:'#00a0dc',p3:'#ffe500',bg:'#f4f4f0',alt:'#e6e6e0',tx:'#101010',dark:false,head:'Rubik',body:'DM Mono',radius:0,pop:false,deco:true},
 pages:[pg('Home','index',[nav('KALAMU PRESS','Get a quote','left'),hero('split','KISUMU · SINCE 1999','Printed today, delivered by five','Business cards, brochures, banners and school books. Offset quality, digital speed, honest quotes.','Get a quote','See our prices',[A('paint',291)],'bg'),
  feats('WHAT WE PRINT','From a card to a book',' ',[['🪪','Business cards','500 cards, 350gsm, from KES 1,800.'],['📰','Flyers & brochures','1,000 A5 flyers from KES 4,500.'],['📚','Books & reports','Perfect bound, 100 copies from KES 38,000.']],'cards','alt'),
  logos('Printed for',['Lake Basin Sacco','Winam Hospital','Tusker Cup','Kisumu Polytechnic','Dunga Hotel']),
  steps('THE PROCESS','Proof to parcel in three days',[['Send','Email or WhatsApp your file.'],['Proof','Colour proof within 2 hours.'],['Print','Plates, press, trim, pack.'],['Deliver','Free in Kisumu over KES 3,000.']],'alt'),
  stats([['25','Years printing'],['3 days','Standard turnaround'],['4,000','Jobs a year'],['2','Heidelberg presses']],'dark'),
  cta('Need it tomorrow?','Rush jobs printed overnight for a 30% fee.','Send my file','primary'),footer('Kalamu Press','Oginga Odinga Street, Kisumu.','dark')]),
  pg('Contact','contact',[nav('KALAMU PRESS','Get a quote','left'),contact('Get a quote','Send the size, quantity and paper type.','jobs@kalamu.example','+254 710 291 292','Oginga Odinga Street, Kisumu','Request quote'),footer('Kalamu Press','Oginga Odinga Street, Kisumu.','dark')])]});

addBespoke({id:'game-studio',g:'Tech',tag:'Indie game studio',name:'Kijiji Games',kw:'indie game studio mobile games play developers',desc:'African stories as games, built in Kampala.',
 th:{p:'#7cff6b',p2:'#ff2e93',p3:'#00e5ff',bg:'#0b0d17',alt:'#141829',tx:'#e8ecff',dark:true,head:'Unbounded',body:'Space Mono',radius:6,grad:true,deco:true,pop:true},
 pages:[pg('Home','index',[nav('KIJIJI GAMES','Play the demo','left'),hero('collage','KAMPALA · 9 DEVS · 1 DOG','We make games about home','Boda chases, market hustles and folk tales as colourful games for phones and PC.','Play the demo','Watch the trailer',[A('rocket',301),A('circles',302),A('grid',303)],'bg'),
  cards('grid','OUR GAMES','Three worlds, one studio','',[[A('road',304),'Boda Rush','Dodge matatus on a wild Kampala ride. 400k downloads.'],[A('shop',305),'Mama Sokoni','Run a market stall and out-haggle the city.'],[A('hills',306),'Kintu','A folk-tale adventure, coming to Steam 2027.']],'alt'),
  stats([['400k','Downloads'],['4.7','Play Store rating'],['9','Developers'],['2','Awards']],'primary'),
  split('left','THE STUDIO','Hand-drawn, locally sourced','Our artists sketch on paper before pixels. Our soundtracks are recorded with Kampala street musicians.','Meet the team',A('paint',307)),
  team('The crew',[['Brenda','Art director',308],['Moses','Lead programmer',309],['Aisha','Sound design',310]],'alt'),
  cta('Join the Kintu beta','Be first to play and tell us what is broken.','Join the beta'),footer('Kijiji Games','Ntinda, Kampala, Uganda.','dark')]),
  pg('Contact','contact',[nav('KIJIJI GAMES','Play the demo','left'),contact('Press and jobs','Press kit on request. We hire artists every spring.','hi@kijiji.example','+256 779 301 310','Ntinda, Kampala'),footer('Kijiji Games','Ntinda, Kampala, Uganda.','dark')])]});

addBespoke({id:'fintech-app',g:'Tech',tag:'Savings app',name:'Chama Pay',kw:'fintech app savings chama mobile money group wallet',desc:'A digital chama: save with friends over M-Pesa.',
 th:{p:'#ff5a1f',p2:'#1f2a44',p3:'#20c997',bg:'#fffaf5',alt:'#fff0e3',tx:'#1f2a44',dark:false,head:'Manrope',body:'Manrope',radius:24,grad:true,pop:true},
 pages:[pg('Home','index',[nav('Chama Pay','Download','left'),hero('split','SAVE TOGETHER · KENYA · UGANDA','Your chama, now in your pocket','Collect contributions by M-Pesa, track who has paid and lend inside the group, all in one tidy app.','Download the app','How it works',[A('phone',311)],'alt'),
  logos('Works with',['M-Pesa','Airtel Money','MTN MoMo','Equity','KCB']),
  feats('FEATURES','No more notebook and WhatsApp reminders',' ',[['📲','Auto-collect','Members pay by M-Pesa. Everyone sees it instantly.'],['🧾','Clear books','Ledger, loans and fines in one place.'],['🔒','Safe by design','Treasurer, chairperson and secretary all approve withdrawals.']]),
  steps('GET STARTED','Four minutes to a running chama',[['Create','Name the group and set the amount.'],['Invite','Share a link on WhatsApp.'],['Collect','Contributions reconcile themselves.'],['Lend','Approve member loans in two taps.']],'alt'),
  stats([['14,000','Chamas'],['KES 2.1B','Saved'],['0','Lost to theft'],['4.8','Play Store']],'dark'),
  faq('Questions',[['What does it cost?','Free for groups under 10. KES 299 a month after.'],['Is my money safe?','Funds sit with a licensed partner bank.']]),
  cta('Start your chama today','Free for the first three months.','Download','primary'),footer('Chama Pay','Chama Pay Ltd, Nairobi. Regulated partner services.','dark')]),
  pg('Contact','contact',[nav('Chama Pay','Download','left'),contact('Talk to support','WhatsApp us 8am to 8pm every day.','help@chamapay.example','+254 700 311 312','Westlands, Nairobi'),footer('Chama Pay','Chama Pay Ltd, Nairobi. Regulated partner services.','dark')])]});

addBespoke({id:'farm-coop',g:'Business',tag:'Farmers co-op',name:'Umoja Maize Growers',kw:'cooperative farmers maize grain members harvest',desc:'A grain co-op of 2,400 farmers in the Rift Valley.',
 th:{p:'#c98a00',p2:'#2b5d34',p3:'#8b2f1b',bg:'#fcf7e8',alt:'#f1e6c2',tx:'#2a2208',dark:false,head:'Oswald',body:'Figtree',radius:6,pop:false},
 pages:[pg('Home','index',[nav('UMOJA MAIZE GROWERS','Join us','left'),hero('cover','ELDORET · UASIN GISHU','Farmers who set their own price','2,400 member farmers pool their maize, store it dry and sell together to millers, so nobody sells cheap at the roadside.','Become a member','Today’s prices',[A('field',321)],'alt'),
  stats([['2,400','Members'],['18,000 t','Grain sold in 2025'],['+22%','Better price'],['4','Storage depots']],'dark'),
  feats('WHAT MEMBERS GET','More than a better price',' ',[['🌽','Fair pooled price','Paid within 7 days of delivery.'],['🏦','Input loans','Seed and fertiliser on credit, repaid at harvest.'],['🎓','Agronomy visits','Free farm advice from our extension officers.']],'cards','bg'),
  menu('Today’s buying prices','Per 90 kg bag, dry maize at 13.5% moisture. Updated every morning.',[['Grade 1 maize','Eldoret depot','KES 3,850'],['Grade 2 maize','Eldoret depot','KES 3,600'],['Beans, mixed','Moiben depot','KES 9,200'],['Wheat','Burnt Forest depot','KES 4,400']],'alt'),
  quotes('Members',[['My first year in, I made enough to buy two cows.','Joseph K.','Moiben'],['No more brokers at my gate.','Sarah C.','Turbo']]),
  cta('Join the next intake','Registration opens every January. Fee is KES 1,000.','Register','primary'),footer('Umoja Maize Growers','Registered SACCO No. 4410, Eldoret.','dark')]),
  pg('Contact','contact',[nav('UMOJA MAIZE GROWERS','Join us','left'),contact('Visit the depot','Open Monday to Saturday, 7am to 5pm.','office@umoja.example','+254 720 321 322','Uganda Road, Eldoret'),footer('Umoja Maize Growers','Registered SACCO No. 4410, Eldoret.','dark')])]});

addBespoke({id:'funeral-home',g:'Services',tag:'Funeral services',name:'Amani Memorial Services',kw:'funeral memorial burial cremation services dignity',desc:'Dignified, transparent funeral support in Nairobi.',
 th:{p:'#41505a',p2:'#b79a62',p3:'#6c7a6a',bg:'#f6f5f2',alt:'#e8e7e2',tx:'#232a2e',dark:false,head:'Libre Caslon Text',body:'Figtree',radius:4,pop:false},
 pages:[pg('Home','index',[nav('Amani Memorial','Call us now','center'),hero('center','NAIROBI · 24 HOURS, EVERY DAY','We carry the arrangements, so you can carry each other','Gentle, transparent funeral support for families who are grieving. One call and a quiet voice answers.','Call 24 hours','See our packages',[],'bg'),
  steps('WHAT HAPPENS NEXT','From the first call',[['You call','We come to you, any hour, within two hours.'],['We plan','One kind coordinator for paperwork, venue and transport.'],['The service','Burial, cremation or church, in your tradition.'],['After','Memorial cards, a book of messages and grief support.']],'alt'),
  price('PACKAGES','Clear prices, no hidden fees','Payment plans available with no interest.',[['Simple','KES 85,000','','Mortuary and coffin\nHearse\nBurial permit'],['Family','KES 180,000','','Service planning\nTent, chairs and sound\nProgramme printing',1],['Memorial','KES 320,000','','Flowers and live music\nLivestream for family abroad\nMemorial book']]),
  split('archleft','OUR PROMISE','Respect, whatever your faith','We serve Christian, Muslim, Hindu and traditional families, and always speak your language and honour your customs.','Read our values',A('stones',331),'alt'),
  quotes('Words from families',[['They handled everything and never once made us feel rushed.','The Odhiambo family','Kisumu'],['Our father had a beautiful send-off.','Mary W.','Nairobi']]),
  footer('Amani Memorial Services','Licensed funeral director. Lang’ata Road, Nairobi.','dark')]),
  pg('Contact','contact',[nav('Amani Memorial','Call us now','center'),contact('We are here, day and night','Call any time. If it is easier, send a message and we call back.','care@amani.example','+254 722 331 332','Lang’ata Road, Nairobi','Request a call'),footer('Amani Memorial Services','Licensed funeral director. Lang’ata Road, Nairobi.','dark')])]});

addBespoke({id:'private-chef',g:'Food',tag:'Personal chef',name:'Chef Zawadi at Home',kw:'private chef dinner cooking at home catering menu',desc:'A private dinner cooked in your kitchen, Dar es Salaam.',
 th:{p:'#c1121f',p2:'#f4a259',p3:'#2b2d42',bg:'#fdf6ee',alt:'#f6e7d5',tx:'#2b1c14',dark:false,head:'DM Serif Display',body:'Karla',radius:16,pop:true},
 pages:[pg('Home','index',[nav('Chef Zawadi','Book dinner','left'),hero('arch','DAR ES SALAAM · MASAKI · OYSTER BAY','Dinner at your table, cooked in your kitchen','Chef Zawadi brings the ingredients, the apron and the playlist. You bring six friends and an appetite.','Book a dinner','See menus',[A('plate',341)],'bg'),
  cards('grid','SIGNATURE MENUS','Pick your evening','',[[A('plate',342),'Swahili Coast','Coconut crab, grilled octopus, mango sorbet. TSh 120,000 / person'],[A('fruit',343),'Garden Table','Vegetarian five courses with local greens. TSh 95,000 / person'],[A('beach',344),'Braai & Beats','Fire-grilled mishkaki, sides and cocktails. TSh 70,000 / person']],'alt'),
  split('right','THE CHEF','Trained in Cape Town, cooking Tanga','After eleven years in hotel kitchens, Zawadi Mwinyi now cooks only for tables of 4 to 12.','Her story',A('person',345)),
  steps('A TYPICAL NIGHT','We handle everything',[['Shop','Fresh ingredients from Kivukoni fish market.'],['Cook','Prep in your kitchen, plated at the table.'],['Serve','Wine pairing and a server for parties over 8.'],['Clean','We leave the kitchen tidier than we found it.']],'alt'),
  quotes('Guests',[['Our anniversary dinner, no restaurant noise, all love.','Salma & Irfan','Masaki'],['She turned a Tuesday into an event.','Dr. Lyimo','Mikocheni']]),
  footer('Chef Zawadi at Home','Private dining across Dar es Salaam.','dark')]),
  pg('Contact','contact',[nav('Chef Zawadi','Book dinner','left'),contact('Book a dinner','Send the date, guest count and any allergies.','dine@zawadi.example','+255 754 341 345','Masaki, Dar es Salaam','Request date'),footer('Chef Zawadi at Home','Private dining across Dar es Salaam.','dark')])]});

addBespoke({id:'bike-shop',g:'Retail',tag:'Bike shop',name:'Baiskeli Cycle Works',kw:'bicycle bike shop repair mountain road cycling',desc:'Bikes, repairs and Sunday rides in Iten.',
 th:{p:'#ff4b00',p2:'#00b4a6',p3:'#222831',bg:'#f2f4f5',alt:'#e1e6e8',tx:'#14181c',dark:false,head:'Anton',body:'Lexend',radius:14,pop:true},
 pages:[pg('Home','index',[nav('BAISKELI CYCLE WORKS','Book a service','left'),hero('collage','ITEN · HOME OF CHAMPIONS','Fast bikes, faster fixes','Road, gravel and mountain bikes from the Rift Valley’s best-loved workshop. Most repairs done in 24 hours.','Book a service','Browse bikes',[A('road',351),A('hills',352),A('circles',353)],'bg'),
  cards('overlay','THE SHOWROOM','Bikes for every road','',[[A('road',354),'Kapsait Road','Carbon frame, 22 speeds. KES 185,000'],[A('mountain',355),'Kerio Trail','Full suspension, 29er. KES 148,000'],[A('city',356),'Town Commuter','Steel, mudguards, rack. KES 38,000']],'alt'),
  menu('Workshop prices','Parts extra. Free quote before we start.',[['Basic tune-up','Brakes, gears, tyres','KES 1,800'],['Full service','Strip, clean, rebuild','KES 5,500'],['Wheel true','Per wheel','KES 800'],['Puncture fix','Any size','KES 300']]),
  steps('SUNDAY RIDE','Meet at the shop, 6:30am',[['Easy 40 km','Coffee stop, all levels.'],['Hill repeat 60 km','Over the Kapsait climb.'],['Gravel 90 km','For the keen ones.']],'alt'),
  stats([['1,500','Bikes serviced'],['8','Mechanics'],['24 hrs','Typical repair'],['12','Years open']],'dark'),
  footer('Baiskeli Cycle Works','Eldoret–Iten Road, Iten.','dark')]),
  pg('Contact','contact',[nav('BAISKELI CYCLE WORKS','Book a service','left'),contact('Book a service','Drop in, or send a photo of the problem.','ride@baiskeli.example','+254 733 351 353','Iten Town, Elgeyo-Marakwet'),footer('Baiskeli Cycle Works','Eldoret–Iten Road, Iten.','dark')])]});

addBespoke({id:'legal-clinic',g:'Services',tag:'Legal aid clinic',name:'Haki Legal Clinic',kw:'legal aid lawyer rights land tenants free advice',desc:'Free legal advice on land, tenancy and work rights.',
 th:{p:'#0b3c5d',p2:'#d9822b',p3:'#328cc1',bg:'#f9fafb',alt:'#e8eef3',tx:'#0e2233',dark:false,head:'Instrument Serif',body:'Manrope',radius:10,pop:false},
 pages:[pg('Home','index',[nav('Haki Legal Clinic','Get advice','left'),hero('split','FREE LEGAL ADVICE · MOMBASA','Know your rights, keep your home','We help tenants, small traders and workers with land disputes, evictions and unpaid wages, free of charge.','Get free advice','What we do',[A('columns',361)],'alt'),
  feats('WHAT WE HELP WITH','Everyday legal problems',' ',[['🏠','Land & rent','Eviction notices, lease disputes and title checks.'],['💼','Work & wages','Unfair dismissal, unpaid salary, NSSF issues.'],['👪','Family','Child support and succession advice.']],'cards','bg'),
  steps('HOW IT WORKS','Four steps to help',[['Call or visit','Tuesdays and Thursdays, 9am to 4pm.'],['Meet a lawyer','A volunteer advocate hears your case.'],['Get a plan','Letters, mediation or court.'],['Follow up','We stay with you to the end.']],'alt'),
  stats([['3,200','People helped'],['41','Volunteer lawyers'],['KES 62M','Recovered for clients'],['100%','Free']],'dark'),
  quotes('Clients',[['They stopped my eviction and found my landlord’s mistake.','Fatuma A.','Likoni'],['I got my last two months’ pay back.','Hassan M.','Nyali']]),
  faq('Common questions',[['Do I need to pay?','Never. We are funded by donors and the Law Society.'],['Can you go to court for me?','Yes, for qualifying cases.']],'alt'),
  footer('Haki Legal Clinic','Tom Mboya Road, Mombasa. Registered legal aid provider.','dark')]),
  pg('Contact','contact',[nav('Haki Legal Clinic','Get advice','left'),contact('Visit or call','Bring all your papers, even if they seem unimportant.','advice@haki.example','+254 41 000 361','Nkrumah Road, Mombasa','Request help'),footer('Haki Legal Clinic','Tom Mboya Road, Mombasa. Registered legal aid provider.','dark')])]});

addBespoke({id:'record-label',g:'Creative',tag:'Record label',name:'Pwani Soul Records',kw:'record label music artists albums release taarab bongo',desc:'An independent label for Swahili coast soul.',
 th:{p:'#f2542d',p2:'#f5dfbb',p3:'#0e9594',bg:'#127475',alt:'#0f6264',tx:'#fbf3e4',dark:true,head:'Syne',body:'DM Mono',radius:0,deco:true,pop:false},
 pages:[pg('Label','index',[nav('PWANI SOUL','Listen','center'),hero('center','MOMBASA · TANGA · ZANZIBAR','Taarab never sounded this modern','Independent releases from the coast: oud, bass and voices you will not forget.','Hear the latest','All artists',[],'bg'),
  gal('strip','New releases',[A('music',371),A('circles',372),A('waves',373),A('diamond',374)]),
  team('Roster',[['Mwanaisha','Vocals · Taarab',375],['Jabali','Producer · Bass',376],['Dada Nuru','Oud · Songwriter',377]],'alt'),
  blog('On tour','Where to catch us this season.',[['Fumba Beach Festival','12 Dec','Mwanaisha and Jabali, sunset stage.'],['Lamu Cultural Night','20 Dec','Dada Nuru live with full band.'],['Nairobi, Alchemist','9 Jan','Label showcase, 4 artists.']],'cards','bg'),
  stats([['38','Releases'],['6','Artists'],['2.4M','Streams'],['1','Grammy nomination']],'primary'),
  cta('Send us your demo','We listen to every song, in order, with tea.','Send a demo','alt'),footer('Pwani Soul Records','Mombasa, Kenya.')]),
  pg('Demos','contact',[nav('PWANI SOUL','Listen','center'),contact('Demos and bookings','Links to private SoundCloud please, not mp3 files.','demos@pwanisoul.example','+254 705 371 377','Old Town, Mombasa'),footer('Pwani Soul Records','Mombasa, Kenya.')])]});

addBespoke({id:'dance-school',g:'Education',tag:'Dance school',name:'Densi Dance Academy',kw:'dance classes ballet hip hop afrobeats kids studio',desc:'Afrobeats, ballet and hip-hop classes in Kigali.',
 th:{p:'#7209b7',p2:'#f72585',p3:'#ffd60a',bg:'#fdf7ff',alt:'#f1deff',tx:'#25062f',dark:false,head:'Unbounded',body:'Figtree',radius:34,grad:true,pop:true,deco:true},
 pages:[pg('Home','index',[nav('Densi Academy','Try a class','left'),hero('collage','KIGALI · REMERA','Move like nobody is watching','Afrobeats, amapiano, ballet and hip-hop for kids from 4 to teens, adults and absolute beginners.','Try a class','See the timetable',[A('music',381),A('balloon',382),A('person',383)],'bg'),
  cards('grid','CLASSES','Find your rhythm','',[[A('music',384),'Afrobeats','High-energy grooves. Adults, Tue & Thu 7pm.'],[A('balloon',385),'Little Ballet','Ages 4 to 8. Saturdays 9am.'],[A('person',386),'Hip-Hop Crew','Teens 12 to 17. Fridays 5pm.']],'alt'),
  price('MEMBERSHIP','Dance more, pay less',' ',[['Drop-in','RWF 6,000','/class','Any class\nNo contract\nShoes on us'],['Unlimited','RWF 45,000','/month','All classes\nFree showcase tickets\nGuest pass',1],['Kids term','RWF 70,000','/term','12 weeks\nCostume included\nEnd-of-term show']]),
  gal('mosaic','Showcase night',[A('music',387),A('balloon',388),A('person',389),A('circles',390),A('bloom',391),A('diamond',392)],'alt'),
  quotes('Dancers',[['I walked in nervous and walked out sweating and laughing.','Diane U.','Afrobeats'],['My daughter practises in the kitchen now.','Claude N.','Parent']]),
  cta('Your first class is free','Wear comfy clothes. We bring the music.','Reserve my spot','primary'),footer('Densi Dance Academy','KG 11 Ave, Remera, Kigali.','dark')]),
  pg('Contact','contact',[nav('Densi Academy','Try a class','left'),contact('Join a class','Tell us your age group and favourite style.','dance@densi.example','+250 788 381 392','Remera, Kigali','Reserve a spot'),footer('Densi Dance Academy','KG 11 Ave, Remera, Kigali.','dark')])]});

addBespoke({id:'ice-cream',g:'Food',tag:'Ice cream shop',name:'Barafu Gelato',kw:'ice cream gelato shop flavours scoops sorbet',desc:'Handmade gelato with East African fruit flavours.',
 th:{p:'#ff6b9d',p2:'#ffd166',p3:'#06d6a0',bg:'#fff8f1',alt:'#ffe6ef',tx:'#3a1c2a',dark:false,head:'Baloo 2',body:'Outfit',radius:36,pop:true,deco:true,grad:true},
 pages:[pg('Home','index',[nav('Barafu Gelato','Find a scoop','center'),hero('arch','ARUSHA · MOSHI · DAR','Mango, baobab and bubblegum','Gelato made every morning from fruit we buy at the market. Seven flavours, two sorbets and a very long queue on Sundays.','Today’s flavours','Find the shop',[A('fruit',401)],'bg'),
  menu('Today’s flavours','One scoop TSh 3,500. Two scoops TSh 6,000.',[['Mango Mkwaju','Tamarind ripple','Cream'],['Baobab Honey','Tangy and sweet','Cream'],['Passion Fruit','Dairy-free','Sorbet'],['Kilimanjaro Coffee','Strong, with cocoa nibs','Cream'],['Coconut & Lime','Dairy-free','Sorbet']],'alt'),
  gal('masonry','Scoop life',[A('fruit',402),A('balloon',403),A('beach',404),A('bloom',405),A('cup',406),A('circles',407)]),
  split('left','HOW WE MAKE IT','No powders, no shortcuts','Fresh milk from Meru farmers, honey from Sikonge hives and fruit bought before 7am.','Our story',A('leaf',408),'alt'),
  feats('GOOD TO KNOW','Little extras',' ',[['🎂','Ice-cream cakes','Order 48 hours ahead, from TSh 45,000.'],['🎉','Party tubs','2 litres, three flavours, TSh 28,000.'],['🌱','Vegan friendly','Four sorbets always on the counter.']],'plain'),
  cta('Birthday this month?','Kids eat free with one adult scoop on their day.','Plan a party'),footer('Barafu Gelato','Sokoine Road, Arusha.','dark')]),
  pg('Contact','contact',[nav('Barafu Gelato','Find a scoop','center'),contact('Find the shop','Open daily 11am to 10pm.','scoop@barafu.example','+255 767 401 408','Sokoine Road, Arusha','Send message'),footer('Barafu Gelato','Sokoine Road, Arusha.','dark')])]});

}
