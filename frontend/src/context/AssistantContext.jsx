import { createContext, useContext } from "react";

// Lets any card open the assistant panel with a question: ask("How has Riverside FC been playing?")
// `enabled` is false on the free plan, and then no "Ask" buttons appear.
const AssistantContext = createContext({ ask: () => {}, enabled: false });

export const AssistantProvider = AssistantContext.Provider;

export function useAssistant() {
  return useContext(AssistantContext);
}
