export interface PageMetaInput {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  robots?: string;
}

export interface PageMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  image: string;
  robots: string;
}

export function buildPageMeta(input: PageMetaInput): PageMeta {
  const path = input.canonicalPath === '/'
    ? '/'
    : `/${input.canonicalPath.replace(/^\/+|\/+$/g, '')}/`;

  return {
    title: `${input.title} | Warsaw West Fight Club`,
    description: input.description,
    canonicalUrl: new URL(path, 'https://wwfc.com.pl').href,
    image: input.image ?? 'https://wwfc.com.pl/images/og-default.jpg',
    robots: input.robots ?? 'index,follow'
  };
}
