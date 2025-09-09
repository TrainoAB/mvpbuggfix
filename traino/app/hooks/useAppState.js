// This file compacts all context's into one useAppState hook for import on other pages
// Make sure to not have conflicting variable names when combining contexts
import { useUserContext } from '@/app/context/UserContext';
import { useLiveContext } from '@/app/context/LiveContext';
import { useProductContext } from '@/app/context/ProductContext';
import { useThemeContext } from '@/app/context/ThemeContext';
import { useTrainoContext } from '@/app/context/Context';

export const useAppState = () => {
  const userContext = useUserContext();
  const liveContext = useLiveContext();
  const productContext = useProductContext();
  const trainoContext = useTrainoContext();
  const themeContext = useThemeContext();

  return {
    ...productContext,
    ...userContext,
    ...liveContext,
    ...trainoContext,
    ...themeContext,
  };
};
