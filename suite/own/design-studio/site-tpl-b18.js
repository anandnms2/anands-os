/* Batch 18: 20 hand-designed website templates. */
{const {nav,hero,feats,split,gal,stats,quotes,price,faq,cta,contact,footer,team,cards,menu,steps,text,logos,blog,wa,pg}=B_,A=a_;

addBespoke({id:'cold-plunge-sauna',g:'Health',tag:'Sauna and cold plunge',name:'Barafu Sauna Club',kw:'sauna ice bath cold plunge wellness nairobi',desc:'Cedar sauna and ice-bath sessions in Nairobi.',
 th:{p:'#7fd1e0',p2:'#e8b27a',p3:'#3d6b73',bg:'#0c1a1e',alt:'#12272d',tx:'#e6f4f6',dark:true,head:'Syne',body:'Figtree',radius:14,grad:true},
 pages:[pg('Home','index',[nav('BARAFU','Book a session','left'),hero('cover','LAVINGTON · NAIROBI','Ninety degrees, then two. Feel everything.','A wood-fired cedar sauna, three 3°C plunge tubs and a quiet garden to sit in afterwards. Sessions are 90 minutes and capped at eight people.','Book a session','See times',[A('waves',1801)],'bg'),
  steps('THE CIRCUIT','How a session runs',[['Heat','15 minutes in the cedar sauna at 85°C.'],['Plunge','2 minutes in the tub at 3°C. Breathe slow.'],['Rest','Tea and dates in the garden, then go again.']],'alt'),
  gal('masonry','Inside',[A('leaf',1802),A('stones',1803),A('waves',1804),A('lamp',1805)]),
  price('SESSIONS','Pay per visit or join the club','',[['Single','KES 2,500','/session','Towel and robe\nHerbal tea\n90 minutes'],['Club','KES 9,000','/month','Four sessions\nBring a friend once\nEvening slots',1],['Corporate','KES 28,000','/month','Team of eight\nWeekday mornings\nInvoice billing']]),
  faq('Good to know',[['Is it safe for everyone?','Skip the plunge if you have a heart condition or are pregnant. The sauna is fine with a short stay.'],['What do I wear?','Swimwear. We lend robes and towels.']],'alt'),
  footer('Barafu Sauna Club','Lavington Green Gardens, Nairobi.')]),
  pg('Book','contact',[nav('BARAFU','Book a session','left'),contact('Reserve a spot','Sessions at 6am, 6pm and 8pm daily.','sauna@barafu.example','+254 711 180 100','James Gichuru Road, Lavington, Nairobi','Request a slot'),footer('Barafu Sauna Club','Lavington Green Gardens, Nairobi.')])]});

addBespoke({id:'clearing-agent',g:'Business',tag:'Customs clearing agent',name:'Malaba Gate Clearing',kw:'customs clearing freight border uganda kenya trucks',desc:'Border clearing and transit paperwork at Malaba.',
 th:{p:'#d9480f',p2:'#1c2b39',p3:'#f0b429',bg:'#f5f3ee',alt:'#e8e4da',tx:'#1c2b39',dark:false,head:'Archivo Black',body:'Manrope',radius:2,pop:true},
 pages:[pg('Home','index',[nav('MALABA GATE','Get a quote','left'),hero('split','MALABA · KENYA–UGANDA BORDER','Your truck should move, not queue','We lodge entries before your driver reaches the weighbridge, so most loads clear in under four hours instead of two days.','Get a clearing quote','Track a load',[A('road',1811)],'alt'),
  stats([['4 hrs','Average clearance'],['1,900','Trucks cleared in 2025'],['24/7','Border desk'],['0','Demurrage disputes']],'dark'),
  feats('WHAT WE HANDLE','Paperwork is the real cargo',' ',[['📄','Entries and duty','IDF, KRA iCMS and URA ASYCUDA entries lodged and paid on your behalf.'],['🚛','Transit bonds','Single-entry or annual bonds, with GPS seals fitted at the gate.'],['🧾','Warehousing','Bonded yard for 60 trucks, with a forklift crew on every shift.']],'cards'),
  split('right','HOW WE WORK','A named clerk on every load','You get one WhatsApp number for your consignment. Documents, duty receipts and the exit stamp arrive there as photos the moment each step is done.','Meet the desk',A('port',1812),'bg'),
  price('RATES','Flat fees, posted openly','',[['Single entry','USD 85','/load','Entry and release\nExit note\nWhatsApp updates'],['Transit run','USD 140','/load','Bond and seals\nPort to Kampala\nDriver briefing',1],['Monthly desk','USD 1,100','/month','Up to 20 loads\nDedicated clerk\nDuty advance line']],'alt'),
  faq('Common questions',[['Which commodities?','General cargo, FMCG, building materials and agricultural exports. We do not clear fuel.'],['Can you advance duty?','Yes, for monthly clients with 30 days of history.']]),
  footer('Malaba Gate Clearing Ltd','Customs Road, Malaba, Busia County.')]),
  pg('Contact','contact',[nav('MALABA GATE','Get a quote','left'),contact('Send us the manifest','Photo of the bill of lading is enough to start.','desk@malabagate.example','+254 722 181 200','Customs Road, Malaba','Request quote'),footer('Malaba Gate Clearing Ltd','Customs Road, Malaba, Busia County.')])]});

addBespoke({id:'rabbit-farm',g:'Agriculture',tag:'Rabbit farm',name:'Sungura Hills Farm',kw:'rabbit breeding meat farm kiambu',desc:'Breeding stock, meat and manure from Kiambu.',
 th:{p:'#8a5a3b',p2:'#9bb86a',p3:'#e8c7a0',bg:'#fbf5ea',alt:'#f0e4cf',tx:'#35261b',dark:false,head:'Baloo 2',body:'Lexend',radius:22,pop:true,deco:true},
 pages:[pg('Home','index',[nav('Sungura Hills','Order stock','center'),hero('collage','KIAMBU · LIMURU ROAD','Small ears, big business','New Zealand White and Californian rabbits, bred on clean hay and sold as breeding stock, dressed meat and rich garden manure.','Order breeding stock','See prices',[A('paw',1821),A('leaf',1822),A('field',1823)],'bg'),
  cards('grid','WHAT WE SELL','Four ways to buy',' ',[[A('paw',1824),'Breeding does','Ready at 5 months, KES 3,500 each, with a record card.'],[A('heart',1825),'Bucks','Proven sires, KES 4,000, health-checked.'],[A('plate',1826),'Dressed meat','KES 650 per kilo, cleaned and frozen.'],[A('leaf',1827),'Manure','KES 300 a sack, odourless and ready for kale.']],'alt'),
  split('archleft','THE FARM','Forty cages, one family','Wanjiru and her sons started with four does in 2019. Today every cage is raised off the ground, scrubbed on Sundays and open to visitors on Saturdays.','Visit on Saturday',A('hills',1828)),
  steps('START YOUR OWN','From first doe to first sale',[['Learn','Free half-day class every first Saturday.'],['Buy','Starter pack: 3 does and 1 buck, KES 13,500.'],['Sell','We buy back kits at 8 weeks, guaranteed.']],'alt'),
  quotes('Farmers we started',[['I began with the starter pack and now sell 30 rabbits a month.','Peter K.','Githunguri'],['Their manure doubled my kale.','Mama Njeri','Limuru'],['The record cards saved me from inbreeding.','Samuel O.','Thika']]),
  footer('Sungura Hills Farm','Off Limuru Road, Kiambu County.')]),
  pg('Order','contact',[nav('Sungura Hills','Order stock','center'),contact('Place an order','We confirm by WhatsApp and arrange pickup or a matatu parcel.','orders@sungurahills.example','+254 733 182 300','Off Limuru Road, Kiambu','Send order'),footer('Sungura Hills Farm','Off Limuru Road, Kiambu County.')])]});

addBespoke({id:'circus-school',g:'Education',tag:'Circus school',name:'Kamba Kids Circus',kw:'circus acrobatics juggling kids stilts nairobi',desc:'Acrobatics, juggling and stilts for ages 6 to 18.',
 th:{p:'#e63946',p2:'#ffbe0b',p3:'#3a86ff',bg:'#fff8e8',alt:'#ffe9b8',tx:'#241a3b',dark:false,head:'Unbounded',body:'Baloo 2',radius:30,pop:true,deco:true,grad:true},
 pages:[pg('Home','index',[nav('Kamba Circus','Join a class','left'),hero('arch','NGONG ROAD · NAIROBI','Fall down. Get up. Fly.','Two hours of acrobatics, juggling, aerial silks and stilt-walking every Saturday, taught by performers who have toured Europe.','Try a free class','Watch a show',[A('balloon',1831)],'bg'),
  gal('mosaic','Saturday at the tent',[A('balloon',1832),A('circles',1833),A('person',1834),A('music',1835),A('diamond',1836)]),
  feats('SKILLS','Pick a trick',' ',[['🤹','Juggling','Scarves at 6, clubs by 12.'],['🎪','Aerial silks','Climb, wrap and drop 4 metres, safely clipped.'],['🦵','Stilts','Start at 30 cm, finish at 1.5 m.'],['🤸','Acro','Cartwheels to human pyramids.']],'cards','alt'),
  split('left','THE TENT','A safe place to be brave','Crash mats, qualified spotters and a rule that nobody laughs at a drop. Parents watch from the benches with free chai.','Meet the coaches',A('person',1837)),
  price('TERMS','Three months at a time','',[['Beginners','KES 6,500','/term','Saturdays 10 to 12\nAges 6 to 10\nCostume loan'],['Troupe','KES 9,500','/term','Saturdays and Wednesdays\nAges 11 to 18\nPerform at shows',1]],'alt'),
  faq('Parents ask',[['Is it insured?','Yes, all students are covered during class.'],['What to bring?','Leggings, water and no jewellery.']]),
  footer('Kamba Kids Circus','Big tent behind Ngong Racecourse, Nairobi.')]),
  pg('Enrol','contact',[nav('Kamba Circus','Join a class','left'),contact('Free trial class','First Saturday of every month, no booking fee.','tent@kambacircus.example','+254 700 183 400','Ngong Racecourse, Nairobi','Book trial'),footer('Kamba Kids Circus','Big tent behind Ngong Racecourse, Nairobi.')])]});

addBespoke({id:'omena-fish-kisumu',g:'Food',tag:'Dried fish trader',name:'Dunga Omena Women',kw:'omena dagaa dried fish kisumu lake victoria',desc:'Sun-dried omena from Dunga beach, Kisumu.',
 th:{p:'#0f5f73',p2:'#f2c14e',p3:'#c7522a',bg:'#f7f1e1',alt:'#e8dfc4',tx:'#122c34',dark:false,head:'Young Serif',body:'Rubik',radius:8,pop:false},
 pages:[pg('Home','index',[nav('Dunga Omena','Order a sack','left'),hero('split','DUNGA BEACH · KISUMU','Silver fish, dried on the shore it was caught','Forty women dry omena on raised racks, not on dirt, so every sack is clean, crisp and ready for the pot.','Order a sack','Our story',[A('waves',1841)],'alt'),
  stats([['40','Women owners'],['1.2 t','Dried each week'],['KES 220','Per kilo, wholesale'],['3 days','Sun-drying']],'primary'),
  split('right','FROM LAKE TO SACK','Caught at 4am, dry by Thursday','Boats land at dawn. By 7am the fish are on racks, turned by hand and sorted into grade A and B. No salt, no chemicals, no middlemen.','Watch the drying',A('beach',1842),'bg'),
  cards('overlay','BUY','Choose your pack',' ',[[A('plate',1843),'Home pack','1 kg vacuum bag, KES 320.'],[A('shop',1844),'Duka sack','25 kg sack, KES 5,200.'],[A('city',1845),'Restaurant','100 kg weekly standing order, KES 20,000.']],'alt'),
  quotes('Customers',[['Clean and no sand in the pot. Finally.','Mama Brian','Nairobi, Kayole'],['I buy two sacks a week for my kibanda.','Otieno','Kisumu'],['Delivered to Kampala in two days.','Grace N.','Restaurant owner']]),
  footer('Dunga Omena Women Group','Dunga Beach, Kisumu County.')]),
  pg('Order','contact',[nav('Dunga Omena','Order a sack','left'),contact('Order or visit','Come see the racks any morning. We deliver by bus parcel.','omena@dunga.example','+254 720 184 500','Dunga Beach, Kisumu','Send order'),footer('Dunga Omena Women Group','Dunga Beach, Kisumu County.')])]});

addBespoke({id:'uniform-maker',g:'Retail',tag:'School uniforms',name:'Eastleigh Uniform House',kw:'school uniforms tailor sewing bulk nairobi',desc:'School uniforms made to size, delivered before term.',
 th:{p:'#1b365d',p2:'#c8102e',p3:'#f4c542',bg:'#ffffff',alt:'#eef2f8',tx:'#14233a',dark:false,head:'Libre Caslon Text',body:'Figtree',radius:4},
 pages:[pg('Home','index',[nav('Eastleigh Uniform House','Order uniforms','left'),hero('center','12 YEARS · 140 SCHOOLS','Uniforms that survive three terms and a football field','Double-stitched seams, fade-proof dye and sizes that leave room to grow. Order online, collect from the shop or have it sent to school.','Order uniforms','Price list',[],'bg'),
  logos('Dressing pupils at',['Starehe Prep','Kariokor Academy','St. Teresa','Pangani Junior','Mathare Hope']),
  feats('WHY PARENTS CHOOSE US','Made to last',' ',[['🧵','Triple-stitched','Knees, elbows and seat reinforced.'],['📏','Grow-room hems','Let out two sizes without re-sewing.'],['🚚','Delivered to school','No Saturday queues.']],'cards','alt'),
  menu('Popular items','Prices per piece, bulk discount from 20 pieces.',[['Shirt, short sleeve','Cotton blend, all sizes','KES 450'],['Shorts or skirt','Gabardine, lined','KES 650'],['Sweater','Embroidered crest','KES 900'],['Tracksuit','PE days','KES 1,500'],['School bag','Waterproof, 25 litre','KES 1,200']]),
  gal('grid','From the workshop',[A('scissors',1851),A('frame',1852),A('person',1853),A('shop',1854)],'alt'),
  cta('Term two orders close on 20 February','Place yours early and we guarantee delivery by opening day.','Order now'),footer('Eastleigh Uniform House','12th Street, Eastleigh, Nairobi.')]),
  pg('Contact','contact',[nav('Eastleigh Uniform House','Order uniforms','left'),contact('Visit the shop','Open Monday to Saturday, 8am to 6pm.','orders@eastleighuniforms.example','+254 722 185 600','12th Street, Eastleigh, Nairobi','Send enquiry'),footer('Eastleigh Uniform House','12th Street, Eastleigh, Nairobi.')])]});

addBespoke({id:'lift-installer',g:'Business',tag:'Lift installer',name:'Juu Lifts East Africa',kw:'elevator lift installation maintenance buildings',desc:'Passenger and goods lifts for East African buildings.',
 th:{p:'#d4af37',p2:'#b8c4cf',p3:'#5c6b7a',bg:'#101418',alt:'#181e24',tx:'#eef1f4',dark:true,head:'Bodoni Moda',body:'Sora',radius:0},
 pages:[pg('Home','index',[nav('JUU LIFTS','Request a survey','center'),hero('center','NAIROBI · KAMPALA · DAR','Going up, quietly','Passenger, goods and hospital lifts installed in 6 weeks, serviced every quarter and answered by an engineer within 2 hours, day or night.','Request a site survey','',[],'bg'),
  gal('strip','Recent installations',[A('city',1861),A('columns',1862),A('grid',1863),A('frame',1864)]),
  stats([['380','Lifts installed'],['2 hrs','Callout response'],['12 yrs','Average lift life added'],['99.2%','Uptime']],'alt'),
  split('left','SERVICE','A lift that stops costs you tenants','Our maintenance plans include a monthly inspection, spare-part stock in Nairobi and remote monitoring that texts our engineer before you notice a fault.','See plans',A('lamp',1865)),
  price('MAINTENANCE','Choose your cover','',[['Basic','KES 18,000','/lift/month','Quarterly visits\nCallouts billed'],['Full','KES 32,000','/lift/month','Monthly visits\nUnlimited callouts\nParts included',1],['Premium','KES 48,000','/lift/month','Remote monitoring\n1-hour response\nAnnual upgrade audit']],'alt'),
  faq('Before you build',[['How long to install?','Six weeks from signed drawings for a 6-stop passenger lift.'],['Do you refurbish?','Yes, controllers, doors and cabins.']]),
  footer('Juu Lifts East Africa','Mombasa Road, Nairobi.')]),
  pg('Survey','contact',[nav('JUU LIFTS','Request a survey','center'),contact('Book a free survey','Send the building address and number of floors.','survey@juulifts.example','+254 733 186 700','Mombasa Road, Nairobi','Request survey'),footer('Juu Lifts East Africa','Mombasa Road, Nairobi.')])]});

addBespoke({id:'spray-drones',g:'Agriculture',tag:'Crop-spraying drones',name:'Nzige Spray Drones',kw:'drone spraying farm agriculture locusts',desc:'Drone spraying for maize, wheat and rice farms.',
 th:{p:'#6bd13a',p2:'#ffe14d',p3:'#1f8a70',bg:'#0f1a14',alt:'#16261c',tx:'#eaf5e2',dark:true,head:'Space Mono',body:'Lexend',radius:6,grad:true},
 pages:[pg('Home','index',[nav('nzige.spray','Book a flight','left'),hero('split','NAROK · UASIN GISHU · MWEA','One hectare in nine minutes','Our licensed 40-litre drones spray 30 hectares a day with 90% less water and no one walking through wet crops.','Book a flight','See rates',[A('field',1871)],'bg'),
  stats([['9 min','Per hectare'],['30 ha','Per drone per day'],['90%','Less water'],['KCAA','Licensed pilots']],'primary'),
  steps('HOW A JOB WORKS','From booking to dry field',[['Map','We fly the boundary and mark no-spray zones.'],['Mix','You supply chemicals, we calibrate the nozzle.'],['Spray','Pilot and spotter on site, live map to your phone.'],['Report','Coverage map and batch log by evening.']],'alt'),
  gal('mosaic','In the field',[A('field',1872),A('rocket',1873),A('leaf',1874),A('solar',1875),A('hills',1876)]),
  price('RATES','Per hectare, all in','',[['Single pass','KES 900','/ha','Pilot and drone\nCoverage report'],['Season plan','KES 750','/ha','Up to 6 passes\nPriority booking',1],['Co-op rate','KES 650','/ha','100 ha minimum\nTraining day free']],'alt'),
  faq('Farmers ask',[['Windy days?','We fly below 18 km/h and rebook free if we cannot.'],['Can you spray at night?','Yes, with lights, for pests that hide by day.']]),
  footer('Nzige Spray Drones','Narok Town and Eldoret.','dark')]),
  pg('Book','contact',[nav('nzige.spray','Book a flight','left'),contact('Book a flight','Send your plot size, crop and nearest town.','fly@nzige.example','+254 700 187 800','Narok Town','Request flight'),footer('Nzige Spray Drones','Narok Town and Eldoret.','dark')])]});

addBespoke({id:'hot-springs-kapedo',g:'Travel',tag:'Hot springs camp',name:'Kapedo Springs Camp',kw:'hot springs turkana baringo camping geothermal',desc:'Camping beside steaming hot rivers in the Rift Valley.',
 th:{p:'#c2410c',p2:'#fcd34d',p3:'#7c2d12',bg:'#fff4e5',alt:'#fbe3c4',tx:'#3b1608',dark:false,head:'Gloock',body:'DM Sans',radius:12,pop:true},
 pages:[pg('Home','index',[nav('Kapedo Springs','Book a night','left'),hero('cover','TURKANA–BARINGO BORDER','Bathe in a river that comes out of the earth hot','A warm stream through red canyon walls, tents on the sand and Turkana dancers around the fire. Eight hours from Nairobi, a world away.','Book a night','The journey',[A('mountain',1881)],'bg'),
  cards('grid','STAY','Three ways to sleep',' ',[[A('house',1882),'Safari tent','Bed, net and solar light. KES 6,500 for two.'],[A('stones',1883),'Own tent','Pitch beside the stream. KES 1,200 each.'],[A('hills',1884),'Cliff bandas','Stone rooms with a river view. KES 9,000.']],'alt'),
  split('right','THE SPRINGS','40°C water, 6am quiet','Soak before the sun is up, then walk the Suguta valley with a Turkana guide who knows where the water runs hottest.','Plan your trip',A('waves',1885)),
  steps('GETTING HERE','Nairobi to Kapedo in a day',[['Drive','Nairobi, Nakuru, Marigat, Tangulbei: 8 hours, 4x4 for the last 40 km.'],['Or fly','Charter from Wilson to our airstrip, 55 minutes.'],['Arrive','Dinner is on the fire at 7.']],'alt'),
  quotes('Travellers',[['The most surprising place I have slept.','Aisha M.','Camper'],['Our guide Lokiru made the hike.','Tom H.','Visitor from UK'],['Hot river, cold beer, no signal. Perfect.','Dennis W.','Weekend trip']]),
  footer('Kapedo Springs Camp','Kapedo, Turkana East.')]),
  pg('Book','contact',[nav('Kapedo Springs','Book a night','left'),contact('Check dates','Camp is open Thursday to Monday, closed in heavy rains.','camp@kapedo.example','+254 722 188 900','Kapedo, Turkana East','Check dates'),footer('Kapedo Springs Camp','Kapedo, Turkana East.')])]});

addBespoke({id:'coach-bus-line',g:'Travel',tag:'Coach bus line',name:'Kasi Express Coaches',kw:'bus coach tickets mombasa kampala nairobi long distance',desc:'Overnight coaches between Nairobi, Mombasa and Kampala.',
 th:{p:'#f97316',p2:'#0f172a',p3:'#22c55e',bg:'#ffffff',alt:'#fff1e6',tx:'#0f172a',dark:false,head:'Oswald',body:'Rubik',radius:10,pop:true},
 pages:[pg('Home','index',[nav('KASI EXPRESS','Book a seat','left'),hero('collage','NAIROBI · MOMBASA · KAMPALA','Sleep on the road. Wake up there.','Fully reclining seats, onboard wifi, a charging point at every seat and a hot meal at the Voi stop.','Book a seat','See routes',[A('road',1891),A('city',1892),A('beach',1893)],'alt'),
  price('FARES','One-way, per seat','',[['Nairobi–Mombasa','KES 1,800','/seat','Departs 9pm\nArrives 5am\nBlanket and snack'],['Nairobi–Kampala','KES 3,200','/seat','Departs 6pm\nArrives 6am\nBorder help',1],['Mombasa–Dar','KES 2,400','/seat','Departs 7am\nArrives 5pm\nLunch included']]),
  feats('ON BOARD','What a night looks like',' ',[['🛏','Recline 150°','Leg rests and a pillow.'],['📶','Wifi and USB','Stream till the Tsavo gate.'],['🛡','Two drivers','Speed-limited and GPS tracked.']],'cards','alt'),
  split('left','HOW TO BOOK','Pay by M-Pesa, ride with a QR','Pick your seat, pay with M-Pesa and show the QR code at the bay. No paper ticket, no queue at Machakos Country Bus.','See the app',A('phone',1894)),
  faq('Travellers ask',[['Luggage?','Two bags of 20 kg free; extra KES 300.'],['Can I change my date?','Yes, once, up to 4 hours before departure.']],'alt'),
  cta('Tuesday and Wednesday fares drop 15%','Travel midweek and keep the savings.','Book midweek'),footer('Kasi Express Coaches','Tom Mboya Street, Nairobi.')]),
  pg('Help','contact',[nav('KASI EXPRESS','Book a seat','left'),contact('Need a hand?','Our desk is open 5am to 11pm.','help@kasiexpress.example','+254 700 189 000','Tom Mboya Street, Nairobi','Send message'),footer('Kasi Express Coaches','Tom Mboya Street, Nairobi.')])]});

addBespoke({id:'mandazi-bakery',g:'Food',tag:'Mandazi bakery',name:'Mama Zawadi Mandazi',kw:'mandazi bakery wholesale breakfast snacks mombasa',desc:'Fresh coconut mandazi, delivered hot every morning.',
 th:{p:'#d97706',p2:'#7c2d12',p3:'#fde68a',bg:'#fffbeb',alt:'#fef0c7',tx:'#451a03',dark:false,head:'Fraunces',body:'Outfit',radius:999,pop:false,deco:true},
 pages:[pg('Home','index',[nav('Mama Zawadi','Order for tomorrow','center'),hero('arch','NYALI · MOMBASA','Warm by 6am, gone by 9','Cardamom and coconut mandazi, fried in small batches the way Mama Zawadi did on her veranda in Kisauni.','Order for tomorrow','See the menu',[A('fruit',1901)],'bg'),
  menu('This morning’s tray','Baked from 3am. Prices per piece.',[['Coconut mandazi','Classic, cardamom','KES 20'],['Maharagwe pair','Mandazi with beans in coconut sauce','KES 120'],['Kaimati','Sweet dumplings in sugar syrup','KES 30'],['Vitumbua','Rice pancakes','KES 25'],['Chai ya tangawizi','Ginger tea, 300 ml','KES 50']],'alt'),
  split('right','FOR OFFICES AND SCHOOLS','A tray at every tea break','Standing orders of 50 to 500 pieces delivered to your door by 6:30am, with tea flasks on request.','Set up a standing order',A('cup',1902)),
  stats([['3am','First fry'],['6:30','Delivered'],['400','Mandazi a day, minimum'],['11','Women on the team']],'primary'),
  gal('strip','From the pan',[A('fruit',1903),A('plate',1904),A('cup',1905),A('heart',1906)],'alt'),
  quotes('Regulars',[['Our staff come early just for these.','Hawa S.','Nyali office manager'],['Kids finished the tray before lessons.','Mwalimu Juma','School teacher'],['Still hot at the sea front.','Peter','Delivery client']]),
  footer('Mama Zawadi Mandazi','Links Road, Nyali, Mombasa.')]),
  pg('Order','contact',[nav('Mama Zawadi','Order for tomorrow','center'),contact('Order for tomorrow','Order before 8pm for next-morning delivery within Nyali and Mkomani.','mandazi@zawadi.example','+254 711 190 100','Links Road, Nyali, Mombasa','Place order'),footer('Mama Zawadi Mandazi','Links Road, Nyali, Mombasa.')])]});

addBespoke({id:'curtains-mombasa',g:'Retail',tag:'Curtains and blinds',name:'Pazia Interiors',kw:'curtains blinds interior fabrics mombasa home decor',desc:'Made-to-measure curtains and blinds for coastal homes.',
 th:{p:'#7b3f61',p2:'#d9a441',p3:'#a7c4bc',bg:'#faf4ee',alt:'#efe3d8',tx:'#2f1b28',dark:false,head:'Cormorant Garamond',body:'Karla',radius:3},
 pages:[pg('Home','index',[nav('Pazia Interiors','Book a measure','center'),hero('cover','NYALI · MOMBASA','Let the sea light in, keep the heat out','Linen sheers, blackout lining and motorised blinds, measured at your window and hung in five days.','Book a free measure','Browse fabrics',[A('frame',1911)],'bg'),
  gal('masonry','Fabrics of the season',[A('frame',1912),A('bloom',1913),A('lamp',1914),A('circles',1915)]),
  steps('HOW IT WORKS','Four visits, one beautiful room',[['Measure','Free home visit with 40 fabric books.'],['Quote','Priced by metre and delivered by WhatsApp.'],['Make','Sewn in our Changamwe workshop.'],['Hang','Fitted, steamed and straightened.']],'alt'),
  split('archleft','COASTAL FABRICS','Made for salt and sun','Our linens are UV-treated and the lining is mildew resistant, so they will not fade or smell after two monsoons.','See the range',A('house',1916)),
  price('STARTING PRICES','Per window','Includes fabric, rail, sewing and fitting.',[['Sheer pair','KES 6,500','','Linen look\nRail included'],['Blackout pair','KES 11,000','','Triple weave\nPelmet option',1],['Roller blind','KES 5,200','','Made to size\nChain control']],'alt'),
  faq('Questions',[['How long?','Five working days from approval.'],['Do you do hotels?','Yes. We have dressed 14 hotels and apartment blocks.']]),
  footer('Pazia Interiors','Nyali Road, Mombasa.')]),
  pg('Contact','contact',[nav('Pazia Interiors','Book a measure','center'),contact('Book a free measure','Tell us your neighbourhood and a good day to visit.','hello@pazia.example','+254 733 191 200','Nyali Road, Mombasa','Request visit'),footer('Pazia Interiors','Nyali Road, Mombasa.')])]});

addBespoke({id:'school-erp-app',g:'Software',tag:'School management app',name:'Darasa School OS',kw:'school software fees attendance report cards saas',desc:'Fees, attendance and report cards for private schools.',
 th:{p:'#4f46e5',p2:'#f59e0b',p3:'#10b981',bg:'#f8f9ff',alt:'#eceeff',tx:'#161a3d',dark:false,head:'Bricolage Grotesque',body:'Figtree',radius:16,grad:true,pop:true},
 pages:[pg('Home','index',[nav('Darasa','Start free trial','left'),hero('split','FOR PRIVATE SCHOOLS IN KENYA, UGANDA AND TANZANIA','Fees collected. Report cards done.','Parents pay by M-Pesa, teachers mark on a phone, and the head sees every balance in one screen. Set up in a weekend.','Start free trial','Watch the demo',[A('laptop',1921)],'bg'),
  logos('Used by 310 schools',['Riverside Prep','Mbale Light','Kilimani Junior','Arusha Hope','Thika Star']),
  feats('FEATURES','Everything the school office does by hand',' ',[['💳','M-Pesa fees','Auto-reconcile every payment to the child’s account.'],['📋','Attendance','Teachers tap once; parents get an SMS.'],['🎓','Report cards','CBC and 8-4-4 templates, printed in one click.'],['💬','Parent chat','Announcements without 12 WhatsApp groups.']],'cards','alt'),
  stats([['94%','Fees collected on time'],['6 hrs','Saved per teacher weekly'],['310','Schools'],['KES 0','Setup fee']],'primary'),
  price('PRICING','Per pupil, per term','',[['Starter','KES 120','/pupil','Fees and attendance'],['School','KES 200','/pupil','Plus report cards and chat',1],['Group','Custom','','Multi-campus reporting']],'alt'),
  faq('Heads ask',[['Can we import pupils?','Yes, from Excel in two minutes.'],['Is data safe?','Hosted in Nairobi, backed up nightly.']]),
  cta('Run term three on Darasa','We import your pupils and fee structure for free.','Book onboarding'),footer('Darasa School OS','Westlands, Nairobi.')]),
  pg('Demo','contact',[nav('Darasa','Start free trial','left'),contact('Book a demo','Twenty minutes, on your phone or laptop.','demo@darasa.example','+254 700 192 300','Sarit Centre, Westlands','Book demo'),footer('Darasa School OS','Westlands, Nairobi.')])]});

addBespoke({id:'smart-parking-app',g:'Software',tag:'Parking app',name:'Pakia Smart Parking',kw:'parking app cbd nairobi payment sensors',desc:'Find and pay for parking in Nairobi CBD from your phone.',
 th:{p:'#00b8a9',p2:'#f6416c',p3:'#ffde7d',bg:'#101820',alt:'#182530',tx:'#f1f7f7',dark:true,head:'Outfit',body:'DM Mono',radius:20,grad:true},
 pages:[pg('Home','index',[nav('pakia','Get the app','left'),hero('center','NAIROBI CBD · 3,200 BAYS','Park in 30 seconds, not 30 minutes','See free bays on the map, pay with M-Pesa and extend your time from the matatu queue. No more clamps, no more cash.','Get the app','How it works',[],'bg'),
  steps('THREE TAPS','From street to parked',[['Find','Live map shows empty bays within 200 m.'],['Park','Tap the bay number and start the timer.'],['Pay','M-Pesa debit when you leave. Pay only what you used.']],'alt'),
  gal('grid','On the map',[A('road',1931),A('phone',1932),A('car',1933),A('city',1934)]),
  price('RATES','Per hour, CBD zones','',[['Zone A','KES 200','/hr','Kenyatta Ave, Moi Ave'],['Zone B','KES 150','/hr','Koinange, Tom Mboya',1],['Zone C','KES 100','/hr','River Road side streets']],'alt'),
  stats([['3,200','Bays on the map'],['41%','Less circling traffic'],['180k','Drivers'],['0','Clamps for app users']],'primary'),
  faq('Drivers ask',[['What if I overstay?','You get a push alert 10 minutes before and can extend remotely.'],['Do motorbikes pay?','Yes, KES 30 per hour in boda bays.']]),
  footer('Pakia Smart Parking','Kimathi Street, Nairobi.')]),
  pg('Support','contact',[nav('pakia','Get the app','left'),contact('Support','Weekdays 7am to 8pm, Saturdays 9 to 4.','help@pakia.example','+254 711 193 500','Kimathi Street, Nairobi','Send message'),footer('Pakia Smart Parking','Kimathi Street, Nairobi.')])]});

addBespoke({id:'bouncy-castles',g:'Events',tag:'Bouncy castle hire',name:'Rukia Kids Party Hire',kw:'bouncy castle party kids birthday hire nairobi',desc:'Castles, slides and party packs for kids’ birthdays.',
 th:{p:'#ff5da2',p2:'#ffd23f',p3:'#3ec1d3',bg:'#fff6fb',alt:'#ffe1f0',tx:'#3a1f4a',dark:false,head:'Baloo 2',body:'Baloo 2',radius:34,pop:true,deco:true,grad:true},
 pages:[pg('Home','index',[nav('Rukia Party Hire','Book a date','center'),hero('collage','KAREN · LANGATA · SYOKIMAU','The best party starts with a giant castle','Bouncy castles, water slides, candy-floss machines and a helper who keeps every child safe and every parent sitting down.','Book a date','See the castles',[A('balloon',1941),A('gift',1942),A('music',1943)],'bg'),
  cards('grid','CASTLES','Pick a size',' ',[[A('balloon',1944),'Mini castle','3 × 3 m, up to 6 kids, KES 6,500.'],[A('rocket',1945),'Adventure slide','Climb and slide, KES 9,500.'],[A('waves',1946),'Water park','Pool and two slides, KES 14,000.']],'alt'),
  feats('INCLUDED','Every hire comes with',' ',[['👷','Safety helper','Stays the whole party.'],['🧼','Sanitised','Cleaned after every use.'],['🔌','Generator','No power? No problem.']],'cards'),
  price('PARTY PACKS','Add-ons that make memories','',[['Sweet table','KES 4,500','','Candy floss and popcorn'],['Face paint','KES 3,000','','Two artists, two hours'],['Full pack','KES 15,000','','Castle, helper, sweets, music',1]],'alt'),
  gal('strip','Recent parties',[A('balloon',1947),A('gift',1948),A('heart',1949),A('music',1950)]),
  quotes('Parents say',[['Twenty kids, zero tears. Seriously.','Mercy W.','Karen'],['They arrived at 8am and set up before I woke.','Ian S.','Lang’ata'],['We booked again for next year.','Shanice','Syokimau']]),
  footer('Rukia Kids Party Hire','Karen Road, Nairobi.')]),
  pg('Book','contact',[nav('Rukia Party Hire','Book a date','center'),contact('Book a date','Tell us the date, location and number of children.','party@rukia.example','+254 722 194 600','Karen Road, Nairobi','Check date'),footer('Rukia Kids Party Hire','Karen Road, Nairobi.')])]});

addBespoke({id:'homestay-rusinga',g:'Travel',tag:'Island homestay',name:'Rusinga Island Homestay',kw:'homestay lake victoria island fishing luo culture',desc:'Stay with a Suba family on Lake Victoria’s Rusinga Island.',
 th:{p:'#2c7a7b',p2:'#e9a23b',p3:'#9c4221',bg:'#f6f2e7',alt:'#e3ebe0',tx:'#1d2f2d',dark:false,head:'Young Serif',body:'Manrope',radius:16,pop:false},
 pages:[pg('Home','index',[nav('Rusinga Homestay','Plan a stay','left'),hero('arch','LAKE VICTORIA · HOMA BAY COUNTY','Sleep where the fishermen sleep','Four families open their homes: fresh tilapia at supper, boat rides at dawn and a ridge walk to the Tom Mboya mausoleum.','Plan a stay','Meet the families',[A('waves',1951)],'bg'),
  cards('overlay','THE FAMILIES','Choose your home',' ',[[A('house',1952),'Mama Atieno','Stilt house over the water, two guests.'],[A('field',1953),'Odhiambo family','Farm, goats and a rooftop view, four guests.'],[A('beach',1954),'Mzee Okello','Beachfront, boat included, three guests.']],'alt'),
  steps('A DAY HERE','Gentle, unhurried',[['Dawn','Row out with the fishermen and haul nets.'],['Midday','Cook ugali and tilapia with your host.'],['Evening','Sunset over the lake, stories at the fire.']]),
  split('left','WHERE MONEY GOES','80% stays on the island','Your stay pays your host, the island school feeding programme and the boat repair fund. We keep 20% to run bookings and training.','See what we fund',A('heart',1955),'alt'),
  price('RATES','Per person per night','Full board, two activities included.',[['Shared','KES 3,800','','Bed, meals, boat'],['Private','KES 5,500','','Own room, meals, boat',1]]),
  faq('Good to know',[['How do we get there?','Ferry from Mbita, then a boda 20 minutes.'],['Is there power?','Solar lights and phone charging.']],'alt'),
  footer('Rusinga Island Homestay','Mbita, Homa Bay County.')]),
  pg('Plan','contact',[nav('Rusinga Homestay','Plan a stay','left'),contact('Plan your stay','Tell us your dates and group size.','stay@rusinga.example','+254 713 195 700','Mbita Pier, Homa Bay','Send request'),footer('Rusinga Island Homestay','Mbita, Homa Bay County.')])]});

addBespoke({id:'stone-quarry',g:'Business',tag:'Building stone quarry',name:'Ndarugu Stone Works',kw:'quarry building stone ballast blocks construction thika',desc:'Dressed stone, ballast and blocks for builders.',
 th:{p:'#9a3412',p2:'#facc15',p3:'#57534e',bg:'#e7e5e4',alt:'#d6d3d1',tx:'#1c1917',dark:false,head:'Anton',body:'Archivo',radius:0},
 pages:[pg('Home','index',[nav('NDARUGU STONE','Get a quote','left'),hero('cover','THIKA · KIAMBU ROAD','Stone from the ground to your gate','Machine-cut building stone, 3/4 ballast and hardcore delivered by tipper within 40 km of Thika, loaded in 15 minutes.','Get a quote','Price list',[A('stones',1961)],'alt'),
  menu('Today’s prices','Per tipper load (7 tonnes) unless stated. Updated every Monday.',[['Machine-cut stone 6 × 9','Per 100 pieces','KES 4,800'],['3/4 ballast','Per tipper','KES 21,000'],['Hardcore','Per tipper','KES 16,000'],['River sand','Per tipper','KES 24,000'],['Blocks 6 inch','Per piece','KES 70']]),
  stats([['9','Tippers on the road'],['40 km','Free delivery radius'],['15 min','Load time'],['1992','Founded']],'dark'),
  gal('mosaic','The quarry',[A('stones',1962),A('mountain',1963),A('road',1964),A('columns',1965),A('hills',1966)],'alt'),
  faq('Builders ask',[['Do you give receipts?','KRA-compliant invoices for every load.'],['Weekend deliveries?','Saturdays until 2pm.']]),
  cta('Building a perimeter wall?','Send the dimensions and we will calculate stone, cement and delivery for free.','Calculate for me'),footer('Ndarugu Stone Works','Ndarugu Road, Thika.')]),
  pg('Order','contact',[nav('NDARUGU STONE','Get a quote','left'),contact('Order or request a quote','Gate open Monday to Saturday, 6am to 5pm.','sales@ndarugustone.example','+254 720 196 800','Ndarugu Road, Thika','Send quote request'),footer('Ndarugu Stone Works','Ndarugu Road, Thika.')])]});

addBespoke({id:'cyber-sme-security',g:'Business',tag:'Cyber security',name:'Ngao Digital Security',kw:'cyber security small business phishing backups consulting',desc:'Cyber security for Kenyan small businesses and SACCOs.',
 th:{p:'#22d3ee',p2:'#a3e635',p3:'#f43f5e',bg:'#05080f',alt:'#0b1220',tx:'#e2f0f6',dark:true,head:'Space Mono',body:'Manrope',radius:4,grad:false},
 pages:[pg('Home','index',[nav('NGAO_','Free check-up','left'),hero('split','NAIROBI · FOR SMES AND SACCOS','You are not too small to be hacked','We find the weak links first: reused passwords, an unpatched till, a phished accountant. Then we fix them, in plain English.','Book a free check-up','See packages',[A('grid',1971)],'bg'),
  stats([['62%','Of SME attacks start by email'],['48 hrs','Median recovery with us'],['210','Businesses protected'],['0','Ransoms paid']],'alt'),
  steps('THE CHECK-UP','Half a day, one report',[['Scan','Passwords, devices, Wi-Fi and cloud accounts.'],['Test','Safe phishing test for your staff.'],['Report','Ten fixes ranked by cost and risk.']]),
  price('PACKAGES','Choose your shield','',[['Check-up','KES 25,000','/once','Scan and report'],['Guard','KES 18,000','/month','Backups, MFA and patching',1],['Response','KES 40,000','/month','24/7 incident line\nStaff training']],'alt'),
  quotes('Clients',[['They stopped a fake invoice that would have cost us KES 2 million.','Beatrice K.','Finance lead, SACCO'],['Our staff finally use proper passwords.','Wycliffe','Pharmacy owner']]),
  footer('Ngao Digital Security','Ngong Road, Nairobi.','dark')]),
  pg('Contact','contact',[nav('NGAO_','Free check-up','left'),contact('Book a free check-up','We will call you within one working day.','secure@ngao.example','+254 733 197 900','Prestige Plaza, Ngong Road','Book call'),footer('Ngao Digital Security','Ngong Road, Nairobi.','dark')])]});

addBespoke({id:'clay-water-filters',g:'Non-profit',tag:'Clay water filters',name:'Kitui Clay Filters',kw:'clay water filter ceramic kitui potters safe drinking water',desc:'Ceramic water filters made by potters in Kitui.',
 th:{p:'#b4532a',p2:'#2b6cb0',p3:'#e8c9a0',bg:'#f9efe3',alt:'#f0dcc3',tx:'#3b2316',dark:false,head:'DM Serif Display',body:'Lexend',radius:18,pop:true,deco:true},
 pages:[pg('Home','index',[nav('Kitui Clay Filters','Buy a filter','left'),hero('arch','KITUI · SOUTH-EASTERN KENYA','Clean water from clay and a handful of rice husk','Our women potters shape, fire and test every filter. One filter cleans 20 litres a day for five years and removes 99.9% of bacteria.','Buy a filter','Sponsor one',[A('cup',1981)],'bg'),
  stats([['99.9%','Bacteria removed'],['20 L','Clean water a day'],['5 yrs','Filter life'],['4,300','Families served']],'primary'),
  split('right','THE POTTERS','Thirty women, one kiln','Each filter is pressed from local clay mixed with sawdust, fired at 900°C and flow-tested before it leaves. Every pot is signed by its maker.','Meet the potters',A('person',1982),'alt'),
  price('PRICES','Pay once, drink for years','',[['Household','KES 2,500','','Filter, tap and lid'],['Sponsor a family','KES 2,800','','We deliver and teach care',1],['School set','KES 18,000','','Six filters with stand']]),
  steps('HOW IT WORKS','Pour, wait, drink',[['Pour','Fill the top pot with river or tap water.'],['Wait','Drops through the clay in 2 hours.'],['Drink','Collect from the tap below.']],'alt'),
  faq('Questions',[['How do I clean it?','Brush the clay gently every two weeks.'],['Can I buy bulk?','Yes, schools and clinics get 15% off.']]),
  footer('Kitui Clay Filters','Kitui Town Showgrounds.')]),
  pg('Contact','contact',[nav('Kitui Clay Filters','Buy a filter','left'),contact('Order or sponsor','Delivery by bus parcel or collect from the workshop.','filters@kituiclay.example','+254 722 198 000','Showgrounds Road, Kitui','Send order'),footer('Kitui Clay Filters','Kitui Town Showgrounds.')])]});

addBespoke({id:'beach-volleyball-diani',g:'Sports',tag:'Beach volleyball club',name:'Diani Spikers',kw:'beach volleyball club diani sand sports coaching',desc:'Beach volleyball coaching and tournaments on Diani beach.',
 th:{p:'#ff7a00',p2:'#00a8cc',p3:'#fff1c1',bg:'#fffaf0',alt:'#ffe9c2',tx:'#0b2d3a',dark:false,head:'Anton',body:'Outfit',radius:20,pop:true,grad:true},
 pages:[pg('Home','index',[nav('DIANI SPIKERS','Join a session','left'),hero('cover','DIANI BEACH · KWALE COUNTY','Sand, sun and a serious serve','Six courts on the white sand, coaching for beginners to national players and a Sunday tournament everyone is invited to.','Join a session','Tournament dates',[A('beach',1991)],'bg'),
  cards('grid','SESSIONS','Find your level',' ',[[A('beach',1992),'Newbie','Tue and Thu 4pm, KES 600.'],[A('person',1993),'Improvers','Mon and Wed 5pm, KES 800.'],[A('rocket',1994),'Squad','Daily 6am, KES 12,000 a month.']],'alt'),
  stats([['6','Courts'],['120','Members'],['Sunday','Open tournament'],['KES 600','First session']],'primary'),
  split('left','SUNDAY CUP','Anyone can enter, everyone eats','Teams of two, round-robin from 10am, a prize for the best team name and grilled fish for all at sunset.','Enter a team',A('music',1995)),
  gal('mosaic','Match day',[A('beach',1996),A('waves',1997),A('balloon',1998),A('hills',1999)],'alt'),
  faq('Players ask',[['Do I need a partner?','No, we match you.'],['Equipment?','Balls and nets are free. Bring sunscreen.']]),
  footer('Diani Spikers','Beach Road, Diani, Kwale.')]),
  pg('Join','contact',[nav('DIANI SPIKERS','Join a session','left'),contact('Join us','Tell us your level and we will place you in a group.','play@dianispikers.example','+254 711 199 100','Diani Beach Road, Kwale','Sign up'),footer('Diani Spikers','Beach Road, Diani, Kwale.')])]});

}
