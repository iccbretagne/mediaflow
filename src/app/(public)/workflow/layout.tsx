import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Workflow de validation — MediaFlow",
  description:
    "Le processus complet de validation des photos, visuels et vidéos — de la capture à la diffusion.",
}

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
