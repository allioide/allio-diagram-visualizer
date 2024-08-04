/// <reference types='./type/svgdom.d.ts' />
import {config, createSVGWindow} from 'svgdom';
import {registerWindow, type Svg, SVG} from '@svgdotjs/svg.js';
import {create} from 'fontkit';
import {
  NOTO_SANS_REGULAR_CSS_SRC, NOTO_SANS_REGULAR_PROPS, NOTO_SANS_BOLD_CSS_SRC, NOTO_SANS_BOLD_PROPS,
  NOTO_SANS_REGULAR_DATA_URL,
  NOTO_SANS_BOLD_DATA_URL,
} from './util/font.js';

export function getNodeCanvas(embeddedFont = true): Svg {
  /* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument */
  config.setFontDir('./font');
  config.setFontFamilyMappings({'Noto Sans': 'NotoSans-Regular.ttf', 'Noto Sans Bold': 'NotoSans-Bold.ttf'});
  // Manually preload font to avoid bundling and reading from ttf file during runtime
  // See: https://github.com/svgdotjs/svgdom/blob/master/src/config.js
  // TODO: contribute the change upstream
  config.getFonts()['Noto Sans'] = create(Buffer.from(NOTO_SANS_REGULAR_DATA_URL.split(',')[1], 'base64'));
  config.getFonts()['Noto Sans Bold'] = create(Buffer.from(NOTO_SANS_BOLD_DATA_URL.split(',')[1], 'base64'));

  const window = createSVGWindow();
  const {document} = window;
  registerWindow(window, document);

  const canvas = SVG<SVGSVGElement>(document.documentElement);

  if (embeddedFont) {
    (canvas as any).fontface('Noto Sans', NOTO_SANS_REGULAR_CSS_SRC, NOTO_SANS_REGULAR_PROPS);
    (canvas as any).fontface('Noto Sans', NOTO_SANS_BOLD_CSS_SRC, NOTO_SANS_BOLD_PROPS);
  }
  /* eslint-enable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument */

  return canvas;
}
