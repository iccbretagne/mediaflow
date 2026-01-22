// Design Tokens - ICC Rennes Charte Graphique
// Source: Charte graphique ICC Rennes

export const tokens = {
  brand: {
    // Palette fondamentale (charte p.4)
    purple: "#3b0b9d",
    blue: "#034daf",
    violet: "#8f16ad",
    cyan: "#38cfd7",
    yellow: "#f8bf2b",
    green: "#07f96c",
    pink: "#eb1298",
  },

  // Palette "documents" (powerpoint etc.) (charte p.5) — valeurs échantillonnées depuis la planche
  docs: {
    // bleus (nuances)
    navy: "#1f2a5d",
    indigo: "#233c7e",
    steel: "#5881b9",
    ice: "#b9cce1",

    // violets (nuances)
    deepPurple: "#311d81",
    purple2: "#453398",
    purple3: "#5848ac",
    lavender: "#6b5cc2",

    // verts (nuances)
    forest: "#40503b",
    green2: "#609966",
    green3: "#9dbf8b",
    mint: "#ecf1d5",

    // accents "terre / mer"
    orange: "#d67003",
    sand: "#fab557",
    peach: "#fcd9a8",
    slateGreen: "#506654",
    sea: "#577d85",
    cream: "#f9efdf",
    beige: "#f4e3c7",

    // neutres
    black: "#000000",
    charcoal: "#373737",
    gray: "#868686",
    silver: "#b8b8b8",
    lightGray: "#e7e7e7",

    // fond papier (planche)
    paper: "#fffbf6",
  },

  typography: {
    // Typographies listées dans la charte (p.3)
    // -> en dev: DM Sans / Anton faciles via next/font/google
    // -> Amsterdam Four + Agrandir souvent en fichiers (OTF/TTF) : à fournir en assets si vous les avez
    display: "Amsterdam Four",
    heading: "Anton",
    body: "DM Sans",
    alt: "Agrandir",
  },

  radius: {
    // La charte montre beaucoup de blocs arrondis : valeurs pratiques (pas explicitement chiffrées)
    card: "24px",
    pill: "999px",
  },
} as const

export type Tokens = typeof tokens
