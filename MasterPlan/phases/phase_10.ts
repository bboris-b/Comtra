
import { PlanPhase } from '../types';

export const phase10: PlanPhase = { 
  id: 10, 
  title: "Ops: Governance", 
  desc: "Pattern Memory, Token Versioning.",
  tools: ["Database", "Fine-tuning"],
  cost: "DEV: €0.001 (DB) | USER: FREE",
  details: "Logica di Feedback Loop e salvataggio preferenze.",
  prompts: [
    "SYSTEM ROLE: AI Data Engineer.",
    "*** CONTEXT & LOGIC RULES (DA IMPLEMENTARE) ***\nQuando un designer accetta un suggerimento, Antigravity salva l'azione nel database. Questi dati vengono inviati come 'Esempi Few-Shot' nei prompt futuri.",
    "TASK: Crea la tabella 'accepted_patterns' e la logica di feedback loop."
  ],
  section: "INFRASTRUCTURE & OPERATIONS"
};
