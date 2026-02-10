
import { PlanPhase } from '../types';

export const phase15: PlanPhase = { 
  id: 15, 
  title: "Marketing: Site, Community & Growth", 
  desc: "Lancio Sito, Newsletter e Community.", 
  tools: ["Lemon Squeezy", "Discord", "Silktide", "Iubenda"], 
  cost: "DEV: Time | USER: N/A", 
  details: "1. SITO: Creazione video tutorial, acquisto e collegamento dominio, integrazione Cookie Banner (Silktide) e Privacy Policy (Iubenda).\n2. NEWSLETTER: Setup tramite Lemon Squeezy Email Marketing.\n3. COMMUNITY: Creazione server Discord, presenza social e piano editoriale.", 
  prompts: [
    "SYSTEM ROLE: CMO & Marketing Operations.",
    "*** MARKETING & LAUNCH CHECKLIST ***",
    "1. WEBSITE: Video tutorial per ogni feature chiave. Setup dominio custom. Compliance legale (Silktide + Iubenda).",
    "2. NEWSLETTER: Configurare Lemon Squeezy per invio update prodotto e lead nurturing.",
    "3. COMMUNITY: Setup Discord per supporto e feedback. Definizione piano editoriale social.",
    "4. EARLY ADOPTERS: Creare link trasformati in coupon (come da doc affiliate) per gli early adopters con crediti gratis per testing.",
    "TASK: Eseguire il setup degli strumenti di marketing e compliance."
  ],
  section: "MARKETING & LAUNCH" 
};
