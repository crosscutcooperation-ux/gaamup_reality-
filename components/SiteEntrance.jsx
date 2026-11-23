'use client';
import {useEffect,useState} from 'react';
import styles from './SiteEntrance.module.css';

export default function SiteEntrance(){
 const [visible,setVisible]=useState(true);
 useEffect(()=>{const timer=setTimeout(()=>setVisible(false),1500);return()=>clearTimeout(timer);},[]);
 if(!visible)return null;
 return <div className={styles.screen} role="status" aria-label="Preparing your next address">
  <div className={styles.content}>
   <svg className={styles.buildings} viewBox="0 0 88 88" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path className={styles.tower} d="M12 75V38h20v37M32 75V15h26v60M58 75V29h18v46"/>
    <path className={styles.windows} d="M19 46h6m-6 9h6m-6 9h6M39 25h12m-12 10h12m-12 10h12m-12 10h12m-9 20V64h6v11M64 38h6m-6 10h6m-6 10h6m-6 10h6"/>
    <path d="M5 76h78"/>
   </svg>
   <span className={styles.name}>GAAMUP</span>
   <p><span className={styles.spinner} aria-hidden="true"/>Preparing your next address</p>
  </div>
 </div>;
}
