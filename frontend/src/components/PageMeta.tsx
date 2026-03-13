interface PageMetaProps {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export default function PageMeta({ title, description, ogTitle, ogDescription }: PageMetaProps) {
  const fullTitle = title.includes('Worki') ? title : `${title} — Worki`
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {ogTitle && <meta property="og:title" content={ogTitle} />}
      {ogDescription && <meta property="og:description" content={ogDescription} />}
    </>
  )
}
