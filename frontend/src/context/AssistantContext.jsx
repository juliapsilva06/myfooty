import { createContext, useContext } from "react";

// Lets any card open the assistant panel with a question: ask("How has Riverside FC been playing?")
const AssistantContext = createContext({ ask: () => {} });

export const AssistantProvider = AssistantContext.Provider;

export function useAssistant() {
  return useContext(AssistantContext);
}
