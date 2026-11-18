let library;
export async function resolveApartmentModel(buildingId,floor,unitId){
  library??=fetch('assets/apartments/index.json').then(response=>{
    if(!response.ok)throw new Error('The apartment library could not load.');return response.json();
  }).catch(error=>{library=null;throw error;});
  const index=await library;
  const tower=index.sharedReferences[buildingId]||buildingId;
  const configuration=tower==='breeze'?(floor<=9?'6-9':'upper'):'typical';
  const key=`${tower}:${configuration}:${String(unitId).padStart(2,'0')}`;
  const model=index.apartments[key];
  if(!model)throw new Error('A furnished apartment model for this numbered unit is not supplied.');
  return {...model,url:model.url+'?v='+model.sha256.slice(0,12),sharedReference:tower!==buildingId?tower:null};
}
