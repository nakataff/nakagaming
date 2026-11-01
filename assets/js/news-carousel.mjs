// Native scrolling keeps touch gestures light; buttons and keyboard share the same position.
export function mountNewsCarousel(track,dots){
 const cards=[...track.children],mobile=matchMedia('(max-width:760px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 if(cards.length<2)return;
 let active=0,frame=0;
 const buttons=cards.map((card,index)=>{
  card.id='home-news-'+(index+1);
  const button=document.createElement('button');button.type='button';button.className='news-dot';
  button.setAttribute('aria-label','Mostrar notícia '+(index+1)+' de '+cards.length);
  button.setAttribute('aria-controls',card.id);button.addEventListener('click',()=>show(index));dots.append(button);return button;
 });
 function mark(index){active=index;buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));}
 function left(card){return card.getBoundingClientRect().left-track.getBoundingClientRect().left+track.scrollLeft;}
 function show(index){
  if(!mobile.matches)return;
  track.scrollTo({left:left(cards[index]),behavior:reduced.matches?'instant':'smooth'});
 }
 function sync(){
  frame=0;if(!mobile.matches)return;
  let nearest=0,distance=Infinity;
  cards.forEach((card,i)=>{const delta=Math.abs(left(card)-track.scrollLeft);if(delta<distance){distance=delta;nearest=i;}});
  mark(nearest);
 }
 function resize(){
  dots.hidden=!mobile.matches;track.tabIndex=mobile.matches?0:-1;
  track.scrollTo({left:mobile.matches?left(cards[active]):0,behavior:'instant'});sync();
 }
 track.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(sync);},{passive:true});
 track.addEventListener('keydown',event=>{
  if(!mobile.matches||event.target!==track)return;
  const next={ArrowRight:Math.min(cards.length-1,active+1),ArrowLeft:Math.max(0,active-1),Home:0,End:cards.length-1}[event.key];
  if(next===undefined)return;event.preventDefault();show(next);
 });
 mobile.addEventListener('change',resize);window.addEventListener('resize',()=>{if(mobile.matches)sync();},{passive:true});
 mark(0);resize();
}
