import "../src/styles/global.css";
import type { Preview } from "@storybook/html-vite";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#f7faf9" },
        { name: "dark", value: "#0f1a17" },
      ],
    },
  },
  decorators: [
    (story) => {
      const wrapper = document.createElement("div");
      wrapper.className = "bg-background text-foreground p-6";
      const result = story();
      if (typeof result === "string") {
        wrapper.innerHTML = result;
      } else {
        wrapper.appendChild(result);
      }
      return wrapper;
    },
  ],
};

export default preview;
