const signInGate=document.querySelector('#signInGate');
const siteShell=document.querySelector('#siteShell');
const profileSetup=document.querySelector('#profileSetup');
const signInForm=document.querySelector('#signInForm');
const signInHeading=document.querySelector('.signin-heading');
const signInNote=document.querySelector('.signin-note');
const profileAvatars=[
  {name:'Sunny',id:'photo-1534528741775-53994a69daeb'},
  {name:'Explorer',id:'photo-1500648767791-00dcc994a43e'},
  {name:'Artist',id:'photo-1544005313-94ddf0286df2'},
  {name:'Dreamer',id:'photo-1531123897727-8f129e1688ce'},
  {name:'Friend',id:'photo-1506794778202-cad84cf45f1d'},
  {name:'Creator',id:'photo-1494790108377-be9c29b29330'}
];
let selectedProfileAvatar=profileAvatars[0];
function profileImage(id){return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=120&h=120&q=80`}
function readProfile(){try{return JSON.parse(localStorage.getItem('fwatch-profile')||'null')}catch{return null}}
function showProfileSetup(){signInHeading.hidden=true;signInForm.hidden=true;signInNote.hidden=true;profileSetup.hidden=false;}
function applyProfile(profile){
  document.querySelector('#profileAvatar').src=profileImage(profile.avatarId);
  document.querySelector('#profileAvatar').alt=`${profile.name}'s avatar`;
  document.querySelector('#welcomeName').textContent=profile.name;
}
function enterSite(profile){applyProfile(profile);signInGate.hidden=true;siteShell.hidden=false;}
document.querySelector('#avatarOptions').innerHTML=profileAvatars.map((avatar,i)=>`<button type="button" class="avatar-choice${i===0?' selected':''}" data-avatar="${avatar.id}" aria-label="Choose ${avatar.name} avatar" aria-pressed="${i===0}"><img src="${profileImage(avatar.id)}" alt=""></button>`).join('');
document.querySelector('#avatarOptions').addEventListener('click',e=>{
  const choice=e.target.closest('[data-avatar]');if(!choice)return;
  selectedProfileAvatar=profileAvatars.find(avatar=>avatar.id===choice.dataset.avatar)||profileAvatars[0];
  document.querySelectorAll('.avatar-choice').forEach(button=>{const selected=button===choice;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
});
try{
  const signedIn=sessionStorage.getItem('fwatch-demo-signed-in')==='true';
  const savedProfile=readProfile();
  if(signedIn&&savedProfile)enterSite(savedProfile);
  else if(signedIn)showProfileSetup();
}catch{}
document.querySelector('#signInForm').addEventListener('submit',e=>{
  e.preventDefault();
  const email=document.querySelector('#signinEmail').value.trim();
  const password=document.querySelector('#signinPassword').value;
  if(!email||password.length<6){document.querySelector('#signinError').textContent='Enter a valid email and a password with at least 6 characters.';return;}
  try{sessionStorage.setItem('fwatch-demo-signed-in','true');}catch{}
  showProfileSetup();
});
document.querySelector('#forgotPassword').addEventListener('click',e=>{e.preventDefault();document.querySelector('#signinError').textContent='Password reset is not connected in this demo.';});
document.querySelector('#profileForm').addEventListener('submit',e=>{
  e.preventDefault();
  const name=document.querySelector('#profileName').value.trim();
  if(!name){document.querySelector('#profileError').textContent='Enter a name to continue.';return;}
  const profile={name,avatarId:selectedProfileAvatar.id};
  try{localStorage.setItem('fwatch-profile',JSON.stringify(profile));}catch{}
  enterSite(profile);
});

const cats=['For you','All','Design','Travel','Music','Technology','Lifestyle','Food','Gaming','Learning','Nature'];
    const videos=[
      {title:'A quiet morning in the mountains | slow living in the Dolomites',channel:'Roam Free',views:'248K views',time:'2 days ago',duration:'18:42',category:'Travel',img:'photo-1464822759023-fed622ff2c3b',avatar:'photo-1500648767791-00dcc994a43e',quality:'4K'},
      {title:'I built my dream creative studio from scratch',channel:'Studio North',views:'82K views',time:'6 hours ago',duration:'24:16',category:'Design',img:'photo-1497366754035-f200968a6e72',avatar:'photo-1535713875002-d1d0cf377fde',quality:'NEW'},
      {title:'The art of doing nothing — a little reminder to slow down',channel:'Maya Chen',views:'1.2M views',time:'1 week ago',duration:'12:08',category:'Lifestyle',img:'photo-1470252649378-9c29740c9fa8',avatar:'photo-1544005313-94ddf0286df2',quality:'4K'},
      {title:'Making a song from sounds I found on a rainy walk',channel:'juniper.wav',views:'56K views',time:'3 days ago',duration:'15:33',category:'Music',img:'photo-1519608487953-e999c86e7455',avatar:'photo-1534528741775-53994a69daeb',quality:'NEW'},
      {title:'How I take better photos with any camera',channel:'Frame by Frame',views:'394K views',time:'5 days ago',duration:'21:05',category:'Design',img:'photo-1452587925148-ce544e77e70d',avatar:'photo-1517841905240-472988babdf9',quality:'4K'},
      {title:'Tokyo at 5 AM — the city before it wakes up',channel:'Roam Free',views:'765K views',time:'2 weeks ago',duration:'28:49',category:'Travel',img:'photo-1519608487953-e999c86e7455',avatar:'photo-1500648767791-00dcc994a43e',quality:'4K'},
      {title:'A week of meals that actually make me happy',channel:'Table for Two',views:'112K views',time:'1 day ago',duration:'16:27',category:'Food',img:'photo-1490645935967-10de6ba17061',avatar:'photo-1494790108377-be9c29b29330',quality:'NEW'},
      {title:'The little laptop that changed my workflow',channel:'Good Tech',views:'203K views',time:'4 days ago',duration:'11:54',category:'Technology',img:'photo-1496181133206-80ce9b88a853',avatar:'photo-1506794778202-cad84cf45f1d',quality:'REVIEW'},
      {title:'This forest feels like another world',channel:'Wild Places',views:'930K views',time:'3 weeks ago',duration:'19:08',category:'Nature',img:'photo-1448375240586-882707db888b',avatar:'photo-1534528741775-53994a69daeb',quality:'4K'},
      {title:'Building a tiny home in the woods (full tour)',channel:'Maya Chen',views:'480K views',time:'1 week ago',duration:'32:40',category:'Lifestyle',img:'photo-1449158743715-0a90ebb6d2d8',avatar:'photo-1544005313-94ddf0286df2',quality:'4K'},
      {title:'The coziest indie games you missed this year',channel:'Pixel Picnic',views:'91K views',time:'8 hours ago',duration:'14:22',category:'Gaming',img:'photo-1511512578047-dfb367046420',avatar:'photo-1531123897727-8f129e1688ce',quality:'NEW'},
      {title:'Learn to draw anything with this simple trick',channel:'Studio North',views:'1.8M views',time:'2 months ago',duration:'9:46',category:'Learning',img:'photo-1455390582262-044cdead277a',avatar:'photo-1535713875002-d1d0cf377fde',quality:'TUTORIAL'}
    ];
    const catsEl=document.querySelector('#categories'),grid=document.querySelector('#videoGrid'),search=document.querySelector('#searchInput');let active='For you',query='',showAll=false;
    const image=(id,w=600)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=82`;
    function renderCats(){catsEl.innerHTML=cats.map(c=>`<button class="chip ${c===active?'active':''}" data-cat="${c}">${c}</button>`).join('')}
    function render(){renderCats();let list=videos.filter(v=>(active==='For you'||active==='All'||v.category===active)&&(!query||(v.title+' '+v.channel+' '+v.category).toLowerCase().includes(query.toLowerCase())));if(!showAll&&active==='For you'&&!query)list=list.slice(0,6);grid.innerHTML=list.length?list.map((v,i)=>`<article class="video-card" data-index="${videos.indexOf(v)}"><div class="thumb-wrap"><img class="thumb" src="${image(v.img,720)}" alt="${v.title}" loading="${i>2?'lazy':'eager'}"><div class="thumb-overlay"></div><span class="quality">${v.quality}</span><span class="duration">${v.duration}</span></div><div class="card-info"><img class="channel-avatar" src="${image(v.avatar,100)}" alt=""><div class="video-copy"><h3 class="video-title">${v.title}</h3><div class="channel-name">${v.channel}<svg class="verified" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.2 9.7 2l1.9-.1.9 1.6 1.6.9-.1 1.9.8 1.7-.8 1.7.1 1.9-1.6.9-.9 1.6-1.9-.1-1.7.8-1.7-.8-1.9.1-.9-1.6-1.6-.9.1-1.9L1.2 8l.8-1.7-.1-1.9 1.6-.9.9-1.6 1.9.1L8 1.2Z"/><path d="m5 8 2 2 4-4" fill="none" stroke="white" stroke-width="1.2"/></svg></div><div class="video-meta">${v.views} · ${v.time}</div></div><button class="more-btn" aria-label="More options"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></button></div></article>`).join(''):`<div class="empty"><strong>No videos found</strong>Try a different search or category.</div>`;document.querySelector('#loadMore').style.display=(active==='For you'&&!query&&!showAll)?'inline-block':'none'}
    render();catsEl.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;active=b.dataset.cat;showAll=false;document.querySelector('#sectionTitle').textContent=active==='For you'?'Recommended for you':active==='All'?'All videos':`${active} videos`;document.querySelector('#sectionSubtitle').textContent=active==='For you'?'Handpicked videos based on what you love':`Fresh picks from the ${active.toLowerCase()} community`;render()});
    document.querySelector('#searchForm').addEventListener('submit',e=>{e.preventDefault();query=search.value.trim();active='All';document.querySelector('#sectionTitle').textContent=query?`Search results for “${query}”`:'All videos';document.querySelector('#sectionSubtitle').textContent=query?'Videos picked just for you':'Explore every category';render()});search.addEventListener('input',()=>{if(!search.value.trim()&&query){query='';active='For you';document.querySelector('#sectionTitle').textContent='Recommended for you';document.querySelector('#sectionSubtitle').textContent='Handpicked videos based on what you love';render()}});
    document.querySelector('#loadMore').addEventListener('click',()=>{showAll=true;render()});
    const modal=document.querySelector('#modal');grid.addEventListener('click',e=>{if(e.target.closest('.more-btn')){e.stopPropagation();toast('More video options coming soon');return}const card=e.target.closest('.video-card');if(!card)return;const v=videos[+card.dataset.index];document.querySelector('#modalTitle').textContent=v.title;document.querySelector('#modalImage').src=image(v.img,1200);modal.classList.add('open')});document.querySelector('#modalClose').onclick=()=>modal.classList.remove('open');modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('open')});
    const sidebar=document.querySelector('#sidebar');document.querySelector('#menuToggle').onclick=()=>sidebar.classList.toggle('open');document.querySelectorAll('.side-link').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();document.querySelectorAll('.side-link').forEach(x=>x.classList.remove('active'));a.classList.add('active');const n=a.dataset.nav;if(n==='Home'){active='For you';query='';search.value='';document.querySelector('#sectionTitle').textContent='Recommended for you';document.querySelector('#sectionSubtitle').textContent='Handpicked videos based on what you love';render()}else toast(`${n} is ready to explore`);if(innerWidth<760)sidebar.classList.remove('open')}));
    let timer;function toast(t){const el=document.querySelector('#toast');el.textContent=t;el.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>el.classList.remove('show'),2100)}document.querySelector('#uploadBtn').onclick=()=>toast('Creator Studio is coming soon');document.querySelector('#bellBtn').onclick=()=>toast('You’re all caught up!');document.querySelector('#sortBtn').onclick=()=>toast('You’re seeing the best picks for you');document.querySelector('#playBtn').onclick=()=>toast('Demo preview — video playback coming soon');
