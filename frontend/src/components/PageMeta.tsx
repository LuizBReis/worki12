interface PageMetaProps {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export default function PageMeta({ title, description, ogTitle, ogDescription, ogImage }: PageMetaProps) {
  const fullTitle = title.includes('Worki') ? title : `${title} — Worki`
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {ogTitle && <meta property="og:title" content={ogTitle} />}
      {ogDescription && <meta property="og:description" content={ogDescription} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
    </>
  )
}
