'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {completeStationJourney,waitFor} from '../lib/journey-flow.js';
import {useSite} from './SiteProvider.jsx';

export default function RailwayExplorer({cities}){
  const router=useRouter();
  const {registerTravel,notify,setCovered}=useSite();
  const canvas=useRef(null),world=useRef(null),frame=useRef(null),stations=useRef([]),scene=useRef(null),active=useRef(null),locked=useRef(false);
  const [status,setStatus]=useState('loading'),[phase,setPhase]=useState('idle'),[destination,setDestination]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0),[paused,setPaused]=useState(false),[guided,setGuided]=useState(false);
  const busy=phase!=='idle';
  useEffect(()=>{document.body.classList.toggle('railway-travelling',busy);return()=>document.body.classList.remove('railway-travelling');},[busy]);
  useEffect(()=>{
    const abort=new AbortController();let controller;
    setStatus('loading');setError('');
    async function initialize(){
      try{
        const {createRailway}=await import('../lib/railway.js');
        if(abort.signal.aborted)return;
        controller=await createRailway({canvas:canvas.current,world:world.current,stations:stations.current,cities,signal:abort.signal,onError:message=>{if(abort.signal.aborted)return;setStatus('error');setError(message);}});
        if(abort.signal.aborted){controller.dispose();return;}
        scene.current=controller;setPaused(controller.isPaused());setStatus('ready');
      }catch(cause){if(abort.signal.aborted)return;console.error('Railway initialization failed',cause);setStatus('error');setError('The 3D railway could not load. Retry the scene to begin your journey.');}
    }
    initialize();
    return ()=>{abort.abort();active.current?.abort();controller?.dispose();scene.current=null;document.body.style.overflow='';};
  },[cities,retry]);
  const startTravel=useCallback(async city=>{
    if(locked.current)return;
    if(status!=='ready'||!scene.current){notify(status==='error'?'Retry the 3D railway before choosing a destination.':'The railway is still loading. Your journey will be available shortly.');return;}
    setGuided(true);locked.current=true;const abort=new AbortController();active.current=abort;
    setError('');setDestination(city);setPhase('expanding');
    document.getElementById('locations')?.scrollIntoView({behavior:'instant'});
    const rect=frame.current.getBoundingClientRect();
    for(const [key,value]of Object.entries({'--frame-left':rect.left,'--frame-top':rect.top,'--frame-width':rect.width,'--frame-height':rect.height}))frame.current.style.setProperty(key,`${value}px`);
    document.body.style.overflow='hidden';
    try{
      await completeStationJourney({
        ready:Promise.resolve(scene.current),signal:abort.signal,
        play:async controller=>{
          // React commits the full-screen scene before the existing camera starts its journey.
          await waitFor(0,abort.signal);
          controller.resize();setPhase('travelling');
          await controller.travelTo(city.index,{signal:abort.signal});
        },
        cover:async()=>{setPhase('covering');setCovered(true);await waitFor(220,abort.signal);},
        navigate:()=>router.push(`/locations/${city.slug}`,{scroll:true}),
      });
    }catch(cause){
      if(abort.signal.aborted)return;
      console.error('Rail journey failed',cause);scene.current?.reset();setCovered(false);setDestination(null);setPhase('idle');document.body.style.overflow='';
      setError('The journey could not finish. Please retry the railway; you are still on the homepage.');notify('The train journey did not finish. Your destination has not been opened.');
      locked.current=false;
    }
  },[status,notify,router,setCovered]);
  useEffect(()=>registerTravel(startTravel),[registerTravel,startTravel]);
  function retryScene(){active.current?.abort();locked.current=false;setPhase('idle');setDestination(null);setCovered(false);document.body.style.overflow='';setRetry(value=>value+1);}
  return <section id="locations" className="locations">
    <div className="section-heading"><h1>Your next station. <em>Your next chapter.</em></h1><p>Choose a station. Let your journey begin.</p></div>
    <div className="railway-slot"><div className={`railway-frame locked-map${busy?' is-travelling':''}${status==='error'?' scene-unavailable':''}`} ref={frame} id="railway-frame" aria-busy={status==='loading'||busy}>
      <div className="railway-scroll"><div className="railway-world" ref={world} id="railway-world"><canvas id="railway-canvas" ref={canvas} aria-label="Fixed view of the downloaded forest landscape, railway and Mumbai AC local train"/>
        <div id="stations" className="station-layer">{cities.map(city=><button type="button" className="station station-arrow" ref={node=>{stations.current[city.index]=node;}} data-city={city.name} data-index={city.index} key={city.slug} aria-label={`Travel to ${city.name}`} disabled={status!=='ready'||busy} onClick={()=>startTravel(city)}><span className="station-marker"><span><span lang="hi">{city.native}</span><strong>{city.name}</strong></span></span>{city.index===1&&status==='ready'&&!guided&&!busy&&<span className="station-click-guide" aria-hidden="true"><svg viewBox="0 0 32 36" fill="none"><path d="M12 17V5a3 3 0 0 1 6 0v9l2-1 4 3 3 3v7c0 5-4 8-8 8h-2c-3 0-5-2-7-5L4 20c-2-3 2-5 4-3l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="var(--paper)"/></svg></span>}</button>)}</div>
        {status!=='ready'&&<div id="scene-loading" className="scene-loading">{status==='loading'?<><span className="loading-line"/><p>Preparing your journey</p></>:<><p>The 3D railway is unavailable.</p><button type="button" className="scene-retry" onClick={retryScene}>Retry railway </button></>}</div>}
      </div></div>
      {status==='ready'&&!busy&&<button type="button" className="forest-motion-control" aria-pressed={!paused} onClick={()=>setPaused(scene.current.togglePause())}>{paused?'Play live landscape':'Pause live landscape'}</button>}
      {destination&&<div className="journey-caption" key={destination.slug}><span className="eyebrow">NEXT STOP</span><p>{destination.name}</p></div>}
    </div></div>
    <p className="map-attribution"><a href="https://sketchfab.com/3d-models/photogrammetry-3d-scan-nature-landscape-e0050374e75347929017942fe761670f" target="_blank" rel="noreferrer">Photogrammetry | 3D scan nature landscape</a> by <a href="https://sketchfab.com/Laslo.S" target="_blank" rel="noreferrer">Laslo.S</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Adapted for this illustrative railway journey.</p>
    {error&&<div className="railway-error" role="alert"><p>{error}</p><button type="button" onClick={retryScene}>Retry railway </button></div>}
    <div className="station-directory" id="station-directory" aria-label="All destination stations">{cities.map(city=><button type="button" data-city={city.name} disabled={status!=='ready'||busy} key={city.slug} onClick={()=>startTravel(city)}>{city.name} </button>)}</div>
    <div className="sr-only" role="status" aria-live="polite">{status==='loading'?'Loading the 3D railway.':busy?`Train arriving for ${destination?.name}.`:'The railway is ready. Choose a station.'}</div>
  </section>;
}
