/* Batch 5: 20 hand-designed website templates. */
{const {nav,hero,feats,split,gal,stats,quotes,price,faq,cta,contact,footer,team,cards,menu,steps,text,logos,blog,wa,pg}=B_,A=a_;

addBespoke({id:'bridal-boutique',g:'Events',tag:'Bridal boutique',name:'Harusi Atelier',kw:'bridal gowns wedding dress boutique fitting',desc:'Made-to-measure wedding gowns in Kilimani, Nairobi.',
 th:{p:'#9c5a6b',p2:'#d9b88f',p3:'#6e3b4a',bg:'#fbf4f1',alt:'#f3e4e0',tx:'#3a2229',dark:false,head:'Bodoni Moda',body:'Figtree',radius:0},
 pages:[pg('Home','index',[nav('Harusi Atelier','Book a fitting','center'),hero('arch','KILIMANI · NAIROBI','Your gown, cut for you alone','Silk, lace and Kenyan beadwork, fitted over three appointments by the women who sew it.','Book a fitting','See the collection',[A('bloom',501)],'alt'),
  gal('masonry','The 2026 collection',[A('bloom',502),A('diamond',503),A('heart',504),A('frame',505),A('lamp',506),A('gift',507)]),
  steps('THREE FITTINGS','From sketch to aisle in 12 weeks',[['Consult','An hour with tea, your mood board and our fabric swatches.'],['Toile','A cotton mock-up so we fix every line before cutting silk.'],['Final fit','Beadwork, hem and a walk-through of the day.']]),
  split('archleft','THE ATELIER','Eleven seamstresses, one workroom','Every bodice is boned by hand. Gowns start at KES 85,000 and most brides spend between 120,000 and 220,000.','Meet the team',A('scissors',508),'alt'),
  quotes('Brides',[['I cried in the toile. The real thing was unreal.','Wambui K.','Wed in Naivasha, June'],['They let my grandmother’s lace become the sleeves.','Aisha M.','Wed in Lamu'],['My mother and sisters were all there for the final fitting.','Njeri D.','Wed in Karen']],'bg'),
  cta('Fitting slots open for March','Six slots a week. We hold yours with a KES 5,000 deposit.','Choose a slot'),footer('Harusi Atelier','Ring Road, Kilimani, Nairobi.')]),
  pg('Book','contact',[nav('Harusi Atelier','Book a fitting','center'),contact('Book your first fitting','Tell us your wedding date and the feeling you are after.','atelier@harusi.example','+254 722 500 100','Ring Road, Kilimani, Nairobi','Request a slot'),footer('Harusi Atelier','Ring Road, Kilimani, Nairobi.')])]});

addBespoke({id:'implant-dentist',g:'Health',tag:'Dental implants',name:'Smile Foundations Kigali',kw:'dental implants dentist teeth clinic',desc:'Dental implants with fixed prices, in Kigali.',
 th:{p:'#0f8b8d',p2:'#143642',p3:'#f2b134',bg:'#ffffff',alt:'#eaf5f5',tx:'#143642',dark:false,head:'Figtree',body:'Figtree',radius:14},
 pages:[pg('Home','index',[nav('Smile Foundations','Free scan','left'),hero('split','IMPLANTS · KACYIRU, KIGALI','Missing a tooth? One visit to plan, one to place','3D scan on day one, your implant placed within a week, a crown you cannot tell from your own.','Book a free scan','See prices',[A('tooth',511)],'alt'),
  stats([['2,400','Implants placed'],['98%','Still strong after 10 years'],['45 min','Per implant'],['3 yr','Warranty']],'primary'),
  price('FIXED PRICES','What it costs, in full','Implant, abutment and crown. No extras at the desk.',[['Single tooth','RWF 650,000','','Implant + crown\nLocal anaesthetic\nWarranty'],['Two teeth','RWF 1,200,000','','Two implants + crowns\nFree review\nWarranty',1],['Full arch','RWF 4,800,000','','Four implants, bridge\nSedation option\nWarranty']],'bg'),
  split('left','YOUR VISIT','Painless, and we show you the scan first','You see your jaw on a big screen and choose the plan. Nothing is drilled until you say yes.','See a case',A('columns',512),'alt'),
  faq('Questions we hear',[['Does it hurt?','Most patients take one paracetamol. We use local anaesthetic.'],['Can I pay in parts?','Yes, over six months with MoMo or bank transfer.'],['Am I too old?','Our oldest patient was 81. Bone health matters, not age.']],'bg'),
  cta('Free 3D scan this week','Walk in or book. 20 minutes, no obligation.','Book the scan'),footer('Smile Foundations Kigali','KG 11 Ave, Kacyiru, Kigali.')]),
  pg('Book','contact',[nav('Smile Foundations','Free scan','left'),contact('Book your scan','Mon to Sat, 8am to 6pm.','scan@smilefoundations.example','+250 788 510 510','KG 11 Ave, Kacyiru, Kigali','Book scan'),footer('Smile Foundations Kigali','KG 11 Ave, Kacyiru, Kigali.')])]});

addBespoke({id:'solar-installer-ke',g:'Business',tag:'Solar installer',name:'Jua Kali Power',kw:'solar panels installation inverter battery nairobi',desc:'Rooftop solar and batteries for Kenyan homes and shops.',
 th:{p:'#f5a300',p2:'#ffd966',p3:'#2fbf71',bg:'#101820',alt:'#18232e',tx:'#f4f1e8',dark:true,head:'Rubik',body:'Rubik',radius:12,pop:true},
 pages:[pg('Home','index',[nav('Jua Kali Power','Free survey','left'),hero('cover','NAIROBI · NAKURU · KISUMU','Your last power bill, then free sun','Rooftop solar with batteries for homes and shops. Most customers recover the cost in 3 to 4 years.','Book a free survey','Calculate savings',[A('solar',521)],'alt'),
  stats([['1,850','Roofs fitted'],['KES 9M','Saved by customers each month'],['5 yr','Panel warranty'],['2 days','Typical install']],'bg'),
  cards('overlay','PACKAGES','Sized for how you live','',[[A('house',522),'Home 3 kW','Lights, TV, fridge and wifi through every outage. From KES 380,000.'],[A('shop',523),'Shop 8 kW','Run freezers and a till all day. From KES 890,000.'],[A('field',524),'Farm pump','Solar pumping for a borehole or dam. From KES 520,000.']]),
  split('right','THE MATH','We show your bill before and after','Our survey measures your roof and last 12 bills, then gives a one-page savings forecast you can take to your bank.','Get the forecast',A('chart',525),'alt'),
  steps('INSTALL','Four steps to lights-on',[['Survey','Roof, meter and bills, free.'],['Quote','Fixed price in 48 hours.'],['Fit','Two-day install by KPLC-certified crews.'],['Watch','App shows panels live.']]),
  faq('Good to know',[['Do you finance?','Yes. 12 to 36 months through our partner SACCOs.'],['What about cloudy weeks?','The battery covers two cloudy days; grid tops up the rest.']],'alt'),
  cta('Fit before the next outage','Book this week and we waive the KES 5,000 survey fee.','Book my survey'),footer('Jua Kali Power','Mombasa Road, Nairobi. EPRA licensed.')]),
  pg('Survey','contact',[nav('Jua Kali Power','Free survey','left'),contact('Book a free survey','Share your town and last month’s KPLC bill.','survey@juakali.example','+254 733 521 521','Mombasa Road, Nairobi','Book survey'),footer('Jua Kali Power','Mombasa Road, Nairobi. EPRA licensed.')])]});

addBespoke({id:'guard-security',g:'Business',tag:'Security services',name:'Ngao Guards',kw:'security guards alarm patrol cctv',desc:'Trained guards, alarms and patrols for Dar es Salaam.',
 th:{p:'#ffcb05',p2:'#ffffff',p3:'#3b82f6',bg:'#0a1128',alt:'#111b3d',tx:'#eef1fa',dark:true,head:'Oswald',body:'Archivo',radius:0},
 pages:[pg('Home','index',[nav('NGAO GUARDS','Get a quote','left'),hero('center','DAR ES SALAAM · LICENSED SINCE 2009','Someone is always awake at your gate','Vetted guards, 24-hour control room and a patrol car within 8 minutes in Masaki, Mikocheni and Mbezi.','Get a quote','Call control room',[],'bg'),
  feats('WHAT WE GUARD','Homes, offices and building sites',' ',[['🛡','Residential','Day and night guards for compounds.'],['🏢','Commercial','Reception, parking and access control.'],['🚧','Sites','Night watch for materials and plant.']],'cards','alt'),
  stats([['640','Guards on duty'],['8 min','Patrol response'],['24/7','Control room'],['0','Break-ins on alarmed sites in 2025']],'primary'),
  split('left','TRAINING','Six weeks before the first shift','Every guard passes first aid, conflict calming and radio drills. Background checks go through the police and two referees.','Our standards',A('city',531),'bg'),
  price('RATES','Monthly, per post','Uniform, radio and supervision included.',[['Day guard','TZS 480,000','/mo','12-hour day shift\nLog book'],['Day + night','TZS 900,000','/mo','Two guards\nPatrol checks',1],['Alarm only','TZS 85,000','/mo','Panic button\nPatrol response']],'alt'),
  cta('Free site assessment','We walk your property and send a plan in 48 hours.','Book assessment'),footer('Ngao Guards Ltd','Ali Hassan Mwinyi Road, Dar es Salaam.')]),
  pg('Quote','contact',[nav('NGAO GUARDS','Get a quote','left'),contact('Request a quote','Tell us the site type and shifts needed.','quotes@ngao.example','+255 754 531 531','Ali Hassan Mwinyi Rd, Dar es Salaam','Request quote'),footer('Ngao Guards Ltd','Ali Hassan Mwinyi Road, Dar es Salaam.')])]});

addBespoke({id:'crafts-market-fair',g:'Events',tag:'Crafts market',name:'Soko la Sanaa',kw:'crafts market fair makers weekend arusha',desc:'A monthly makers’ market in Arusha.',
 th:{p:'#e4572e',p2:'#2a9d8f',p3:'#f4b942',bg:'#fff6e5',alt:'#ffe8c2',tx:'#2d1b0e',dark:false,head:'Baloo 2',body:'Bricolage Grotesque',radius:24,pop:true,deco:true,grad:true},
 pages:[pg('Home','index',[nav('Soko la Sanaa','Become a maker','center'),hero('collage','FIRST SATURDAY · ARUSHA','Meet the hands behind the things you love','Ninety stalls of beadwork, batik, pottery, leather and honey, with live marimba and a food court.','Plan your visit','Apply for a stall',[A('shop',541),A('gift',542),A('paint',543)],'bg'),
  gal('mosaic','Last month’s finds',[A('paint',544),A('fruit',545),A('stones',546),A('gift',547),A('leaf',548),A('circles',549)]),
  feats('WHY COME','More than shopping',' ',[['🎶','Live music','Marimba at 11, bongo flava at 3.'],['🍢','Food court','Mishkaki, mandazi and cold passion juice.'],['🧒','Kids’ corner','Free clay and face painting.']],'cards','alt'),
  cards('grid','FEATURED MAKERS','Stall holders to find first','',[[A('stones',550),'Neema Beads','Maasai beadwork. Bracelets from TZS 8,000.'],[A('leaf',551),'Kijani Soap','Cold-process soap from TZS 6,000.'],[A('paint',552),'Batik Baba','Hand-dyed cloth from TZS 25,000.']]),
  price('STALLS','Sell at the market','Includes a table, a canopy and a spot on our Instagram.',[['Table','TZS 30,000','','2 m table\nCanopy shared'],['Corner','TZS 60,000','','3 m corner\nOwn canopy',1],['Food','TZS 90,000','','Gas allowed\nWater point']],'bg'),
  cta('Next market: first Saturday, 9am','Entry is TZS 2,000. Kids free.','Get directions'),footer('Soko la Sanaa','Njiro Community Grounds, Arusha.')]),
  pg('Apply','contact',[nav('Soko la Sanaa','Become a maker','center'),contact('Apply for a stall','Tell us what you make and send a photo link.','makers@sokolasanaa.example','+255 784 541 541','Njiro Grounds, Arusha','Apply'),footer('Soko la Sanaa','Njiro Community Grounds, Arusha.')])]});

addBespoke({id:'gallery-opening',g:'Creative',tag:'Art gallery',name:'Nyeusi Gallery',kw:'art gallery exhibition opening contemporary kampala',desc:'Contemporary East African art in Kampala.',
 th:{p:'#111111',p2:'#b3262b',p3:'#9b9b9b',bg:'#ffffff',alt:'#f2f2f0',tx:'#111111',dark:false,head:'Cormorant Garamond',body:'DM Mono',radius:0},
 pages:[pg('Now showing','index',[nav('Nyeusi Gallery','Opening RSVP','left'),hero('center','NOW SHOWING · UNTIL 15 NOVEMBER','Salt, Soil, Skin','Ten painters from Gulu, Jinja and Kampala on land and belonging. Opening night Friday 6pm.','RSVP to the opening','',[],'bg'),
  gal('strip','On the walls',[A('field',561),A('person',562),A('stones',563),A('hills',564)]),
  split('right','THE CURATOR','Why these ten','Dr Grace Atim chose artists who never left the district they paint. Works start at UGX 600,000; the largest canvas is 2 metres.','Read the essay',A('frame',565),'alt'),
  team('Artists in the show',[['Okello Julius','Oil on jute',566],['Mariam Nabirye','Charcoal',567],['Peter Ssali','Ink and clay',568]]),
  stats([['10','Artists'],['34','Works'],['UGX 600k','Prices from'],['Free','Entry']],'dark'),
  text('Visiting','Tuesday to Sunday, 11am to 7pm. Closed Mondays. Wheelchair access at the Kira Road entrance. Tours at 3pm on Saturdays.','narrow','bg'),
  footer('Nyeusi Gallery','Kira Road, Kamwokya, Kampala.','dark')]),
  pg('RSVP','contact',[nav('Nyeusi Gallery','Opening RSVP','left'),contact('RSVP to the opening','Friday, 6pm. Wine, a short talk, then the paintings.','rsvp@nyeusi.example','+256 772 561 561','Kira Road, Kamwokya, Kampala','RSVP'),footer('Nyeusi Gallery','Kira Road, Kamwokya, Kampala.','dark')])]});

addBespoke({id:'hr-payroll-app',g:'Tech',tag:'HR and payroll software',name:'Wafanyi HR',kw:'hr payroll software leave staff saas',desc:'Payroll, leave and contracts for East African SMEs.',
 th:{p:'#5b47e0',p2:'#e8e4ff',p3:'#ff7a59',bg:'#fafaff',alt:'#eeecff',tx:'#16133a',dark:false,head:'Manrope',body:'Manrope',radius:16,grad:true},
 pages:[pg('Home','index',[nav('Wafanyi HR','Start free','left'),hero('split','PAYROLL · LEAVE · CONTRACTS','Pay everyone right, on the 25th, in 10 minutes','PAYE, NSSF and NHIF worked out for you. Pay by M-Pesa, bank or cash slip. Built for teams of 5 to 200.','Start free for 30 days','Watch a demo',[A('phone',571)],'bg'),
  logos('Used by',['Savannah Foods','Tui Clinics','Kibo Logistics','Pwani Hotels','Zuri Schools'],'alt'),
  feats('ONE PLACE','Everything about your staff',' ',[['💸','Payroll in 10 minutes','Statutory deductions for Kenya, Uganda and Tanzania.'],['🌴','Leave that approves itself','Staff request on their phone; managers tap yes.'],['📄','Contracts and payslips','Signed e-contracts and payslips on WhatsApp.']],'cards','bg'),
  split('left','COMPLIANCE','No more KRA late fees','Every deadline is on your dashboard. We file returns for you and send you the receipt.','See compliance',A('bars',572),'alt'),
  price('PRICING','Pay per person','Prices in Kenya shillings. Cancel any time.',[['Starter','KES 150','/person','Up to 10 staff\nPayslips'],['Growth','KES 250','/person','Leave + contracts\nM-Pesa pay',1],['Scale','Custom','','API and SSO\nDedicated onboarding']],'bg'),
  quotes('Finance teams',[['Payroll used to take me three days. Now lunch.','Esther W.','Accountant, Tui Clinics'],['Our staff finally get payslips on time.','Brian O.','HR, Kibo Logistics']],'alt'),
  cta('Run your next payroll free','We migrate your spreadsheet for you.','Start free'),footer('Wafanyi HR','Westlands, Nairobi.')]),
  pg('Contact','contact',[nav('Wafanyi HR','Start free','left'),contact('Talk to a human','We reply within a working hour.','hello@wafanyi.example','+254 700 571 571','Waiyaki Way, Westlands, Nairobi','Send'),footer('Wafanyi HR','Westlands, Nairobi.')])]});

addBespoke({id:'school-fundraiser',g:'Nonprofit',tag:'School fundraiser',name:'Roof for Kanyama Primary',kw:'school fundraiser donate classroom roof charity',desc:'Raising money for a new classroom roof in Lusaka.',
 th:{p:'#d94f30',p2:'#fdb827',p3:'#1f7a5a',bg:'#fffaf0',alt:'#ffeccc',tx:'#2c1a12',dark:false,head:'Lexend',body:'Lexend',radius:20,pop:true},
 pages:[pg('Home','index',[nav('Roof for Kanyama','Donate','center'),hero('cover','LUSAKA · 480 PUPILS','When it rains, class stops','Our classroom roof leaks in eleven places. We need ZMW 180,000 before the November rains to fix it.','Give today','Read the story',[A('house',581)],'bg'),
  stats([['ZMW 112k','Raised so far'],['62%','Of the goal'],['318','Donors'],['23 days','Left']],'primary'),
  split('right','THE PROBLEM','Seven classes share three dry rooms','Last term pupils lost 31 school days to rain. The roof is rusted iron from 1994.','See the photos',A('hills',582),'alt'),
  cards('grid','WHAT YOUR GIFT BUYS','Every kwacha is itemised','',[[A('house',583),'ZMW 100','Four iron sheets.'],[A('book',584),'ZMW 500','Timber for one rafter row.'],[A('heart',585),'ZMW 2,000','A whole classroom ceiling.']]),
  quotes('From the school',[['My daughter now studies without a bucket beside her.','Mrs. Phiri','Parent'],['We want children learning, not mopping.','Mr. Banda','Head teacher']],'alt'),
  faq('Giving',[['Is it safe?','Funds go straight to the school’s bank account, receipts shared on this site.'],['Can I pay with MTN MoMo?','Yes. Dial *115# or use the donate button.']],'bg'),
  cta('Help us finish by November','Share this page with three friends.','Donate now'),footer('Kanyama Primary PTA','Kanyama Compound, Lusaka.')]),
  pg('Donate','contact',[nav('Roof for Kanyama','Donate','center'),contact('Give or ask a question','MoMo till 449110, or write to the PTA.','pta@kanyama.example','+260 977 581 581','Kanyama Primary, Lusaka','Send'),footer('Kanyama Primary PTA','Kanyama Compound, Lusaka.')])]});

addBespoke({id:'yoga-teacher-diani',g:'Wellness',tag:'Yoga teacher',name:'Amani Yoga with Zawadi',kw:'yoga teacher retreat beach diani classes',desc:'Beach yoga classes and retreats in Diani.',
 th:{p:'#5c7a5a',p2:'#e8c9a0',p3:'#a85d44',bg:'#f8f3ea',alt:'#ebe3d3',tx:'#2d3a2c',dark:false,head:'Young Serif',body:'Figtree',radius:40,deco:true},
 pages:[pg('Home','index',[nav('Amani Yoga','Join a class','center'),hero('arch','DIANI BEACH · KWALE','Breathe where the sea breathes','Sunrise vinyasa on the sand and slow yin by candlelight. One teacher, twelve mats, no rush.','See the timetable','Plan a retreat',[A('beach',591)],'alt'),
  feats('THIS WEEK','Classes with Zawadi',' ',[['🌅','Sunrise flow, 6:30','Mon, Wed, Fri on the sand. KES 1,500.'],['🕯','Yin and candles, 6pm','Tue and Thu in the studio. KES 1,800.'],['🌱','Beginner basics, Sat 9','Gentle, no experience needed. KES 1,200.']],'cards','bg'),
  split('left','ABOUT ZAWADI','Eleven years of teaching, trained in Mysore','She grew up in Ukunda and started teaching to three neighbours under a baobab.','Her story',A('person',592),'alt'),
  gal('grid','Mornings on the beach',[A('beach',593),A('waves',594),A('leaf',595),A('bloom',596)]),
  price('RETREAT','Three days in March','Shared rooms at Msambweni, vegetarian meals, two classes a day.',[['Shared','KES 42,000','','3 nights\nAll meals'],['Private room','KES 58,000','','3 nights\nAll meals\nMassage',1]],'bg'),
  quotes('Students',[['I came for a stretch, I left sleeping properly.','Maria G.','Retreat guest'],['Zawadi remembers every injury and adjusts for it.','Hassan A.','Weekly student']],'alt'),
  footer('Amani Yoga','Diani Beach Road, Kwale County.')]),
  pg('Contact','contact',[nav('Amani Yoga','Join a class','center'),contact('Say hello','First class is a gift: just turn up and say Karibu.','zawadi@amani.example','+254 711 591 591','Diani Beach Road, Kwale','Send message'),footer('Amani Yoga','Diani Beach Road, Kwale County.')])]});

addBespoke({id:'freelance-accountant',g:'Business',tag:'Freelance accountant',name:'Mercy Wanjiku, CPA',kw:'accountant freelance tax bookkeeping small business',desc:'Bookkeeping and tax for small Nairobi businesses.',
 th:{p:'#1f3d2b',p2:'#b8860b',p3:'#7a8f7e',bg:'#f9f6ee',alt:'#efe9d8',tx:'#1e1e1a',dark:false,head:'Libre Caslon Text',body:'Libre Caslon Text',radius:2},
 pages:[pg('Home','index',[nav('Mercy Wanjiku, CPA','Book a call','left'),hero('center','BOOKKEEPING · KRA RETURNS · PAYROLL','Books you can read, taxes filed before the deadline','One accountant, no juniors. I look after 38 small businesses in Nairobi: shops, salons, clinics and consultants.','Book a free call','',[],'bg'),
  steps('HOW WE WORK','A simple monthly rhythm',[['Send','Photos of receipts on WhatsApp by the 5th.'],['Record','I enter and match everything in Zoho Books.'],['Report','A one-page summary lands on the 10th.'],['File','VAT, PAYE and annual returns, on time.']],'alt'),
  price('FEES','Fixed monthly, no surprises','Paid by M-Pesa. No contract beyond three months.',[['Light','KES 6,000','/mo','Bookkeeping to 50 entries\nQuarterly review'],['Standard','KES 12,000','/mo','Up to 200 entries\nVAT and PAYE',1],['Full','KES 22,000','/mo','Unlimited entries\nPayroll for 10\nBank loan packs']],'bg'),
  split('right','WHY ME','Fifteen years at a Big Four, then a desk of my own','I left audit to help people who were drowning in shoeboxes of receipts.','About Mercy',A('chart',601),'alt'),
  quotes('Clients',[['She found KES 240,000 of VAT I had overpaid.','Peter K.','Hardware shop, Thika'],['I finally know whether the salon makes money.','Lilian A.','Salon owner, Ngong Road']],'bg'),
  cta('Is your KRA return up to date?','A free 20-minute call to check your position.','Book a call'),footer('Mercy Wanjiku, CPA (K)','ICPAK registered. Ngong Road, Nairobi.')]),
  pg('Contact','contact',[nav('Mercy Wanjiku, CPA','Book a call','left'),contact('Book a free call','Mon to Fri, 9am to 5pm.','mercy@wanjiku-cpa.example','+254 722 601 601','Prestige Plaza, Ngong Road, Nairobi','Request call'),footer('Mercy Wanjiku, CPA (K)','ICPAK registered. Ngong Road, Nairobi.')])]});

addBespoke({id:'tv-production-house',g:'Creative',tag:'TV production',name:'Kioo Pictures',kw:'tv production video documentary commercial crew',desc:'TV, documentary and commercial production in Dar es Salaam.',
 th:{p:'#c8ff3d',p2:'#ff4fa3',p3:'#7b61ff',bg:'#0b0b10',alt:'#14141c',tx:'#f3f3f7',dark:true,head:'Syne',body:'Manrope',radius:8,grad:true},
 pages:[pg('Reel','index',[nav('KIOO PICTURES','Brief us','left'),hero('cover','DOCUMENTARY · COMMERCIAL · SERIES','We shoot Africa’s next ten minutes','From 30-second ads for Azam to a six-part series for Netflix East Africa, shot by a crew of 24.','Watch the reel','Brief us',[A('film',611)],'bg'),
  logos('Worked with',['Azam TV','Vodacom','Serengeti Breweries','DW Africa','NMB Bank'],'alt'),
  gal('mosaic','Frames',[A('film',612),A('city',613),A('person',614),A('beach',615),A('savanna',616),A('road',617)]),
  split('left','CAPABILITY','Two stages, a grade suite and four camera crews','We own Arri and Sony kit, a 400 m² studio in Mikocheni and a colour suite. Post is done under the same roof.','See the kit',A('camera',618),'alt'),
  stats([['180','Productions'],['3','Emmy nominations'],['24','Crew'],['11','Languages subtitled']],'primary'),
  steps('PROCESS','From brief to broadcast',[['Brief','A 30-minute call.'],['Pitch','Treatment and budget in a week.'],['Shoot','Local crews, fixers, permits.'],['Deliver','Edit, grade, sound and subtitles.']]),
  cta('Got a story?','Send a paragraph. We reply in two working days.','Send the brief'),footer('Kioo Pictures','Mikocheni Industrial Area, Dar es Salaam.')]),
  pg('Brief','contact',[nav('KIOO PICTURES','Brief us','left'),contact('Brief us','What are we making, for whom, by when?','hello@kioo.example','+255 713 611 611','Mikocheni, Dar es Salaam','Send brief'),footer('Kioo Pictures','Mikocheni Industrial Area, Dar es Salaam.')])]});

addBespoke({id:'camera-repair-bench',g:'Retail',tag:'Camera repair',name:'Shutter Doctor',kw:'camera repair lens service film photography nairobi',desc:'Camera and lens repair bench in Nairobi CBD.',
 th:{p:'#e8541e',p2:'#d8d2c4',p3:'#6b6b63',bg:'#1b1b19',alt:'#262623',tx:'#ece7da',dark:true,head:'DM Mono',body:'DM Mono',radius:3},
 pages:[pg('Bench','index',[nav('SHUTTER DOCTOR','Send a camera','left'),hero('split','NAIROBI CBD · SINCE 2003','Stuck shutter? Foggy lens? Bring it in','Canon, Nikon, Sony, Fuji and old film bodies. Free diagnosis. Repairs guaranteed for 6 months.','Book a drop-off','See prices',[A('camera',621)],'alt'),
  menu('Price list','Typical repairs in Kenya shillings. Parts extra.',[['Sensor clean','Same day','2,500'],['Shutter replace, DSLR','3 to 5 days','9,500'],['Lens fungus clean','5 days','6,000'],['Film body overhaul','2 weeks','12,000'],['Water damage rescue','Depends, diagnosis free','from 4,000']],'bg'),
  steps('THE BENCH','What happens to your camera',[['Check-in','Photographed and logged.'],['Diagnose','Quote by WhatsApp in 24 hours.'],['Repair','Done by Mr. Karanja himself.'],['Test','50 frames before it leaves.']],'alt'),
  gal('strip','On the bench today',[A('camera',622),A('frame',623),A('lamp',624),A('circles',625)]),
  faq('Common questions',[['Do you repair film cameras?','Yes: Pentax K1000, Canon AE-1, Olympus OM and Yashica.'],['Can you ship?','We receive by Wells Fargo courier from anywhere in Kenya.']],'bg'),
  footer('Shutter Doctor','Kimathi Street, Nairobi CBD. Mon to Sat 9 to 6.','dark')]),
  pg('Drop-off','contact',[nav('SHUTTER DOCTOR','Send a camera','left'),contact('Book a drop-off','Tell us the model and what it does (or does not do).','bench@shutterdoctor.example','+254 20 621 0621','3rd Floor, Kimathi House, Nairobi','Book'),footer('Shutter Doctor','Kimathi Street, Nairobi CBD.','dark')])]});

addBespoke({id:'land-surveyor',g:'Business',tag:'Land surveyor',name:'Mipaka Surveys',kw:'land surveyor boundary title deed mapping',desc:'Boundary surveys and title support in Nakuru.',
 th:{p:'#0050ff',p2:'#fff200',p3:'#202020',bg:'#f7f7f2',alt:'#e9e9df',tx:'#161616',dark:false,head:'Space Mono',body:'Space Mono',radius:0},
 pages:[pg('Home','index',[nav('MIPAKA SURVEYS','Request a survey','left'),hero('center','LICENSED SURVEYORS · NAKURU','Know exactly where your land ends','Boundary re-establishment, subdivisions and title deed support with a drone and a total station.','Request a survey','See rates',[],'alt'),
  stats([['3,100','Plots surveyed'],['±2 cm','Accuracy'],['5 days','Typical turnaround'],['0','Disputes lost']],'dark'),
  steps('HOW IT WORKS','Pegs in the ground in five days',[['Search','We pull your RIM and deed plan at the land registry.'],['Visit','Crew of three, drone and GPS.'],['Peg','Concrete beacons at every corner.'],['Report','Signed mutation form and map.']]),
  split('left','DRONE MAPPING','See every boundary from the air','For farms over 5 acres we fly the land, draw contours and mark water paths for your buyer or bank.','Drone survey',A('field',631),'alt'),
  price('RATES','Typical charges','Government fees paid separately.',[['Quarter acre','KES 28,000','','Boundary check\nBeacons'],['One acre','KES 45,000','','Beacons + report',1],['Subdivision','KES 8,000','/plot','Mutation forms\nRegistry follow-up']],'bg'),
  faq('Before you buy land',[['How do I know the title is real?','We run an official search for KES 5,000 and tell you what it shows.'],['Do neighbours need to be present?','Yes. We invite them in writing 7 days before.']],'alt'),
  cta('Buying land this month?','Book a pre-purchase check before you pay the deposit.','Book a check'),footer('Mipaka Surveys','Kenyatta Avenue, Nakuru. ISK member.','dark')]),
  pg('Request','contact',[nav('MIPAKA SURVEYS','Request a survey','left'),contact('Request a survey','Share the parcel number and county.','survey@mipaka.example','+254 722 631 631','Kenyatta Avenue, Nakuru','Send request'),footer('Mipaka Surveys','Kenyatta Avenue, Nakuru.','dark')])]});

addBespoke({id:'drip-irrigation',g:'Agriculture',tag:'Irrigation supplier',name:'Matone Drip',kw:'drip irrigation farming kits water greenhouse',desc:'Drip kits and solar pumps for smallholders in Kenya.',
 th:{p:'#007f5f',p2:'#ffbe0b',p3:'#3a86ff',bg:'#f1fbe9',alt:'#d9f0c2',tx:'#0e2e1c',dark:false,head:'Archivo Black',body:'Rubik',radius:10,pop:true},
 pages:[pg('Home','index',[nav('MATONE DRIP','Order a kit','left'),hero('collage','KITS · PUMPS · TRAINING','Double your yield with half the water','Drip kits from one-eighth of an acre to ten acres, with a solar pump and a free training day.','Choose a kit','Ask an agronomist',[A('field',641),A('leaf',642),A('fruit',643)],'bg'),
  cards('grid','KITS','Sized to your plot','',[[A('leaf',644),'Kitchen garden','500 m². KES 14,500, delivered.'],[A('field',645),'Quarter acre','Tomatoes or kale. KES 38,000.'],[A('solar',646),'Acre + solar pump','Full system. KES 165,000.']]),
  stats([['62%','Less water'],['2.4×','Tomato yield'],['9,000','Farms fitted'],['1 day','Installed']],'primary'),
  split('right','FARMER TRAINING','Free class with every kit','Bring your family to our demo plot in Kiambu. Learn spacing, fertigation and pest scouting.','Join a class',A('hills',647),'alt'),
  quotes('Farmers',[['My kale beat the drought and paid my school fees.','Mama Njoki','Limuru'],['Pump runs on sun, no more diesel.','Daniel R.','Kitengela']],'bg'),
  faq('Questions',[['Can I pay by instalments?','Yes. 3 payments by M-Pesa over 90 days.'],['Do you deliver upcountry?','Same day to Nairobi, 2 days anywhere in Kenya.']],'alt'),
  cta('Planting season is near','Order by Friday for installation next week.','Order now'),footer('Matone Drip Ltd','Thika Road, Kiambu.')]),
  pg('Order','contact',[nav('MATONE DRIP','Order a kit','left'),contact('Order or ask','Say your plot size and crop.','kits@matone.example','+254 700 641 641','Thika Road, Kiambu','Send order'),footer('Matone Drip Ltd','Thika Road, Kiambu.')])]});

addBespoke({id:'tilapia-fish-farm',g:'Agriculture',tag:'Fish farm',name:'Ziwa Bora Fishery',kw:'tilapia fish farm cages lake victoria fingerlings',desc:'Cage-farmed tilapia and fingerlings on Lake Victoria.',
 th:{p:'#12577a',p2:'#f0a35e',p3:'#2b9a8c',bg:'#f5efe3',alt:'#e3ecef',tx:'#0e2631',dark:false,head:'Gloock',body:'Lexend',radius:6},
 pages:[pg('Home','index',[nav('Ziwa Bora Fishery','Order fish','center'),hero('arch','BUSIA · LAKE VICTORIA','Tilapia raised in clean, moving water','Grown in cages off Port Victoria for seven months, delivered on ice to Nairobi, Kisumu and Kampala.','Order fish','Buy fingerlings',[A('waves',651)],'alt'),
  stats([['180 t','Harvested each year'],['7 months','To plate size'],['0','Antibiotics used'],['4 hrs','Lake to ice']],'bg'),
  cards('overlay','WHAT WE SELL','Fresh, frozen and fingerlings','',[[A('waves',652),'Plate-size tilapia','500 g, KES 450 each. Whole or gutted.'],[A('plate',653),'Fillets','KES 1,100 per kg, vacuum packed.'],[A('leaf',654),'Fingerlings','KES 12 each, minimum 2,000.']]),
  split('left','THE CAGES','Floating farms with a view of Mfangano','Fish are fed twice daily on pellets from Kisumu and sampled weekly by a vet from Maseno University.','Visit the farm',A('beach',655),'alt'),
  steps('DELIVERY','Cold chain, start to finish',[['Harvest','Before 6am.'],['Ice','Packed in food-grade crates.'],['Truck','Insulated, 6 hours to Nairobi.'],['Door','Same-day to restaurants.']]),
  quotes('Buyers',[['Our grilled tilapia sells out by 2pm.','Samuel O.','Restaurant, Kisumu'],['Clean taste, no mud.','Faith A.','Supermarket buyer']],'alt'),
  cta('Restaurants and hotels','Weekly standing orders at a locked price.','Request prices'),footer('Ziwa Bora Fishery','Port Victoria, Busia County.')]),
  pg('Order','contact',[nav('Ziwa Bora Fishery','Order fish','center'),contact('Place an order','Delivery Tuesday and Friday.','orders@ziwabora.example','+254 721 651 651','Port Victoria, Busia','Order'),footer('Ziwa Bora Fishery','Port Victoria, Busia County.')])]});

addBespoke({id:'timber-yard',g:'Business',tag:'Timber yard',name:'Mbao Mpya Timber',kw:'timber yard wood planks cypress cutting sawmill',desc:'Treated cypress and pine, cut to size in Njombe.',
 th:{p:'#8a4b1f',p2:'#e9c46a',p3:'#4a6b3f',bg:'#f6ede0',alt:'#ead9bf',tx:'#2b1a0d',dark:false,head:'Fraunces',body:'Outfit',radius:4},
 pages:[pg('Home','index',[nav('Mbao Mpya','Get a price','left'),hero('cover','NJOMBE · TANZANIA','Straight planks that stay straight','Cypress and pine from our own plantations, kiln dried, treated and cut to your list.','Get a price','View stock',[A('field',661)],'bg'),
  gal('masonry','In the yard',[A('field',662),A('stones',663),A('house',664),A('leaf',665)]),
  menu('Stock list','Per piece, cut and planed. Prices in TZS.',[['Cypress 2×4, 4 m','Roofing','12,500'],['Cypress 2×2, 4 m','Battens','5,800'],['Pine plank 1×12, 3 m','Doors, cupboards','18,000'],['Marine plywood 18 mm','Full sheet','78,000'],['Treated pole, 6 m','Fencing','22,000']],'alt'),
  stats([['25 yr','Treated life'],['900 ha','Own plantations'],['Free','Cutting to size'],['2 days','Dar delivery']],'primary'),
  split('left','CARE','We replant three trees for every one cut','FSC-certified since 2018. Our nursery in Makambako gives away seedlings to neighbouring farms.','Our forests',A('leaf',666),'bg'),
  faq('For builders',[['Do you deliver?','Yes. Dar es Salaam, Mbeya and Iringa by truck.'],['Can I see samples?','Visit the yard, Mon to Sat 7am to 5pm.']],'alt'),
  footer('Mbao Mpya Timber','Njombe Industrial Area, Njombe Region.')]),
  pg('Price','contact',[nav('Mbao Mpya','Get a price','left'),contact('Send your cut list','We reply with a price in 4 working hours.','sales@mbaompya.example','+255 765 661 661','Njombe Industrial Area','Get price'),footer('Mbao Mpya Timber','Njombe Industrial Area, Njombe Region.')])]});

addBespoke({id:'electrician-fundi',g:'Business',tag:'Electrician',name:'Volts Fundi',kw:'electrician wiring repairs house emergency power',desc:'Licensed electricians on call in Kampala.',
 th:{p:'#ffe600',p2:'#111111',p3:'#ff3b30',bg:'#ffffff',alt:'#f3f3ee',tx:'#111111',dark:false,head:'Anton',body:'Rubik',radius:0},
 pages:[pg('Home','index',[nav('VOLTS FUNDI','Call now','left','page:contact'),hero('center','KAMPALA · 24/7','Lights out? We are 40 minutes away','Licensed electricians for tripping breakers, rewiring, meters and new installs. Fixed prices before we start.','Call 0700 671 671','Get a quote',[],'alt'),
  feats('WE FIX','The usual troubles',' ',[['⚡','Tripping power','Faulty breakers, overloaded sockets.'],['🏠','Rewiring','Old houses made safe, with certificates.'],['💡','Lighting','Ceilings, security lights, solar tie-ins.']],'cards','bg'),
  price('PRICES','Fixed call-out rates','Materials charged at cost with a receipt.',[['Callout','UGX 50,000','','Diagnosis\nSmall fixes'],['Half day','UGX 180,000','','4 hours\nTwo electricians',1],['Full rewire','From UGX 2.4M','','3-bed house\nCertificate']],'alt'),
  stats([['12,000','Jobs done'],['40 min','Average response'],['10 yr','Workmanship guarantee'],['ERA','Licensed']],'dark'),
  quotes('Customers',[['Arrived at 11pm and fixed our DB board.','Ritah N.','Ntinda'],['Explained everything and left it tidy.','Moses T.','Muyenga']],'bg'),
  cta('Call before you touch the wires','Free phone advice, any time of the day.','Call now','dark'),footer('Volts Fundi','Ntinda, Kampala. ERA licence 4471.')]),
  pg('Contact','contact',[nav('VOLTS FUNDI','Call now','left'),contact('Call or message','Emergency line open all night.','help@voltsfundi.example','+256 700 671 671','Ntinda Road, Kampala','Request fundi'),footer('Volts Fundi','Ntinda, Kampala.')])]});

addBespoke({id:'flower-subscription',g:'Retail',tag:'Florist subscription',name:'Maua Weekly',kw:'flowers bouquet subscription delivery roses nairobi',desc:'Weekly flower bouquets from Naivasha farms, delivered in Nairobi.',
 th:{p:'#c9345a',p2:'#f6c445',p3:'#2e6b4a',bg:'#fff7f4',alt:'#fde3e3',tx:'#401828',dark:false,head:'Instrument Serif',body:'Figtree',radius:30,deco:true,grad:true},
 pages:[pg('Home','index',[nav('Maua Weekly','Subscribe','center'),hero('split','NAIVASHA TO NAIROBI','Cut on Wednesday, on your table on Thursday','Flowers from small Naivasha farms in a hand-tied bunch, every week, with free delivery.','Subscribe from KES 1,800','See this week’s bunch',[A('bloom',671)],'alt'),
  cards('grid','CHOOSE A SIZE','Three bunches, no wasted stems','',[[A('bloom',672),'Posy','12 stems. KES 1,800 / week.'],[A('leaf',673),'Bunch','24 stems and foliage. KES 2,800 / week.'],[A('heart',674),'Grand','40 stems in a vase. KES 4,500 / week.']]),
  gal('mosaic','Last month’s bunches',[A('bloom',675),A('heart',676),A('leaf',677),A('bloom',678),A('gift',679),A('fruit',680)],'alt'),
  steps('HOW IT WORKS','Pause or skip any week',[['Pick','Choose size and day.'],['We cut','Fresh on Wednesday.'],['Delivered','Thursday 4 to 7pm.'],['Enjoy','Flowers last 10 days.']]),
  split('archleft','OUR GROWERS','Six family farms around Lake Naivasha','We pay 30% above market and flowers are grown with recycled water.','Meet the growers',A('field',681),'bg'),
  quotes('Subscribers',[['Thursdays now smell wonderful.','Karen M.','Lavington'],['Sent to my mum every week. She cries every time.','Yusuf H.','Subscriber']],'alt'),
  cta('First bunch half price','Use code MAUA50 at checkout.','Start now'),footer('Maua Weekly','Delivering across Nairobi, Wednesday to Thursday.')]),
  pg('Subscribe','contact',[nav('Maua Weekly','Subscribe','center'),contact('Start or change your subscription','Pay by M-Pesa each month.','hello@mauaweekly.example','+254 722 671 671','Lavington, Nairobi','Subscribe'),footer('Maua Weekly','Delivering across Nairobi.')])]});

addBespoke({id:'maths-tuition',g:'Education',tag:'Maths tuition centre',name:'Hesabu Plus',kw:'maths tuition kcse mock exams after school students',desc:'KCSE maths and physics tuition in Eldoret.',
 th:{p:'#1b3a8a',p2:'#ff9f1c',p3:'#00a78e',bg:'#f6f8ff',alt:'#e3e9ff',tx:'#101a40',dark:false,head:'Sora',body:'Lexend',radius:12,grad:true},
 pages:[pg('Home','index',[nav('Hesabu Plus','Enrol now','left'),hero('center','FORM 3 · FORM 4 · ELDORET','From a D to a B+ in one year','Small-group KCSE maths and physics with weekly mock tests and parents’ reports every term.','Enrol for Term 1','See timetable',[],'alt'),
  stats([['A- avg','Top class result'],['96%','Improve a grade'],['8','Students per class'],['14 yr','Teaching']],'primary'),
  feats('HOW WE TEACH','Fewer notes, more practice',' ',[['✏','Past papers weekly','10 years of KCSE papers solved in class.'],['📊','Mock tests','Marked in 48 hours with feedback.'],['👨‍👩‍👧','Parent reports','Termly reports by WhatsApp.']],'cards','bg'),
  price('FEES','Per term','Pay by M-Pesa Paybill 400123.',[['Maths','KES 9,000','/term','2 evenings a week'],['Maths + Physics','KES 15,000','/term','4 evenings\nMocks included',1],['Holiday camp','KES 6,500','/week','Revision week']],'alt'),
  team('Teachers',[['Mr. Kiprop','Maths · 14 yrs',691],['Ms. Chebet','Physics · 9 yrs',692]],'bg'),
  faq('Parents ask',[['What age?','Form 2 to Form 4.'],['Do you pick up?','No, but we are 3 minutes from Eldoret High.']],'alt'),
  cta('Term 1 places are filling','Enrol before 15 December for early-bird fees.','Enrol now'),footer('Hesabu Plus','Uganda Road, Eldoret.')]),
  pg('Enrol','contact',[nav('Hesabu Plus','Enrol now','left'),contact('Enrol your child','Mon to Fri, 3pm to 7pm.','enrol@hesabu.example','+254 722 691 691','Uganda Road, Eldoret','Enrol'),footer('Hesabu Plus','Uganda Road, Eldoret.')])]});

addBespoke({id:'boda-ride-app',g:'Tech',tag:'Boda boda ride app',name:'Pikipiki Go',kw:'boda boda ride hailing app motorcycle taxi',desc:'Safe boda boda rides at the tap of a phone in Kampala.',
 th:{p:'#00c853',p2:'#ffd600',p3:'#212121',bg:'#101010',alt:'#1a1a1a',tx:'#f5f5f0',dark:true,head:'Syne',body:'Sora',radius:22,pop:true,grad:true},
 pages:[pg('Home','index',[nav('Pikipiki Go','Get the app','left'),hero('collage','KAMPALA · 4,000 VERIFIED RIDERS','A safe boda, three minutes away','Verified riders, fixed fares and a helmet for you. Pay by MTN MoMo, Airtel Money or cash.','Download the app','How it works',[A('road',701),A('phone',702),A('city',703)],'bg'),
  feats('SAFETY FIRST','Every ride is tracked',' ',[['🪖','Helmets for two','Clean, hairnet included.'],['📍','Live tracking','Share your trip with family.'],['🆘','SOS button','Straight to our control room.']],'cards','alt'),
  steps('RIDING','Three taps to your ride',[['Set pickup','Pin where you stand.'],['See fare','UGX 3,000 for 3 km.'],['Ride','Rider arrives in 3 minutes.']]),
  stats([['1.2M','Rides each month'],['3 min','Pickup time'],['4.8★','Rider rating'],['UGX 3k','Start fare']],'primary'),
  price('FOR RIDERS','Drive with Pikipiki','Keep 85% of every fare.',[['Starter','Free','','Sign-up\nHelmet loan'],['Pro','UGX 15,000','/wk','Insurance\nFuel discount',1]],'alt'),
  faq('Questions',[['Do I need data?','The app works on 2G with low data mode.'],['What if I forget something?','Call the lost-and-found line; we trace the rider.']],'bg'),
  cta('Ride safer tonight','First three rides are UGX 1,000 off.','Get the app'),footer('Pikipiki Go','Bukoto, Kampala.')]),
  pg('Riders','contact',[nav('Pikipiki Go','Get the app','left'),contact('Become a rider','Bring your licence, logbook and ID.','riders@pikipikigo.example','+256 752 701 701','Bukoto Street, Kampala','Apply'),footer('Pikipiki Go','Bukoto, Kampala.')])]});

}
