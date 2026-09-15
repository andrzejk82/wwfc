import { describe, expect, it } from 'vitest';
import { buildPageMeta } from '../../src/lib/seo/page-meta';

describe('buildPageMeta', () => {
  it('buduje kanoniczny adres non-www z końcowym ukośnikiem', () => {
    expect(buildPageMeta({
      title: 'Grafik zajęć',
      description: 'Aktualny grafik WWFC',
      canonicalPath: '/grafik'
    })).toEqual({
      title: 'Grafik zajęć | Warsaw West Fight Club',
      description: 'Aktualny grafik WWFC',
      canonicalUrl: 'https://wwfc.com.pl/grafik/',
      image: 'https://wwfc.com.pl/images/og-default.jpg',
      robots: 'index,follow'
    });
  });
});
