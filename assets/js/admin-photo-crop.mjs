import {photoLayout,frameStyles,dragPhoto} from './photo-frame.mjs?v=20261101-news';
import {mediaURL} from './roster-media.mjs?v=20261101-news';
import {validatePhoto} from './admin-schema.mjs?v=20261101-news';
export function createPhotoCrop({form,getProfile,onApply,feedback,circle=true}) {
  const dialog=document.createElement('dialog');dialog.className='photo-crop-dialog';
  dialog.setAttribute('aria-labelledby','photo-crop-title');
  dialog.innerHTML='<form method="dialog" class="photo-crop-content"><div class="card-heading"><h2 id="photo-crop-title">Enquadrar foto</h2><button type="button" data-close class="crop-close" aria-label="Fechar enquadramento">×</button></div><p class="crop-instructions">Arraste a foto para ajustar a posição. Use o zoom para aproximar.</p><div class="crop-stage '+(circle?'is-circle':'is-portrait')+'" tabindex="0" role="group" aria-label="Mover foto. Arraste ou use as setas do teclado."><img alt="Prévia do enquadramento" draggable="false"></div><p class="crop-status" role="status" aria-live="polite"></p><label>Zoom <output data-zoom-value>100%</output><input name="zoom" aria-label="Zoom da foto" type="range" min="1" max="3" step="0.05" value="1"></label><div class="field-grid"><label>Posição horizontal<input name="positionX" aria-label="Posição horizontal da foto" type="range" min="0" max="100" step="0.01" value="50"></label><label>Posição vertical<input name="positionY" aria-label="Posição vertical da foto" type="range" min="0" max="100" step="0.01" value="50"></label></div><p class="field-help">Se a foto não se mover em alguma direção, aumente o zoom. Você também pode usar as setas do teclado na prévia.</p><div class="form-buttons"><button type="button" data-apply class="admin-primary" disabled>Aplicar enquadramento</button><button type="button" data-center class="admin-secondary">Centralizar</button><button type="button" data-close class="admin-secondary">Cancelar</button></div><p class="field-help">Depois de aplicar, salve o cadastro e publique no site.</p></form>';
  document.body.append(dialog);
  const stage=dialog.querySelector('.crop-stage'),image=stage.querySelector('img'),status=dialog.querySelector('.crop-status'),apply=dialog.querySelector('[data-apply]');
  const zoom=dialog.querySelector('[name=zoom]'),x=dialog.querySelector('[name=positionX]'),y=dialog.querySelector('[name=positionY]');
  let settings={},ready=false,drag=null,generation=0;
  function layout(){return photoLayout(image.naturalWidth,image.naturalHeight,stage.clientWidth,stage.clientHeight,settings);}
  function paint(){
    zoom.value=settings.photoZoom;x.value=settings.photoPositionX;y.value=settings.photoPosition;
    dialog.querySelector('[data-zoom-value]').textContent=Math.round(settings.photoZoom*100)+'%';
    if(ready)Object.assign(image.style,frameStyles(layout()));
  }
  function stop(){drag=null;stage.classList.remove('is-dragging');}
  function close(){generation++;stop();dialog.close();}
  for(const button of dialog.querySelectorAll('[data-close]'))button.addEventListener('click',close);
  dialog.addEventListener('cancel',()=>{generation++;stop();});
  for(const control of [zoom,x,y])control.addEventListener('input',()=>{settings.photoZoom=Number(zoom.value);settings.photoPositionX=Number(x.value);settings.photoPosition=Number(y.value);paint();});
  dialog.querySelector('[data-center]').addEventListener('click',()=>{settings.photoZoom=1;settings.photoPositionX=50;settings.photoPosition=50;paint();});
  apply.addEventListener('click',()=>{
    if(!ready)return;
    form.elements.namedItem('photoZoom').value=settings.photoZoom;
    form.elements.namedItem('photoPositionX').value=settings.photoPositionX;
    form.elements.namedItem('photoPosition').value=settings.photoPosition;
    close();onApply();
  });
  stage.addEventListener('pointerdown',event=>{
    if(!ready||event.button!==0)return;
    event.preventDefault();stage.focus();drag={id:event.pointerId,x:event.clientX,y:event.clientY,settings:{...settings},layout:layout()};
    stage.setPointerCapture(event.pointerId);stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    Object.assign(settings,dragPhoto(drag.layout,drag.settings,event.clientX-drag.x,event.clientY-drag.y));paint();
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(type,stop);
  stage.addEventListener('keydown',event=>{
    if(!ready)return;
    const step=event.shiftKey?15:5,deltas={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]},delta=deltas[event.key];
    if(!delta)return;event.preventDefault();Object.assign(settings,dragPhoto(layout(),settings,...delta));paint();
  });
  return {
    async open(){
      let profile,reference;try{profile=getProfile();reference=validatePhoto(profile.photo);if(!reference)throw new Error('Envie uma foto ou informe o link antes de enquadrar.');}
      catch(error){feedback(error.message,true);return;}
      const token=++generation;settings={photoFit:profile.photoFit,photoZoom:profile.photoZoom??1,photoPositionX:profile.photoPositionX??50,photoPosition:profile.photoPosition??50};
      ready=false;apply.disabled=true;image.style.visibility='hidden';status.textContent='Carregando foto…';
      if(!dialog.open)dialog.showModal();paint();
      image.onload=()=>{
        if(token!==generation)return;ready=true;apply.disabled=false;image.style.visibility='visible';status.textContent='Arraste para enquadrar. A alteração só entra no cadastro ao aplicar.';paint();
      };
      image.onerror=()=>{if(token===generation)status.textContent='Não foi possível carregar esta foto. Confira o arquivo ou o link.';};
      try{const url=await mediaURL(reference);if(token===generation)image.src=url;}
      catch{if(token===generation)status.textContent='Não foi possível carregar esta foto. Confira a conexão e tente novamente.';}
    }
  };
}
