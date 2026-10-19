/* Batch 10: 20 hand-designed website templates. */
{const {nav,hero,feats,split,gal,stats,quotes,price,faq,cta,contact,footer,team,cards,menu,steps,text,logos,blog,wa,pg}=B_,A=a_;

addBespoke({id:'henna-mombasa',g:'Beauty',tag:'Henna artist',name:'Noor Henna',kw:'henna mehndi bridal mombasa swahili wedding',desc:'Bridal and event henna by a Swahili-coast artist in Mombasa.',
 th:{p:'#7a1f3d',p2:'#c9973b',p3:'#3e6b5a',bg:'#fbf3e8',alt:'#f1e0cb',tx:'#3a1220',dark:false,head:'Cormorant Garamond',body:'Manrope',radius:2,pop:false,deco:true},
 pages:[pg('Home','index',[nav('Noor Henna','Book henna','center'),hero('arch','OLD TOWN, MOMBASA','Patterns your grandmother would stop to admire','Swahili bridal henna, drawn freehand with natural paste that stains deep burgundy within 48 hours.','Book a bridal date','See designs',[A('bloom',1001)]),
  gal('mosaic','Recent hands and feet',[A('bloom',1002),A('circles',1003),A('leaf',1004),A('diamond',1005)],'alt'),
  price('PACKAGES','Henna for every occasion','Paste is mixed fresh the morning of your event.',[['Guest hands','Ksh 800','/person','Simple floral palm\nDone in 15 minutes\nGroups of 5 or more'],['Bridal','Ksh 18,000','/bride','Hands to elbow, feet to ankle\nTwo-visit trial\nAt your home or hotel',1],['Kupamba night','Ksh 35,000','/party','Bride plus 8 guests\nTwo artists\nChai and sambusa on us']]),
  split('left','THE PASTE','Henna leaves, lemon, sugar. Nothing else.','No black dye and no chemicals. Sheikha Noor ground her own henna from Lamu leaves, rests it overnight and tests every batch on her own wrist first.','Read about aftercare',A('leaf',1007),'alt'),
  quotes('Brides say',[['The pattern on my feet took five hours and I never felt it.','Mwanaisha S.','Bride, Nyali'],['She matched the lace on my kanzu exactly.','Fatma A.','Bride, Old Town'],['Booked 40 guests, nobody waited more than ten minutes.','Rukia M.','Mother of the bride']],'bg'),
  cta('Wedding season fills up by August','Save your date with a Ksh 3,000 deposit.','Hold my date'),footer('Noor Henna','Kuze Street, Old Town, Mombasa.')]),
  pg('Contact','contact',[nav('Noor Henna','Book henna','center'),contact('Tell Noor about your day','Date, venue, and a photo of your outfit if you have one.','noor@hennanoor.example','+254 711 300 410','Kuze Street, Old Town, Mombasa','Send details'),footer('Noor Henna','Kuze Street, Old Town, Mombasa.')])]});

addBespoke({id:'barista-academy',g:'Education',tag:'Barista academy',name:'Cherry & Crema Lab',kw:'barista training coffee latte art cupping kigali',desc:'Hands-on barista and cupping courses in Kigali.',
 th:{p:'#e8552d',p2:'#f5c26b',p3:'#7bd3b8',bg:'#17120f',alt:'#231b16',tx:'#f3e9dc',dark:true,head:'Space Mono',body:'Inter',radius:4,pop:false,deco:false},
 pages:[pg('Home','index',[nav('CHERRY&CREMA/LAB','Enrol','left','page:enrol'),hero('split','KIGALI · KACYIRU','Learn coffee where the beans are grown','Rwandan arabica, a two-group La Marzocco and six weeks of pulling shots until your latte art stops wobbling.','Pick a course','Join Saturday cupping',[A('cup',1011)],'alt'),
  steps('THE CURRICULUM','From cherry to cup',[['Week 1 · Origin','Visit a washing station in Huye. Taste six lots side by side.'],['Week 2–3 · Espresso','Dosing, grind, extraction time. Sink shots until it clicks.'],['Week 4 · Milk','Texturing, microfoam, rosetta and tulip.'],['Week 5–6 · Floor','Run our public bar on weekends with a mentor.']]),
  stats([['6','Weeks, 3 evenings each'],['8','Students per class'],['Rwf 380k','Full course fee'],['82%','Placed in cafes in 3 months']],'primary'),
  cards('grid','SHORT COURSES','Not ready for six weeks?','',[[A('cup',1012),'Saturday cupping','Rwf 15,000. Taste and score 8 coffees, 2 hours.'],[A('circles',1013),'Latte art lab','Rwf 45,000. One long morning, 40 cups of milk.'],[A('grid',1014),'Home brewing','Rwf 30,000. V60, Aeropress and moka for your kitchen.']],'alt'),
  faq('Good to ask',[['Do I need experience?','No. Half of each class has never touched a portafilter.'],['Do you give a certificate?','Yes, SCA-aligned foundation level, recognised by Kigali cafes.'],['Is there a payment plan?','Three instalments, no interest.']]),
  footer('Cherry & Crema Lab','KG 11 Ave, Kacyiru, Kigali.')]),
  pg('Enrol','enrol',[nav('CHERRY&CREMA/LAB','Enrol','left','page:enrol'),contact('Save a seat','The next intake starts on the first Monday of the month.','learn@cherrycrema.example','+250 788 410 520','KG 11 Ave, Kacyiru, Kigali','Reserve seat'),footer('Cherry & Crema Lab','KG 11 Ave, Kacyiru, Kigali.')])]});

addBespoke({id:'dairy-nakuru',g:'Food',tag:'Dairy farm',name:'Maziwa Mazuri Dairy',kw:'milk yoghurt dairy farm cows nakuru delivery',desc:'Fresh milk, mala and yoghurt from a family farm in Nakuru.',
 th:{p:'#2a7de1',p2:'#ffd447',p3:'#ff7a59',bg:'#fffdf5',alt:'#e8f2ff',tx:'#102a4c',dark:false,head:'Baloo 2',body:'Figtree',radius:28,pop:true,grad:true,deco:true},
 pages:[pg('Home','index',[nav('Maziwa Mazuri','Order milk','center','page:order'),hero('center','NAKURU · MILKED AT 5AM','From our cows to your gate by 8','Forty Friesians, one family, and a cooler van that visits Nakuru town, Naivasha and Gilgil every morning.','Start deliveries','See the dairy',[A('field',1021)]),
  cards('overlay','THE FRIDGE LINE','Six things we make, nothing we add','',[[A('cup',1022),'Fresh milk','Ksh 70 per litre. Pasteurised, never powdered.'],[A('fruit',1023),'Yoghurt','Plain, strawberry or passion. Ksh 120 per 500 ml.'],[A('bloom',1024),'Mala','Kikuyu-style fermented milk, Ksh 100 per litre.']],'alt'),
  split('right','THE HERD','Cows with names, not numbers','Wanjiru, Chebet, Akinyi and 37 more. They graze Rhodes grass, sleep on sand beds and are checked by our vet every Tuesday.','Meet the herd',A('hills',1025)),
  steps('DELIVERY','How your week works',[['Pick days','Mon, Wed, Fri or every day.'],['Leave a crate','We swap glass bottles for clean ones.'],['Pay by M-Pesa','Statement on the 1st, no cash at the door.']],'alt'),
  stats([['40','Friesian cows'],['210','Homes served'],['6 hrs','Cow to doorstep'],['0','Preservatives']],'primary'),
  faq('Questions',[['Which areas?','Nakuru CBD, Milimani, Section 58, Naivasha and Gilgil.'],['Minimum order?','Two litres a day.']]),
  footer('Maziwa Mazuri Dairy','Lanet Road, Nakuru.')]),
  pg('Order','order',[nav('Maziwa Mazuri','Order milk','center','page:order'),contact('Start your deliveries','Tell us your estate and the days you want milk.','moo@maziwamazuri.example','+254 733 880 120','Lanet Road, Nakuru','Start milk'),footer('Maziwa Mazuri Dairy','Lanet Road, Nakuru.')])]});

addBespoke({id:'sign-language-school',g:'Education',tag:'Sign language school',name:'Mikono Sign School',kw:'sign language ugandan deaf interpreter classes kampala',desc:'Ugandan Sign Language classes and interpreter training in Kampala.',
 th:{p:'#5b3df5',p2:'#ffb400',p3:'#00b894',bg:'#ffffff',alt:'#f0edff',tx:'#1c1650',dark:false,head:'Figtree',body:'Figtree',radius:16,pop:true,deco:false},
 pages:[pg('Home','index',[nav('Mikono','Join a class','left'),hero('cover','KAMPALA · NAKASERO','Learn a language you can speak in silence','Ugandan Sign Language taught by Deaf teachers, for families, teachers, nurses and anyone who wants to talk with their neighbours.','See classes','Watch a lesson',[A('person',1031)],'alt'),
  feats('WHY DEAF-LED','Taught by people who live it',' ',[['👋','Deaf teachers only','Every class is led by a native signer, not a hearing person reading from a book.'],['👪','Family tracks','Parents and siblings learn alongside their deaf child.'],['🏥','Clinic and school courses','Vocabulary for health workers and classroom teachers.']],'cards','bg'),
  split('archleft','OUR STORY','Founded by two sisters in 2012','Grace and Ruth grew up with a Deaf brother and no one to teach their parents. Today 1,900 Ugandans have learned to sign with us.','Read the story',A('heart',1032),'alt'),
  price('TERMS','Eight weeks, Saturday mornings','',[['Beginner','Ush 180,000','/term','16 hours of class\nPicture dictionary\nCertificate'],['Family','Ush 300,000','/term','Up to 3 family members\nHome practice videos\nFree catch-up class',1],['Interpreter prep','Ush 650,000','/term','Level 2 and 3 grammar\nMock interpreting\nExam coaching']]),
  quotes('Students',[['My son signed “I love you” to me for the first time.','Rose N.','Family track'],['I finally understood my patients.','Dr. Kato','Mulago Hospital'],['The teachers are patient and funny.','Brian S.','Beginner']],'alt'),
  cta('New term starts 2 November','Classes are limited to 12 students.','Reserve a seat'),footer('Mikono Sign School','Plot 22, Nakasero Hill, Kampala.')]),
  pg('Contact','contact',[nav('Mikono','Join a class','left'),contact('Say hello','You can write, call, or send a short video message.','hello@mikonosign.example','+256 772 330 140','Plot 22, Nakasero Hill, Kampala','Send'),footer('Mikono Sign School','Plot 22, Nakasero Hill, Kampala.')])]});

addBespoke({id:'diagnostics-lab',g:'Health',tag:'Diagnostic lab',name:'Afya Labs',kw:'medical laboratory blood test results online nairobi',desc:'Same-day lab tests and results by SMS in Nairobi.',
 th:{p:'#0a7f8f',p2:'#e84a5f',p3:'#264653',bg:'#fafdfd',alt:'#e7f4f5',tx:'#10343b',dark:false,head:'Manrope',body:'Inter',radius:8,pop:false,grad:false,deco:false},
 pages:[pg('Home','index',[nav('Afya Labs','Book a test','left'),hero('split','NAIROBI · OPEN 6AM – 9PM','Accurate results, fast and in your phone','Walk in or book a home draw. Your results land on SMS and email, signed by a pathologist.','Book a test','View price list',[A('chart',1041)]),stats([['2 hrs','Typical result time'],['180+','Tests offered'],['ISO 15189','Accredited lab'],['6 branches','Across Nairobi']],'primary'),
  feats('POPULAR PANELS','Common tests, clear prices',' ',[['🩸','Full blood count','Ksh 600. Ready in 1 hour.'],['🧪','Lipid and sugar profile','Ksh 1,800. Fasting 10 hours.'],['🦠','Malaria and typhoid','Ksh 900. Ready same day.'],['🤰','Antenatal panel','Ksh 3,500. Nine tests in one visit.']],'cards','alt'),
  split('left','HOME SERVICE','A nurse comes to you','For Ksh 500 on top of your tests, a phlebotomist visits within Nairobi between 6am and 11am. Fasting tests are best at home.','Book home draw',A('person',1042)),
  steps('HOW IT WORKS','Four steps',[['Book','Online or call.'],['Sample','Branch or home.'],['Analysis','In our own lab.'],['Results','SMS, email, or print.']],'alt'),
  faq('Before your test',[['Do I need a doctor’s note?','No, you can test yourself. We recommend sharing results with your doctor.'],['Do you accept insurance?','Yes, AAR, Jubilee, Britam and NHIF.']]),
  footer('Afya Labs','Argwings Kodhek Road, Kilimani, Nairobi.')]),
  pg('Book','contact',[nav('Afya Labs','Book a test','left'),contact('Book a test','Choose a branch and a time, or request a home draw.','book@afyalabs.example','+254 20 500 7788','Argwings Kodhek Road, Kilimani, Nairobi','Book now'),footer('Afya Labs','Argwings Kodhek Road, Kilimani, Nairobi.')])]});

addBespoke({id:'student-housing',g:'Property',tag:'Student housing',name:'Chuo Nest',kw:'student hostel apartments university nairobi rent',desc:'Furnished student rooms by Kenyatta University with wifi and study halls.',
 th:{p:'#ff5a1f',p2:'#1a1a40',p3:'#ffd23f',bg:'#fff8f0',alt:'#ffe8d6',tx:'#1a1a40',dark:false,head:'Rubik',body:'Rubik',radius:14,pop:true,grad:false,deco:true},
 pages:[pg('Home','index',[nav('chuo nest','Book a room','left'),hero('collage','KAHAWA WENDANI · 8 MIN TO KU','Your room, your desk, no landlord drama','Furnished rooms with fibre, 24-hour water and a study hall that stays open till midnight.','See rooms','Take a video tour',[A('house',1051),A('laptop',1052),A('book',1053)]),
  price('ROOMS','Pick your size','Rent includes wifi, water and security.',[['Bedsitter','Ksh 9,500','/month','Own bathroom\nBed, desk, wardrobe\nShared kitchen'],['Twin share','Ksh 6,000','/month each','Two beds\nFloor study area\nCleaning weekly',1],['Studio','Ksh 16,000','/month','Kitchenette\nBalcony\nSmart lock']],'alt'),
  cards('grid','LIFE HERE','What’s on the compound','',[[A('book',1054),'Study hall','80 desks, printing, quiet floor till midnight.'],[A('laptop',1055),'Fibre wifi','50 Mbps per floor with a generator backup.'],[A('shop',1056),'Mama Sam’s canteen','Chapati, githeri and tea from 6am.']]),
  gal('masonry','The compound',[A('house',1057),A('book',1058),A('city',1059),A('plate',1060)],'alt'),
  faq('Parents ask',[['Is it secure?','Two guards, CCTV and a biometric gate.'],['Deposit?','One month, fully refundable.'],['Can I pay per semester?','Yes, with 5% off.']]),
  cta('Semester two rooms are going','Only 14 left for January.','Book a viewing'),footer('Chuo Nest','Kahawa Wendani, Thika Road, Nairobi.')]),
  pg('Viewing','contact',[nav('chuo nest','Book a room','left'),contact('Book a viewing','Come on a weekday after 3pm or any Saturday.','rooms@chuonest.example','+254 701 220 330','Kahawa Wendani, Thika Road','Book viewing'),footer('Chuo Nest','Kahawa Wendani, Thika Road, Nairobi.')])]});

addBespoke({id:'mama-lucy-catering',g:'Food',tag:'Event catering',name:'Mama Lucy’s Kitchen',kw:'catering weddings funerals events buffet nairobi',desc:'Home-style buffet catering for weddings, graduations and church events.',
 th:{p:'#b3341a',p2:'#e9a93b',p3:'#2f5233',bg:'#fdf6e9',alt:'#f4e4c7',tx:'#3b1a10',dark:false,head:'Young Serif',body:'Outfit',radius:12,pop:false,deco:true},
 pages:[pg('Home','index',[nav('Mama Lucy’s Kitchen','Get a quote','center'),hero('cover','NAIROBI · SINCE 1998','Food that makes the whole village come back for seconds','Pilau, nyama choma, mukimo and kachumbari, cooked in big sufurias by a team of 14 women.','Get a quote','See the menu',[A('plate',1061)],'alt'),
  menu('Our buffets','Per person, minimum 50 guests',[['Classic Kenyan','Pilau, beef stew, chapati, kachumbari, greens, soda','Ksh 850'],['Wedding feast','Roast goat, mukimo, rice, two stews, salad, dessert','Ksh 1,600'],['Church lunch','Githeri, ugali, sukuma, chicken, fruit','Ksh 650'],['Graduation tea','Samosa, mandazi, sausage, cake, chai','Ksh 450']]),
  split('right','THE TEAM','Fourteen cooks, one recipe book','Mama Lucy started with a single jiko in Kayole. Her daughters now run the pots, the van and the washing-up crew.','Meet the family',A('person',1062),'alt'),
  stats([['25 years','Feeding Nairobi'],['4,000','Events catered'],['14','Women on the team'],['1','Phone call to book']]),
  quotes('Happy hosts',[['300 guests, no queue, no leftovers.','Wambui K.','Wedding, Karen'],['The goat was so tender they asked for the recipe.','Pastor Otieno','Church fundraiser'],['They arrived at 6am with everything hot.','Daniel M.','Graduation']],'alt'),
  cta('Booking a date? Call Lucy herself','0722 000 456, any day before 8pm.','Request a quote'),footer('Mama Lucy’s Kitchen','Kayole Spine Road, Nairobi.')]),
  pg('Quote','contact',[nav('Mama Lucy’s Kitchen','Get a quote','center'),contact('Tell us about your event','Date, venue, number of guests and what you like to eat.','lucy@mamalucy.example','+254 722 000 456','Kayole Spine Road, Nairobi','Get my quote'),footer('Mama Lucy’s Kitchen','Kayole Spine Road, Nairobi.')])]});

addBespoke({id:'mushroom-grower',g:'Agriculture',tag:'Mushroom farm',name:'Uyoga Fresh',kw:'oyster mushroom farm kiambu growing kits',desc:'Oyster mushrooms, growing kits and farmer training in Kiambu.',
 th:{p:'#3a2e5c',p2:'#e9c46a',p3:'#9bd1a5',bg:'#f6f1e7',alt:'#e9e0f0',tx:'#241b3a',dark:false,head:'Bricolage Grotesque',body:'Figtree',radius:30,pop:true,grad:true,deco:true},
 pages:[pg('Home','index',[nav('Uyoga Fresh','Buy mushrooms','left','page:shop'),hero('arch','KIAMBU · GROWN IN THE DARK','A farm the size of a garage','We harvest 220 kg of oyster mushrooms a week from stacked bags of waste maize cobs. No soil, no sprays, 25 days from spawn to plate.','Buy fresh','Start growing',[A('bloom',1071)]),
  cards('grid','WHAT WE SELL','Fresh, dried and grow-at-home','',[[A('leaf',1072),'Fresh oysters','Ksh 700 per kg, delivered in Nairobi on Tue, Thu and Sat.'],[A('fruit',1073),'Dried uyoga','Ksh 2,400 per 250 g. Keeps for a year.'],[A('grid',1074),'Home grow kit','Ksh 1,500. Spray twice daily, harvest in two weeks.']],'alt'),
  steps('THE CYCLE','Waste in, protein out',[['Cobs','We collect maize cobs from Limuru mills.'],['Pasteurise','Steamed at 90°C for six hours.'],['Spawn','Mycelium colonises bags in 14 days.'],['Fruit','Cut the bag, harvest in 5 days.']]),
  split('left','TRAINING','Start your own for under Ksh 40,000','Two-day course on the farm, includes 20 bags, a starter shelf and a month of WhatsApp mentoring.','Join a course',A('field',1075),'alt'),
  stats([['220 kg','Weekly harvest'],['600+','Farmers trained'],['25 days','Spawn to plate'],['45%','Protein by dry weight']],'primary'),
  footer('Uyoga Fresh','Kamiti Road, Kiambu.')]),
  pg('Shop','shop',[nav('Uyoga Fresh','Buy mushrooms','left','page:shop'),contact('Order or enrol','Tell us what you need and where to deliver.','farm@uyogafresh.example','+254 745 100 660','Kamiti Road, Kiambu','Place order'),footer('Uyoga Fresh','Kamiti Road, Kiambu.')])]});

addBespoke({id:'dhow-boatyard',g:'Craft',tag:'Dhow boatyard',name:'Lamu Mashua Yard',kw:'boat builder dhow wooden mangrove lamu repair',desc:'Wooden dhows and mashua built and repaired by hand in Lamu.',
 th:{p:'#1d4e5f',p2:'#d98f3a',p3:'#8b3a2b',bg:'#f2ebdc',alt:'#e3d7bf',tx:'#1c2a2e',dark:false,head:'Libre Caslon Text',body:'Karla',radius:0,pop:false,deco:false},
 pages:[pg('Home','index',[nav('LAMU MASHUA YARD','Commission a boat','center'),hero('center','MANDA TOORANI · LAMU ARCHIPELAGO','Boats the monsoon has trusted for three hundred years','Master builder Ahmed Famau and his four sons shape mvule and mango planks with an adze and a bow drill.','Commission a dhow','Visit the yard',[A('waves',1081)]),
  gal('strip','On the slipway',[A('beach',1082),A('waves',1083),A('port',1084),A('hills',1085)]),
  split('archleft','THE CRAFT','No plan on paper','The hull is drawn on sand with a stick, then planks are bent over fire. A 12-metre dhow takes seven months and not a single steel screw touches the keel.','Read how it’s built',A('port',1086),'alt'),
  price('WORK WE DO','Three kinds of jobs','All prices include timber and labour.',[['Repair and re-caulk','Ksh 180,000','from','New planks as needed\nCoconut-fibre caulking\n3-week job'],['Mashua, 7 m','Ksh 1,400,000','','Fishing or ferry\nMangrove ribs\nDelivery by sea',1],['Jahazi, 12 m','Ksh 6,200,000','','Sail plan and rigging\nCaptained sea trial\n7-month build']],'bg'),
  quotes('From the water',[['She has carried my family for 22 years.','Capt. Bakari','Mashua owner'],['Ahmed refit our guest dhow in a month.','Elena V.','Lodge owner, Shela']],'alt'),
  footer('Lamu Mashua Yard','Manda Toorani jetty, Lamu County.')]),
  pg('Contact','contact',[nav('LAMU MASHUA YARD','Commission a boat','center'),contact('Visit the yard','Tell us what you need. Ahmed replies within two days.','yard@lamumashua.example','+254 722 118 440','Manda Toorani jetty, Lamu County','Send enquiry'),footer('Lamu Mashua Yard','Manda Toorani jetty, Lamu County.')])]});

addBespoke({id:'stargazing-laikipia',g:'Travel',tag:'Stargazing camp',name:'Nyota Observatory',kw:'astronomy telescope night sky laikipia camp',desc:'Night-sky evenings with telescopes in the Laikipia plateau.',
 th:{p:'#7c8cff',p2:'#ffc26b',p3:'#ff6b9a',bg:'#070b1f',alt:'#101736',tx:'#e6e9ff',dark:true,head:'Syne',body:'DM Mono',radius:12,pop:false,grad:true,deco:true},
 pages:[pg('Home','index',[nav('NYOTA','Book a night','center'),hero('cover','LAIKIPIA · 1,900 M · ZERO CITY LIGHT','Come see what the sky was hiding','A dark-sky camp with four telescopes, a roofless dome and a guide who can find Saturn in thirty seconds.','Book a night','What you’ll see',[A('circles',1091)]),
  cards('grid','EVENINGS','Three ways to look up','',[[A('circles',1092),'Naked-eye night','Ksh 3,500. Constellations, the Milky Way and Swahili star stories.'],[A('diamond',1093),'Telescope deep-dive','Ksh 7,500. Nebulae, clusters and Jupiter’s moons.'],[A('camera',1094),'Astrophotography','Ksh 14,000. Bring a camera, leave with a Milky Way print.']],'alt'),
  stats([['Bortle 1','Darkest rating'],['4','Telescopes'],['12','Guests per night'],['38','Clear nights in 40 this year']],'primary'),
  split('right','THE CALENDAR','What’s up this season','November: Leonid meteors on the 17th. December: Jupiter at opposition. January: the Orion nebula, high at 9pm.','See full calendar',A('circles',1095)),
  steps('YOUR EVENING','Dusk to midnight',[['5:30pm','Sundowner and tea by the fire.'],['7pm','Sky orientation and the first telescope.'],['9pm','Deep-sky targets.'],['11pm','Hot chocolate and a warm tent.']],'alt'),
  cta('New moon weekends fill first','Next new moon: 9 November.','Check availability'),footer('Nyota Observatory','Mukogodo Road, Laikipia.')]),
  pg('Contact','contact',[nav('NYOTA','Book a night','center'),contact('Plan your night','Tell us the date and group size. We check the cloud forecast for you.','sky@nyotaobs.example','+254 733 450 780','Off Mukogodo Road, 40 min from Nanyuki','Request a night'),footer('Nyota Observatory','Mukogodo Road, Laikipia.')])]});

addBespoke({id:'rugby-club-rift',g:'Sports',tag:'Rugby club',name:'Rift Rhinos RFC',kw:'rugby club nakuru youth team fixtures membership',desc:'Community rugby club in Nakuru with youth squads and a Sunday clubhouse.',
 th:{p:'#0e7c3a',p2:'#f4d21f',p3:'#d4282f',bg:'#0a0f0b',alt:'#121a14',tx:'#f1f4ec',dark:true,head:'Anton',body:'Oswald',radius:0,pop:false,deco:false},
 pages:[pg('Home','index',[nav('RIFT RHINOS RFC','Join the club','left','page:join'),hero('split','NAKURU ATHLETIC GROUNDS · EST. 1989','Hit hard. Shake hands. Buy the first round.','Three men’s sides, two women’s, and 240 juniors who train every Saturday morning.','Join a squad','Fixtures',[A('field',1101)],'alt'),
  stats([['5','Senior sides'],['240','Junior players'],['3','Kenya Cup titles'],['1989','Founded']],'primary'),
  cards('overlay','SQUADS','Find your pitch','',[[A('person',1102),'Rhinos Men','Training Tue and Thu 6pm. Kenya Cup Championship.'],[A('person',1103),'Lady Rhinos','Wed and Sat. Sevens and fifteens.'],[A('balloon',1104),'Cubs U8–U16','Sat 9am. Ksh 3,000 per term, kit included.']]),
  split('left','THE CLUBHOUSE','Sundays are for the stand','Chapati, nyama choma and the whole county watching from the terrace. Open to members and visitors from 1pm.','Visit on Sunday',A('plate',1105),'alt'),
  gal('mosaic','Match day',[A('field',1106),A('person',1107),A('hills',1108),A('circles',1109)]),
  cta('Pre-season starts 4 January','Trials open to all. Bring boots and a bottle.','Register for trials'),footer('Rift Rhinos RFC','Nakuru Athletic Grounds, Nakuru.')]),
  pg('Join','join',[nav('RIFT RHINOS RFC','Join the club','left','page:join'),contact('Join the club','Adult membership is Ksh 6,000 a year. Juniors Ksh 3,000 a term.','rhinos@riftrhinos.example','+254 700 123 987','Nakuru Athletic Grounds, Nakuru','Send application'),footer('Rift Rhinos RFC','Nakuru Athletic Grounds, Nakuru.')])]});

addBespoke({id:'barbershop-westlands',g:'Beauty',tag:'Barbershop',name:'Kata Kata Barbers',kw:'barber haircut fade beard grooming nairobi',desc:'Fades, shaves and beard sculpting in Westlands, Nairobi.',
 th:{p:'#ffcc00',p2:'#ff4d4d',p3:'#4dd2ff',bg:'#111111',alt:'#1d1d1d',tx:'#f5f5f5',dark:true,head:'Archivo Black',body:'Space Mono',radius:0,pop:true,grad:false,deco:false},
 pages:[pg('Home','index',[nav('KATA KATA','Book chair','left','page:book'),hero('center','WESTLANDS · TUE – SUN 9AM – 9PM','Sharp lines. Slow shaves.','Six chairs, one rule: nobody leaves until the mirror says yes.','Book a chair','Price list',[A('scissors',1111)]),
  menu('Price list','Walk-ins welcome, bookings first',[['Skin fade','Zero to two, finished with a straight razor','Ksh 700'],['Beard sculpt','Hot towel, line-up, oil','Ksh 500'],['Fade + beard','The full set','Ksh 1,100'],['Kids cut','Under 12','Ksh 450'],['Royal shave','Steam, hot lather, cold towel','Ksh 900']],'alt'),
  gal('masonry','The shop',[A('scissors',1112),A('person',1113),A('frame',1114),A('circles',1115),A('diamond',1116)]),
  team('Your barbers',[['Kamau','Fades',1117],['Otis','Beards',1118],['Ali','Shaves and kids',1119]],'alt'),
  quotes('From the chair',[['Been coming since 2019 and the line is still perfect.','Mwangi','Regular'],['Booked online, in the chair in five minutes.','Faisal','First timer']],'bg'),
  footer('Kata Kata Barbers','Woodvale Grove, Westlands, Nairobi.')]),
  pg('Book','book',[nav('KATA KATA','Book chair','left','page:book'),contact('Book your chair','Choose your barber and a time. Deposit is Ksh 200 by M-Pesa.','chair@katakata.example','+254 799 660 120','Woodvale Grove, Westlands','Reserve'),footer('Kata Kata Barbers','Woodvale Grove, Westlands, Nairobi.')])]});

addBespoke({id:'wooden-toys-kisumu',g:'Retail',tag:'Wooden toys',name:'Mchezo Toys',kw:'wooden toys educational kids kisumu handmade',desc:'Hand-carved wooden toys and puzzles made in Kisumu.',
 th:{p:'#1b8a6b',p2:'#ffb347',p3:'#ef476f',bg:'#fffaf0',alt:'#e6f5ec',tx:'#14332a',dark:false,head:'Outfit',body:'Nunito',radius:24,pop:true,grad:false,deco:true},
 pages:[pg('Home','index',[nav('Mchezo Toys','Shop toys','center','page:shop'),hero('collage','KISUMU · CARVED FROM MAHOGANY OFFCUTS','Toys with no batteries and no end','Puzzles, pull-along animals and counting blocks, sanded smooth and painted with food-safe colours.','Shop toys','Our workshop',[A('gift',1121),A('paw',1122),A('balloon',1123)],'alt'),
  cards('grid','FAVOURITES','Loved by two-year-olds and their grandmothers','',[[A('paw',1124),'Pull-along giraffe','Ksh 1,800. Wheels that roll on carpet and tiles.'],[A('grid',1125),'Number blocks','Ksh 1,200. Twenty cubes, counting 1–20 in Swahili and English.'],[A('lamp',1126),'Lake Victoria puzzle','Ksh 2,400. 48 chunky pieces.']]),
  split('right','THE WORKSHOP','Seven carpenters, one rule','Every toy must survive being thrown across a room. We use offcuts from Kisumu furniture makers that would otherwise be burned.','See how it’s made',A('leaf',1127),'alt'),
  feats('SAFE FOR LITTLE ONES','Made for mouths',' ',[['🌿','Food-safe paint','Water-based colour, tested at KEBS.'],['🔨','No small parts','Everything passes the toilet-roll test.'],['🎁','Gift ready','Wrapped in recycled kitenge cloth.']],'cards','bg'),
  stats([['7','Carpenters'],['34','Toy designs'],['Ksh 450','Cheapest toy'],['12,000','Toys sold']],'primary'),
  cta('Free delivery in Kisumu over Ksh 3,000','Nationwide by Easy Coach bus.','Shop now'),footer('Mchezo Toys','Kibuye Market Road, Kisumu.')]),
  pg('Shop','shop',[nav('Mchezo Toys','Shop toys','center','page:shop'),contact('Order or ask','Send your list and your county. We reply with a total and a pay link.','toys@mchezo.example','+254 721 660 880','Kibuye Market Road, Kisumu','Order'),footer('Mchezo Toys','Kibuye Market Road, Kisumu.')])]});

addBespoke({id:'safari-outfitters-4x4',g:'Automotive',tag:'4x4 outfitters',name:'Pori Overland Outfitters',kw:'4x4 land cruiser rooftop tent safari conversion workshop',desc:'Land Cruiser conversions, rooftop tents and recovery kit in Nairobi.',
 th:{p:'#d9531e',p2:'#c8b88a',p3:'#4a5d3a',bg:'#1b1d18',alt:'#262920',tx:'#ece7da',dark:true,head:'Oswald',body:'Rubik',radius:3,pop:false,grad:false,deco:false},
 pages:[pg('Home','index',[nav('PORI OVERLAND','Get a build quote','left'),hero('cover','NAIROBI · INDUSTRIAL AREA','Build it once. Drive it everywhere.','Snorkels, long-range tanks, fridge slides and rooftop tents fitted by mechanics who have driven to Turkana.','Plan my build','Browse kit',[A('road',1131)],'alt'),
  cards('grid','PACKAGES','Three build levels','',[[A('car',1132),'Weekender','Ksh 380,000. Rooftop tent, awning, bull bar, snorkel.'],[A('road',1133),'Expedition','Ksh 1,150,000. Long-range tank, dual battery, fridge slide.'],[A('hills',1134),'Full overland','Ksh 2,400,000. Suspension, winch, drawers and a sleeping platform.']],'alt'),
  split('left','THE WORKSHOP','Tested on rough road, not on paper','Every Pori build leaves with a 1,000 km shakedown drive to Lake Baringo and back, then a free check-up.','See finished builds',A('car',1135)),
  gal('strip','Recent builds',[A('car',1136),A('road',1137),A('savanna',1138),A('hills',1139)],'alt'),
  stats([['180+','Builds since 2013'],['2 yrs','Warranty on fit-out'],['12','Mechanics'],['7 lands','Cruisers shipped abroad']],'primary'),
  faq('Common questions',[['Do you fit other vehicles?','Land Cruiser 70 and 200, Hilux, Defender and Pajero.'],['How long does a build take?','Four to ten weeks depending on parts.']]),
  footer('Pori Overland Outfitters','Lunga Lunga Road, Industrial Area, Nairobi.')]),
  pg('Quote','contact',[nav('PORI OVERLAND','Get a build quote','left'),contact('Plan your build','Tell us the vehicle, where you are driving and your budget.','build@poriov.example','+254 733 998 440','Lunga Lunga Road, Industrial Area','Request quote'),footer('Pori Overland Outfitters','Lunga Lunga Road, Industrial Area, Nairobi.')])]});

addBespoke({id:'aloe-vera-farm',g:'Agriculture',tag:'Aloe farm',name:'Aloe & Rain',kw:'aloe vera gel farm skincare wholesale makueni',desc:'Aloe vera grown in Makueni and pressed into gel, juice and soap.',
 th:{p:'#2f7a52',p2:'#e8c36a',p3:'#b8d8c0',bg:'#f1f7f1',alt:'#dcebdd',tx:'#16301f',dark:false,head:'Gloock',body:'Manrope',radius:20,pop:false,grad:true,deco:true},
 pages:[pg('Home','index',[nav('Aloe & Rain','Order gel','center','page:order'),hero('split','MAKUENI · 12 HECTARES OF SPINY LEAVES','Cut at dawn, pressed by noon','The only aloe in Kenya that goes from leaf to jar in six hours, with nothing added except a little vitamin C to keep it fresh.','Order gel','Wholesale',[A('leaf',1141)]),
  cards('overlay','PRODUCTS','Four jars on our shelf','',[[A('leaf',1142),'Pure gel','Ksh 650 per 250 ml. Sunburn, shaving, scalp.'],[A('cup',1143),'Aloe juice','Ksh 480 per litre. Sip 30 ml a day.'],[A('bloom',1144),'Soap bar','Ksh 350. Aloe, shea and neem.']],'alt'),
  split('archleft','THE FARM','Aloe loves a dry county','Makueni gets 600 mm of rain a year, which suits Aloe barbadensis. We employ 38 women from Wote, all paid weekly.','Visit the farm',A('field',1145)),
  stats([['12 ha','Planted'],['38','Women employed'],['6 hrs','Leaf to jar'],['0','Preservatives except vitamin C']],'primary'),
  price('WHOLESALE','For salons and pharmacies','Minimum order 24 units.',[['Salon','Ksh 450','/250 ml','24 jars\nFree labels\nWeekly delivery'],['Pharmacy','Ksh 400','/250 ml','96 jars\nKEBS certificate\nMonthly invoice',1],['Export','On request','','Drums of 20 L\nCOA per batch\nFreight arranged']],'alt'),
  footer('Aloe & Rain','Wote–Machakos Road, Makueni.')]),
  pg('Order','order',[nav('Aloe & Rain','Order gel','center','page:order'),contact('Order or request wholesale','Send your order and location. Free delivery in Nairobi over Ksh 5,000.','hello@aloerain.example','+254 722 880 910','Wote–Machakos Road, Makueni','Send order'),footer('Aloe & Rain','Wote–Machakos Road, Makueni.')])]});

addBespoke({id:'poetry-slam-kampala',g:'Events',tag:'Poetry night',name:'Words & Wire',kw:'poetry slam open mic spoken word kampala bar night',desc:'A monthly spoken-word night at a Kampala bar.',
 th:{p:'#f2e94e',p2:'#ff7a45',p3:'#7ee0d1',bg:'#0f0e17',alt:'#1a1827',tx:'#fffffe',dark:true,head:'Instrument Serif',body:'DM Mono',radius:2,pop:false,grad:false,deco:false},
 pages:[pg('Home','index',[nav('Words & Wire','Sign up to read','left','page:signup'),hero('center','LAST FRIDAY OF EVERY MONTH · KAMWOKYA','Say it into the microphone','Open mic, a featured poet and a crowd that snaps instead of clapping. Doors 7pm, first reader 8.','Sign up to read','Next night',[A('music',1151)]),
  text('Three rules','Be on time. Keep it under four minutes. Never talk over another poet. Everything else is up to you: Luganda, English, Swahili, Acholi, or a mix of all four.','center','alt'),
  cards('grid','FEATURED POETS','Last season on the stage','',[[A('person',1152),'Nakato Grace','Luganda lyric. A piece about her grandmother’s kitchen.'],[A('person',1153),'Okello Daniel','Protest verse from Gulu, with a drum.'],[A('person',1154),'Amina Hassan','Swahili ballads. Brought half the room to tears.']]),
  steps('THE EVENING','How the night runs',[['7pm','Doors, beer and nyama.'],['8pm','Open mic, 12 readers drawn from a hat.'],['9:30pm','Featured poet.'],['10:30pm','Slam round, three judges from the crowd.']],'alt'),
  stats([['62','Nights run'],['Ush 10,000','Entry'],['140','Seats'],['1','Winner takes the pot']],'primary'),
  footer('Words & Wire','The Wire Bar, Kamwokya, Kampala.')]),
  pg('Sign up','signup',[nav('Words & Wire','Sign up to read','left','page:signup'),contact('Put your name in the hat','Tell us your name and which language you’ll read in.','read@wordswire.example','+256 701 770 330','The Wire Bar, Kamwokya, Kampala','Add me'),footer('Words & Wire','The Wire Bar, Kamwokya, Kampala.')])]});

addBespoke({id:'biogas-installer',g:'Energy',tag:'Biogas installer',name:'Gesi Safi Biogas',kw:'biogas digester cooking gas farm cow dung installation meru',desc:'Home biogas digesters that turn cow dung into free cooking gas.',
 th:{p:'#e0701b',p2:'#2a9d8f',p3:'#264653',bg:'#fdfaf3',alt:'#f4ecd9',tx:'#26323a',dark:false,head:'Lexend',body:'Lexend',radius:10,pop:false,grad:false,deco:false},
 pages:[pg('Home','index',[nav('Gesi Safi','Get a site visit','left'),hero('split','MERU · NYERI · EMBU','Cook with what your cows leave behind','A 6 m³ digester gives a family four hours of cooking gas a day and free slurry that doubles your kale yield.','Book a site visit','Price list',[A('field',1161)],'alt'),
  stats([['2,100','Digesters installed'],['6 m³','Typical home size'],['4 hrs','Gas a day'],['Ksh 95,000','Installed, family size']],'primary'),
  steps('INSTALLATION','Ready in five days',[['Visit','We check cow numbers, water and space.'],['Dig','The pit is dug and lined with brick and cement.'],['Fit','Dome, inlet, outlet and gas pipe to the kitchen.'],['Start','We charge it with the first dung and train you.']]),
  split('left','SAVINGS','A gas cylinder costs Ksh 3,200 a month','Over five years a biogas family keeps about Ksh 190,000, and loses the smoke that blackens kitchen roofs.','See the sums',A('chart',1162),'alt'),
  price('SIZES','Pick your digester','Includes a stove and a 5-year warranty.',[['4 m³','Ksh 78,000','','2 cows\nTwo-ring burner'],['6 m³','Ksh 95,000','','3–4 cows\nTwo-ring burner + lamp',1],['10 m³','Ksh 148,000','','6 cows\nBurner, lamp, and a gas heater']]),
  faq('Questions',[['Can I pay in instalments?','Yes, 40% deposit and 6 monthly payments via M-Pesa.'],['What if I only have two cows?','The 4 m³ unit works fine with 2 cows.']],'alt'),
  footer('Gesi Safi Biogas','Meru–Maua Road, Meru.')]),
  pg('Visit','contact',[nav('Gesi Safi','Get a site visit','left'),contact('Book a free site visit','Tell us your village and how many cows you keep.','visit@gesisafi.example','+254 726 330 550','Meru–Maua Road, Meru','Book visit'),footer('Gesi Safi Biogas','Meru–Maua Road, Meru.')])]});

addBespoke({id:'pet-grooming-karen',g:'Pets',tag:'Pet grooming',name:'Waggle Parlour',kw:'dog grooming cat spa bath karen nairobi pet',desc:'Dog and cat grooming with fear-free handling in Karen.',
 th:{p:'#ff6fa5',p2:'#6ad0e0',p3:'#ffd966',bg:'#fff7fb',alt:'#ffe3ef',tx:'#4a1530',dark:false,head:'Unbounded',body:'Outfit',radius:36,pop:true,grad:true,deco:true},
 pages:[pg('Home','index',[nav('Waggle Parlour','Book a groom','center'),hero('arch','KAREN · NGONG ROAD','Spa day for the ones who snore on your sofa','Warm baths, gentle blow-dries and a groomer who talks to your dog the whole time.','Book a groom','Price guide',[A('paw',1171)]),
  price('PRICES','By size, not by breed','Includes bath, brush, ear clean and nail trim.',[['Small','Ksh 2,200','','Up to 8 kg\nShih Tzu, Dachshund, cats'],['Medium','Ksh 3,200','','8–20 kg\nBeagle, Cocker, Pomeranian',1],['Large','Ksh 4,500','','20 kg+\nLabrador, Alsatian, Rhodesian ridgeback']],'alt'),
  cards('grid','EXTRAS','Little add-ons dogs love','',[[A('heart',1172),'Blueberry facial','Ksh 400. Gentle cleaner for tear stains.'],[A('bloom',1173),'Coat conditioning','Ksh 600. Soft for a month.'],[A('paw',1174),'Paw balm','Ksh 300. For hot pavements.']]),
  split('right','FEAR-FREE','No cages, no hurry','We never use cages or heat dryers on full blast. Anxious dogs get a quiet room and a break whenever they need one.','Meet the groomers',A('person',1175),'alt'),
  gal('mosaic','Fresh from the bath',[A('paw',1176),A('heart',1177),A('bloom',1178),A('circles',1179)]),
  quotes('Pet parents',[['Bruno usually bites the vet. He fell asleep here.','Njeri W.','Boerboel owner'],['My cat actually came out purring.','Sam O.','Persian owner']],'bg'),
  footer('Waggle Parlour','Ngong Road, Karen, Nairobi.')]),
  pg('Contact','contact',[nav('Waggle Parlour','Book a groom','center'),contact('Book a groom','Tell us your pet’s name, breed and age.','woof@waggle.example','+254 705 770 990','Ngong Road, Karen, Nairobi','Book'),footer('Waggle Parlour','Ngong Road, Karen, Nairobi.')])]});

addBespoke({id:'photo-safari-workshop',g:'Travel',tag:'Photo safari',name:'Lens & Lion',kw:'wildlife photography workshop masai mara tuition safari camera',desc:'Small-group wildlife photography safaris in Maasai Mara.',
 th:{p:'#b5832f',p2:'#e8d8b8',p3:'#6b2e1f',bg:'#14110e',alt:'#201b15',tx:'#f3ead7',dark:true,head:'Bodoni Moda',body:'Figtree',radius:0,pop:false,grad:false,deco:false},
 pages:[pg('Home','index',[nav('LENS & LION','Reserve a seat','center'),hero('cover','MAASAI MARA · JULY–OCTOBER','Come back with the frame, not just the memory','Six photographers, two custom vehicles with beanbags, and a pro who has shot the migration for twelve seasons.','Reserve a seat','Dates and prices',[A('savanna',1181)],'alt'),
  gal('masonry','From the workshops',[A('savanna',1182),A('hills',1183),A('camera',1184),A('mountain',1185),A('paw',1186)]),
  steps('A DAY IN THE MARA','Light dictates the day',[['5:30am','Golden hour drive. Big cats are still moving.'],['10am','Breakfast and editing review.'],['4pm','Second drive, backlight and dust.'],['8pm','Critique by lantern.']],'alt'),
  price('SAFARIS','Seven nights, small groups','Park fees and all meals included.',[['Migration','$4,200','','Mara River crossings\n6 guests, 2 vehicles'],['Big cats','$3,800','','Talek and Musiara prides\nSunrise focus',1],['Private','$7,500','','One-on-one mentoring\nYour own vehicle']]),
  split('left','YOUR GUIDE','Lucy Mwende, 12 seasons','A National Geographic Your Shot regular. She teaches panning, backlit exposure and how to be patient enough for a leopard.','Read her story',A('camera',1187),'alt'),
  quotes('Past guests',[['Two hundred keepers in a week. I used to get five.','Hendrik J.','Migration 2025'],['She taught me to read the grass.','Priya R.','Big cats 2025']],'bg'),
  footer('Lens & Lion','Sekenani Gate, Maasai Mara.')]),
  pg('Contact','contact',[nav('LENS & LION','Reserve a seat','center'),contact('Reserve a seat','Tell us your camera kit and what you most want to shoot.','safari@lensandlion.example','+254 728 400 210','Sekenani Gate, Narok County','Send request'),footer('Lens & Lion','Sekenani Gate, Maasai Mara.')])]});

addBespoke({id:'mobile-library-ngo',g:'Nonprofit',tag:'Mobile library',name:'Kitabu Van',kw:'mobile library books charity school children kenya donate',desc:'A converted matatu that carries 4,000 books to rural schools.',
 th:{p:'#c4472b',p2:'#f2c14e',p3:'#1f4e5f',bg:'#f9f3e7',alt:'#efe2c9',tx:'#2d1b14',dark:false,head:'Instrument Serif',body:'Karla',radius:6,pop:false,grad:false,deco:true},
 pages:[pg('Home','index',[nav('Kitabu Van','Donate','left','page:give'),hero('collage','BUNGOMA · KAKAMEGA · BUSIA','A library that arrives on four wheels','We drive a converted matatu with 4,000 books to 34 schools that have no library, once every two weeks.','Give a book','Where we go',[A('book',1191),A('road',1192),A('heart',1193)]),
  stats([['34','Schools visited'],['4,000','Books on board'],['9,800','Children reading'],['Ksh 500','Buys a book']],'primary'),
  split('right','THE VAN','Shelves, a rug and a story corner','A retired 33-seater matatu with shelves on both sides, a rooftop solar panel and a reading rug that unrolls under a tree.','See inside the van',A('road',1194),'alt'),
  cards('grid','HOW YOU CAN HELP','Three ways to give','',[[A('book',1195),'Buy a book','Ksh 500 adds a new Swahili or English picture book.'],[A('heart',1196),'Sponsor a school','Ksh 24,000 keeps one school supplied for a year.'],[A('person',1197),'Volunteer reader','Ride with us for a day. Weekends in school holidays.']]),
  quotes('From the schools',[['Our pupils now fight over who reads first.','Mr. Wekesa','Headteacher, Sirisia'],['I finished three books this term.','Faith, 11','Std 5']],'alt'),
  cta('Help us reach 40 schools by June','Every Ksh 500 puts one book on the shelf.','Donate now'),footer('Kitabu Van','Bungoma Town, Western Kenya. NGO reg. 24817.')]),
  pg('Give','give',[nav('Kitabu Van','Donate','left','page:give'),contact('Donate or volunteer','Pay by M-Pesa paybill 247247, account KITABU, or write to us.','read@kitabuvan.example','+254 725 119 330','Bungoma Town, Western Kenya','Get in touch'),footer('Kitabu Van','Bungoma Town, Western Kenya. NGO reg. 24817.')])]});

}
