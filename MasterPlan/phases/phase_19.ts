
import { PlanPhase } from '../types';

export const phase19: PlanPhase = {
  id: 19,
  title: "Growth: Gamification Engine",
  desc: "Levels, Badges & Certifications.",
  tools: ["React", "LinkedIn API"],
  cost: "DEV: €0 | USER: N/A",
  details: "Sistema di retention basato su XP e Medaglie. Integrazione 'Add to Profile' di LinkedIn per viralità professionale.",
  prompts: [
    "SYSTEM ROLE: Game Designer & Growth Hacker.",
    "*** GAMIFICATION RULES & SCORING ***",
    "1. XP CALCULATION:",
    "- Wireframe Generated: 10 XP",
    "- Audit Performed (A11y/UX/Proto): 5 XP",
    "- Sync Action (Storybook/Git): 20 XP (High value behavior)",
    "- Affiliate Invite: 50 XP (Viral growth)",
    "2. LEVEL SYSTEM:",
    "- Level = floor(Total XP / 500) + 1.",
    "- Progress Bar visualizza % verso il prossimo livello.",
    "3. BADGES (UNLOCKABLES):",
    "- Leaf (Novice): Start.",
    "- Rock (Solid): 500 XP.",
    "- Iron (Engineer): > 10 Syncs.",
    "- Bronze (Auditor): > 50 Audits.",
    "- Diamond (Partner): > 5 Affiliates.",
    "4. LINKEDIN CERTIFICATION (ADD TO PROFILE):",
    "- Al posto di uno share generico, usa l'URL 'https://www.linkedin.com/profile/add'.",
    "- Compila automaticamente: Name='Level [X] Design Engineer', Organization='Comtra AI', IssueDate=Now, CertID='XP-[Total]'.",
    "- Questo crea una certificazione ufficiale sul profilo dell'utente, aumentando l'autorità del tool.",
    "- FUTURE TODO: È necessario diventare **LinkedIn Verified Partner** per bloccare i campi (titolo/organizzazione) e impedire che l'utente modifichi i dati della certificazione manualmente.",
    "TASK: Implementare la vista Analytics con il calcolo XP, le nuove icone badge e il widget 'Add to LinkedIn'."
  ],
  section: "MARKETING & LAUNCH"
};
