export async function compressImage(file) {
  if (!['image/png','image/jpeg','image/webp','image/avif'].includes(file.type)) throw new Error('Escolha uma foto PNG, JPG, WebP ou AVIF.');
  if (file.size>12*1024*1024) throw new Error('A imagem original deve ter até 12 MB.');
  const bitmap=await createImageBitmap(file);
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width*bitmap.height>40000000) throw new Error('Escolha uma imagem com até 40 megapixels.');
    let scale=Math.min(1,480/bitmap.width,720/bitmap.height),blob;
    const canvas=document.createElement('canvas');
    for (let pass=0;pass<3;pass++) {
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      canvas.getContext('2d',{alpha:true}).drawImage(bitmap,0,0,canvas.width,canvas.height);
      for (const quality of [.82,.7,.55]) {
        blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
        if (!blob || blob.type!=='image/webp') throw new Error('Este navegador não conseguiu converter a imagem para WebP.');
        if (blob.size<=75000) return await new Promise((resolve,reject)=>{
          const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Não foi possível ler a imagem convertida.'));reader.readAsDataURL(blob);
        });
      }
      scale*=.75;
    }
    throw new Error('A imagem continua muito grande. Escolha uma versão mais simples.');
  } finally {bitmap.close();}
}
