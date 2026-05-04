import { Provider } from "jotai";

export const JotaiProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <Provider>{children}</Provider>;
};
