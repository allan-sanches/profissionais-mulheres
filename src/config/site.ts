const site = {
  // --- Site Metadata ---
  meta: {
    title: "Pesquisadoras — Mulheres na Ecologia",
    description:
      "Portfólio de pesquisadoras cadastradas no programa Mulheres na Ecologia.",
    author: "Mulheres na Ecologia",
    logo: "/logo.svg",
    ogImage: "/og-image.png",
    // HTML lang attribute, affects page language and date formatting
    // Options: "zh-CN", "en", "ja", etc.
    lang: "pt-BR",
  },

  // --- Navigation ---
  // subtitle: decorative label shown below the name (uppercase, small text)
  navigation: [
    { name: "Admin", subtitle: "Pesquisadoras", href: "/admin/researchers" },
  ],

  // --- Social Links ---
  social: [] as { name: string; href: string; icon: string }[],

  // --- Site principal (Wix) ---
  // Link de continuidade exibido no rodapé, apontando para o site principal do projeto.
  mainSite: {
    label: "mulheresnaecologia.com",
    href: "https://www.mulheresnaecologia.com/",
  },

  // --- Homepage Hero ---
  hero: {
    greeting: "👋 Hello, I'm Breeze",
    // Supports HTML. Use <span class="font-medium text-foreground underline decoration-primary/30"> to highlight keywords
    description:
      'A minimal personal website theme built with <span class="font-medium text-foreground underline decoration-primary/30">Astro</span> and <span class="font-medium text-foreground underline decoration-primary/30">Tailwind CSS</span>.',
    cards: [
      {
        icon: "mdi:explore",
        label: "Status",
        value: "Building something cool",
      },
      { icon: "mdi:location", label: "Location", value: "Earth" },
    ],
  },

  // --- Footer ---
  footer: {
    copyright: "Mulheres na Ecologia",
  },

  // --- Comments ---
  comments: {
    enabled: false,
    provider: "artalk" as const,
    artalk: {
      server: "https://your-artalk-server.com",
    },
  },

  // --- Feature Toggles ---
  features: {
    search: true,
    rss: true,
    // Auto-mark posts as "new" if published within this many days (0 to disable)
    newPostDays: 7,
  },

  // --- Tools Page Data ---
  tools: [
    {
      name: "development",
      items: [
        {
          name: "VS Code",
          link: "https://code.visualstudio.com",
          icon: "mdi:microsoft-visual-studio-code",
        },
        {
          name: "WebStorm",
          link: "https://www.jetbrains.com/webstorm",
          icon: "mdi:code-braces",
        },
        { name: "Terminal", icon: "mdi:terminal" },
        { name: "Git", link: "https://git-scm.com", icon: "mdi:git" },
        { name: "Docker", link: "https://www.docker.com", icon: "mdi:docker" },
        { name: "Postman", link: "https://www.postman.com", icon: "mdi:api" },
      ],
    },
    {
      name: "design",
      items: [
        {
          name: "Figma",
          link: "https://www.figma.com",
          icon: "mdi:vector-polygon",
        },
        {
          name: "Sketch",
          link: "https://www.sketch.com",
          icon: "mdi:vector-square",
        },
        {
          name: "Adobe XD",
          link: "https://www.adobe.com/products/xd.html",
          icon: "mdi:pencil-ruler",
        },
        {
          name: "Photoshop",
          link: "https://www.adobe.com/products/photoshop.html",
          icon: "mdi:image-edit",
        },
      ],
    },
    {
      name: "productivity",
      items: [
        { name: "Notion", link: "https://www.notion.so", icon: "mdi:notebook" },
        {
          name: "Obsidian",
          link: "https://obsidian.md",
          icon: "mdi:diamond-stone",
        },
        {
          name: "Raycast",
          link: "https://www.raycast.com",
          icon: "mdi:lightning-bolt",
        },
        { name: "Arc Browser", link: "https://arc.net", icon: "mdi:web" },
      ],
    },
  ],

  // --- UI Labels ---
  // Customize these values to change the text displayed on pages
  labels: {
    postsTitle: "Writing",
    postsDescription: "Notes, thoughts, and technical musings",
    projectsTitle: "Projects",
    projectsDescription: "Small tools built for fun or to solve real problems.",
    friendsTitle: "Friends",
    friendsDescription: "Like-minded folks around the web.",
    toolsTitle: "Stack",
    aboutTitle: "About",
    aboutDescription: "About this site and its author",
    backToPosts: "Back to posts",
    goHome: "Go Home",
    notFoundTitle: "Page not found",
    notFoundDescription:
      "The page you're looking for may have been removed or the link is broken.",
    endOfPost: "End of Post",
    tableOfContents: "Table of Contents",
    searchPlaceholder: "Search posts, tags, or commands...",
    searchNavigate: "Navigate",
    commentSuccess: "Comment submitted",
  },

  ogImage: "/og-image.png",
} as const;

export default site;
