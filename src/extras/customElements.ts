import { MathTextboxElement } from "../elements/mathTextbox";

const elements = {
  "math-textbox": MathTextboxElement,
} as unknown as Record<string, CustomElementConstructor>;

for (const [key, constructor] of Object.entries(elements)) {
  if (!customElements.get(key)) {
    customElements.define(key, constructor);
  }
}
