import React, { useState, useEffect } from 'react';
import { Excalidraw } from "@excalidraw/excalidraw";

interface ExcalidrawWrapperProps {
  elements: any[]; // Accepts both SimplifiedElement[] and standard ExcalidrawElement[]
  onChange: (elements: any[]) => void;
  isDarkMode?: boolean;
}

export const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({ elements, onChange, isDarkMode = true }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  // 1. Handle Background Color & Theme Sync independently of Elements
  useEffect(() => {
    if (!excalidrawAPI) return;
    
    const bgColor = isDarkMode ? "#1e293b" : "#f1f5f9"; // Slate-900 vs Slate-100
    
    excalidrawAPI.updateScene({
        appState: {
            viewBackgroundColor: bgColor,
            theme: isDarkMode ? "dark" : "light",
        }
    });
  }, [isDarkMode, excalidrawAPI]);

  // 2. Handle Elements Loading & color patching
  useEffect(() => {
    if (!excalidrawAPI || !elements) return;

    let finalElements = [];

    // Check if elements are already formatted as Excalidraw Elements (have 'id', 'version', etc)
    const isAlreadyExcalidraw = elements.some(el => el.id && el.type);

    if (isAlreadyExcalidraw) {
        // Deep clone to avoid mutating props
        finalElements = elements.map(el => ({ ...el }));
        
        // Patch colors for Dark Mode visibility if coming from conversion
        // If stroke is strictly black (default conversion) and we are in dark mode, make it white/gray.
        if (isDarkMode) {
            finalElements = finalElements.map(el => {
                if (el.strokeColor === '#000000' || el.strokeColor === 'black' || !el.strokeColor) {
                    return { ...el, strokeColor: '#e2e8f0' }; // light slate
                }
                return el;
            });
        }
    } else {
        // Convert simplified AI JSON schema to Excalidraw elements
        finalElements = elements.map((el, index) => {
            const base = {
                id: `el-${index}-${Date.now()}`,
                roughness: 1,
                strokeWidth: 1,
                fillStyle: "solid",
                strokeColor: isDarkMode ? "#e2e8f0" : "#1e293b",
                backgroundColor: el.backgroundColor || "transparent",
            };

            if (el.type === 'rectangle' || el.type === 'ellipse') {
                return {
                    ...base,
                    type: el.type,
                    x: el.x || 0,
                    y: el.y || 0,
                    width: el.width || 100,
                    height: el.height || 50,
                    label: el.label ? { text: el.label } : undefined,
                };
            } else if (el.type === 'arrow') {
                return {
                    ...base,
                    type: 'arrow',
                    x: el.startX || 0,
                    y: el.startY || 0,
                    points: [[0, 0], [(el.endX || 100) - (el.startX || 0), (el.endY || 100) - (el.startY || 0)]],
                };
            } else if (el.type === 'text') {
                return {
                    ...base,
                    type: 'text',
                    x: el.x || 0,
                    y: el.y || 0,
                    text: el.text || el.label || "Text",
                    fontSize: el.fontSize || 20,
                    strokeColor: isDarkMode ? "#f8fafc" : "#0f172a"
                };
            }
            return null;
        }).filter(Boolean);
    }

    if (finalElements.length > 0) {
        excalidrawAPI.updateScene({ elements: finalElements });
        // Ensure we center content after loading new elements
        setTimeout(() => {
            excalidrawAPI.scrollToContent(finalElements, { fitToViewport: true, viewportZoomFactor: 0.8 });
        }, 50);
    }

  }, [elements, excalidrawAPI, isDarkMode]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-100 dark:bg-[#1e293b]">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        theme={isDarkMode ? "dark" : "light"}
        initialData={{
            appState: {
                viewBackgroundColor: isDarkMode ? "#1e293b" : "#f1f5f9",
                currentItemFontFamily: 1,
                gridSize: 20,
            },
            scrollToContent: true
        }}
        onChange={(els, state) => {
            // Optional: Debounce and sync back to parent if needed
            // onChange(els);
        }}
      />
    </div>
  );
};