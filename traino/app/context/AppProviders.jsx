// Import all your context providers
import { UserContextProvider } from './UserContext';
import { LiveContextProvider } from './LiveContext';
import { ThemeContextProvider } from './ThemeContext';
import { ProductContextProvider } from './ProductContext';
import { TrainoContextProvider } from './Context';

// AppProviders groups them all together
export const AppProviders = ({ children, sessionObjectCtx }) => {
  return (
    <ThemeContextProvider>
      <UserContextProvider sessionObjectCtx={sessionObjectCtx}>
        <TrainoContextProvider>
          <ProductContextProvider>
            <LiveContextProvider>{children}</LiveContextProvider>
          </ProductContextProvider>
        </TrainoContextProvider>
      </UserContextProvider>
    </ThemeContextProvider>
  );
};
