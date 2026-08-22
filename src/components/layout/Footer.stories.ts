import type { Meta, StoryObj } from "@storybook/html-vite";

// Gerado automaticamente por scripts/generate-storybook-stories.mjs
// a partir do HTML real renderizado de Footer.astro.

const meta: Meta = {
  title: "Componentes/Footer",
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj;

export const Padrao: Story = {
  render:
    () => `<footer class="mt-16 border-t border-base-300 pt-8 pb-4"> <div class="flex flex-col items-center gap-4 text-center"> <a href="https://www.mulheresnaecologia.com/" class="btn rounded-full btn-outline btn-primary"> <svg width="1em" height="1em" class="size-4" data-icon="mdi:arrow-left">   <symbol id="ai:mdi:arrow-left" viewBox="0 0 24 24"><path fill="currentColor" d="M20 11v2H8l5.5 5.5l-1.42 1.42L4.16 12l7.92-7.92L13.5 5.5L8 11z"></path></symbol><use href="#ai:mdi:arrow-left"></use>  </svg>
Voltar para mulheresnaecologia.com <svg width="1em" height="1em" class="size-3.5 opacity-60" data-icon="mdi:open-in-new">   <symbol id="ai:mdi:open-in-new" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2z"></path></symbol><use href="#ai:mdi:open-in-new"></use>  </svg> </a> <p class="text-xs text-base-content/50">
© 2026 Mulheres na Ecologia </p> </div> </footer>`,
};
