const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function photoLayout(imageWidth,imageHeight,frameWidth,frameHeight,settings={}) {
  if (![imageWidth,imageHeight,frameWidth,frameHeight].every(n=>Number.isFinite(n)&&n>0)) throw new Error('Dimensões da foto inválidas.');
  const fit=settings.photoFit==='contain'?'contain':'cover';
  const scale=(fit==='cover'?Math.max:Math.min)(frameWidth/imageWidth,frameHeight/imageHeight)*clamp(settings.photoZoom??1,1,3);
  const width=imageWidth*scale,height=imageHeight*scale;
  const spaceX=frameWidth-width,spaceY=frameHeight-height;
  return {width,height,left:spaceX*clamp(settings.photoPositionX??50,0,100)/100,top:spaceY*clamp(settings.photoPosition??50,0,100)/100,spaceX,spaceY,frameWidth,frameHeight};
}
export function frameStyles(layout) {
  return {width:layout.width/layout.frameWidth*100+'%',height:layout.height/layout.frameHeight*100+'%',left:layout.left/layout.frameWidth*100+'%',top:layout.top/layout.frameHeight*100+'%'};
}
export function dragPhoto(layout,settings,dx,dy) {
  const round=n=>Math.round(clamp(n,0,100)*100)/100;
  return {
    photoPositionX:Math.abs(layout.spaceX)<.01?(settings.photoPositionX??50):round((settings.photoPositionX??50)+dx/layout.spaceX*100),
    photoPosition:Math.abs(layout.spaceY)<.01?(settings.photoPosition??50):round((settings.photoPosition??50)+dy/layout.spaceY*100)
  };
}
