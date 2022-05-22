import React, { PropsWithChildren } from 'react';

import _throttle from 'lodash/throttle'

type BreakPoint = 'lg' | 'md' | 'sm';
const BreakPointOrdering: BreakPoint[] = ['lg', 'md', 'sm',];

const DefaultBreakpoints: {
  [key in BreakPoint]: boolean;
} = {
  sm: false,
  md: false,
  lg: false,
};

const BreakPoints: {
  [key in BreakPoint]: number;
} = {
  sm: 0,
  md: 769,
  lg: 1025,
};

type ViewportContext = {
  width?: number,
  height?: number,
  breakpoints: {
    [key in BreakPoint]: boolean;
  }
};

const viewportContext = React.createContext<ViewportContext>({
  width: undefined,
  height: undefined,
  breakpoints: {
    ...DefaultBreakpoints
  }
});

export const ViewportProvider = ({ children }: PropsWithChildren<{}>) => {
  // This is the exact same logic that we previously had in our hook

  const [width, setWidth] = React.useState(window.innerWidth);
  const [height, setHeight] = React.useState(window.innerHeight);

  const [breakpoints, setBreakpoints] = React.useState({
    ...DefaultBreakpoints
  });

  const handleWindowResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    setWidth(width);
    setHeight(height);

    const bps = {
      ...DefaultBreakpoints
    };
    for (const bp of BreakPointOrdering) {
      if (width >= BreakPoints[bp]) {
        bps[bp] = true;
        break;
      }
    }

    setBreakpoints(bps);
  }

  const resizeHandler = _throttle(handleWindowResize, 250);

  React.useEffect(() => {
    handleWindowResize();
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  return (
    <viewportContext.Provider value={{ width, height, breakpoints }}>
      {children}
    </viewportContext.Provider>
  );
};

export const useViewport = () => {
  const { width, height, breakpoints } = React.useContext(viewportContext);
  return { width, height, breakpoints };
}