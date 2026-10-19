/* Batch 1: 20 hand-designed website templates. */
{const {nav,hero,feats,split,gal,stats,quotes,price,faq,cta,contact,footer,team,cards,menu,steps,text,logos,blog,wa,pg}=B_,A=a_;

addBespoke({id:'dhow-cruises',g:'Travel',tag:'Dhow cruises',name:'Bahari Dhow Co.',kw:'boat sailing zanzibar ocean sunset',desc:'Sunset sailing on traditional dhows from Stone Town.',
 th:{p:'#0b6e8a',p2:'#f2a541',p3:'#e4572e',bg:'#fdf8ef',alt:'#e6f0f1',tx:'#12313a',dark:false,head:'DM Serif Display',body:'DM Sans',radius:6,pop:true},
 pages:[pg('Home','index',[nav('Bahari Dhow Co.','Book a sail','center'),hero('arch','SAIL FROM STONE TOWN','Let the wind plan your evening','Hand-built wooden dhows, a lantern-lit dinner and the best sunset on the Indian Ocean.','See the cruises','Watch the sunset',[A('beach',3)]),
  cards('overlay','THREE WAYS TO SAIL','Pick your hour on the water','',[[A('beach',11),'Sunset sail','Two hours, cold drinks, the whole sky turning orange.'],[A('waves',12),'Snorkel safari','Reefs, turtles and a grilled fish lunch on a sandbank.'],[A('savanna',13),'Moonlit dinner','Seven courses of coastal cooking under the stars.']],'alt'),
  split('left','THE BOATS','Built by hand, the old way','Our three dhows were made in Nungwi from mango and mahogany. No engines at sunset, only sail, rope and the crew who grew up on this water.','Meet the crew',A('hills',14)),
  stats([['3','Wooden dhows'],['11','Crew members'],['4.9','Guest rating'],['0','Plastic bottles']]),
  quotes('Guests on deck',[['The captain sang as we turned for home. I cried a little.','Anna L.','Sunset sail'],['Best snorkelling of our whole trip, and lunch was unreal.','Imani R.','Snorkel safari'],['Booked on the day, no stress, pure magic.','Tom & Dee','Moonlit dinner']]),
  cta('Tonight’s sail has 6 seats left','Book by 4pm and we hold your place on the beach.','Reserve seats'),footer('Bahari Dhow Co.','Kendwa and Stone Town, Zanzibar.')]),
  pg('Contact','contact',[nav('Bahari Dhow Co.','Book a sail','center'),contact('Ask the captain','Tell us the date and how many are coming.','sail@bahari.example','+255 777 000 111','Forodhani Gardens pier, Stone Town','Send request'),footer('Bahari Dhow Co.','Kendwa and Stone Town, Zanzibar.')])]});

addBespoke({id:'ink-tattoo',g:'Creative',tag:'Tattoo studio',name:'Black Mamba Ink',kw:'tattoo piercing artist dark',desc:'Custom tattoos and fine-line work in Arusha.',
 th:{p:'#ff3d2e',p2:'#f5f0e6',p3:'#8a8a8a',bg:'#0d0d0d',alt:'#171717',tx:'#f1ede4',dark:true,head:'Anton',body:'Space Mono',radius:0},
 pages:[pg('Home','index',[nav('BLACK MAMBA INK','Book a slot','left'),hero('cover','ARUSHA · SINCE 2016','Skin is the only canvas that comes with you','Custom blackwork, fine line and traditional pieces. One artist per piece, no flash walls, no rush.','Book a consult','See the work',[A('circles',21)],'alt'),
  gal('strip','Recent pieces',[A('diamond',22),A('leaf',23),A('circles',24),A('frame',25)]),
  split('right','HOW IT WORKS','You bring the idea, we draw it for you','Every tattoo starts with a free 20-minute chat. You get a sketch before you pay a deposit, and changes are free until you love it.','Start a consult',A('paint',26),'alt'),
  steps('THE PROCESS','Four steps, no surprises',[['Chat','Tell us the idea, size and where it goes.'],['Sketch','Drawn in 3 to 5 days, tweaked until right.'],['Session','Clean room, new needles, all the water you want.'],['Aftercare','Written guide and a free touch-up in 8 weeks.']]),
  team('The artists',[['Neo','Blackwork · Fine line',31],['Juma','Traditional · Lettering',32],['Rehema','Botanical · Watercolour',33]],'alt'),
  faq('Before you book',[['Does it hurt?','A bit. We take breaks whenever you ask.'],['How much?','From $60 for small pieces, $120 an hour for larger work.'],['Can I walk in?','Mondays only, for small flash pieces.']]),
  footer('Black Mamba Ink','Private studio, Njiro, Arusha.')]),
  pg('Book','contact',[nav('BLACK MAMBA INK','Book a slot','left'),contact('Book a consult','Send a photo or reference and where you want it.','ink@blackmamba.example','+255 765 000 222','Njiro Complex, Arusha'),footer('Black Mamba Ink','Private studio, Njiro, Arusha.')])]});

addBespoke({id:'cowork-hub',g:'Business',tag:'Co-working space',name:'Kazi Hub',kw:'coworking desk office freelancers startup',desc:'Flexible desks and meeting rooms in Kigali.',
 th:{p:'#2f3df5',p2:'#ffcf3f',p3:'#18c29c',bg:'#ffffff',alt:'#f1f3ff',tx:'#101436',dark:false,head:'Sora',body:'Inter',radius:18,grad:false,pop:true},
 pages:[pg('Home','index',[nav('Kazi Hub','Take a tour','left'),hero('collage','KIGALI · KIMIHURURA','Work where good things keep happening','Fast fibre, strong coffee and 140 people building companies, studios and side projects.','Book a free day','See prices',[A('laptop',41),A('grid',42),A('bloom',43)],'bg'),
  logos('Home to teams from',['Mpesa Lab','GreenGrid','Nyota Films','Tembo Pay','Safi Co.']),
  feats('WHAT YOU GET','Everything a good office has, minus the lease',' ',[['⚡','1 Gbps fibre','Backed by solar and a generator, so the wifi never blinks.'],['☕','Unlimited coffee','A real espresso machine and a barista on weekdays.'],['🤝','Community nights','Demo Fridays, founder dinners and a monthly pitch clinic.']]),
  price('PRICING','Pick a desk, a door or a day','Month to month, cancel any time.',[['Day pass','$12','/day','Any open desk\nCoffee and wifi\nPrinting 10 pages'],['Hot desk','$95','/month','Open seating 24/7\nMeeting room 5 hrs\nMail address',1],['Private office','$420','/month','Lockable room for 4\nStorage\nUnlimited meeting rooms']],'alt'),
  quotes('Members say',[['I signed up for a day and stayed for two years.','Chantal U.','Founder, Safi Co.'],['The pitch clinic got us our first investor.','Eric M.','CEO, Tembo Pay'],['Quiet when I need it, loud when I want it.','Amina K.','Freelance designer']],'bg'),
  cta('Come work a day on us','Your first day is free, no card needed.','Claim my free day'),footer('Kazi Hub','Plot 14, KG 7 Ave, Kimihurura, Kigali.')]),
  pg('Visit','contact',[nav('Kazi Hub','Take a tour','left'),contact('Take a tour','Weekdays 9am to 6pm. Tell us when you can come.','hello@kazihub.example','+250 788 000 333','KG 7 Ave, Kimihurura, Kigali','Request a tour'),faq('Good to know',[['Is it open 24/7?','Members get a key card for round-the-clock access.'],['Can I bring guests?','Yes, three free guest passes every month.']]),footer('Kazi Hub','Plot 14, KG 7 Ave, Kimihurura, Kigali.')])]});

addBespoke({id:'roastery-shop',g:'Retail',tag:'Coffee roastery',name:'Mlima Roasters',kw:'coffee beans shop subscription kilimanjaro',desc:'Small-batch coffee roasted in Moshi and posted to your door.',
 th:{p:'#6b3a1f',p2:'#e6a23c',p3:'#3f5d45',bg:'#f6efe4',alt:'#ecdfcb',tx:'#2a1a10',dark:false,head:'Fraunces',body:'Karla',radius:10,pop:false},
 pages:[pg('Home','index',[nav('Mlima Roasters','Shop beans','left','page:shop'),hero('split','ROASTED IN MOSHI THIS WEEK','Coffee that still remembers the mountain','Grown on Kilimanjaro’s slopes by 400 farming families, roasted every Tuesday in 12-kilo batches.','Shop beans','Start a subscription',[A('cup',51)],'alt'),
  cards('grid','OUR BEANS','Three roasts, one farm each','',[[A('cup',52),'Kibo · Light','Jasmine, peach and black tea. $14 / 250 g'],[A('hills',53),'Mawenzi · Medium','Cocoa, orange peel and brown sugar. $13 / 250 g'],[A('fruit',54),'Shira · Dark','Treacle, toasted almond and smoke. $12 / 250 g']]),
  split('arch','THE FARMERS','Paid before the harvest, not after','We pay 40% above Fairtrade and print the farm’s name on every bag, so you know exactly whose work you are drinking.','Read their stories',A('field',55),'alt'),
  steps('SUBSCRIBE','Fresh coffee on repeat',[['Choose','Pick a roast and a grind.'],['We roast','Roasted the Tuesday before it ships.'],['You sip','Posted in 2 days across East Africa.']]),
  quotes('Kind words',[['Honestly the best coffee I have had in Dar.','Mussa H.','Subscriber'],['Smells unreal when you open the bag.','Lena V.','Customer'],['We serve it in our cafe now.','Joseph T.','Cafe owner']],'alt'),
  footer('Mlima Roasters','Roasted in Moshi. Shipped across East Africa.')]),
  pg('Shop','shop',[nav('Mlima Roasters','Shop beans','left','page:shop'),menu('The shelf','Prices in US dollars. Free delivery over $30.',[['Kibo · Light','250 g whole bean','$14'],['Mawenzi · Medium','250 g whole bean','$13'],['Shira · Dark','250 g whole bean','$12'],['Tasting trio','3 × 100 g, all roasts','$18'],['Monthly subscription','Two bags, your choice','$24']]),contact('Wholesale and gifts','Cafes, hotels and offices: ask for our trade price list.','beans@mlima.example','+255 713 000 444','Kiboriloni Road, Moshi','Send enquiry'),footer('Mlima Roasters','Roasted in Moshi. Shipped across East Africa.')])]});

addBespoke({id:'arch-studio',g:'Business',tag:'Architecture studio',name:'Nyumba & Co. Architects',kw:'architecture design building houses mono',desc:'Calm, climate-smart buildings in East Africa.',
 th:{p:'#1d1d1b',p2:'#c4572f',p3:'#8d8a82',bg:'#efede8',alt:'#e3e0d8',tx:'#1d1d1b',dark:false,head:'Instrument Serif',body:'DM Mono',radius:0},
 pages:[pg('Studio','index',[nav('Nyumba & Co.','Start a project','center'),hero('center','ARCHITECTURE · INTERIORS · MASTERPLANS','Buildings that breathe with the weather','Passive cooling, local stone and big shade. Homes, schools and hotels designed for the equator, not for a brochure.','Start a project','',[],'bg'),
  gal('mosaic','Selected work',[A('house',61),A('city',62),A('columns',63),A('hills',64),A('frame',65),A('lamp',66),A('mountain',67),A('field',68)]),
  split('right','APPROACH','Start with the sun, end with the sofa','We map wind, light and rain before we draw a single wall. The result: homes that need no air-conditioning and cost less to run for the next fifty years.','Our method',A('solar',69),'alt'),
  stats([['62','Buildings completed'],['9','Countries'],['-70%','Cooling energy'],['2019','RIBA award']],'dark'),
  team('Partners',[['Wanjiru Otieno','Principal',71],['Idris Mrisho','Structure',72],['Sofia Lund','Interiors',73]]),
  cta('Have a plot and an idea?','Send us the location. We reply with a one-page site reading, free.','Send the plot'),footer('Nyumba & Co. Architects','Studio in Oyster Bay, Dar es Salaam.','dark')]),
  pg('Contact','contact',[nav('Nyumba & Co.','Start a project','center'),contact('Say hello','Visits by appointment, Tuesday to Friday.','studio@nyumba.example','+255 22 000 5555','Toure Drive, Oyster Bay, Dar es Salaam'),footer('Nyumba & Co. Architects','Studio in Oyster Bay, Dar es Salaam.','dark')])]});

addBespoke({id:'surf-school',g:'Travel',tag:'Surf school',name:'Pwani Surf School',kw:'surf waves beach lessons paje',desc:'Learn to surf on the warm waves of Paje.',
 th:{p:'#00a6c8',p2:'#ff6f59',p3:'#ffd23f',bg:'#f2fbfd',alt:'#d8f1f6',tx:'#06303b',dark:false,head:'Unbounded',body:'Outfit',radius:28,pop:true,deco:true,grad:true},
 pages:[pg('Home','index',[nav('Pwani Surf','Book a lesson','left'),hero('collage','PAJE · ZANZIBAR','Stand up on your first wave by lunchtime','Small groups, soft boards and instructors who never stop smiling. Ages 6 to 66.','Book a lesson','View prices',[A('waves',81),A('beach',82),A('balloon',83)],'bg'),
  feats('WHY IT WORKS','Learn fast, stay safe',' ',[['🏄','2 to 1','Never more than two students per instructor.'],['🌊','Warm water','27°C all year, no wetsuit needed.'],['📸','Photo pack','Every lesson filmed and sent to you.']],'cards','bg'),
  price('LESSONS','Pick your session','',[['First wave','$35','/90 min','Board and rash vest\nTheory on sand\nPhoto pack'],['Surf week','$180','/5 days','Daily lessons\nVideo coaching\nFree board day',1],['Private','$70','/hour','Just you and a coach\nAny level\nAny time']],'alt'),
  gal('strip','The vibe',[A('waves',84),A('beach',85),A('balloon',86),A('hills',87)]),
  quotes('Surfers speak',[['Stood up on my third try!','Mia, 9','First wave'],['Instructors with so much patience.','Jonas P.','Surf week'],['Best birthday present ever.','Layla A.','Private']]),
  cta('Tide table says 6am is perfect','Reserve your spot for tomorrow’s dawn session.','Book 6am'),footer('Pwani Surf School','Paje Beach, behind the white shack.','primary')]),
  pg('Contact','contact',[nav('Pwani Surf','Book a lesson','left'),contact('Find us on the sand','Message us on WhatsApp for same-day spots.','surf@pwani.example','+255 777 000 666','Paje Beach, Zanzibar'),footer('Pwani Surf School','Paje Beach, behind the white shack.','primary')])]});

addBespoke({id:'lingua-school',g:'Education',tag:'Language school',name:'Lugha Language Lab',kw:'language english french swahili classes',desc:'Speak a new language in 12 weeks.',
 th:{p:'#d6336c',p2:'#4263eb',p3:'#fab005',bg:'#fffaf5',alt:'#ffe9d8',tx:'#2b1a24',dark:false,head:'Bricolage Grotesque',body:'Figtree',radius:16,pop:true},
 pages:[pg('Home','index',[nav('Lugha Lab','Free trial','left'),hero('split','FRENCH · ENGLISH · SWAHILI · MANDARIN','Say it out loud, from the first lesson','Small conversation classes, taught by native speakers, built around the situations you actually meet.','Try a free class','See courses',[A('book',91)],'alt'),
  cards('grid','COURSES','Choose your language','',[[A('book',92),'French','Business and travel French, levels A1 to B2.'],[A('city',93),'English','Interview, meeting and email English.'],[A('hills',94),'Swahili','For expats, volunteers and curious families.']]),
  steps('HOW CLASSES WORK','Twelve weeks, one speaking goal',[['Level test','A friendly 15-minute chat.'],['Small group','Six learners, two live sessions a week.'],['Real tasks','Order, negotiate, present, argue.'],['Certificate','Recognised by partner employers.']],'alt'),
  stats([['3,400','Learners taught'],['6','Native teachers'],['92%','Reach their goal'],['12','Weeks to fluent chat']]),
  quotes('Learners',[['I gave a presentation in French after 10 weeks.','Peter K.','Logistics manager'],['The teacher never lets you stay silent, in the best way.','Dana S.','Volunteer'],['My kids and I learn Swahili together.','Rukia & family','Parents']],'bg'),
  cta('Your first class is free','No payment, no commitment, just a conversation.','Book my free class'),footer('Lugha Language Lab','Mikocheni B, Dar es Salaam.','dark')]),
  pg('Contact','contact',[nav('Lugha Lab','Free trial','left'),contact('Book your trial','Tell us the language you want to learn.','hello@lugha.example','+255 754 000 777','Mikocheni B, Dar es Salaam'),footer('Lugha Language Lab','Mikocheni B, Dar es Salaam.','dark')])]});

addBespoke({id:'podcast-show',g:'Creative',tag:'Podcast',name:'Mtaani Stories',kw:'podcast audio episodes show listen',desc:'A weekly podcast of true stories from city streets.',
 th:{p:'#ffb300',p2:'#ff4d6d',p3:'#7c4dff',bg:'#120f1c',alt:'#1c1730',tx:'#f5f0ff',dark:true,head:'Syne',body:'Manrope',radius:20,grad:true,deco:true},
 pages:[pg('Show','index',[nav('Mtaani Stories','Listen now','left'),hero('split','NEW EPISODE EVERY THURSDAY','True stories from the streets you walk past','A show about the vendors, drivers and dreamers who keep the city moving. Told by the people who live them.','Listen now','Browse episodes',[A('music',101)],'bg'),
  blog('Latest episodes','Forty minutes. Headphones recommended.',[['The night bus driver','Ep 48 · 12 Oct','Twelve years, one route, and the passenger who changed everything.'],['Mama Lishe’s secret','Ep 47 · 5 Oct','Why the best lunch in town costs a dollar and starts at 4am.'],['The last film projectionist','Ep 46 · 28 Sep','Inside the cinema that refuses to go digital.']],'cards','alt'),
  split('left','THE HOSTS','Two friends and one very old microphone','Zawadi writes. Kito talks. Together they have recorded 190 hours of tape in markets, ferries and living rooms.','About the show',A('person',102)),
  stats([['48','Episodes'],['310k','Plays'],['4.9','Rating'],['11','Cities']],'primary'),
  logos('Find us on',['Spotify','Apple Podcasts','YouTube','Audiomack','Castbox'],'alt'),
  cta('Got a story we should hear?','Tell us in a voice note. We answer every one.','Send your story','alt'),footer('Mtaani Stories','Recorded in Dar es Salaam.')]),
  pg('Contact','contact',[nav('Mtaani Stories','Listen now','left'),contact('Pitch a story','Send a voice note or a few lines.','stories@mtaani.example','+255 700 000 888','Dar es Salaam'),footer('Mtaani Stories','Recorded in Dar es Salaam.')])]});

addBespoke({id:'craft-brewery',g:'Food',tag:'Craft brewery',name:'Simba Hops Brewing',kw:'beer taproom brewery pub',desc:'Small-batch beer and a taproom in Nairobi.',
 th:{p:'#b8620c',p2:'#1f6f4a',p3:'#e9c46a',bg:'#1b1511',alt:'#271d17',tx:'#f4e9d8',dark:true,head:'Archivo Black',body:'Karla',radius:8,pop:true},
 pages:[pg('Home','index',[nav('Simba Hops','Visit the taproom','left'),hero('cover','NAIROBI · EST. 2018','Brewed slow. Poured proud.','Eight taps, one wood-fired pizza oven and a beer garden under the jacaranda.','Visit the taproom','Meet the beers',[A('plate',111)],'alt'),
  menu('On tap this week','Half pints from $2, pints from $3.5.',[['Jacaranda Pale','Citrus and pine, 5.2%','$3.5'],['Mombasa Stout','Coffee and cocoa, 6.0%','$4'],['Maasai Wheat','Orange peel and coriander, 4.8%','$3.5'],['Rift IPA','Tropical and bitter, 6.5%','$4.5']]),
  split('right','THE BREWERS','Every batch is 600 litres, no more','Our two brewers still taste every tank by hand, using Kenyan barley and hops from the Great Rift Valley.','Book a tour',A('fruit',112),'alt'),
  gal('mosaic','Friday nights',[A('plate',113),A('city',114),A('music',115),A('fruit',116),A('cup',117),A('balloon',118),A('lamp',119),A('hills',120)]),
  steps('THE TAPROOM','Come for the beer, stay for the pizza',[['Thursday','Quiz night, free entry'],['Friday','Live band from 7pm'],['Sunday','Brewery tour at 3pm']],'alt'),
  cta('Private parties and tastings','Our upstairs room seats 40.','Book the room'),footer('Simba Hops Brewing','Lenana Road, Nairobi. Please drink responsibly, 18+.')]),
  pg('Contact','contact',[nav('Simba Hops','Visit the taproom','left'),contact('Find the taproom','Open Wednesday to Sunday from 4pm.','taps@simbahops.example','+254 720 000 999','Lenana Road, Nairobi'),footer('Simba Hops Brewing','Lenana Road, Nairobi. Please drink responsibly, 18+.')])]});

addBespoke({id:'spa-retreat',g:'Health',tag:'Wellness retreat',name:'Utulivu Retreat',kw:'spa yoga wellness massage retreat calm',desc:'Quiet days of yoga, massage and good food by the lake.',
 th:{p:'#5c7f67',p2:'#d9a38c',p3:'#b7c4a8',bg:'#f7f3ec',alt:'#ebe5d8',tx:'#27332b',dark:false,head:'Cormorant Garamond',body:'Figtree',radius:40,pop:false},
 pages:[pg('Home','index',[nav('Utulivu','Plan your stay','center'),hero('arch','LAKE TANGANYIKA','A week with nothing on the to-do list','Slow mornings, sea-salt massage, vegetable-led meals and a very large hammock.','See the retreats','',[A('stones',131)]),
  feats('INCLUDED','What fills your day',' ',[['🧘','Morning yoga','Gentle flow at sunrise, all levels.'],['💆','Daily massage','Sixty minutes with local oils.'],['🥗','Garden meals','Harvested that morning, three times a day.']],'plain'),
  split('arch','THE PLACE','Twelve rooms on a quiet lakeshore','Mud-brick cottages, outdoor showers and no phone signal on purpose. The nearest town is an hour away by boat.','Take a look',A('hills',132),'alt'),
  price('RETREATS','Three ways to unwind',' ',[['Weekend','$420','/2 nights','Yoga and meals\nOne massage\nBoat transfer'],['Reset week','$1,150','/6 nights','Daily massage\nCooking class\nGuided hikes',1],['Silence','$1,600','/8 nights','Quiet programme\nMeditation\nPrivate cottage']]),
  quotes('Guests wrote',[['I slept nine hours for six nights.','Hannah B.','Reset week'],['Nothing to do and everything to feel.','Peter N.','Weekend'],['The food alone is worth the boat.','Catherine O.','Silence']],'alt'),
  cta('Take a breath','Rooms fill up early in the dry season.','Check dates'),footer('Utulivu Retreat','Kigoma, on the shore of Lake Tanganyika.','dark')]),
  pg('Enquire','contact',[nav('Utulivu','Plan your stay','center'),contact('Plan your stay','We reply within a day with dates and a transfer plan.','stay@utulivu.example','+255 762 000 123','Ujiji, Kigoma'),footer('Utulivu Retreat','Kigoma, on the shore of Lake Tanganyika.','dark')])]});

addBespoke({id:'ai-summit',g:'Events',tag:'Tech conference',name:'AI Africa Summit 2027',kw:'conference summit tickets speakers technology',desc:'Two days of AI for African builders, in Kigali.',
 th:{p:'#6d5dfc',p2:'#00e0b8',p3:'#ff5d8f',bg:'#0a0b1e',alt:'#12143a',tx:'#eef0ff',dark:true,head:'Space Grotesk',body:'Inter',radius:14,grad:true,deco:true},
 pages:[pg('Summit','index',[nav('AI Africa 2027','Get tickets','left'),hero('center','KIGALI · 14 – 15 MARCH 2027','Where African builders ship AI','Forty talks, ten workshops and a startup showcase with real customers in the room.','Get tickets','See the speakers',[],'bg'),
  stats([['2','Days'],['40','Talks'],['1,200','Attendees'],['35','Countries']]),
  team('Headline speakers',[['Dr. Aisha Bello','Lagos, Applied ML',141],['Kwame Asante','Accra, Open data',142],['Léa Mugisha','Kigali, Agri AI',143]],'alt'),
  steps('SCHEDULE','Two days at a glance',[['Day 1 · Build','Keynote, model workshops and demo hour.'],['Day 2 · Ship','Founder panels, investor clinic and the pitch final.'],['After dark','Rooftop party with a live DJ.']]),
  price('TICKETS','Early prices end 30 November',' ',[['Student','$49','','Both days\nLunch\nCertificate'],['Standard','$199','','Both days\nWorkshops\nRecordings',1],['Founder','$449','','Investor clinic\nBooth\nVIP dinner']],'alt'),
  cta('Join 1,200 builders in Kigali','Group discounts for teams of five or more.','Get tickets'),footer('AI Africa Summit','Kigali Convention Centre, Rwanda.')]),
  pg('Contact','contact',[nav('AI Africa 2027','Get tickets','left'),contact('Sponsors and media','Talk to our team about partnering.','team@aiafrica.example','+250 788 111 222','KCC, Kimihurura, Kigali'),footer('AI Africa Summit','Kigali Convention Centre, Rwanda.')])]});

addBespoke({id:'drone-studio',g:'Tech',tag:'Drone photography',name:'Juu Aerial',kw:'drone aerial video mapping photography',desc:'Aerial photo, video and mapping across East Africa.',
 th:{p:'#0ea5e9',p2:'#f97316',p3:'#a3e635',bg:'#f8fafc',alt:'#e2e8f0',tx:'#0f172a',dark:false,head:'Lexend',body:'Inter',radius:12,pop:true},
 pages:[pg('Home','index',[nav('JUU Aerial','Get a quote','left'),hero('cover','LICENSED PILOTS · TCAA APPROVED','See it from 120 metres up','Cinematic video, real-estate photos and survey-grade maps, delivered in 48 hours.','Get a quote','Watch showreel',[A('mountain',151)],'alt'),
  cards('overlay','WHAT WE FLY','Four things clients ask for most','',[[A('house',152),'Real estate','Photo and video that sells plots faster.'],[A('field',153),'Farm mapping','Crop health and boundary maps.'],[A('city',154),'Construction','Weekly progress flights.'],[A('beach',155),'Weddings and events','Smooth, discreet, beautiful.']]),
  split('right','WHY JUU','Licensed, insured and obsessed with light','Every pilot carries a licence, backup batteries and permission from the landowner. We fly at golden hour whenever the weather lets us.','Our safety record',A('solar',156),'alt'),
  stats([['1,300','Flights logged'],['0','Incidents'],['48h','Delivery'],['4K','Every clip']]),
  quotes('Clients',[['The aerial video doubled our enquiries.','Mwanaisha T.','Estate agent'],['Maps accurate to 3 cm. Impressive.','Felix R.','Surveyor'],['Nobody even knew the drone was there.','Zuri & Pete','Wedding']],'alt'),
  cta('Planning a shoot?','Send the location and date. We reply within 3 hours.','Request a quote'),footer('Juu Aerial','Based in Arusha, flying across East Africa.','dark')]),
  pg('Quote','contact',[nav('JUU Aerial','Get a quote','left'),contact('Get a quote','Tell us the site, the date and what you need.','fly@juu.example','+255 784 000 213','Njiro, Arusha'),footer('Juu Aerial','Based in Arusha, flying across East Africa.','dark')])]});

addBespoke({id:'skincare-brand',g:'Retail',tag:'Natural skincare',name:'Shea & Sun',kw:'skincare beauty shea natural shop',desc:'Whipped shea butters and oils, made in small batches in Tamale.',
 th:{p:'#c2703d',p2:'#6b8f71',p3:'#f4c7a1',bg:'#fdf7f0',alt:'#f6e7d6',tx:'#3a2418',dark:false,head:'Young Serif',body:'Nunito',radius:24,pop:false},
 pages:[pg('Home','index',[nav('Shea & Sun','Shop now','center','page:shop'),hero('collage','MADE IN SMALL BATCHES','Skin that glows, from the shea tree outward','Unrefined shea, baobab and moringa, bought directly from 300 women’s cooperatives.','Shop now','Our story',[A('bloom',161),A('fruit',162),A('leaf',163)]),
  cards('grid','BEST SELLERS','Three jars to start',' ',[[A('bloom',164),'Whipped body butter','Rich, light-scented, melts in. $16'],[A('leaf',165),'Baobab face oil','Fast-absorbing, no clogged pores. $22'],[A('fruit',166),'Moringa lip balm','Soft and glossy for 8 hours. $6']]),
  split('left','OUR PROMISE','Five ingredients or fewer','No parabens, no perfume, no plastic tubs. We refill jars for free.','Read the ingredients',A('hills',167),'alt'),
  quotes('Loved by',[['My eczema has calmed down in two weeks.','Sarah N.','Customer'],['Smells like my grandmother’s kitchen.','Dina O.','Customer'],['Beautiful gift boxes.','Marcus L.','Customer']]),
  cta('Free shipping over $40','Delivered in 3 days across East Africa.','Shop the range'),footer('Shea & Sun','Tamale, Ghana · shipped worldwide.')]),
  pg('Shop','shop',[nav('Shea & Sun','Shop now','center','page:shop'),menu('The shop','Handmade and refillable.',[['Whipped body butter','200 ml','$16'],['Baobab face oil','30 ml','$22'],['Moringa lip balm','10 g','$6'],['Gift trio','All three, in a box','$38']]),contact('Help with an order','We answer every message.','care@sheasun.example','+233 20 000 1010','Tamale, Ghana'),footer('Shea & Sun','Tamale, Ghana · shipped worldwide.')])]});

addBespoke({id:'hardware-mart',g:'Retail',tag:'Building materials',name:'Imara Hardware',kw:'hardware cement tools builders construction store',desc:'Cement, steel, paint and tools delivered across Dodoma.',
 th:{p:'#f08a00',p2:'#1f2937',p3:'#2f9e44',bg:'#ffffff',alt:'#f3f4f6',tx:'#1f2937',dark:false,head:'Oswald',body:'Rubik',radius:4,pop:true},
 pages:[pg('Home','index',[nav('IMARA HARDWARE','Get a quote','left'),hero('split','DODOMA · OPEN 7 DAYS','Everything for the build, in one trip','Cement, roofing, steel, paint and power tools, with delivery to site the same day.','Get a quote','Call the yard',[A('house',171)],'alt'),
  feats('WHY BUILDERS CHOOSE US','Honest prices, on time',' ',[['🚚','Same-day delivery','Order by noon, on site by evening.'],['🏷','Trade prices','Contractors save 8% on every order.'],['🧰','Tool hire','Mixers, drills and generators by the day.']]),
  cards('grid','AISLES','Shop by the job','',[[A('city',172),'Cement and blocks','All grades, delivered by the tonne.'],[A('house',173),'Roofing','Iron sheets, trusses and gutters.'],[A('paint',174),'Paint','Mixed to any colour in ten minutes.']],'alt'),
  stats([['9','Years trading'],['3,800','Site deliveries'],['40','Trucks'],['7','Days a week']],'dark'),
  logos('Brands we stock',['Twiga','Simba','Sadolin','Bosch','Dewalt']),
  cta('Send us your bill of quantities','We price it free within the hour.','Get a quote'),footer('Imara Hardware','Area D, Dodoma.','dark')]),
  pg('Quote','contact',[nav('IMARA HARDWARE','Get a quote','left'),contact('Get a quote','Send a list or a photo of your plan.','sales@imara.example','+255 756 000 313','Area D, Dodoma'),footer('Imara Hardware','Area D, Dodoma.','dark')])]});

addBespoke({id:'party-planner',g:'Events',tag:'Kids parties',name:'Pop! Parties',kw:'kids birthday party planner balloons fun',desc:'Birthday parties kids talk about for a year.',
 th:{p:'#ff5a8a',p2:'#2dc4b2',p3:'#ffc233',bg:'#fff9ee',alt:'#ffe7ef',tx:'#2a1f3d',dark:false,head:'Baloo 2',body:'Nunito',radius:34,pop:true,deco:true,grad:true},
 pages:[pg('Home','index',[nav('Pop! Parties','Plan a party','left'),hero('collage','BIRTHDAYS · NAMING · GRADUATIONS','We bring the party, you bring the cake','Games, balloons, face-paint and a host who knows every kid’s name by the end.','Plan a party','See packages',[A('balloon',181),A('gift',182),A('heart',183)],'bg'),
  cards('grid','PARTY THEMES','Pick a world',' ',[[A('rocket',184),'Space explorers','Rocket crafts, star hunt and glow-stick disco.'],[A('savanna',185),'Safari adventure','Animal masks, treasure trail and drum circle.'],[A('paint',186),'Little artists','Paint, glitter and a gallery wall to take home.']]),
  price('PACKAGES','Simple prices, nothing hidden',' ',[['Mini','$120','/10 kids','2 hours\nHost and games\nBalloon arch'],['Classic','$220','/20 kids','3 hours\nFace paint\nTheme décor',1],['Mega','$380','/30 kids','4 hours\nBouncy castle\nPhotographer']],'alt'),
  quotes('Parents say',[['Twenty kids, zero stress for me.','Asha M.','Mum of two'],['They remembered our son’s favourite colour!','Peter L.','Dad'],['Best party in the whole street.','Joy K.','Birthday mum']]),
  cta('Pick a date before it’s gone','Weekends book out six weeks ahead.','Check dates'),footer('Pop! Parties','Mikocheni and Masaki, Dar es Salaam.','primary')]),
  pg('Book','contact',[nav('Pop! Parties','Plan a party','left'),contact('Plan a party','Tell us the date, the age and the theme.','hello@popparties.example','+255 713 000 414','Mikocheni, Dar es Salaam'),footer('Pop! Parties','Mikocheni and Masaki, Dar es Salaam.','primary')])]});

addBespoke({id:'physio-clinic',g:'Health',tag:'Physiotherapy',name:'Mwendo Physio',kw:'physiotherapy clinic back pain sports injury rehab',desc:'Move without pain. Physiotherapy in Mwanza.',
 th:{p:'#0f766e',p2:'#38bdf8',p3:'#fbbf24',bg:'#f6fbfa',alt:'#dff2ee',tx:'#0b2a28',dark:false,head:'Manrope',body:'Inter',radius:14,pop:true},
 pages:[pg('Home','index',[nav('Mwendo Physio','Book a visit','left'),hero('split','MWANZA · MIKOCHENI ROAD','Get back to the things you love','Back pain, knees, shoulders and sports injuries treated by registered physios with clear plans.','Book a visit','Our services',[A('bars',191)],'alt'),
  feats('WHAT WE TREAT','Pain has a plan',' ',[['🦴','Back and neck','Desk pain, disc problems, stiffness.'],['🏃','Sports injuries','Runners, footballers, gym lifters.'],['🩹','After surgery','Safe, steady return to full movement.']]),
  steps('YOUR FIRST VISIT','What to expect',[['Assessment','45 minutes, full movement check.'],['Plan','Clear goals and number of sessions.'],['Treatment','Hands-on work and tailored exercise.'],['Progress','We track your gains every week.']],'alt'),
  team('Your physios',[['Dr. Amani J.','Spine and posture',201],['Dr. Lilian K.','Sports rehab',202],['Dr. Omari B.','Neuro and elderly',203]]),
  stats([['8,500','Patients'],['94%','Back to activity'],['6','Physios'],['Same week','Appointments']],'dark'),
  cta('Pain should not be normal','Book online or send us a WhatsApp.','Book a visit'),footer('Mwendo Physio','Mikocheni Road, Mwanza.')]),
  pg('Book','contact',[nav('Mwendo Physio','Book a visit','left'),contact('Book a visit','Mon to Sat, 7am to 7pm. Most insurances accepted.','care@mwendo.example','+255 785 000 515','Mikocheni Road, Mwanza'),footer('Mwendo Physio','Mikocheni Road, Mwanza.')])]});

addBespoke({id:'film-festival',g:'Events',tag:'Film festival',name:'Bahari Film Festival',kw:'film festival cinema screenings tickets movies',desc:'Ten days of African cinema on the Zanzibar waterfront.',
 th:{p:'#e63946',p2:'#f1c40f',p3:'#457b9d',bg:'#101820',alt:'#1a2530',tx:'#f6efe6',dark:true,head:'Bodoni Moda',body:'Work Sans',radius:2,grad:false,deco:false},
 pages:[pg('Festival','index',[nav('BAHARI FILM FESTIVAL','Tickets','center','page:tickets'),hero('cover','ZANZIBAR · 5 – 14 JUNE','Ten nights. One hundred films. Open air.','African cinema under the stars, from debut shorts to restored classics.','Get tickets','Full programme',[A('film',211)],'alt'),
  gal('strip','Opening night',[A('film',212),A('music',213),A('city',214),A('beach',215)]),
  steps('PROGRAMME','Every night has a theme',[['Mon','Debut shorts'],['Wed','Documentary night'],['Fri','Restored classics'],['Sat','Closing gala']],'alt'),
  split('right','THE JURY','Judged by people who make films for a living','Our five jurors include a Cannes winner, two editors and a Swahili poet.','Meet the jury',A('person',216)),
  logos('Presented with',['Zuku','Ocean Bank','Jahazi Press','Film Africa','Sauti za Busara'],'alt'),
  cta('Pass for all ten nights: $55','Single nights from $8. Students half price.','Buy a pass'),footer('Bahari Film Festival','Forodhani Gardens, Stone Town.','dark')]),
  pg('Tickets','tickets',[nav('BAHARI FILM FESTIVAL','Tickets','center','page:tickets'),price('TICKETS','Choose your pass',' ',[['One night','$8','','One screening block\nSeat on the lawn'],['Weekend','$25','','Fri, Sat, Sun\nProgramme booklet',1],['Full festival','$55','','All ten nights\nFilmmaker Q&As\nClosing gala']]),contact('Press and sponsors','Accreditation requests and partnership enquiries.','press@baharifilm.example','+255 777 111 616','Stone Town, Zanzibar'),footer('Bahari Film Festival','Forodhani Gardens, Stone Town.','dark')])]});

addBespoke({id:'pottery-studio',g:'Creative',tag:'Pottery studio',name:'Udongo Ceramics',kw:'pottery ceramics clay workshop handmade',desc:'Hand-thrown ceramics and weekend wheel classes.',
 th:{p:'#b0553a',p2:'#2f4858',p3:'#e0a96d',bg:'#f4ede4',alt:'#e8dccd',tx:'#2c1f19',dark:false,head:'Gloock',body:'Karla',radius:14,pop:false},
 pages:[pg('Home','index',[nav('Udongo','Join a class','left'),hero('arch','HANDMADE IN IRINGA','Made slowly, from the red earth','Tableware and planters thrown by hand, plus beginner wheel classes every weekend.','Shop the pots','Join a class',[A('cup',221)]),
  cards('grid','FROM THE KILN','New this season',' ',[[A('cup',222),'Speckled mugs','Set of two. $24'],[A('plate',223),'Dinner plates','Set of four. $48'],[A('bloom',224),'Plant pots','Three sizes. From $12']]),
  split('left','CLASSES','Get your hands dirty on Saturday','A three-hour intro with clay, wheel and tea. You take home two pieces once fired.','See dates',A('stones',225),'alt'),
  gal('masonry','The studio',[A('cup',226),A('plate',227),A('bloom',228),A('stones',229),A('fruit',230),A('leaf',231)]),
  quotes('Students',[['I found my Saturday calm.','Rose M.','Beginner class'],['Our wedding gifts were all made here.','Ali & Neema','Customers'],['Lovely teacher, lovely tea.','Kevin D.','Beginner class']],'alt'),
  cta('Next intro class: Saturday 9am','Eight places. Aprons and tea included.','Book a place'),footer('Udongo Ceramics','Kihesa, Iringa.')]),
  pg('Visit','contact',[nav('Udongo','Join a class','left'),contact('Visit the studio','Open Thu to Sun, 10am to 5pm.','clay@udongo.example','+255 713 000 717','Kihesa, Iringa'),footer('Udongo Ceramics','Kihesa, Iringa.')])]});

addBespoke({id:'kili-treks',g:'Travel',tag:'Mountain trekking',name:'Kibo Summit Treks',kw:'kilimanjaro climbing hiking guides trekking',desc:'Guided Kilimanjaro climbs with a 98% summit rate.',
 th:{p:'#1d4e89',p2:'#f79d2d',p3:'#4c9f70',bg:'#f5f8fb',alt:'#e1eaf3',tx:'#10243a',dark:false,head:'Libre Caslon Text',body:'Figtree',radius:8,pop:true},
 pages:[pg('Home','index',[nav('Kibo Summit Treks','Plan my climb','left'),hero('cover','MARANGU · LEMOSHO · MACHAME','Stand on the roof of Africa','Seven-day guided climbs with fair-paid porters, hot meals and a 98% summit rate.','Plan my climb','See the routes',[A('mountain',241)],'alt'),
  cards('grid','ROUTES','Choose your way up',' ',[[A('mountain',242),'Machame · 7 days','The scenic favourite. From $2,150'],[A('hills',243),'Lemosho · 8 days','Best for acclimatising. From $2,450'],[A('field',244),'Marangu · 6 days','Huts, not tents. From $1,950']]),
  feats('WHY US','Done properly or not at all',' ',[['⛑','Safety first','Oxygen, radios and a pulse check every evening.'],['🤝','Fair porters','KPAP partner. Every porter paid a fair wage.'],['🍲','Real food','Hot, fresh meals on the mountain.']],'plain','alt'),
  stats([['98%','Summit success'],['1,900','Climbers guided'],['14','Years'],['A+','KPAP rating']],'dark'),
  quotes('Climbers',[['Hardest and best thing I have ever done.','Sam H.','Machame'],['Guides felt like family by day three.','Beatriz P.','Lemosho'],['Porters sang us to the summit.','Daniel W.','Marangu']],'bg'),
  cta('Dates for 2027 are open','Climbs leave every Saturday. Groups of 2 to 12.','Plan my climb'),footer('Kibo Summit Treks','Moshi, Kilimanjaro.','dark')]),
  pg('Plan','contact',[nav('Kibo Summit Treks','Plan my climb','left'),contact('Plan your climb','Tell us the month and group size.','climb@kibo.example','+255 754 000 818','Moshi, Kilimanjaro'),footer('Kibo Summit Treks','Moshi, Kilimanjaro.','dark')])]});

addBespoke({id:'driving-school',g:'Education',tag:'Driving school',name:'Barabara Driving School',kw:'driving lessons licence cars learner',desc:'Pass your licence test with patient instructors.',
 th:{p:'#e11d48',p2:'#0ea5e9',p3:'#facc15',bg:'#ffffff',alt:'#f8fafc',tx:'#111827',dark:false,head:'Rubik',body:'Inter',radius:10,pop:true},
 pages:[pg('Home','index',[nav('Barabara','Book lessons','left'),hero('split','NAIROBI · NGONG ROAD','From L-plates to licence in six weeks','Dual-control cars, calm instructors and a test-ready plan from the very first lesson.','Book lessons','See prices',[A('road',251)],'alt'),
  steps('YOUR JOURNEY','Six weeks to a licence',[['Theory','NTSA test practice online.'],['Basics','Empty-road control and parking.'],['City roads','Traffic, roundabouts and night driving.'],['Test day','Mock test, then the real one.']]),
  price('LESSON PACKS','Cheaper by the pack',' ',[['Starter','$85','/5 lessons','Dual-control car\nTheory app'],['Test ready','$240','/15 lessons','Mock test\nTest-day pickup',1],['Refresher','$40','/2 lessons','For licence holders']],'alt'),
  stats([['91%','First-time pass'],['6,200','Learners']],'dark'),
  quotes('Learners',[['Passed first time, no nerves.','Ruth W.','Test ready'],['Instructor never raised his voice.','Brian O.','Starter'],['Finally confident in traffic.','Faith M.','Refresher']],'bg'),
  cta('Free first lesson for students','Bring your ID and a smile.','Claim it'),footer('Barabara Driving School','Ngong Road, Nairobi.')]),
  pg('Contact','contact',[nav('Barabara','Book lessons','left'),contact('Book lessons','Pickup available across Nairobi.','drive@barabara.example','+254 711 000 919','Ngong Road, Nairobi'),footer('Barabara Driving School','Ngong Road, Nairobi.')])]});
}
