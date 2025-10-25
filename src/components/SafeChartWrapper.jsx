import React, { useState, useEffect, useRef } from "react";

const SafeChartWrapper = ({ children, style }) => {
  const [ready, setReady] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const check = () => {
      if (ref.current) {
        const { width, height } = ref.current.getBoundingClientRect();
        if (width > 0 && height > 0) setReady(true);
      }
    };
    const id = requestAnimationFrame(check);
    return () => cancelAnimationFrame(id);
  }, []);

  return <div ref={ref} style={{ width: "100%", height: "100%", ...style }}>{ready && children}</div>;
};


export default SafeChartWrapper;
