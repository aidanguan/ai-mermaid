import { GoogleGenAI } from "@google/genai";
import { DiagramType } from "../types";

// Note: In a real app, this key comes from process.env.API_KEY. 
// We strictly follow the instruction to use process.env.API_KEY.
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables");
    // We intentionally do not throw here to allow the UI to render, 
    // but the API call will fail if triggered.
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export const generateDiagramCode = async (
  prompt: string, 
  type: DiagramType,
  modelId: string = 'gemini-2.5-flash'
): Promise<string> => {
  const ai = getAIClient();

  if (type === DiagramType.MERMAID) {
    return generateMermaid(ai, prompt, modelId);
  } else {
    return generateExcalidrawJSON(ai, prompt, modelId);
  }
};

const generateMermaid = async (ai: GoogleGenAI, prompt: string, modelId: string): Promise<string> => {
  const systemPrompt = `
    You are an expert technical diagram generator. 
    Your task is to translate the user's natural language description into valid Mermaid.js syntax.
    
    Rules:
    1. Return ONLY the raw Mermaid code. Do not include markdown code blocks (no \`\`\`mermaid).
    2. If the user does not specify a diagram type, default to 'graph TD' (flowchart).
    3. Ensure syntax is correct and strictly follows Mermaid standards.
    4. Do not include explanations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // Low temperature for deterministic code
      }
    });

    const text = response.text || '';
    // Clean up if the model accidentally wrapped it in markdown
    return text.replace(/```mermaid/g, '').replace(/```/g, '').trim();
  } catch (error) {
    console.error("Gemini Mermaid Generation Error:", error);
    throw error;
  }
};

const generateExcalidrawJSON = async (ai: GoogleGenAI, prompt: string, modelId: string): Promise<string> => {
  // Generating full Excalidraw JSON is complex due to internal IDs and styling properties.
  // We will ask for a simplified schema and mapped it in the prompt to a valid JSON structure 
  // that can be imported as 'elements'.
  
  const systemPrompt = `
    You are an expert visual diagram generator.
    Your task is to generate a JSON array of graphic elements based on the user's description.
    These elements will be rendered on an infinite whiteboard (Excalidraw).
    
    Output Format:
    Return a strictly valid JSON ARRAY of objects. Each object represents a shape.
    
    Supported Shapes & Properties:
    - Rectangle: { "type": "rectangle", "x": number, "y": number, "width": number, "height": number, "label": string, "backgroundColor": string }
    - Ellipse: { "type": "ellipse", "x": number, "y": number, "width": number, "height": number, "label": string, "backgroundColor": string }
    - Arrow: { "type": "arrow", "startX": number, "startY": number, "endX": number, "endY": number, "label": string }
    - Text: { "type": "text", "x": number, "y": number, "text": string, "fontSize": number }
    
    Layout Rules:
    - Arrange the elements logically (e.g., a flowchart layout from top to bottom).
    - Ensure elements do not overlap significantly.
    - Use "x" and "y" coordinates to position them. Assume a canvas starting at 0,0.
    
    Example Output:
    [
      { "type": "rectangle", "x": 100, "y": 50, "width": 120, "height": 60, "label": "Start", "backgroundColor": "#e0eaff" },
      { "type": "arrow", "startX": 160, "startY": 110, "endX": 160, "endY": 150, "label": "Next" },
      { "type": "rectangle", "x": 100, "y": 150, "width": 120, "height": 60, "label": "Process", "backgroundColor": "#ffe0e0" }
    ]
    
    Return ONLY the JSON array. No markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json", 
        temperature: 0.3,
      }
    });

    const text = response.text || '[]';
    // Helper to transform the simplified JSON into Excalidraw specific element structure
    // We do this post-processing on the client, but for now, we assume the AI gives us the intermediate format
    // which the frontend handles, or valid excalidraw elements if possible.
    // To make it easier for the frontend, we'll try to get the AI to do the layout math.
    
    return text;
  } catch (error) {
    console.error("Gemini Excalidraw Generation Error:", error);
    throw error;
  }
};